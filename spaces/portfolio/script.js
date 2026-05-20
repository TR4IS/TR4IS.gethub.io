"use strict";

const GITHUB_USER = "TR4IS";
const SKIP = [];
const LANG_COLORS = {
  JavaScript:"#f1e05a",TypeScript:"#3178c6",Python:"#3572a5",
  HTML:"#e34c26",CSS:"#563d7c",Shell:"#89e051",
  Rust:"#dea584",Go:"#00add8",Java:"#b07219",
  "C++":"#f34b7d",Vue:"#41b883",Lua:"#000080",R:"#276dc3",
};

const $ = id => document.getElementById(id);

const cd = $("cd"), cr = $("cr");
let rx = 0, ry = 0;
document.addEventListener("mousemove", e => {
  cd.style.left = e.clientX + "px"; cd.style.top = e.clientY + "px";
  rx = e.clientX; ry = e.clientY;
});
(function ring() {
  const cx = parseFloat(cr.style.left)||0, cy = parseFloat(cr.style.top)||0;
  cr.style.left = cx + (rx-cx)*.14 + "px";
  cr.style.top  = cy + (ry-cy)*.14 + "px";
  requestAnimationFrame(ring);
})();

const cvs = $("particles"), ctx = cvs.getContext("2d");
const COLORS = ["rgba(167,139,250,","rgba(34,211,238,","rgba(244,114,182,","rgba(52,211,153,","rgba(251,191,36,"];
let pts = [];
function initPts() {
  cvs.width = window.innerWidth; cvs.height = window.innerHeight;
  pts = Array.from({length:80}, () => ({
    x: Math.random() * cvs.width,
    y: Math.random() * cvs.height,
    r: Math.random() * 1.5 + .3,
    vx: (Math.random()-.5) * .3,
    vy: (Math.random()-.5) * .3,
    c: COLORS[Math.random()*COLORS.length|0],
    a: Math.random() * .5 + .1,
  }));
}
function drawPts() {
  ctx.clearRect(0,0,cvs.width,cvs.height);
  pts.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = cvs.width; if (p.x > cvs.width) p.x = 0;
    if (p.y < 0) p.y = cvs.height; if (p.y > cvs.height) p.y = 0;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = p.c + p.a + ")";
    ctx.fill();
  });
  requestAnimationFrame(drawPts);
}
initPts(); window.addEventListener("resize", initPts); drawPts();

function pad(n) { return String(n).padStart(2,"0"); }

setInterval(() => {
  const d = new Date();
  $("bar-time").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}, 1000);

const boot = Date.now();
setInterval(() => {
  const s = Math.floor((Date.now()-boot)/1000);
  $("up").textContent = `${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`;
}, 1000);

const roles = ["Full-Stack Developer","Web Architect","Python Engineer","Open Source Builder","Problem Solver"];
let ri=0,ci=0,del=false;
function tw() {
  const w = roles[ri];
  if (!del) { $("tw").textContent = w.slice(0,++ci); if(ci===w.length){del=true;setTimeout(tw,1800);return;} }
  else       { $("tw").textContent = w.slice(0,--ci); if(ci===0){del=false;ri=(ri+1)%roles.length;} }
  setTimeout(tw, del?42:78);
}
tw();

setTimeout(() => {
  document.querySelectorAll(".skf,.wf").forEach(el => { el.style.width = (el.dataset.p||0) + "%"; });
}, 500);

function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

async function loadProjects() {
  try {
    const res   = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`);
    if (!res.ok) throw new Error();
    const all   = await res.json();
    const repos = all.filter(r => !r.fork && !SKIP.includes(r.name))
                     .sort((a,b) => b.stargazers_count - a.stargazers_count);

    $("rn").textContent     = repos.length;
    $("plabel").textContent = repos.length + " repos";

    const track    = $("ptrack");
    const feed     = $("pfeed");
    const ROW_H    = 32;

    function makeRow(r) {
      const lc = LANG_COLORS[r.language] || "#4a5568";
      const d  = document.createElement("div");
      d.className = "pr";
      d.innerHTML = `
        <span class="prn">${esc(r.name)}</span>
        <span class="prl" style="color:${lc};border-color:${lc}35">${r.language||"—"}</span>
        <span class="prs">${r.stargazers_count > 0 ? "★ "+r.stargazers_count : ""}</span>
        <a href="${r.html_url}" target="_blank" class="pra">↗</a>`;
      return d;
    }

    repos.forEach(r => track.appendChild(makeRow(r)));
    repos.forEach(r => track.appendChild(makeRow(r)));

    let offset = 0;
    setInterval(() => {
      offset += ROW_H;
      if (offset >= repos.length * ROW_H) offset = 0;
      track.style.transform = `translateY(-${offset}px)`;
    }, 2000);

  } catch {
    $("plabel").textContent = "unavailable";
    $("rn").textContent = "?";
  }
}
loadProjects();

setInterval(() => {
  const cards = document.querySelectorAll(".card");
  const c = cards[Math.floor(Math.random()*cards.length)];
  const prev = c.style.transition;
  c.style.transition = "box-shadow .05s";
  c.style.boxShadow = "0 0 30px rgba(167,139,250,.25), inset 0 0 0 1px rgba(167,139,250,.2)";
  setTimeout(() => { c.style.transition = prev||""; c.style.boxShadow = ""; }, 100);
}, 2500);

console.log("%cCRACKER\ntrstrais@gmail.com | github.com/TR4IS\nBuilding since 2022.", "color:#a78bfa;font-family:monospace;font-size:13px;");
