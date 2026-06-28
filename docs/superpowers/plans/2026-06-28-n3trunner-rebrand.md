# n3trunner Rebrand & React Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand TR4IS.gethub.io from "reachflow" to "n3trunner.dev", enhance the dark-brutalist theme with cyberpunk additions, and wire up React + Vite + framer-motion for incoming component work.

**Architecture:** Static HTML pages are rebranded in-place (no framework conversion). Vite builds a React bundle output to `assets/react-bundle.js` — a library mode build that existing HTML pages can load via a `<script type="module">` tag. framer-motion ships inside that bundle. This preserves GitHub Pages compatibility with zero CI changes required for existing pages.

**Tech Stack:** Vanilla HTML/CSS/JS (existing pages), React 18, Vite 5, framer-motion 11, GitHub Pages, Cloudflare Workers

## Global Constraints

- Brand name display: `N3T_RUNNER` (Bebas Neue, underscore accent-colored, same pattern as `REACH_FLOW`)
- Domain: `n3trunner.dev` — replace every `reachflow.site` occurrence
- localStorage prefix: `n3t_` (was `rf_`) — breaking change, new domain = fresh sessions
- OAuth callback URL: `https://n3trunner.dev/auth/callback`
- Worker ALLOWED_ORIGIN: `https://n3trunner.dev`
- Worker User-Agent strings: `n3trunner-auth`
- Keep GitHub repo path `TR4IS/TR4IS.gethub.io` — that's the actual repo, not a brand string
- Accent colors: primary `#8b5cf6` (violet), new secondary `--accent2: #06b6d4` (cyan)
- Favicon letter: `n` (was `r`)
- Copyright line: `© 2026 n3trunner.dev · TR4IS`
- No rounding, no drop shadows — existing THEME.md design principles preserved

---

### Task 1: Rebrand CNAME + worker files

**Files:**
- Modify: `CNAME`
- Modify: `worker/index.js`
- Modify: `worker/wrangler.toml`

- [x] **Step 1: Update CNAME**

Replace contents with: `n3trunner.dev`

- [ ] **Step 2: Update worker ALLOWED_ORIGIN and User-Agent**

In `worker/index.js` line 1:
```js
const ALLOWED_ORIGIN = 'https://n3trunner.dev';
```
Replace all `'reachflow-auth'` User-Agent strings with `'n3trunner-auth'`.

- [ ] **Step 3: Update wrangler.toml**

```toml
name = "n3trunner-auth"
main = "index.js"
compatibility_date = "2024-09-01"

[vars]
GITHUB_CLIENT_ID = "Ov23likbVZBfG5a3rnEu"
```

- [ ] **Step 4: Commit**
```bash
git add CNAME worker/index.js worker/wrangler.toml
git commit -m "rebrand: rename domain and worker to n3trunner"
```

---

### Task 2: Rebrand index.html

**Files:**
- Modify: `index.html`

Key changes:
- Title: `n3trunner — your developer node`
- Favicon: letter `n`, same violet palette
- Nav brand: `N3T<span>_</span>RUNNER`
- Add `--accent2: #06b6d4` to `:root`
- Hero tag: `// jack in. own your node.`
- Hero H1: `YOUR NODE.<br>YOUR&nbsp;NET.<br>FREE.`
- Hero sub: `Get a **developer node** in seconds.` (not "developer page")
- Step 2 body: `n3trunner.dev/spaces/you`
- Creator section label: `// the developer behind n3trunner`
- Creator bio: replace "reachflow" → "n3trunner"
- OAuth callback: `https://n3trunner.dev/auth/callback`
- GitHub repo fetch: `TR4IS/TR4IS.gethub.io` — keep unchanged
- localStorage keys: `rf_lang` → `n3t_lang`, `rf_lang_seen` → `n3t_lang_seen`
- Footer: `© 2026 n3trunner.dev · TR4IS`
- All i18n strings: replace "reachflow" → "n3trunner", "developer page" → "developer node"
- Arabic i18n step 2 body: replace domain
- Add glitch keyframe + scanline overlay (see Task 5 THEME.md for CSS)
- Add `--accent2` cyan glow on h1 `text-shadow`

- [ ] **Step 1: Apply all changes to index.html** (see full file in execution)

- [ ] **Step 2: Verify in browser** — nav says `N3T_RUNNER`, hero says `YOUR NODE.`

- [ ] **Step 3: Commit**
```bash
git add index.html
git commit -m "rebrand: n3trunner identity on landing page"
```

---

### Task 3: Rebrand spaces/index.html

**Files:**
- Modify: `spaces/index.html`

Changes:
- Title: `n3trunner — nodes`
- Favicon letter: `n`
- Nav brand: `N3T<span>_</span>RUNNER`
- Page H1: `DEVELOPER<br>NODES`
- Page sub: replace "reachflow" → "n3trunner"
- Footer: `© 2026 n3trunner.dev · TR4IS`
- Add `--accent2: #06b6d4` to `:root`

- [ ] **Step 1: Apply changes**
- [ ] **Step 2: Commit**
```bash
git add spaces/index.html
git commit -m "rebrand: n3trunner identity on spaces page"
```

---

### Task 4: Rebrand 404.html + auth/callback.html + terms/index.html

**Files:**
- Modify: `404.html`
- Modify: `auth/callback.html`
- Modify: `terms/index.html`

**404.html changes:**
- Label: `// n3trunner`
- Back link text: `← back to n3trunner`
- Favicon letter: `n`

**auth/callback.html changes:**
- Title: `n3trunner — signing in`
- Status label SVG text: `n`, aria label `// n3trunner auth`
- WORKER_URL: `'https://n3trunner-auth.cr4cker.workers.dev'`
- Back link text: `← back to n3trunner`
- Terms link text: `n3trunner Terms of Use`
- localStorage keys: `rf_token` → `n3t_token`, `rf_user` → `n3t_user`, `rf_editData` → `n3t_editData`
- Favicon letter: `n`

**terms/index.html changes:**
- Title: `n3trunner — Terms`
- Nav brand: `N3T<span>_</span>RUNNER`
- All body text: replace "Reachflow" → "n3trunner", "reachflow" → "n3trunner"
- Domain references: `reachflow.site/spaces/` → `n3trunner.dev/spaces/`
- Footer: `© 2026 n3trunner.dev · TR4IS · All rights reserved`
- Arabic translations: same text replacements
- localStorage keys: `rf_lang` → `n3t_lang`, `rf_lang_seen_terms` → `n3t_lang_seen_terms`
- i18n title strings: `n3trunner — Terms` / `n3trunner — الشروط`
- Enforcement section: `n3trunner is curated` (not "Reachflow is curated")
- Favicon letter: `n`

- [ ] **Step 1: Apply 404.html changes**
- [ ] **Step 2: Apply auth/callback.html changes**
- [ ] **Step 3: Apply terms/index.html changes**
- [ ] **Step 4: Commit**
```bash
git add 404.html auth/callback.html terms/index.html
git commit -m "rebrand: n3trunner identity on 404, auth, terms pages"
```

---

### Task 5: Rebrand worker space templates + update THEME.md

**Files:**
- Modify: `worker/index.js` (template strings inside `buildTemplate` and `defaultUserHtml`)
- Modify: `THEME.md`

**worker/index.js template changes:**
- `buildTemplate`: title tag `${title} — n3trunner`, nav brand `N3T<span>_</span>RUNNER`, footer `© 2026 n3trunner.dev · TR4IS`
- `defaultUserHtml`: no brand references (user's own page, fine as-is)
- localStorage check: `rf_user` → `n3t_user`, `rf_token` → `n3t_token`, `rf_editData` → `n3t_editData`
- Edit button redirect: `/editor.html?user=` — unchanged

**THEME.md additions** (append to existing doc, keep all existing rules):

```markdown
---

## 19. n3trunner Identity (v3.0 — June 2026)

Brand display: `N3T_RUNNER` — underscore in accent color, same pattern as prior brand.

### Secondary Accent (Cyan)
```css
--accent2: #06b6d4;   /* Cyan — secondary cyberpunk highlight */
--glow-cyan: rgba(6, 182, 212, 0.35);
```
Use cyan for: secondary badges, hover glow on cards (alternate), scanline tint.
Never use cyan as a primary CTA — violet owns that slot.

### Glitch Animation
```css
@keyframes glitch {
  0%,100% { text-shadow: 0 0 80px rgba(139,92,246,.4); transform: none; }
  92%      { text-shadow: -2px 0 rgba(6,182,212,.8), 2px 0 rgba(139,92,246,.8); transform: skewX(-1deg); }
  94%      { text-shadow: 2px 0 rgba(6,182,212,.8), -2px 0 rgba(139,92,246,.8); transform: skewX(1deg); }
  96%      { text-shadow: 0 0 80px rgba(139,92,246,.4); transform: none; }
}
.hero h1 { animation: glitch 6s infinite; }
```

### Scanline Overlay (optional, for full-bleed hero sections)
```css
.scanlines::after {
  content: '';
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,.03) 2px,
    rgba(0,0,0,.03) 4px
  );
}
```

### Copy Voice
- Section labels: keep `//` prefix (developer aesthetic, unchanged)
- Hero tagline: active/imperative — "jack in", "own your node", "run the net"
- "developer page" → "developer node" in all copy
- "spaces" terminology stays — `n3trunner.dev/spaces/{username}`

### Favicon Pattern
```html
<!-- Letter: n, same violet palette -->
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='5' fill='%23060606'/><rect width='32' height='32' rx='5' fill='%238b5cf6' opacity='.15'/><text x='5' y='23' font-family='monospace' font-size='20' font-weight='900' fill='%238b5cf6'>n3t</text></svg>">
```

---

## 20. React + framer-motion Layer

When React components are added, they load via `/assets/react-bundle.js` (Vite library build). Pages opt-in with:
```html
<script type="module" src="/assets/react-bundle.js"></script>
```

framer-motion usage pattern:
```jsx
import { motion } from 'framer-motion';

// Card entrance
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
/>

// Stagger children
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } }
};
```

Keep transitions under 400ms. Prefer `ease: [0.25, 0.1, 0.25, 1]` (snappy cubic). No bounce/spring on UI chrome — only on interactive elements.
```

- [ ] **Step 1: Update buildTemplate in worker/index.js**
- [ ] **Step 2: Update localStorage key refs in buildTemplate**
- [ ] **Step 3: Append sections 19–20 to THEME.md**
- [ ] **Step 4: Commit**
```bash
git add worker/index.js THEME.md
git commit -m "rebrand: update worker templates and THEME.md for n3trunner"
```

---

### Task 6: npm setup + Vite + React + framer-motion

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/main.jsx` (entry point)
- Create: `src/components/.gitkeep`
- Modify: `.gitignore`

- [ ] **Step 1: Initialize package.json**
```bash
cd /mnt/c/Users/Cracker/Documents/Code/reachflow.site
cat > package.json << 'EOF'
{
  "name": "n3trunner",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
EOF
```

- [ ] **Step 2: Install dependencies**
```bash
npm install react react-dom framer-motion
npm install -D vite @vitejs/plugin-react
```

Expected: `node_modules/` created, `package-lock.json` created.

- [ ] **Step 3: Create vite.config.js**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'N3trunner',
      fileName: 'react-bundle',
      formats: ['es'],
    },
    outDir: 'assets',
    emptyOutDir: false,
    rollupOptions: {
      external: [],
    },
  },
});
```

- [ ] **Step 4: Create src/main.jsx entry**
```jsx
// Entry point — exports components for use in HTML pages
export * from './components';
```

- [ ] **Step 5: Create src/components/index.js**
```js
// Component exports — add here as components are built
```

- [ ] **Step 6: Update .gitignore**

Append to existing `.gitignore`:
```
node_modules/
dist/
```

- [ ] **Step 7: Build to verify setup works**
```bash
npm run build
```
Expected: `assets/react-bundle.js` created, no errors.

- [ ] **Step 8: Commit**
```bash
git add package.json vite.config.js src/ .gitignore
git commit -m "feat: add Vite + React + framer-motion build setup"
```

---

### Task 7: React component integration

> **Pending:** Component details not yet provided. When received, add here:
> - Component name, props, and purpose
> - Which page(s) it goes into
> - Where in the page layout it renders
> - Any data it needs from the existing JS

Steps will follow the same TDD pattern: failing test → implementation → passing test → commit.
