# reachflow.site

[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Built with](https://img.shields.io/badge/Built%20with-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Hosted on](https://img.shields.io/badge/Hosted%20on-GitHub%20Pages-181717?style=flat-square&logo=github)](https://reachflow.site)

Free personal pages for developers — sign in with GitHub, get your space at `reachflow.site/spaces/{username}` in under a minute.

**Live:** [reachflow.site](https://reachflow.site)

---

## Features

- **One-click GitHub OAuth signup** — no config files, no hosting setup
- **Drag-and-drop layout** — move your photo, name, and bio anywhere on screen
- **Full customization** — 25+ fonts, text shadows, animations, avatar rings, background images/videos, gradients
- **Social links** — GitHub, X, Instagram, LinkedIn, YouTube, TikTok, Discord, Twitch, Reddit
- **Custom stickers, text blocks, and music player**
- **Owner-only editor** — only you can edit your own space
- **Zero dependencies** — pure HTML/CSS/JS

---

## How It Works

1. Visit [reachflow.site](https://reachflow.site) and sign in with GitHub.
2. Your space is created instantly at `reachflow.site/spaces/{username}`.
3. Use the editor to customize your layout, links, and style.

---

## Stack

| Layer | Tech |
|---|---|
| Hosting | GitHub Pages |
| Auth + Save API | Cloudflare Workers |
| OAuth | GitHub OAuth App |
| Storage | GitHub Contents API |

---

## Worker Setup

```bash
cd worker
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put REPO_TOKEN
wrangler secret put TOKEN_SECRET
wrangler deploy
```

---

## Author

**TR4IS** — [github.com/TR4IS](https://github.com/TR4IS)
