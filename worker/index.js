const ALLOWED_ORIGIN = 'https://reachflow.site';

const CORS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/exchange') {
      return handleExchange(url, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleExchange(url, env) {
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'Missing code' }, 400);

  /* 1 — Exchange code for user access token */
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

  /* 2 — Fetch GitHub user profile */
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'reachflow-auth',
    },
  });
  const user = await userRes.json();
  const username = user.login;

  /* 3 — Check if space already exists */
  const checkRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}`,
    { headers: ghHeaders(env) }
  );
  if (checkRes.status === 200) {
    return json({ username, created: false });
  }

  /* 4 — Create index.html from template */
  const html = buildTemplate(user);
  const content = toBase64(html);

  const createRes = await fetch(
    `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces/${username}/index.html`,
    {
      method: 'PUT',
      headers: ghHeaders(env),
      body: JSON.stringify({
        message: `feat: add space for ${username}`,
        content,
      }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.json();
    return json({ error: 'Failed to create space', detail: err }, 500);
  }

  return json({ username, created: true });
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

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/* ── Space template ── */
function buildTemplate(user) {
  const name = user.name || user.login;
  const bio = user.bio || 'Developer. Builder.';
  const avatar = user.avatar_url;
  const github = `https://github.com/${user.login}`;

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
    :root{--bg:#060606;--fg:#efefef;--accent:#00ff88;--dim:rgba(239,239,239,.28);--border:rgba(239,239,239,.07);--ease:cubic-bezier(.23,1,.32,1);--pad:64px}
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{background-color:var(--bg);background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:72px 72px;color:var(--fg);font-family:'JetBrains Mono',monospace;overflow-x:hidden;cursor:none}
    a{color:inherit;text-decoration:none}
    #cursor{position:fixed;z-index:9999;pointer-events:none;width:8px;height:8px;border-radius:50%;background:var(--accent);transform:translate(-50%,-50%);transition:width .25s var(--ease),height .25s var(--ease);mix-blend-mode:exclusion}
    #cursor.big{width:36px;height:36px;opacity:.4}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:26px var(--pad);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(to bottom,rgba(6,6,6,.95) 60%,transparent)}
    .nav-brand{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:5px;color:var(--fg)}
    .nav-brand span{color:var(--accent)}
    .nav-back{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:var(--dim);transition:color .2s}
    .nav-back:hover{color:var(--fg)}
    .hero{height:100vh;min-height:600px;display:flex;align-items:flex-end;padding:0 var(--pad) 72px;position:relative;overflow:hidden}
    .hero-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:clamp(14rem,40vw,42rem);color:rgba(255,255,255,.012);letter-spacing:-20px;user-select:none;pointer-events:none;line-height:1}
    .hero-inner{position:relative;z-index:2;display:flex;align-items:flex-end;gap:40px}
    .hero-avatar{width:80px;height:80px;border-radius:50%;border:2px solid var(--border);margin-bottom:8px;flex-shrink:0}
    .hero-label{font-size:.6rem;letter-spacing:1.5px;color:var(--accent);margin-bottom:16px;opacity:.8}
    .hero-headline{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,12vw,13rem);line-height:.85;letter-spacing:2px;color:var(--fg)}
    section:not(.hero){border-top:1px solid var(--border)}
    .sc-wrap{max-width:1100px;margin:0 auto;padding:88px var(--pad);display:grid;grid-template-columns:140px 1fr;gap:56px}
    .sc-label{display:flex;flex-direction:column;gap:6px;padding-top:4px}
    .sc-num{font-size:.52rem;color:var(--accent);letter-spacing:2px}
    .sc-name{font-size:.55rem;color:var(--dim);letter-spacing:4px;text-transform:uppercase}
    .about-text{font-size:clamp(1rem,1.8vw,1.5rem);font-weight:300;line-height:1.7;color:rgba(239,239,239,.5)}
    .contact-btn{display:inline-flex;align-items:center;gap:12px;font-size:.65rem;letter-spacing:4px;text-transform:uppercase;font-weight:700;color:var(--bg);background:var(--accent);padding:14px 28px;border:1.5px solid var(--accent);transition:background .3s,color .3s}
    .contact-btn:hover{background:transparent;color:var(--accent)}
    .scroll-cue{position:absolute;bottom:40px;right:var(--pad);display:flex;flex-direction:column;align-items:center;gap:10px}
    .sc-line{width:1px;height:48px;background:linear-gradient(to bottom,transparent,var(--dim));display:block}
    .sc-text{font-size:.5rem;letter-spacing:4px;text-transform:uppercase;color:var(--dim);writing-mode:vertical-rl}
    @media(max-width:768px){:root{--pad:24px}body{cursor:auto}#cursor{display:none}nav{padding:18px var(--pad)}.sc-wrap{grid-template-columns:1fr;gap:20px;padding:56px var(--pad)}.sc-label{flex-direction:row;align-items:center;gap:10px}}
  </style>
</head>
<body>
  <div id="cursor" aria-hidden="true"></div>
  <nav>
    <a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
    <a href="/spaces" class="nav-back">← spaces</a>
  </nav>
  <section class="hero">
    <div class="hero-bg" aria-hidden="true">${user.login.slice(0, 2).toUpperCase()}</div>
    <div class="hero-inner">
      <img src="${avatar}" alt="${name}" class="hero-avatar">
      <div>
        <p class="hero-label">// ${user.login} · reachflow member</p>
        <h1 class="hero-headline">${name}</h1>
      </div>
    </div>
    <div class="scroll-cue" aria-hidden="true">
      <span class="sc-line"></span>
      <span class="sc-text">scroll</span>
    </div>
  </section>
  <section id="about">
    <div class="sc-wrap">
      <div class="sc-label"><span class="sc-num">01</span><span class="sc-name">About</span></div>
      <div>
        <p class="about-text">${bio}</p>
      </div>
    </div>
  </section>
  <section id="contact">
    <div class="sc-wrap">
      <div class="sc-label"><span class="sc-num">02</span><span class="sc-name">Contact</span></div>
      <div>
        <a class="contact-btn" href="${github}" target="_blank" rel="noopener">
          View on GitHub ↗
        </a>
      </div>
    </div>
  </section>
  <script>
    const cursor = document.getElementById('cursor');
    const isTouch = window.matchMedia('(hover: none)').matches;
    if(!isTouch){
      document.addEventListener('mousemove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});
      document.querySelectorAll('a').forEach(el=>{el.addEventListener('mouseenter',()=>cursor.classList.add('big'));el.addEventListener('mouseleave',()=>cursor.classList.remove('big'))});
    } else { cursor.style.display='none'; }
  </script>
</body>
</html>`;
}
