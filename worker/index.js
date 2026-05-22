const ALLOWED_ORIGIN = 'https://reachflow.site';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (url.pathname === '/exchange')    return handleExchange(url, env);
    if (url.pathname === '/create-space' && request.method === 'POST') return handleCreateSpace(request, env);
    if (url.pathname === '/save'         && request.method === 'POST') return handleSave(request, env);
    return new Response('Not found', { status: 404 });
  },
};

/* ── Token helpers ── */

function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

async function importKey(secret) {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

async function issueToken(username, env) {
  if (!env.TOKEN_SECRET) throw new Error('TOKEN_SECRET not configured');
  const payload = JSON.stringify({ sub: username, exp: Date.now() + 3_600_000 });
  const key = await importKey(env.TOKEN_SECRET);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return b64url(new TextEncoder().encode(payload)) + '.' + b64url(sig);
}

async function verifyToken(token, env) {
  if (!env.TOKEN_SECRET) throw new Error('TOKEN_SECRET not configured');
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('Malformed token');
  const payloadBytes = b64urlDecode(parts[0]);
  const sigBytes     = b64urlDecode(parts[1]);
  const key = await importKey(env.TOKEN_SECRET);
  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, payloadBytes);
  if (!valid) throw new Error('Invalid token');
  const { sub, exp } = JSON.parse(new TextDecoder().decode(payloadBytes));
  if (Date.now() > exp) throw new Error('Token expired');
  return sub;
}

/* ── Helpers ── */

function sanitizeUrl(raw) {
  const s = String(raw || '').trim().slice(0, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? s : '';
  } catch { return ''; }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.REPO_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'reachflow-auth',
  };
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/* ── Sanitize (simple — just login + raw HTML) ── */

function sanitizeData(raw) {
  return {
    login:    String(raw.login    || '').trim().slice(0, 100),
    userHtml: String(raw.userHtml || '').slice(0, 500_000),
  };
}

/* ── Default starter HTML for new users ── */

function defaultUserHtml(profile) {
  const name   = esc(profile.name   || profile.login || 'Developer');
  const bio    = esc(profile.bio    || '');
  const avatar = esc(profile.avatar || '');
  const github = esc(profile.github || '');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      background: #060606;
      color: #efefef;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 80px 24px 60px;
    }
    .avatar {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid #8b5cf6;
      box-shadow: 0 0 40px rgba(139,92,246,.4);
      display: block;
    }
    h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2.5rem, 8vw, 5rem);
      letter-spacing: 4px;
      line-height: 1;
      text-shadow: 0 0 60px rgba(139,92,246,.8);
    }
    .bio {
      font-size: .78rem;
      color: rgba(239,239,239,.5);
      line-height: 1.8;
      max-width: 400px;
      text-align: center;
    }
    .gh-link {
      font-family: 'JetBrains Mono', monospace;
      font-size: .6rem;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: 700;
      color: #060606;
      background: #8b5cf6;
      border: 1.5px solid #8b5cf6;
      padding: 10px 24px;
      text-decoration: none;
      transition: background .25s, color .25s;
    }
    .gh-link:hover { background: transparent; color: #8b5cf6; }
  </style>
</head>
<body>
  ${avatar ? `<img class="avatar" src="${avatar}" alt="${name}">` : ''}
  <h1>${name}</h1>
  ${bio    ? `<p class="bio">${bio}</p>` : ''}
  ${github ? `<a class="gh-link" href="${github}" target="_blank" rel="noopener">GitHub &#8599;</a>` : ''}
</body>
</html>`;
}

/* ── Outer shell template (wraps user HTML in iframe) ── */

function buildTemplate(d) {
  const login    = d.login || '';
  const userHtml = (d.userHtml || '').replace(/<\/script>/gi, '<\\/script>');

  // Extract <title> from user HTML for the wrapper page title
  const titleMatch = (d.userHtml || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const rawTitle   = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : login;
  const title      = esc((rawTitle || login).slice(0, 100));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — reachflow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;overflow:hidden;background:#060606}
    #space-frame{position:fixed;inset:0;width:100%;height:100%;border:none;display:block}
    nav{position:fixed;top:0;left:0;right:0;z-index:9998;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to bottom,rgba(6,6,6,.8),transparent);pointer-events:none}
    .nav-brand{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:5px;color:#efefef;text-decoration:none;pointer-events:auto}
    .nav-brand span{color:#8b5cf6}
    .nav-back{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:rgba(239,239,239,.35);text-decoration:none;transition:color .2s;pointer-events:auto}
    .nav-back:hover{color:#efefef}
    #edit-btn{position:fixed;bottom:28px;right:28px;z-index:9999;font-family:'JetBrains Mono',monospace;font-size:.68rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#060606;background:#8b5cf6;padding:11px 20px;border:1.5px solid #8b5cf6;text-decoration:none;display:none;align-items:center;gap:8px;transition:background .25s,color .25s}
    #edit-btn:hover{background:transparent;color:#8b5cf6}
    footer{position:fixed;bottom:0;left:0;right:0;z-index:9997;padding:6px 32px;display:flex;justify-content:space-between;font-size:.42rem;color:rgba(239,239,239,.1);letter-spacing:2px;pointer-events:none;font-family:'JetBrains Mono',monospace}
    footer a{pointer-events:auto;color:rgba(239,239,239,.1);text-decoration:none;transition:color .2s}
    footer a:hover{color:rgba(239,239,239,.3)}
    @media(max-width:600px){nav{padding:12px 18px}#edit-btn{bottom:18px;right:18px;font-size:.6rem;padding:9px 14px}}
  </style>
</head>
<body>
  <nav>
    <a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
    <a href="/spaces" class="nav-back">&#8592; spaces</a>
  </nav>
  <iframe id="space-frame"
    sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
    title="${title}'s space"
    loading="eager"
  ></iframe>
  <a href="#" id="edit-btn">&#x270F; Edit</a>
  <footer>
    <span>&#169; 2026 reachflow.site &middot; TR4IS</span>
    <a href="/terms.html">.terms()</a>
  </footer>
  <script id="user-html" type="text/x-user-html">${userHtml}<\/script>
  <script>
  (function(){
    var login=${JSON.stringify(login)};
    document.getElementById('space-frame').srcdoc=document.getElementById('user-html').textContent;
    var u=localStorage.getItem('rf_user');
    var t=localStorage.getItem('rf_token');
    var btn=document.getElementById('edit-btn');
    if(u&&u.toLowerCase()===login.toLowerCase()&&t){
      btn.style.display='inline-flex';
      btn.addEventListener('click',function(e){
        e.preventDefault();
        localStorage.setItem('rf_editData',JSON.stringify({login:login}));
        window.location.href='/editor.html?user='+encodeURIComponent(login);
      });
    }
  })();
  <\/script>
</body>
</html>`;
}

/* ── Exchange ── */

async function handleExchange(url, env) {
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'Missing code' }, 400);

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return json({ error: 'Token exchange failed' }, 400);

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'reachflow-auth' },
  });
  const user = await userRes.json();
  const username = user.login;

  const checkRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}`,
    { headers: ghHeaders(env) }
  );
  const exists = checkRes.status === 200;

  const profile = {
    login:  user.login,
    name:   user.name  || user.login,
    bio:    user.bio   || '',
    avatar: user.avatar_url,
    github: `https://github.com/${user.login}`,
  };

  const sessionToken = await issueToken(username, env);
  return json({ username, exists, sessionToken, profile: exists ? null : profile });
}

/* ── Create space ── */

async function handleCreateSpace(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, profile: rawProfile } = body;
  if (!token) return json({ error: 'Missing token' }, 400);

  let username;
  try { username = await verifyToken(token, env); } catch (e) { return json({ error: e.message }, 401); }

  // Idempotent
  const checkRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}`,
    { headers: ghHeaders(env) }
  );
  if (checkRes.status === 200) return json({ ok: true });

  let profile = rawProfile && typeof rawProfile === 'object' ? rawProfile : null;
  if (!profile) {
    const uRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: { ...ghHeaders(env), Accept: 'application/vnd.github+json' },
    });
    if (uRes.ok) {
      const u = await uRes.json();
      profile = { login: u.login, name: u.name || u.login, bio: u.bio || '', avatar: u.avatar_url, github: `https://github.com/${u.login}` };
    }
  }

  const spaceData = {
    login:    username,
    userHtml: defaultUserHtml(profile || { login: username }),
  };

  const createRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}/index.html`,
    {
      method: 'PUT',
      headers: ghHeaders(env),
      body: JSON.stringify({
        message: `feat: add space for ${username}`,
        content: toBase64(buildTemplate(spaceData)),
      }),
    }
  );
  if (!createRes.ok) {
    const err = await createRes.json();
    return json({ error: 'Failed to create space', detail: err }, 500);
  }

  return json({ ok: true });
}

/* ── Save ── */

async function handleSave(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, data: rawData } = body;
  if (!token || !rawData) return json({ error: 'Missing token or data' }, 400);

  let username;
  try { username = await verifyToken(token, env); } catch (e) { return json({ error: e.message }, 401); }

  const data = sanitizeData(rawData);
  data.login = username; // always trust the token, not the client

  const getRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}/index.html`,
    { headers: ghHeaders(env) }
  );
  if (!getRes.ok) return json({ error: 'Space not found' }, 404);
  const { sha } = await getRes.json();

  const putRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}/index.html`,
    {
      method: 'PUT',
      headers: ghHeaders(env),
      body: JSON.stringify({
        message: `space(${username}): self-edit`,
        content: toBase64(buildTemplate(data)),
        sha,
      }),
    }
  );
  if (!putRes.ok) {
    const err = await putRes.json();
    return json({ error: 'Failed to save', detail: err }, 500);
  }

  return json({ ok: true });
}
