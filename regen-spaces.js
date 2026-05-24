// regen-spaces.js — regenerate all user space HTML files using the current buildTemplate
// Run from repo root: node regen-spaces.js
//
// Handles three formats:
//   NEW  — already has <script id="user-html" type="text/x-user-html">  → pass userHtml through unchanged
//   OLD  — has <script id="rf-data" type="application/json">             → convert profile to defaultUserHtml
//   BARE — plain old space pages                                          → extract name/avatar and use defaultUserHtml

const fs   = require('fs');
const path = require('path');

/* ── Helpers matching worker/index.js ── */

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function sanitizeUrl(raw) {
  const s = String(raw || '').trim().slice(0, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? s : '';
  } catch { return ''; }
}

/* ── Default starter HTML for new/migrating users ── */
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
      background-image:
        linear-gradient(rgba(255,255,255,.016) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.016) 1px, transparent 1px);
      background-size: 72px 72px;
      color: #efefef;
      font-family: 'JetBrains Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
      padding: 80px 24px 60px;
    }
    .avatar {
      width: 120px; height: 120px;
      border-radius: 50%; object-fit: cover;
      border: 2px solid #8b5cf6;
      box-shadow: 0 0 40px rgba(139,92,246,.4);
      display: block;
    }
    h1 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: clamp(2.5rem, 8vw, 5rem);
      letter-spacing: 4px; line-height: 1;
      text-shadow: 0 0 80px rgba(139,92,246,.4);
    }
    .bio {
      font-size: .88rem;
      color: rgba(239,239,239,.5);
      line-height: 1.9; max-width: 420px; text-align: center;
    }
    .gh-link {
      font-family: 'JetBrains Mono', monospace; font-weight: 700;
      font-size: .88rem; letter-spacing: 3px; text-transform: uppercase;
      color: #060606; background: #8b5cf6;
      border: 1.5px solid #8b5cf6;
      padding: 13px 28px;
      text-decoration: none;
      display: inline-flex; align-items: center; gap: 10px;
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

/* ── Outer shell template — exactly mirrors worker/index.js buildTemplate ── */
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
    nav{position:fixed;top:0;left:0;right:0;z-index:9998;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(6,6,6,.96);border-bottom:1px solid rgba(139,92,246,.15);backdrop-filter:blur(14px)}
    .nav-brand{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:5px;color:#efefef;text-decoration:none}
    .nav-brand span{color:#8b5cf6}
    .nav-right{display:flex;align-items:center;gap:16px}
    .nav-back{font-size:.6rem;letter-spacing:2px;text-transform:uppercase;color:rgba(239,239,239,.28);text-decoration:none;transition:color .2s}
    .nav-back:hover{color:#efefef}
    #edit-btn{font-family:'JetBrains Mono',monospace;font-size:.62rem;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#060606;background:#8b5cf6;padding:8px 16px;border:1.5px solid #8b5cf6;text-decoration:none;display:none;align-items:center;gap:6px;transition:background .25s,color .25s}
    #edit-btn:hover{background:transparent;color:#8b5cf6}
    footer{position:fixed;bottom:0;left:0;right:0;z-index:9997;padding:5px 28px;display:flex;justify-content:space-between;font-size:.5rem;color:rgba(239,239,239,.1);letter-spacing:2px;pointer-events:none;font-family:'JetBrains Mono',monospace;background:rgba(6,6,6,.7);backdrop-filter:blur(8px)}
    footer a{pointer-events:auto;color:rgba(239,239,239,.1);text-decoration:none;transition:color .2s}
    footer a:hover{color:rgba(239,239,239,.3)}
    @media(max-width:600px){nav{padding:0 16px}#edit-btn{font-size:.56rem;padding:7px 13px}}
  </style>
</head>
<body>
  <nav>
    <a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
    <div class="nav-right">
      <a href="/spaces" class="nav-back">&#8592; spaces</a>
      <a href="#" id="edit-btn">&#x270F;&nbsp;Edit</a>
    </div>
  </nav>
  <iframe id="space-frame"
    sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
    title="${title}'s space"
    loading="eager"
  ></iframe>
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

/* ── Extract data from old-style or new-style space HTML ── */
function extractData(html, login) {
  // NEW format: <script id="user-html" type="text/x-user-html">
  const newMatch = html.match(/<script\s+id="user-html"\s+type="text\/x-user-html">([\s\S]*?)<\/script>/i);
  if (newMatch) {
    // Already in the new format — pass userHtml through as-is
    return { login, userHtml: newMatch[1] };
  }

  // OLD format: <script id="rf-data" type="application/json">
  const oldMatch = html.match(/<script\s+id="rf-data"\s+type="application\/json">([\s\S]*?)<\/script>/i);
  if (oldMatch) {
    try {
      const d = JSON.parse(oldMatch[1]);
      const profile = {
        login:  d.login  || login,
        name:   d.name   || d.login || login,
        bio:    d.text   || '',
        avatar: d.avatar || `https://github.com/${login}.png`,
        github: d.github || `https://github.com/${login}`,
      };
      console.log(`  [MIGRATE] ${login} — converting rf-data format → defaultUserHtml`);
      return { login, userHtml: defaultUserHtml(profile) };
    } catch (e) {
      console.warn(`  [WARN] ${login} — failed to parse rf-data: ${e.message}`);
    }
  }

  // FALLBACK: extract what we can from the raw HTML
  const titleMatch = html.match(/<title>([^<]+?)\s*(?:[—–-]|&#8212;)\s*reachflow<\/title>/i);
  const name = titleMatch ? titleMatch[1].trim() : login;

  const avatarMatch = html.match(/src="(https:\/\/avatars\.githubusercontent\.com\/[^"]+)"/);
  const avatar = avatarMatch ? avatarMatch[1] : `https://github.com/${login}.png`;

  const ghMatch = html.match(/href="(https:\/\/github\.com\/[^"]+)"/);
  const github = ghMatch ? ghMatch[1] : `https://github.com/${login}`;

  const profile = { login, name, bio: '', avatar, github };
  console.log(`  [MIGRATE] ${login} — using fallback extraction → defaultUserHtml`);
  return { login, userHtml: defaultUserHtml(profile) };
}

/* ── Main ── */

const spacesDir = path.join(__dirname, 'spaces');
const dirs = fs.readdirSync(spacesDir).filter(d => {
  const full = path.join(spacesDir, d);
  return fs.statSync(full).isDirectory();
});

let updated = 0, skipped = 0, failed = 0;

for (const login of dirs) {
  const htmlPath = path.join(spacesDir, login, 'index.html');
  if (!fs.existsSync(htmlPath)) {
    console.log(`  [SKIP] ${login} — no index.html`);
    skipped++;
    continue;
  }

  try {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const data = extractData(html, login);
    data.login = login; // always trust directory name, not embedded login
    const newHtml = buildTemplate(data);
    fs.writeFileSync(htmlPath, newHtml, 'utf8');
    console.log(`  [OK]   ${login}`);
    updated++;
  } catch (e) {
    console.error(`  [FAIL] ${login}: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed.`);
