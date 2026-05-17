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
  document.querySelectorAll('a, .space-row').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}
attachCursorHovers();

/* ── Spaces list ── */
const listContainer = document.getElementById('spaces-list-container');
const apiUrl = `https://api.github.com/repos/TR4IS/TR4IS.gethub.io/contents/spaces`;

listContainer.innerHTML = '<p class="spaces-loading">// loading spaces...</p>';

fetch(apiUrl)
  .then(res => res.json())
  .then(data => {
    const dirs = data.filter(item => item.type === 'dir');
    listContainer.innerHTML = '';

    dirs.forEach((item, index) => {
      const row = document.createElement('a');
      row.href = `${item.name}/`;
      row.className = 'space-row';
      row.innerHTML = `
        <span class="space-num">0${index + 1}</span>
        <span class="space-name">.${item.name}()</span>
        <span class="space-arrow">↗</span>
      `;
      listContainer.appendChild(row);
    });

    attachCursorHovers();
  })
  .catch(err => {
    console.error('Error fetching spaces:', err);
    listContainer.innerHTML = `
      <div class="space-row">
        <span class="space-name" style="color:#ff5555">.error() — could not load spaces</span>
      </div>
    `;
  });
