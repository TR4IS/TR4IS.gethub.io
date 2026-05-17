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
  document.querySelectorAll('a, .space-row, .search-input').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}
attachCursorHovers();

/* ── Spaces list ── */
const listContainer = document.getElementById('spaces-list-container');
const searchInput   = document.getElementById('search-input');
const searchCount   = document.getElementById('search-count');
const apiUrl = `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces`;

let allDirs = [];

function renderRows(dirs) {
  listContainer.innerHTML = '';

  if (dirs.length === 0) {
    listContainer.innerHTML = '<p class="spaces-loading">// no match found</p>';
    return;
  }

  dirs.forEach((item, index) => {
    const num = String(index + 1).padStart(2, '0');
    const row = document.createElement('a');
    row.href = `${item.name}/`;
    row.className = 'space-row';
    row.innerHTML = `
      <span class="space-num">${num}</span>
      <span class="space-name">.${item.name}()</span>
      <span class="space-arrow">↗</span>
    `;
    listContainer.appendChild(row);
  });

  attachCursorHovers();
}

listContainer.innerHTML = '<p class="spaces-loading">// loading spaces...</p>';

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    allDirs = data.filter(item => item.type === 'dir');
    renderRows(allDirs);

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      const filtered = q
        ? allDirs.filter(d => d.name.toLowerCase().includes(q))
        : allDirs;
      renderRows(filtered);
      searchCount.textContent = q ? `${filtered.length} / ${allDirs.length}` : '';
    });
  })
  .catch(() => {
    listContainer.innerHTML = `
      <div class="space-row">
        <span class="space-name" style="color:#ff5555">.error() — could not load spaces</span>
      </div>
    `;
  });
