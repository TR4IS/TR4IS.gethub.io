# Mobile Responsive Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio at `spaces/trais/` fully responsive across mobile (≤768px) and tablet (≤1024px) viewports.

**Architecture:** Pure CSS media queries appended to the bottom of `style.css`. One JS change to detect touch devices and disable the custom cursor. One HTML change to add a mobile-only contact link in the nav. No new files, no new libraries.

**Tech Stack:** Vanilla HTML/CSS/JS. Breakpoints: `1024px` (tablet), `768px` (mobile).

---

## File Map

| File | Change |
|------|--------|
| `spaces/trais/script.js` | Disable cursor + hover listeners on touch devices |
| `spaces/trais/index.html` | Add `<a class="nav-contact-mobile">` inside `<nav>` |
| `spaces/trais/style.css` | Append all media queries at the bottom |

---

### Task 1: Disable cursor on touch devices

**Files:**
- Modify: `spaces/trais/script.js` (top of file, after `const dot = ...`)

- [ ] **Step 1: Open `spaces/trais/script.js` and read the top**

The file starts with:
```js
/* ── Cursor ── */
const dot = document.getElementById('dot');
document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top  = e.clientY + 'px';
});
```

- [ ] **Step 2: Add touch detection immediately after `const dot = ...`**

Replace the cursor block at the top with:
```js
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
```

- [ ] **Step 3: Guard `attachCursorHovers` so it only runs on non-touch**

Find this function:
```js
function attachCursorHovers() {
  document.querySelectorAll('a, button, .project-row, .nav-links a').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('big'));
    el.addEventListener('mouseleave', () => dot.classList.remove('big'));
  });
}
attachCursorHovers();
```

Replace with:
```js
function attachCursorHovers() {
  if (isTouch) return;
  document.querySelectorAll('a, button, .project-row, .nav-links a').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('big'));
    el.addEventListener('mouseleave', () => dot.classList.remove('big'));
  });
}
attachCursorHovers();
```

- [ ] **Step 4: Verify — open DevTools, toggle device toolbar to any mobile device**

Expected: no dot cursor visible, default browser cursor restored, no JS errors in console.

- [ ] **Step 5: Commit**

```bash
git add spaces/trais/script.js
git commit -m "feat(mobile): disable custom cursor on touch devices"
```

---

### Task 2: Mobile nav — hide links, show contact link

**Files:**
- Modify: `spaces/trais/index.html` (inside `<nav>`)
- Modify: `spaces/trais/style.css` (append to bottom)

- [ ] **Step 1: Add mobile contact link to nav HTML**

Open `spaces/trais/index.html`. Find the `<nav>` block:
```html
<nav>
  <span class="nav-logo">Cracker</span>
  <ul class="nav-links">
    <li><a href="#about">About</a></li>
    <li><a href="#skills">Skills</a></li>
    <li><a href="#projects">Projects</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>
```

Replace with:
```html
<nav>
  <span class="nav-logo">Cracker</span>
  <ul class="nav-links">
    <li><a href="#about">About</a></li>
    <li><a href="#skills">Skills</a></li>
    <li><a href="#projects">Projects</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a class="nav-contact-mobile" href="mailto:ziyad.tr.46@gmail.com">Contact ↗</a>
</nav>
```

- [ ] **Step 2: Add CSS for mobile nav at the bottom of `spaces/trais/style.css`**

Append:
```css
/* ══════════════════════════════════════
   RESPONSIVE — TABLET  (≤ 1024px)
══════════════════════════════════════ */
@media (max-width: 1024px) {
  nav { padding: 20px 32px; }
  .hero { padding: 0 32px 60px; }
  .about { padding: 80px 32px; }
  .skills-wrap { padding: 70px 32px; }
  .projects-wrap { padding: 70px 32px; }
  .contact-wrap { padding: 80px 32px 100px; }
  .divider { width: calc(100% - 64px); margin: 0 32px; }
  .skills-grid { grid-template-columns: repeat(2, 1fr); gap: 36px; }
}

/* ══════════════════════════════════════
   RESPONSIVE — MOBILE  (≤ 768px)
══════════════════════════════════════ */
@media (max-width: 768px) {
  body { cursor: auto; }

  /* Nav */
  nav { padding: 18px 24px; }
  .nav-links { display: none; }
  .nav-contact-mobile {
    display: inline-block;
    font-size: .68rem; letter-spacing: 2px; text-transform: uppercase;
    color: rgba(255,255,255,.35); transition: color .2s;
  }
  .nav-contact-mobile:hover { color: #a78bfa; }

  /* Hero */
  .hero {
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 0 24px 60px;
    min-height: 600px;
  }
  .hero-content { display: flex; flex-direction: column; align-items: center; }
  .hero-ghost { font-size: clamp(5rem, 28vw, 10rem); right: -10px; }
  .hero-sub { justify-content: center; }
  .scroll-cue { right: 24px; }

  /* About */
  .about {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 60px 24px;
  }

  /* Skills */
  .skills-wrap { padding: 60px 24px; }
  .skills-grid { grid-template-columns: repeat(2, 1fr); gap: 28px; }

  /* Projects */
  .projects-wrap { padding: 60px 24px; }
  .project-row {
    grid-template-columns: 48px 1fr auto;
    gap: 16px;
  }
  .project-tags { display: none; }

  /* Contact */
  .contact-wrap { padding: 60px 24px 80px; }

  /* Dividers */
  .divider { width: calc(100% - 48px); margin: 0 24px; }
}

/* ══════════════════════════════════════
   RESPONSIVE — SMALL MOBILE (≤ 480px)
══════════════════════════════════════ */
@media (max-width: 480px) {
  .skills-grid { grid-template-columns: 1fr; }
  .project-row { grid-template-columns: 40px 1fr auto; gap: 12px; }
  .project-num { font-size: .9rem; }
}
```

- [ ] **Step 3: Hide `.nav-contact-mobile` on desktop (default hidden)**

Find the existing nav CSS block in `style.css` and add one line after `.nav-links a:hover`:
```css
.nav-contact-mobile { display: none; }
```

- [ ] **Step 4: Verify at 768px**

Open DevTools → set viewport to 375px wide.
Expected:
- Nav links hidden, "Contact ↗" visible top-right
- Skills in 2-column grid
- Project tags hidden

- [ ] **Step 5: Commit**

```bash
git add spaces/trais/index.html spaces/trais/style.css
git commit -m "feat(mobile): nav collapses to contact link, section padding scales"
```

---

### Task 3: Hero mobile — centered layout

**Files:**
- Modify: `spaces/trais/style.css` (already added in Task 2 media queries — verify it looks right)

- [ ] **Step 1: Open browser at 375px wide, check hero section**

Expected:
- "Crafting Worlds." headline is centered
- Sub-line `Developer · Builder · Digital Architect` is centered
- Ghost "Cracker" text is partially visible top-right (reduced size)
- Scroll cue is visible bottom-right

If hero content is not centered, check that `.hero-content { display: flex; flex-direction: column; align-items: center; }` and `.hero { justify-content: center; text-align: center; }` are in the `@media (max-width: 768px)` block.

- [ ] **Step 2: Verify headline doesn't overflow at 320px**

Set viewport to 320px. Headline uses `clamp(3.5rem, 8vw, 7.5rem)` — at 320px this renders as `max(3.5rem, 8*320/100) = max(3.5rem, 25.6px)` = 3.5rem. Should be fine.

Expected: no horizontal scroll, text contained.

- [ ] **Step 3: Commit if any adjustments were needed**

```bash
git add spaces/trais/style.css
git commit -m "fix(mobile): hero layout adjustments at small viewport"
```

If no changes were needed, skip this commit.

---

### Task 4: Orbs — scale down on mobile

**Files:**
- Modify: `spaces/trais/style.css` (add inside existing `@media (max-width: 768px)` block)

- [ ] **Step 1: Add orb scaling inside the mobile media query**

Find the `@media (max-width: 768px)` block added in Task 2. Add these rules inside it:
```css
  /* Orbs — scaled down for mobile performance */
  .o1 { width: 300px; height: 300px; }
  .o2 { width: 250px; height: 250px; }
  .o3 { width: 200px; height: 200px; }
  .o4 { width: 180px; height: 180px; }
```

- [ ] **Step 2: Verify at 375px**

Expected: orbs still visible as soft glow in corners, but smaller — no large blur artifacts eating up most of the screen.

- [ ] **Step 3: Commit**

```bash
git add spaces/trais/style.css
git commit -m "feat(mobile): scale down orbs for performance on small screens"
```

---

### Task 5: Final pass — verify all sections at key widths

**Files:** None (verification only)

- [ ] **Step 1: Check at 1024px (tablet)**

Expected:
- Nav links still visible
- Skills grid: 2 columns
- All paddings reduced to 32px horizontal
- No horizontal overflow

- [ ] **Step 2: Check at 768px (mobile)**

Expected:
- Nav: logo left + "Contact ↗" right
- Hero: centered, headline readable
- About: single column
- Skills: 2 columns
- Projects: no tags column, name + arrow visible
- Contact: headline and button readable

- [ ] **Step 3: Check at 480px (small mobile)**

Expected:
- Skills: 1 column
- Everything readable, no overflow

- [ ] **Step 4: Check at 320px (minimum)**

Expected: no horizontal scroll, all content contained within viewport.

- [ ] **Step 5: Commit final state**

```bash
git add spaces/trais/index.html spaces/trais/style.css spaces/trais/script.js
git commit -m "feat: mobile responsive layout complete — phase 2"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Stack hero to centered layout — Task 2 & 3
- [x] Reduce headline size — handled by existing `clamp()`, verified in Task 3
- [x] Skills grid 2-col then 1-col — Task 2 (1024px → 2col, 480px → 1col)
- [x] Project rows hide tags — Task 2
- [x] Nav collapses to email link — Task 2
- [x] Cursor disabled on touch — Task 1
- [x] Orbs scale down — Task 4
