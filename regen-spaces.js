// regen-spaces.js — regenerate all user space HTML files using the current buildTemplate
// Run from repo root: node regen-spaces.js

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

function sanitizeData(raw) {
  const color = /^#[0-9a-fA-F]{6}$/.test(String(raw.accentColor || '').trim())
    ? String(raw.accentColor).trim() : '#8b5cf6';
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

function buildTemplate(d) {
  const login    = esc(d.login);
  const name     = esc(d.name  || 'Developer');
  const text     = esc(d.text  || '');
  const avatar   = esc(d.avatar || '');
  const github   = esc(d.github || `https://github.com/${d.login}`);
  const bgUrl    = esc(d.bgUrl    || '');
  const musicUrl = esc(d.musicUrl || '');
  const accent   = /^#[0-9a-fA-F]{6}$/.test(d.accentColor) ? d.accentColor : '#8b5cf6';

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

/* ── Extract data from old-style or new-style HTML ── */

function extractData(html, login) {
  // Try new format: <script id="rf-data" type="application/json">...</script>
  const jsonMatch = html.match(/<script\s+id="rf-data"\s+type="application\/json">([\s\S]*?)<\/script>/);
  if (jsonMatch) {
    try {
      const raw = JSON.parse(jsonMatch[1]);
      // If accent is old green default, upgrade to violet
      if (!raw.accentColor || raw.accentColor === '#00ff88') raw.accentColor = '#8b5cf6';
      return sanitizeData(raw);
    } catch (e) {
      console.warn(`  [WARN] Failed to parse rf-data JSON for ${login}: ${e.message}`);
    }
  }

  // Fall back to old-style extraction
  const titleMatch = html.match(/<title>([^<]+?)\s*[—–-]\s*reachflow<\/title>/i)
    || html.match(/<title>([^<]+?)\s*&#8212;\s*reachflow<\/title>/i);
  const name = titleMatch ? titleMatch[1].trim() : login;

  const avatarMatch = html.match(/src="(https:\/\/avatars\.githubusercontent\.com\/[^"]+)"/);
  const avatar = avatarMatch ? avatarMatch[1] : `https://github.com/${login}.png`;

  const ghMatch = html.match(/href="(https:\/\/github\.com\/[^"]+)"/);
  const github = ghMatch ? ghMatch[1] : `https://github.com/${login}`;

  return sanitizeData({
    login,
    name,
    text:        '',
    avatar,
    github,
    bgUrl:       '',
    musicUrl:    '',
    accentColor: '#8b5cf6',
  });
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
    // Make sure login matches directory name
    data.login = login;
    const newHtml = buildTemplate(data);
    fs.writeFileSync(htmlPath, newHtml, 'utf8');
    console.log(`  [OK]   ${login} (accent: ${data.accentColor})`);
    updated++;
  } catch (e) {
    console.error(`  [FAIL] ${login}: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed.`);
