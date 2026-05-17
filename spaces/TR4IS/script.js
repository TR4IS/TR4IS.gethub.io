/* ── Cursor ── */
const cursor = document.getElementById('cursor');
const isTouch = window.matchMedia('(hover: none)').matches;

if (isTouch) {
  cursor.style.display = 'none';
  document.body.style.cursor = 'auto';
} else {
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });
}

function attachCursorHovers() {
  if (isTouch) return;
  document.querySelectorAll('a, button, .project-row, .skill-list li').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}
attachCursorHovers();

/* ── Scroll reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── Projects ── */
const PROJECTS = [
  {
    repo: 'reachflow',
    name: 'Reachflow',
    desc: 'A developer community platform — each member gets their own space to showcase work, ideas, and projects.',
    url: 'https://reachflow.site',
    tags: ['HTML', 'CSS', 'JS']
  },
  {
    repo: 'windows-downloads-file-organizer',
    name: 'File Organizer',
    desc: 'Automated Windows Downloads folder organizer — cleans your workflow without lifting a finger.',
    url: 'https://github.com/TR4IS/windows-downloads-file-organizer',
    tags: ['Python', 'Automation']
  },
  {
    repo: 'WindowsOptimizer',
    name: 'Windows Optimizer',
    desc: 'Performance optimization tool for Windows — system tweaks and cleanup to keep your machine fast.',
    url: 'https://github.com/TR4IS/WindowsOptimizer',
    tags: ['Python', 'Windows']
  }
];

function buildProjectRow(p, index) {
  const row = document.createElement('a');
  row.href = p.url;
  row.target = '_blank';
  row.rel = 'noopener';
  row.className = 'project-row reveal';
  row.style.transitionDelay = (index * 70) + 'ms';
  row.innerHTML = `
    <span class="project-num">0${index + 1}</span>
    <div class="project-info">
      <div class="project-name">${p.name}</div>
      <div class="project-desc">${p.desc}</div>
    </div>
    <div class="project-tags">${p.tags.map(t => `<span class="project-tag">${t}</span>`).join('')}</div>
    <span class="project-arrow">↗</span>
  `;
  return row;
}

function renderProjects(projects) {
  const list = document.getElementById('projects-list');
  list.innerHTML = '';
  projects.forEach((p, i) => {
    const row = buildProjectRow(p, i);
    list.appendChild(row);
    observer.observe(row);
  });
  attachCursorHovers();
}

async function fetchAndRender() {
  const resolved = await Promise.all(
    PROJECTS.map(async p => {
      try {
        const res = await fetch(`https://api.github.com/repos/TR4IS/${p.repo}`);
        if (!res.ok) return p;
        const data = await res.json();
        return { ...p, desc: data.description || p.desc };
      } catch { return p; }
    })
  );
  renderProjects(resolved);
}

fetchAndRender();

/* ── Extraordinary scramble ── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
const EXT_TARGET = 'extraordinary.';
const extEl = document.getElementById('ext-text');
let extIv = null;

function runExtScramble() {
  let iter = 0;
  clearInterval(extIv);
  extIv = setInterval(() => {
    extEl.textContent = EXT_TARGET.split('').map((ch, i) => {
      if (ch === '.') return '.';
      if (i < iter) return EXT_TARGET[i];
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }).join('');
    if (iter >= EXT_TARGET.length) clearInterval(extIv);
    iter += 0.35;
  }, 55);
}

new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) runExtScramble();
    else { clearInterval(extIv); extEl.textContent = EXT_TARGET; }
  });
}, { threshold: 0.8 }).observe(extEl);

/* ── About word hover ── */
function wrapWordsIn(el) {
  [...el.childNodes].forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach(part => {
        if (/^\s+$/.test(part) || part === '') {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'about-word';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('cracker-name')) {
      wrapWordsIn(node);
    }
  });
}
wrapWordsIn(document.querySelector('.about-text'));
