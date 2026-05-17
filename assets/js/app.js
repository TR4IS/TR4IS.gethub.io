/* ── Config — fill in after creating your GitHub OAuth App ── */
const GITHUB_CLIENT_ID = 'Ov23likbVZBfG5a3rnEu';
const CALLBACK_URL = 'https://reachflow.site/auth/callback';

/* ── Join button ── */
function doJoin(e) {
  e.preventDefault();
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&scope=read:user`;
  window.location.href = authUrl;
}

document.getElementById('join-btn').addEventListener('click', doJoin);
document.getElementById('join-btn-hero').addEventListener('click', doJoin);

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
  document.querySelectorAll('a').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('big'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('big'));
  });
}
