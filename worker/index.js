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
    if (url.pathname === '/exchange') return handleExchange(url, env);
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
  return sub; // returns verified username
}

/* ── Sanitize ── */

function sanitizeUrl(raw) {
  const s = String(raw || '').trim().slice(0, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? s : '';
  } catch { return ''; }
}

function sanitizeData(raw) {
  const color = /^#[0-9a-fA-F]{6}$/.test(String(raw.accentColor || '').trim())
    ? String(raw.accentColor).trim() : '#00ff88';
  return {
    login:       String(raw.login    || '').trim().slice(0, 100),
    name:        String(raw.name     || '').trim().slice(0, 60) || 'Developer',
    text:        String(raw.text     || '').trim().slice(0, 500),
    avatar:      sanitizeUrl(raw.avatar),
    github:      sanitizeUrl(raw.github),
    bgUrl:       sanitizeUrl(raw.bgUrl),
    musicUrl:    sanitizeUrl(raw.musicUrl),
    accentColor: color,
  };
}

/* ── Helpers ── */

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.REPO_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'reachflow-auth',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
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

  // Store GitHub profile data in token so /create-space can use it
  // (access token is only available during this exchange)
  const profile = {
    login:  user.login,
    name:   user.name || user.login,
    bio:    user.bio  || '',
    avatar: user.avatar_url,
    github: `https://github.com/${user.login}`,
  };

  const sessionToken = await issueToken(username, env);
  return json({ username, exists, sessionToken, profile: exists ? null : profile });
}

/* ── Create space (called after terms accepted) ── */

async function handleCreateSpace(request, env) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const { token, profile: rawProfile } = body;
  if (!token) return json({ error: 'Missing token' }, 400);

  let username;
  try { username = await verifyToken(token, env); } catch (e) { return json({ error: e.message }, 401); }

  // Idempotent — if space already exists, that's fine
  const checkRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}`,
    { headers: ghHeaders(env) }
  );
  if (checkRes.status === 200) return json({ ok: true });

  // Use profile from client (sent back from exchange response) or fall back to GitHub API
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

  const spaceData = sanitizeData({
    login:       username,
    name:        profile?.name  || username,
    text:        profile?.bio   || '',
    avatar:      profile?.avatar || '',
    github:      profile?.github || `https://github.com/${username}`,
    bgUrl:       '',
    musicUrl:    '',
    accentColor: '#8b5cf6',
  });

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

  // Override login with the token's verified username (never trust client)
  data.login = username;

  // Get current file SHA (required by GitHub API for updates)
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

/* ── Space template ── */

function buildTemplate(d) {
  const login    = esc(d.login);
  const name     = esc(d.name  || 'Developer');
  const text     = esc(d.text  || '');
  const avatar   = esc(d.avatar || '');
  const github   = esc(d.github || `https://github.com/${d.login}`);
  const bgUrl    = esc(d.bgUrl    || '');
  const musicUrl = esc(d.musicUrl || '');
  const accent   = /^#[0-9a-fA-F]{6}$/.test(d.accentColor) ? d.accentColor : '#00ff88';

  const isVideo  = bgUrl && /\.(mp4|webm)(\?.*)?$/i.test(bgUrl);
  const hasBg    = !!bgUrl;
  const hasMusic = !!musicUrl;

  const bgHtml = isVideo
    ? `<video id="bg-vid" autoplay muted loop playsinline><source src="${bgUrl}"></video>`
    : hasBg
      ? `<div id="bg-img" style="background-image:url('${bgUrl}')"></div>`
      : `<div id="bg-grid"></div>`;

  const audioHtml = hasMusic ? `
  <audio id="bg-audio" loop preload="none"><source src="${musicUrl}"></audio>
  <div id="audio-ctrl" aria-label="Music player">
    <button id="audio-play" title="Play / Pause">&#9654;</button>
    <input id="audio-vol" type="range" min="0" max="1" step="0.05" value="0.5" aria-label="Volume">
    <button id="audio-mute" title="Mute">&#128266;</button>
    <span id="audio-lbl">&#9834; music</span>
  </div>` : '';

  const spaceJSON = JSON.stringify({
    login: d.login, name: d.name || 'Developer', text: d.text || '',
    avatar: d.avatar || '', github: d.github || '',
    bgUrl: d.bgUrl || '', musicUrl: d.musicUrl || '',
    accentColor: accent,
  }).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — reachflow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;700&display=swap" rel="stylesheet">
  <style>
    :root{--accent:${accent};--bg:#060606;--fg:#efefef;--dim:rgba(239,239,239,.28);--ease:cubic-bezier(.23,1,.32,1)}
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%}
    body{background:var(--bg);color:var(--fg);font-family:'JetBrains Mono',monospace;
      min-height:100vh;cursor:none;display:flex;align-items:center;justify-content:center;overflow:hidden}
    a{color:inherit;text-decoration:none}

    #cursor{position:fixed;z-index:9999;pointer-events:none;width:8px;height:8px;border-radius:50%;
      background:var(--accent);transform:translate(-50%,-50%);mix-blend-mode:exclusion;
      transition:width .25s var(--ease),height .25s var(--ease)}
    #cursor.big{width:36px;height:36px;opacity:.4}

    #bg-vid,#bg-img,#bg-grid{position:fixed;inset:0;z-index:0}
    #bg-vid{width:100%;height:100%;object-fit:cover}
    #bg-img{background-size:cover;background-position:center;background-repeat:no-repeat}
    #bg-grid{background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:72px 72px}
    .bg-overlay{position:fixed;inset:0;z-index:1;background:rgba(6,6,6,.52)}

    nav{position:fixed;top:0;left:0;right:0;z-index:50;padding:20px 40px;
      display:flex;justify-content:space-between;align-items:center;
      background:linear-gradient(to bottom,rgba(6,6,6,.85),transparent)}
    .nav-brand{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:5px}
    .nav-brand span{color:var(--accent)}
    .nav-back{font-size:.58rem;letter-spacing:2px;text-transform:uppercase;color:var(--dim);transition:color .2s}
    .nav-back:hover{color:var(--fg)}

    .stage{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;
      gap:20px;text-align:center;padding:20px;max-width:640px}

    .av-ring{width:136px;height:136px;border-radius:50%;padding:3px;flex-shrink:0;
      background:conic-gradient(var(--accent) 0%,transparent 40%,var(--accent) 80%,transparent 100%);
      animation:spin 5s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .av-inner{width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--bg);border:3px solid var(--bg)}
    .av-img{width:100%;height:100%;object-fit:cover;display:block}

    .sp-name{font-family:'Bebas Neue',sans-serif;font-size:clamp(3rem,10vw,7rem);
      letter-spacing:4px;line-height:1;text-shadow:0 0 80px var(--accent)}
    .sp-text{font-size:clamp(.75rem,1.4vw,.9rem);color:var(--dim);line-height:1.85;
      max-width:500px;white-space:pre-wrap;word-break:break-word}
    .sp-gh{font-family:'JetBrains Mono',monospace;font-size:.55rem;letter-spacing:3px;
      text-transform:uppercase;font-weight:700;color:var(--accent);
      border:1.5px solid var(--accent);padding:9px 20px;display:inline-block;
      transition:background .25s,color .25s}
    .sp-gh:hover{background:var(--accent);color:var(--bg)}

    #audio-ctrl{position:fixed;bottom:28px;left:28px;z-index:100;
      background:rgba(6,6,6,.88);border:1px solid rgba(239,239,239,.1);
      backdrop-filter:blur(10px);padding:10px 14px;
      display:flex;align-items:center;gap:10px;
      font-size:.5rem;letter-spacing:1px;color:var(--dim)}
    #audio-play,#audio-mute{background:none;border:none;cursor:none;padding:0;
      line-height:1;transition:color .2s}
    #audio-play{color:var(--accent);font-size:.9rem}
    #audio-play:hover{opacity:.7}
    #audio-mute{color:var(--dim);font-size:.82rem}
    #audio-mute:hover{color:var(--accent)}
    #audio-vol{width:56px;accent-color:var(--accent);cursor:none}
    #audio-lbl{font-size:.45rem;letter-spacing:1px;color:rgba(239,239,239,.25)}

    #edit-btn{position:fixed;bottom:28px;right:28px;z-index:100;
      font-family:'JetBrains Mono',monospace;font-size:.55rem;letter-spacing:2px;
      text-transform:uppercase;font-weight:700;color:var(--bg);background:var(--accent);
      padding:11px 20px;border:1.5px solid var(--accent);cursor:none;
      text-decoration:none;display:none;align-items:center;gap:8px;
      transition:background .25s,color .25s}
    #edit-btn:hover{background:transparent;color:var(--accent)}

    footer{position:fixed;bottom:0;left:0;right:0;z-index:10;padding:8px 40px;
      display:flex;justify-content:space-between;font-size:.4rem;
      color:rgba(239,239,239,.12);letter-spacing:2px;pointer-events:none}
    footer a{pointer-events:auto;color:rgba(239,239,239,.12);transition:color .2s;text-decoration:none}
    footer a:hover{color:rgba(239,239,239,.4)}

    @media(max-width:768px){
      body{cursor:auto;overflow-y:auto}
      #cursor{display:none}
      nav{padding:14px 20px}
      .stage{padding:100px 20px 90px}
      .av-ring{width:96px;height:96px}
      #audio-ctrl{bottom:14px;left:14px;padding:8px 10px;gap:7px}
      #edit-btn{bottom:14px;right:14px;padding:9px 14px}
      #audio-lbl{display:none}
    }
  </style>
</head>
<body>
  <script id="rf-data" type="application/json">${spaceJSON}<\/script>

  <div id="cursor" aria-hidden="true"></div>

  <nav>
    <a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
    <a href="/spaces" class="nav-back">&#8592; spaces</a>
  </nav>

  ${bgHtml}
  <div class="bg-overlay"></div>

  <div class="stage">
    <div class="av-ring">
      <div class="av-inner">
        <img class="av-img" src="${avatar}" alt="${name}">
      </div>
    </div>
    <div class="sp-name">${name}</div>
    ${text ? `<p class="sp-text">${text}</p>` : ''}
    <a href="${github}" target="_blank" rel="noopener" class="sp-gh">GitHub &#8599;</a>
  </div>

  ${audioHtml}

  <a href="#" id="edit-btn" aria-label="Edit your space">&#x270F; Edit</a>

  <footer>
    <span>&#169; 2026 reachflow.site &middot; TR4IS</span>
    <a href="/terms.html">.terms()</a>
  </footer>

  <script>
  (function(){
    const D    = JSON.parse(document.getElementById('rf-data').textContent);
    const CID  = 'Ov23likbVZBfG5a3rnEu';
    const CBCK = 'https://reachflow.site/auth/callback';

    /* cursor */
    const cur   = document.getElementById('cursor');
    const touch = window.matchMedia('(hover:none)').matches;
    if (!touch) {
      document.addEventListener('mousemove', e => {
        cur.style.left = e.clientX + 'px';
        cur.style.top  = e.clientY + 'px';
      });
      document.querySelectorAll('a,button').forEach(el => {
        el.addEventListener('mouseenter', () => cur.classList.add('big'));
        el.addEventListener('mouseleave', () => cur.classList.remove('big'));
      });
    }

    /* edit button — owner only */
    const editBtn     = document.getElementById('edit-btn');
    const storedUser  = sessionStorage.getItem('rf_user');
    const storedToken = sessionStorage.getItem('rf_token');
    const isOwner     = storedUser && storedUser.toLowerCase() === D.login.toLowerCase() && storedToken;
    if (isOwner) {
      editBtn.style.display = 'inline-flex';
      editBtn.addEventListener('click', e => {
        e.preventDefault();
        sessionStorage.setItem('rf_editData', JSON.stringify(D));
        window.location.href = '/editor.html?user=' + encodeURIComponent(D.login);
      });
    }

    /* audio controller */
    const audioEl = document.getElementById('bg-audio');
    if (audioEl) {
      const playBtn  = document.getElementById('audio-play');
      const volSlider= document.getElementById('audio-vol');
      const muteBtn  = document.getElementById('audio-mute');
      audioEl.volume = 0.5;
      let muted = false;

      playBtn.addEventListener('click', () => {
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
          playBtn.innerHTML = '&#9646;&#9646;';
        } else {
          audioEl.pause();
          playBtn.innerHTML = '&#9654;';
        }
      });
      volSlider.addEventListener('input', () => {
        audioEl.volume = volSlider.value;
        if (muted && +volSlider.value > 0) { muted = false; audioEl.muted = false; muteBtn.innerHTML = '&#128266;'; }
      });
      muteBtn.addEventListener('click', () => {
        muted = !muted;
        audioEl.muted = muted;
        muteBtn.innerHTML = muted ? '&#128263;' : '&#128266;';
      });
    }
  })();
  <\/script>
</body>
</html>`;
}
