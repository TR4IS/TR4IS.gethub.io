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
    if (url.pathname === '/save' && request.method === 'POST') return handleSave(request, env);
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

/* ── Theme ── */

const THEME_KEYS = ['mint', 'crimson', 'cobalt', 'amber', 'violet', 'neon'];

function themeForUser(login) {
  let h = 0;
  for (const c of login) h = (Math.imul(h, 31) + c.charCodeAt(0)) | 0;
  return THEME_KEYS[Math.abs(h) % THEME_KEYS.length];
}

/* ── Sanitize ── */

function sanitizeData(raw) {
  return {
    login:  String(raw.login  || '').trim().slice(0, 100),
    name:   String(raw.name   || '').trim().slice(0, 60)  || 'Developer',
    bio:    String(raw.bio    || '').trim().slice(0, 300) || 'Developer. Builder.',
    avatar: String(raw.avatar || '').trim().slice(0, 500),
    github: String(raw.github || '').trim().slice(0, 200),
    theme:  THEME_KEYS.includes(raw.theme) ? raw.theme : 'mint',
    skills: Array.isArray(raw.skills)
      ? raw.skills.map(s => String(s).trim().slice(0, 40)).filter(Boolean).slice(0, 20)
      : [],
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

  let created = false;
  if (checkRes.status !== 200) {
    const spaceData = {
      login:  user.login,
      name:   user.name || user.login,
      bio:    user.bio  || 'Developer. Builder.',
      avatar: user.avatar_url,
      github: `https://github.com/${user.login}`,
      theme:  themeForUser(user.login),
      skills: [],
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
    created = true;
  }

  const sessionToken = await issueToken(username, env);
  return json({ username, created, sessionToken });
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
  const login  = esc(d.login);
  const name   = esc(d.name);
  const bio    = esc(d.bio);
  const avatar = esc(d.avatar);
  const github = esc(d.github || `https://github.com/${d.login}`);
  const theme  = THEME_KEYS.includes(d.theme) ? d.theme : themeForUser(d.login);
  const skills = (d.skills || []).map(s => esc(String(s).slice(0, 40)));

  const skillChips = skills.length
    ? skills.map(s => `<span class="skill-chip">${s}</span>`).join('')
    : `<span class="skill-chip muted">// no skills listed yet</span>`;

  // Embedded JSON — escape </script> to prevent injection
  const spaceJSON = JSON.stringify({
    login: d.login, name: d.name, bio: d.bio,
    avatar: d.avatar, github: d.github, theme,
    skills: d.skills || [],
  }).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — reachflow</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
  <style>
    :root{
      --bg:#060606;--fg:#efefef;--accent:#00ff88;
      --glow:rgba(0,255,136,.18);--glow-s:rgba(0,255,136,.38);
      --dim:rgba(239,239,239,.28);--border:rgba(239,239,239,.07);
      --ease:cubic-bezier(.23,1,.32,1);
      --fd:'Bebas Neue',sans-serif;--fm:'JetBrains Mono',monospace;
      --pad:64px;
    }
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{background-color:var(--bg);color:var(--fg);font-family:var(--fm);min-height:100vh;cursor:none;overflow-x:hidden}
    a{color:inherit;text-decoration:none}

    /* cursor */
    #cursor{position:fixed;z-index:9999;pointer-events:none;width:8px;height:8px;border-radius:50%;
      background:var(--accent);transform:translate(-50%,-50%);mix-blend-mode:exclusion;
      transition:width .25s var(--ease),height .25s var(--ease),opacity .2s}
    #cursor.big{width:36px;height:36px;opacity:.4}

    /* nav */
    nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:24px var(--pad);
      display:flex;justify-content:space-between;align-items:center;
      background:linear-gradient(to bottom,rgba(6,6,6,.92) 60%,transparent)}
    .nav-brand{font-family:var(--fd);font-size:1.2rem;letter-spacing:5px}
    .nav-brand span{color:var(--accent)}
    .nav-back{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:var(--dim);transition:color .2s}
    .nav-back:hover{color:var(--fg)}

    /* hero */
    .hero{min-height:100vh;display:flex;align-items:center;padding:0 var(--pad);
      position:relative;overflow:hidden}
    .hero-parallax{position:absolute;inset:-8%;z-index:0;will-change:transform;
      background-image:var(--bg-img);background-size:var(--bg-sz)}
    .hero-glow{position:absolute;inset:0;z-index:1;pointer-events:none;
      background:radial-gradient(ellipse 55% 55% at 65% 50%,var(--glow) 0%,transparent 70%)}
    .hero-inner{position:relative;z-index:2;display:grid;grid-template-columns:auto 1fr;
      gap:52px;align-items:center;max-width:920px}

    /* avatar */
    .avatar-wrap{position:relative;flex-shrink:0;width:148px;height:148px}
    .avatar-ring{position:absolute;inset:-5px;border-radius:50%;
      background:conic-gradient(var(--accent) 0%,transparent 40%,var(--accent) 80%,transparent 100%);
      animation:spin 5s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .avatar{width:148px;height:148px;border-radius:50%;border:4px solid var(--bg);
      position:relative;z-index:1;display:block;object-fit:cover}

    /* hero text */
    .hero-eyebrow{font-size:.56rem;color:var(--accent);letter-spacing:2px;margin-bottom:14px;opacity:.8}
    .hero-name{font-family:var(--fd);font-size:clamp(3.5rem,9vw,8.5rem);line-height:.85;
      letter-spacing:2px;color:var(--fg);text-shadow:0 0 80px var(--glow-s);margin-bottom:18px}
    .hero-bio{font-size:clamp(.75rem,1.2vw,.95rem);color:var(--dim);line-height:1.8;max-width:460px}
    .hero-actions{display:flex;gap:14px;margin-top:26px;flex-wrap:wrap}
    .hero-btn{font-size:.55rem;letter-spacing:3px;text-transform:uppercase;font-weight:700;
      color:var(--accent);border:1.5px solid var(--accent);padding:9px 20px;
      transition:background .25s,color .25s;display:inline-flex;align-items:center;gap:6px;
      font-family:var(--fm)}
    .hero-btn:hover{background:var(--accent);color:var(--bg)}

    /* scroll cue */
    .scroll-cue{position:absolute;bottom:40px;right:var(--pad);
      display:flex;flex-direction:column;align-items:center;gap:10px}
    .sc-line{width:1px;height:48px;background:linear-gradient(to bottom,transparent,var(--dim));display:block}
    .sc-txt{font-size:.46rem;letter-spacing:4px;text-transform:uppercase;color:var(--dim);writing-mode:vertical-rl}

    /* sections */
    section.sc{border-top:1px solid var(--border)}
    .sc-wrap{max-width:920px;margin:0 auto;padding:80px var(--pad);
      display:grid;grid-template-columns:160px 1fr;gap:48px}
    .sc-label{display:flex;flex-direction:column;gap:6px;padding-top:4px}
    .sc-num{font-size:.52rem;color:var(--accent);letter-spacing:2px}
    .sc-name{font-size:.5rem;color:var(--dim);letter-spacing:4px;text-transform:uppercase}
    .about-text{font-size:clamp(.88rem,1.5vw,1.2rem);font-weight:300;line-height:1.85;
      color:rgba(239,239,239,.5)}

    /* skills */
    .skills-wrap{display:flex;flex-wrap:wrap;gap:10px}
    .skill-chip{font-size:.6rem;letter-spacing:1px;color:var(--accent);
      border:1px solid var(--accent);padding:6px 14px;
      transition:background .2s,color .2s;display:inline-block}
    .skill-chip:hover{background:var(--accent);color:var(--bg)}
    .skill-chip.muted{color:var(--dim);border-color:var(--border)}

    /* footer */
    footer{padding:28px var(--pad);border-top:1px solid var(--border);
      display:flex;justify-content:space-between;align-items:center;
      font-size:.46rem;color:rgba(239,239,239,.14);letter-spacing:2px}
    footer a{color:rgba(239,239,239,.14);transition:color .2s}
    footer a:hover{color:var(--accent)}

    /* edit button */
    #edit-btn{position:fixed;bottom:32px;right:32px;z-index:300;font-family:var(--fm);
      font-size:.55rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;
      color:var(--bg);background:var(--accent);padding:12px 20px;
      border:1.5px solid var(--accent);cursor:none;
      display:none;align-items:center;gap:8px;
      transition:background .25s,color .25s}
    #edit-btn:hover{background:transparent;color:var(--accent)}
    #edit-btn.guest{background:transparent;color:var(--dim);border-color:var(--border)}
    #edit-btn.guest:hover{border-color:var(--accent);color:var(--accent)}

    /* editor overlay */
    #ep-overlay{position:fixed;inset:0;z-index:400;background:rgba(6,6,6,.65);
      backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .4s var(--ease)}
    #ep-overlay.open{opacity:1;pointer-events:auto}

    /* editor panel */
    #ep{position:fixed;top:0;right:0;bottom:0;z-index:500;
      width:min(420px,100vw);background:rgba(8,8,8,.98);
      border-left:1px solid var(--border);
      transform:translateX(100%);transition:transform .45s var(--ease);
      display:flex;flex-direction:column;overflow:hidden}
    #ep.open{transform:none}
    .ep-hd{padding:26px 28px 20px;border-bottom:1px solid var(--border);
      display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
    .ep-title{font-family:var(--fd);font-size:2.2rem;letter-spacing:2px;color:var(--accent)}
    .ep-close{font-size:1.5rem;color:var(--dim);cursor:none;background:none;border:none;
      font-family:var(--fm);transition:color .2s;line-height:1}
    .ep-close:hover{color:var(--fg)}
    .ep-body{flex:1;overflow-y:auto;padding:24px 28px;display:flex;flex-direction:column;gap:22px}
    .ep-body::-webkit-scrollbar{width:3px}
    .ep-body::-webkit-scrollbar-thumb{background:var(--border)}
    .ep-field{display:flex;flex-direction:column;gap:8px}
    .ep-lbl{font-size:.48rem;color:var(--accent);letter-spacing:2px;text-transform:uppercase}
    .ep-in,.ep-ta{background:rgba(255,255,255,.04);border:1px solid var(--border);
      color:var(--fg);font-family:var(--fm);font-size:.75rem;padding:10px 12px;
      outline:none;width:100%;transition:border-color .2s;cursor:none}
    .ep-in:focus,.ep-ta:focus{border-color:var(--accent)}
    .ep-ta{resize:vertical;min-height:80px;line-height:1.65}

    /* theme swatches */
    .swatches{display:flex;gap:10px;flex-wrap:wrap}
    .swatch{width:30px;height:30px;border-radius:50%;border:2px solid transparent;
      cursor:none;transition:transform .2s,border-color .2s}
    .swatch:hover{transform:scale(1.15)}
    .swatch.on{border-color:var(--fg);transform:scale(1.1)}

    /* skills editor */
    .sk-tags{display:flex;flex-wrap:wrap;gap:8px;min-height:28px}
    .sk-tag{font-size:.58rem;color:var(--accent);border:1px solid var(--accent);
      padding:4px 10px;display:inline-flex;align-items:center;gap:6px}
    .sk-rm{cursor:none;color:var(--dim);transition:color .2s;font-size:.8rem;line-height:1;
      background:none;border:none;font-family:var(--fm)}
    .sk-rm:hover{color:#ff5555}
    .sk-add-row{display:flex;gap:8px}
    .sk-in{flex:1;background:rgba(255,255,255,.04);border:1px solid var(--border);
      color:var(--fg);font-family:var(--fm);font-size:.7rem;padding:8px 10px;
      outline:none;cursor:none;transition:border-color .2s}
    .sk-in:focus{border-color:var(--accent)}
    .sk-add{font-size:.6rem;letter-spacing:1px;font-weight:700;font-family:var(--fm);
      color:var(--bg);background:var(--accent);border:1.5px solid var(--accent);
      padding:8px 14px;cursor:none;transition:background .2s,color .2s}
    .sk-add:hover{background:transparent;color:var(--accent)}

    /* ep footer */
    .ep-ft{padding:18px 28px;border-top:1px solid var(--border);display:flex;gap:10px;flex-shrink:0}
    .ep-save{flex:1;font-size:.62rem;letter-spacing:3px;text-transform:uppercase;font-weight:700;
      color:var(--bg);background:var(--accent);border:1.5px solid var(--accent);
      padding:12px;cursor:none;font-family:var(--fm);transition:background .25s,color .25s}
    .ep-save:hover{background:transparent;color:var(--accent)}
    .ep-save:disabled{opacity:.35;pointer-events:none}
    .ep-cx{font-size:.62rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;
      color:var(--dim);background:transparent;border:1.5px solid var(--border);
      padding:12px 14px;cursor:none;font-family:var(--fm);transition:border-color .2s,color .2s}
    .ep-cx:hover{border-color:var(--fg);color:var(--fg)}
    .ep-status{font-size:.52rem;letter-spacing:1px;padding:6px 28px;min-height:28px;
      display:flex;align-items:center;color:var(--accent)}

    /* reveal */
    .reveal{opacity:0;transform:translateY(14px);
      transition:opacity .6s var(--ease),transform .6s var(--ease)}
    .reveal.vis{opacity:1;transform:none}

    @media(max-width:768px){
      :root{--pad:24px}
      body{cursor:auto}
      #cursor{display:none}
      nav{padding:18px var(--pad)}
      .hero{align-items:flex-end;padding-bottom:72px}
      .hero-inner{grid-template-columns:1fr;gap:28px;padding-top:110px}
      .avatar-wrap,.avatar{width:88px;height:88px}
      .sc-wrap{grid-template-columns:1fr;gap:16px;padding:56px var(--pad)}
      .sc-label{flex-direction:row;align-items:center;gap:8px}
      #edit-btn{bottom:16px;right:16px}
    }
  </style>
</head>
<body>
  <script id="rf-data" type="application/json">${spaceJSON}</script>

  <div id="cursor" aria-hidden="true"></div>

  <nav>
    <a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
    <a href="/spaces" class="nav-back">&#8592; spaces</a>
  </nav>

  <section class="hero">
    <div class="hero-parallax" id="pbg"></div>
    <div class="hero-glow"></div>
    <div class="hero-inner">
      <div class="avatar-wrap">
        <div class="avatar-ring"></div>
        <img id="av" src="${avatar}" alt="${name}" class="avatar">
      </div>
      <div>
        <p class="hero-eyebrow">// ${login} &middot; reachflow</p>
        <h1 class="hero-name" id="d-name">${name}</h1>
        <p class="hero-bio" id="d-bio">${bio}</p>
        <div class="hero-actions">
          <a href="${github}" target="_blank" rel="noopener" class="hero-btn">GitHub &#8599;</a>
        </div>
      </div>
    </div>
    <div class="scroll-cue" aria-hidden="true">
      <span class="sc-line"></span><span class="sc-txt">scroll</span>
    </div>
  </section>

  <section class="sc" id="about">
    <div class="sc-wrap reveal">
      <div class="sc-label"><span class="sc-num">01</span><span class="sc-name">About</span></div>
      <div><p class="about-text" id="d-bio2">${bio}</p></div>
    </div>
  </section>

  <section class="sc" id="skills-sec">
    <div class="sc-wrap reveal">
      <div class="sc-label"><span class="sc-num">02</span><span class="sc-name">Skills</span></div>
      <div class="skills-wrap" id="d-skills">${skillChips}</div>
    </div>
  </section>

  <footer>
    <span>&#169; 2026 reachflow.site &middot; TR4IS &middot; All rights reserved</span>
    <a href="/terms.html">.terms()</a>
  </footer>

  <button id="edit-btn" aria-label="Edit your space">&#x270F; Edit your space</button>

  <div id="ep-overlay"></div>
  <div id="ep">
    <div class="ep-hd">
      <span class="ep-title">.edit()</span>
      <button class="ep-close" id="ep-close" aria-label="Close">&#x00D7;</button>
    </div>
    <div class="ep-body">
      <div class="ep-field">
        <label class="ep-lbl" for="ep-name">Display Name</label>
        <input class="ep-in" id="ep-name" type="text" maxlength="60" autocomplete="off" spellcheck="false">
      </div>
      <div class="ep-field">
        <label class="ep-lbl" for="ep-bio">Bio</label>
        <textarea class="ep-ta" id="ep-bio" maxlength="300" rows="4" spellcheck="false"></textarea>
      </div>
      <div class="ep-field">
        <span class="ep-lbl">Theme</span>
        <div class="swatches" id="swatches"></div>
      </div>
      <div class="ep-field">
        <span class="ep-lbl">Skills</span>
        <div class="sk-tags" id="sk-tags"></div>
        <div class="sk-add-row">
          <input class="sk-in" id="sk-in" type="text" placeholder="Add a skill..." maxlength="40" autocomplete="off">
          <button class="sk-add" id="sk-add">+ Add</button>
        </div>
      </div>
    </div>
    <div class="ep-status" id="ep-st"></div>
    <div class="ep-ft">
      <button class="ep-save" id="ep-save">Save changes</button>
      <button class="ep-cx" id="ep-cx">Cancel</button>
    </div>
  </div>

  <script>
  (function(){
    const D = JSON.parse(document.getElementById('rf-data').textContent);
    const WORKER = 'https://reachflow-auth.cr4cker.workers.dev';
    const CLIENT_ID = 'Ov23likbVZBfG5a3rnEu';
    const CALLBACK  = 'https://reachflow.site/auth/callback';

    /* ── Palette ── */
    const PAL = {
      mint:    { a:'#00ff88', g:'0,255,136',   bi:'linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px)', bs:'72px 72px' },
      crimson: { a:'#ff3355', g:'255,51,85',   bi:'linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px)', bs:'72px 72px' },
      cobalt:  { a:'#4499ff', g:'68,153,255',  bi:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(68,153,255,.04) 3px,rgba(68,153,255,.04) 4px)', bs:'100% 4px' },
      amber:   { a:'#ffaa00', g:'255,170,0',   bi:'radial-gradient(circle,rgba(255,255,255,.05) 1px,transparent 1px)', bs:'28px 28px' },
      violet:  { a:'#bb44ff', g:'187,68,255',  bi:'radial-gradient(circle,rgba(187,68,255,.06) 1px,transparent 1px)', bs:'24px 24px' },
      neon:    { a:'#00ffee', g:'0,255,238',   bi:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,238,.03) 3px,rgba(0,255,238,.03) 4px)', bs:'100% 4px' },
    };

    /* ── Apply theme ── */
    function applyTheme(t) {
      const p = PAL[t] || PAL.mint;
      const r = document.documentElement.style;
      r.setProperty('--accent',  p.a);
      r.setProperty('--glow',    \`rgba(\${p.g},.18)\`);
      r.setProperty('--glow-s',  \`rgba(\${p.g},.38)\`);
      r.setProperty('--bg-img',  p.bi);
      r.setProperty('--bg-sz',   p.bs);
      document.getElementById('pbg').style.cssText =
        \`background-image:\${p.bi};background-size:\${p.bs}\`;
    }
    applyTheme(D.theme);

    /* ── Cursor ── */
    const cur = document.getElementById('cursor');
    const touch = window.matchMedia('(hover:none)').matches;
    if (touch) { cur.style.display='none'; document.body.style.cursor='auto'; }
    else {
      document.addEventListener('mousemove', e => {
        cur.style.left = e.clientX + 'px';
        cur.style.top  = e.clientY + 'px';
      });
      function hookCursor() {
        document.querySelectorAll('a,button,.swatch,.skill-chip,.sk-rm,.sk-tag').forEach(el => {
          el.addEventListener('mouseenter', () => cur.classList.add('big'));
          el.addEventListener('mouseleave', () => cur.classList.remove('big'));
        });
      }
      hookCursor();
    }

    /* ── Mouse parallax ── */
    if (!touch) {
      const pbg = document.getElementById('pbg');
      const av  = document.getElementById('av');
      document.addEventListener('mousemove', e => {
        const x = (e.clientX / window.innerWidth  - .5) * 20;
        const y = (e.clientY / window.innerHeight - .5) * 20;
        pbg.style.transform = \`translate(\${x}px,\${y}px)\`;
        av.style.transform  = \`translate(\${-x*.35}px,\${-y*.35}px)\`;
      });
    }

    /* ── Scroll reveal ── */
    const ro = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); ro.unobserve(e.target); } }),
      { threshold: .08 }
    );
    document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

    /* ── Edit button logic ── */
    const editBtn = document.getElementById('edit-btn');
    editBtn.style.display = 'inline-flex';

    const storedUser  = sessionStorage.getItem('rf_user');
    const storedToken = sessionStorage.getItem('rf_token');
    const isOwner = storedUser && storedUser.toLowerCase() === D.login.toLowerCase() && storedToken;

    if (isOwner) {
      editBtn.classList.remove('guest');
      editBtn.addEventListener('click', openEditor);
    } else {
      editBtn.classList.add('guest');
      editBtn.textContent = '&#x270F; Edit your space';
      editBtn.innerHTML = '&#x270F; Edit your space';
      editBtn.addEventListener('click', () => {
        const nonce = crypto.randomUUID();
        const state = \`edit:\${D.login}:\${nonce}\`;
        sessionStorage.setItem('oauth_state', state);
        window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID
          + '&redirect_uri=' + encodeURIComponent(CALLBACK)
          + '&scope=read:user&state=' + encodeURIComponent(state);
      });
    }

    /* ── Editor state ── */
    let eSkills = [...(D.skills || [])];
    let eTheme  = D.theme || 'mint';

    function openEditor() {
      document.getElementById('ep-name').value = D.name || '';
      document.getElementById('ep-bio').value  = D.bio  || '';
      eSkills = [...(D.skills || [])];
      eTheme  = D.theme || 'mint';
      renderSwatches();
      renderSkills();
      document.getElementById('ep-st').textContent = '';
      document.getElementById('ep').classList.add('open');
      document.getElementById('ep-overlay').classList.add('open');
    }
    function closeEditor() {
      document.getElementById('ep').classList.remove('open');
      document.getElementById('ep-overlay').classList.remove('open');
      applyTheme(D.theme); // revert preview
    }

    document.getElementById('ep-close').addEventListener('click', closeEditor);
    document.getElementById('ep-cx').addEventListener('click', closeEditor);
    document.getElementById('ep-overlay').addEventListener('click', closeEditor);

    /* ── Swatches ── */
    function renderSwatches() {
      const wrap = document.getElementById('swatches');
      wrap.innerHTML = '';
      Object.entries(PAL).forEach(([key, p]) => {
        const sw = document.createElement('button');
        sw.className = 'swatch' + (key === eTheme ? ' on' : '');
        sw.style.background = p.a;
        sw.title = key;
        sw.addEventListener('click', () => {
          eTheme = key;
          applyTheme(key);
          renderSwatches();
        });
        wrap.appendChild(sw);
      });
      hookCursor && hookCursor();
    }

    /* ── Skills editor ── */
    function renderSkills() {
      const wrap = document.getElementById('sk-tags');
      wrap.innerHTML = '';
      eSkills.forEach((s, i) => {
        const tag = document.createElement('span');
        tag.className = 'sk-tag';
        const txt = document.createTextNode(s + ' ');
        const rm  = document.createElement('button');
        rm.className = 'sk-rm';
        rm.textContent = '×';
        rm.addEventListener('click', () => { eSkills.splice(i, 1); renderSkills(); });
        tag.appendChild(txt);
        tag.appendChild(rm);
        wrap.appendChild(tag);
      });
    }

    function addSkill() {
      const inp = document.getElementById('sk-in');
      const val = inp.value.trim();
      if (val && eSkills.length < 20 && !eSkills.includes(val)) {
        eSkills.push(val);
        renderSkills();
        inp.value = '';
      }
    }
    document.getElementById('sk-add').addEventListener('click', addSkill);
    document.getElementById('sk-in').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } });

    /* ── Live preview ── */
    document.getElementById('ep-name').addEventListener('input', e => {
      const v = e.target.value || D.name;
      document.getElementById('d-name').textContent = v;
    });
    document.getElementById('ep-bio').addEventListener('input', e => {
      const v = e.target.value || D.bio;
      document.getElementById('d-bio').textContent = v;
      document.getElementById('d-bio2').textContent = v;
    });

    /* ── Save ── */
    document.getElementById('ep-save').addEventListener('click', async () => {
      const saveBtn = document.getElementById('ep-save');
      const status  = document.getElementById('ep-st');
      const token   = sessionStorage.getItem('rf_token');
      if (!token) {
        status.style.color = '#ff5555';
        status.textContent = '// session expired — sign in again';
        return;
      }
      saveBtn.disabled = true;
      status.style.color = 'var(--accent)';
      status.textContent = '// saving...';

      try {
        const res = await fetch(WORKER + '/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            data: {
              login:  D.login,
              name:   document.getElementById('ep-name').value.trim() || D.name,
              bio:    document.getElementById('ep-bio').value.trim()  || D.bio,
              avatar: D.avatar,
              github: D.github,
              theme:  eTheme,
              skills: eSkills,
            },
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Save failed');

        // Update in-memory data
        D.name   = document.getElementById('ep-name').value.trim() || D.name;
        D.bio    = document.getElementById('ep-bio').value.trim()  || D.bio;
        D.theme  = eTheme;
        D.skills = [...eSkills];

        // Update skills display safely
        const wrap = document.getElementById('d-skills');
        wrap.innerHTML = '';
        if (eSkills.length) {
          eSkills.forEach(s => {
            const chip = document.createElement('span');
            chip.className = 'skill-chip';
            chip.textContent = s;
            wrap.appendChild(chip);
          });
        } else {
          const chip = document.createElement('span');
          chip.className = 'skill-chip muted';
          chip.textContent = '// no skills listed yet';
          wrap.appendChild(chip);
        }

        status.textContent = '// saved! github is rebuilding your page...';
        setTimeout(closeEditor, 2000);
      } catch (err) {
        status.style.color = '#ff5555';
        status.textContent = '// error: ' + err.message;
      } finally {
        saveBtn.disabled = false;
      }
    });

    function hookCursor() {
      if (touch) return;
      document.querySelectorAll('a,button,.swatch,.skill-chip,.sk-rm').forEach(el => {
        el.addEventListener('mouseenter', () => cur.classList.add('big'));
        el.addEventListener('mouseleave', () => cur.classList.remove('big'));
      });
    }
  })();
  </script>
</body>
</html>`;
}
