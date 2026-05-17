/* ── Cursor ── */
const dot = document.getElementById('dot');
const isTouch = window.matchMedia('(hover: none)').matches;

if (isTouch) {
  dot.style.display = 'none';
  document.body.style.cursor = 'auto';
} else {
  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  });
}

function attachCursorHovers() {
  if (isTouch) return;
  document.querySelectorAll('a, button, .project-row, .nav-links a').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('big'));
    el.addEventListener('mouseleave', () => dot.classList.remove('big'));
  });
}
attachCursorHovers();

/* ── Scroll reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

// Stagger skill groups
document.querySelectorAll('.sg').forEach((el, i) => {
  el.style.transitionDelay = (i * 100) + 'ms';
});

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

const ROW_COLORS = ['pr-1', 'pr-2', 'pr-3'];

function buildProjectRow(p, index) {
  const row = document.createElement('a');
  row.href = p.url;
  row.target = '_blank';
  row.rel = 'noopener';
  row.className = `project-row ${ROW_COLORS[index % ROW_COLORS.length]} reveal`;
  row.style.transitionDelay = (index * 80) + 'ms';
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
        return {
          ...p,
          desc: data.description || p.desc,
          url: p.url
        };
      } catch {
        return p;
      }
    })
  );
  renderProjects(resolved);
}

fetchAndRender();

/* ── Text scramble ── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
const SCRAMBLE_TARGET = 'Initiate Contact';
const scrambleEl  = document.getElementById('scramble-text');
const scrambleBtn = document.getElementById('scramble-btn');
let scrambleIv = null;

scrambleBtn.addEventListener('click', () => {
  window.location.href = 'mailto:ziyad.tr.46@gmail.com';
});

scrambleBtn.addEventListener('mouseenter', () => {
  let iter = 0;
  clearInterval(scrambleIv);
  scrambleIv = setInterval(() => {
    scrambleEl.textContent = SCRAMBLE_TARGET
      .split('')
      .map((ch, i) => {
        if (ch === ' ') return ' ';
        if (i < iter) return SCRAMBLE_TARGET[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join('');
    if (iter >= SCRAMBLE_TARGET.length) clearInterval(scrambleIv);
    iter += 0.6;
  }, 35);
});

scrambleBtn.addEventListener('mouseleave', () => {
  clearInterval(scrambleIv);
  scrambleEl.textContent = SCRAMBLE_TARGET;
});

/* ── Heading hover: scale + seamless rainbow speed-up ── */
const SLOW_MS = 6000;
const FAST_MS = 1500;

function getRgEls(el) {
  return el.classList.contains('rg') ? [el] : [...el.querySelectorAll('.rg')];
}

function switchRainbow(heading, fromMs, toMs) {
  getRgEls(heading).forEach(el => {
    const delayMs = parseFloat(getComputedStyle(el).animationDelay) * 1000 || 0;
    const elapsed = performance.now() - delayMs;
    const progress = (elapsed % fromMs) / fromMs;
    el.style.animationDuration = toMs + 'ms';
    el.style.animationDelay    = -(progress * toMs) + 'ms';
  });
}

document.querySelectorAll('.hero-headline, .section-title, .contact-headline').forEach(heading => {
  heading.addEventListener('mouseenter', () => switchRainbow(heading, SLOW_MS, FAST_MS));
  heading.addEventListener('mouseleave', () => switchRainbow(heading, FAST_MS, SLOW_MS));
});

/* ── Extraordinary scramble ── */
const EXT_TARGET = 'extraordinary.';
const extEl = document.getElementById('ext-text');
let extIv = null;

function runExtScramble() {
  let iter = 0;
  clearInterval(extIv);
  extIv = setInterval(() => {
    extEl.textContent = EXT_TARGET
      .split('')
      .map((ch, i) => {
        if (ch === '.') return '.';
        if (i < iter) return EXT_TARGET[i];
        return CHARS[Math.floor(Math.random() * CHARS.length)];
      })
      .join('');
    if (iter >= EXT_TARGET.length) clearInterval(extIv);
    iter += 0.35;
  }, 55);
}

new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      runExtScramble();
    } else {
      clearInterval(extIv);
      extEl.textContent = EXT_TARGET;
    }
  });
}, { threshold: 0.8 }).observe(extEl);
