# reachflow Design System
**Version 2.0 — May 2026**

A complete specification of the reachflow visual identity. Use this document to recreate any page with the same look and feel. Every rule here is exact — follow it and the output will match.

---

## 1. Core Concept

The aesthetic is **developer-first dark brutalism** — think terminal meets editorial. No gradients on backgrounds, no soft shadows, no rounded corners. Everything is angular, monospaced, and intentional. The grid background provides structure without decoration.

**The feeling:** You're looking at a tool built by a developer, for developers.

---

## 2. Color Palette

```css
:root {
  --bg:      #060606;                     /* Near-black background */
  --fg:      #efefef;                     /* Off-white body text */
  --accent:  #8b5cf6;                     /* Violet — primary accent, CTAs, highlights */
  --warn:    #f59e0b;                     /* Amber — warnings, AV notices */
  --border:  rgba(139, 92, 246, 0.14);   /* Violet-tinted subtle border */
  --dim:     rgba(239, 239, 239, 0.35);  /* Dimmed text, secondary content */
}
```

**Secondary card accents** (used only on download cards, one per card):
```
#f59e0b  — Amber   (high-risk tools, optimizer)
#8b5cf6  — Violet  (standard tools)
#10b981  — Emerald (converter tools)
#06b6d4  — Cyan    (audio/media tools)
```

**Never use:**
- White backgrounds
- Pure black (#000000) — use #060606
- Warm or soft grays
- Any gradient on solid backgrounds
- More than one secondary accent per card

---

## 3. Typography

### Font Stack
```html
<!-- Load these exactly — order matters -->
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@300;400;700&family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
```

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display headings | Bebas Neue | 400 | All-caps only, large sizes |
| Body / UI text | JetBrains Mono | 300, 400, 700 | Everything else in English |
| Arabic text | Cairo | 400, 700, 900 | Used when `dir="rtl"` |

### Font Size Scale (readable, production sizes)
```
.72rem  — badges, small labels, metadata
.76rem  — footer, char counts
.80rem  — section labels (// labels), hero tag
.82–.84rem — nav links, buttons
.88–.92rem — body text, card descriptions, hero subtitle
.95rem  — hero subtitle (large)
1.0rem  — nav brand (Bebas Neue)
1.4rem  — how-it-works card titles (Bebas Neue)
clamp(4rem, 11vw, 9rem) — main hero H1 (Bebas Neue)
clamp(3.5rem, 8vw, 6rem) — section hero H1 (Bebas Neue)
```

**Never use sub-`.7rem` font sizes for readable text.** Labels can go to `.6rem` minimum only for purely decorative metadata.

### Letter Spacing
- Display (Bebas Neue) headings: `letter-spacing: 4px`
- Nav brand: `letter-spacing: 5px`
- Uppercase labels: `letter-spacing: 3px`
- Body text: `letter-spacing: 0` to `letter-spacing: .5px`
- **Arabic RTL: always `letter-spacing: 0 !important`** — Arabic is connected script

---

## 4. Background

Every page uses the same grid background:

```css
body {
  background: #060606;
  background-image:
    linear-gradient(rgba(255,255,255,.016) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.016) 1px, transparent 1px);
  background-size: 72px 72px;
}
```

The grid is extremely subtle (opacity `.016`). It gives depth without being distracting.

---

## 5. Navigation Bar

All pages share the same sticky nav pattern:

```css
nav {
  position: sticky; top: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 40px;
  background: rgba(6,6,6,.9);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
}
```

### Brand
```html
<a href="/" class="nav-brand">REACH<span>_</span>FLOW</a>
```
```css
.nav-brand {
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem; letter-spacing: 5px; color: var(--fg);
}
.nav-brand span { color: var(--accent); }
```

### Nav links
```css
.nav-link {
  font-size: .82rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--dim); transition: color .2s;
}
.nav-link:hover { color: var(--fg); }
```

### Primary nav button (Sign in / Save)
```css
.nav-btn {
  font-family: 'JetBrains Mono', monospace; font-weight: 700;
  font-size: .82rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--bg); background: var(--accent);
  border: 1.5px solid var(--accent);
  padding: 8px 18px;
  transition: background .2s, color .2s;
}
.nav-btn:hover { background: transparent; color: var(--accent); }
```

### Language toggle (EN | AR)
```html
<button class="lang-toggle" id="lang-toggle"
        title="Switch language · تبديل اللغة" aria-label="Switch language">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       style="opacity:.55;flex-shrink:0">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
  <span class="lang-opt on" data-lang="en">EN</span>
  <span class="lang-sep">|</span>
  <span class="lang-opt" data-lang="ar">AR</span>
</button>
```
```css
.lang-toggle {
  display: flex; align-items: center; gap: 7px;
  background: none; border: 1px solid rgba(139,92,246,.22);
  padding: 7px 13px; cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: .74rem; letter-spacing: 2px; color: var(--dim);
  transition: border-color .2s;
}
.lang-toggle:hover { border-color: rgba(139,92,246,.4); }
.lang-sep { color: rgba(239,239,239,.15); }
.lang-opt.on { color: var(--accent); }
```

---

## 6. Section Labels

Every content section starts with a small uppercase label:

```html
<p class="section-lbl">// section name</p>
```
```css
.section-lbl {
  font-size: .80rem; color: var(--accent);
  letter-spacing: 3px; text-transform: uppercase;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border);
  font-family: 'JetBrains Mono', monospace;
}
```

Always prefixed with `//` for the monospace/developer aesthetic.

---

## 7. Cards

All cards follow one pattern. Variations use `--card-accent` CSS variable.

```css
.card {
  border: 1px solid var(--border);
  background: rgba(6,6,6,.6);
  padding: 26px 24px 22px;
  display: flex; flex-direction: column; gap: 14px;
  transition: border-color .2s, background .2s;
  position: relative;
}

/* Top accent line — appears on hover */
.card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 1px;
  background: var(--card-accent, var(--accent));
  opacity: 0; transition: opacity .2s;
}
.card:hover { border-color: var(--card-accent, var(--accent)); background: rgba(139,92,246,.05); }
.card:hover::before { opacity: .6; }
```

### Per-card accent color
```html
<div class="card" style="--card-accent:#f59e0b; --icon-rgb:245,158,11">
```

---

## 8. Buttons

### Primary (filled)
```css
.btn-primary {
  font-family: 'JetBrains Mono', monospace; font-weight: 700;
  font-size: .88rem; letter-spacing: 3px; text-transform: uppercase;
  color: #060606; background: var(--accent);
  border: 1.5px solid var(--accent);
  padding: 13px 28px;
  transition: background .25s, color .25s;
  display: inline-flex; align-items: center; gap: 10px;
}
.btn-primary:hover { background: transparent; color: var(--accent); }
```

### Secondary (outline)
```css
.btn-secondary {
  font-family: 'JetBrains Mono', monospace;
  font-size: .72rem; letter-spacing: 2px; text-transform: uppercase;
  color: var(--dim); border: 1px solid var(--border);
  padding: 9px 20px; transition: border-color .2s, color .2s;
}
.btn-secondary:hover { border-color: rgba(139,92,246,.4); color: var(--fg); }
```

### Per-color download button
```css
.dl-btn {
  background: var(--card-accent, var(--accent));
  border: 1.5px solid var(--card-accent, var(--accent));
  color: #060606; /* always dark text on colored bg */
}
.dl-btn:hover { background: transparent; color: var(--card-accent, var(--accent)); }
```

---

## 9. Badges

```css
.badge {
  font-size: .68rem; letter-spacing: 2px; text-transform: uppercase;
  padding: 3px 8px;
  font-family: 'JetBrains Mono', monospace;
}
.badge-ver      { color: rgba(239,239,239,.5); background: rgba(239,239,239,.06); border: 1px solid rgba(239,239,239,.1); }
.badge-warn     { color: #f59e0b; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.3); }
.badge-platform { color: rgba(139,92,246,.8); background: rgba(139,92,246,.08); border: 1px solid rgba(139,92,246,.2); }
```

---

## 10. AV Warning Box

Used for antivirus/security notices:

```css
.av-box {
  border: 1px solid rgba(245,158,11,.3);
  background: rgba(245,158,11,.04);
  padding: 24px 28px;
  display: flex; flex-direction: column; gap: 14px;
}
.av-head {
  display: flex; align-items: center; gap: 12px;
  font-size: .80rem; letter-spacing: 3px; text-transform: uppercase;
  color: #f59e0b; font-weight: 700;
}
.av-icon {
  width: 26px; height: 26px; flex-shrink: 0;
  border: 1.5px solid #f59e0b; color: #f59e0b;
  display: flex; align-items: center; justify-content: center;
  font-size: .85rem; font-weight: 900;
}
.av-body { font-size: .90rem; color: rgba(239,239,239,.55); line-height: 1.95; }
.av-body strong { color: rgba(239,239,239,.9); }
.av-list li {
  font-size: .84rem; color: rgba(245,158,11,.7);
  padding-left: 18px; position: relative;
  line-height: 1.8;
}
.av-list li::before { content: '↳'; position: absolute; left: 0; }
/* RTL: */
[dir="rtl"] .av-list li { padding-left: 0; padding-right: 18px; }
[dir="rtl"] .av-list li::before { left: auto; right: 0; content: '↲'; }
```

---

## 11. Footer

```html
<footer>
  <span>© 2026 reachflow · TR4IS</span>
  <a href="/terms.html">.terms()</a>
</footer>
```
```css
footer {
  border-top: 1px solid var(--border);
  padding: 14px 40px;
  display: flex; justify-content: space-between;
  font-size: .76rem; color: rgba(239,239,239,.12);
  letter-spacing: 2px;
  font-family: 'JetBrains Mono', monospace;
}
footer a { color: rgba(239,239,239,.12); transition: color .2s; }
footer a:hover { color: rgba(239,239,239,.4); }
```

---

## 12. Hero Pattern (Landing)

```html
<div class="hero">
  <p class="hero-tag">// page subtitle</p>
  <h1>BIG BEBAS NEUE TITLE</h1>
  <p class="hero-sub">Description text here. Keep it short.</p>
</div>
```
```css
.hero-tag {
  font-size: .80rem; color: var(--accent);
  letter-spacing: 3px; text-transform: uppercase;
}
.hero h1 {
  font-family: 'Bebas Neue', sans-serif;
  font-size: clamp(3.5rem, 8vw, 6rem);
  letter-spacing: 4px; line-height: 1;
  text-shadow: 0 0 80px rgba(139,92,246,.4);
}
.hero-sub {
  font-size: .95rem; color: rgba(239,239,239,.4);
  line-height: 2; max-width: 480px;
}
```

**Arabic H1 override:**
```css
[dir="rtl"] .hero h1 {
  font-family: 'Cairo', sans-serif;
  font-weight: 900; letter-spacing: 0;
}
```

---

## 13. i18n / RTL Support

Pages with Arabic support:
1. Load Cairo font
2. Add `lang="en" dir="ltr"` to `<html>` (JS updates these on toggle)
3. Add `data-i18n="key"` to text elements, `data-i18n-html="key"` for elements with HTML inside
4. Apply global RTL letter-spacing fix:

```css
[dir="rtl"] * { letter-spacing: 0 !important; }
[dir="rtl"] body { font-family: 'Cairo', sans-serif; }
[dir="rtl"] .hero h1 { font-family: 'Cairo', sans-serif; font-weight: 900; letter-spacing: 0; }
[dir="rtl"] .how-title { font-family: 'Cairo', sans-serif; font-weight: 700; letter-spacing: 0; }
```

5. First-visit hint animation on the lang toggle:
```css
@keyframes langHint {
  0%,100% { border-color: rgba(139,92,246,.22); box-shadow: none; }
  50%      { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(139,92,246,.18); }
}
.lang-toggle.hinting { animation: langHint 1.5s ease .8s 3; }
```
```js
if (!localStorage.getItem('rf_lang_seen')) {
  document.getElementById('lang-toggle').classList.add('hinting');
  localStorage.setItem('rf_lang_seen', '1');
}
```

---

## 14. Editor Page Rules

The editor (`/editor.html`) uses `position: fixed` for the workspace to avoid height collapse:

```css
:root { --nav-h: 56px; --foot-h: 36px; }

#workspace { position: fixed; top: var(--nav-h); bottom: var(--foot-h); left: 0; right: 0; display: flex; }
#editor-pane { width: 50%; height: 100%; display: flex; flex-direction: column; }
#editor-body { flex: 1; min-height: 0; display: flex; overflow: hidden; }
#code-area   { flex: 1; height: 100%; overflow: auto; }
#preview-frame { flex: 1; min-height: 0; border: none; }
```

**Do NOT use `position: absolute` on the textarea/editor** — causes height collapse.

### Wait Overlay (save progress)
Phases in order: saving → committing → building → live
- Progress bar tweens using `setInterval` (not CSS transitions) for phase-by-phase control
- Polls `HEAD /spaces/${login}/` every 5 seconds after worker returns success
- Times out at 120 seconds and shows success anyway (GitHub Pages is slow but reliable)
- Elapsed timer shown in seconds

---

## 15. Space Pages (User HTML)

Each user space is an outer shell (`buildTemplate`) wrapping user HTML in an iframe:

```html
<iframe id="space-frame"
  sandbox="allow-scripts allow-forms allow-popups allow-pointer-lock allow-modals"
></iframe>
<script id="user-html" type="text/x-user-html">
  <!-- user's HTML here, with </script> escaped as <\/script> -->
</script>
<script>
  document.getElementById('space-frame').srcdoc =
    document.getElementById('user-html').textContent;
</script>
```

The outer nav overlay is `pointer-events: none` except for the brand link and back link.
The Edit button only appears if `localStorage.rf_user` matches the space login.

---

## 16. Design Principles

1. **No rounded corners** — everything is rectangular
2. **No drop shadows** — use glow (text-shadow, box-shadow with rgba) for accents only
3. **Monospace everywhere** — JetBrains Mono for ALL body text, never use system fonts or Inter
4. **Uppercase for UI labels** — nav links, section labels, badges, buttons all use `text-transform: uppercase`
5. **`//` prefix on section labels** — developer aesthetic, always
6. **Border hover, not background hover** — hover states primarily change border color
7. **Violet-tinted borders** — even "neutral" borders are `rgba(139,92,246,.14)`, not gray
8. **Arabic is always Cairo** — Bebas Neue and JetBrains Mono don't support Arabic script
9. **letter-spacing breaks Arabic** — always `letter-spacing: 0` in RTL context
10. **Grid background is universal** — 72px×72px at opacity `.016`, same on every page

---

## 17. Spacing / Layout

```
Max content width:     880–920px (centered, margin: 0 auto)
Page side padding:     40px desktop / 20px mobile
Section gap:           44–56px between major sections
Card gap:              12–16px in grid
Nav padding:           18px 40px desktop / 14px 20px mobile
Footer padding:        14px 40px desktop / 14px 20px mobile
```

---

## 18. File Map

| File | Purpose |
|------|---------|
| `index.html` | Main landing — promotes reachflow + TR4IS as creator |
| `downloads.html` | TR4IS's programs with direct download links + AV notice |
| `editor.html` | Full-page HTML editor for space owners |
| `spaces/index.html` | Browsable list of all developer spaces |
| `spaces/[login]/index.html` | Individual user space (outer shell + iframe) |
| `auth/callback.html` | GitHub OAuth callback |
| `terms.html` | Terms of service |
| `worker/index.js` | Cloudflare Worker: auth, save, create-space endpoints |
| `regen-spaces.js` | Node script to rebuild all space shells |
| `THEME.md` | This file — design system documentation |

---

*Last updated: May 2026 — reachflow by TR4IS*
