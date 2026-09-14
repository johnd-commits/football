# Playbook Trainer

A phone-first football playbook trainer. Load plays, then run each route with a finger. Everything saves in the browser — no account, no server.

**Live app:** https://johnd-commits.github.io/football/

## Open it on your phone

1. Push this repo (already set as `origin`).
2. Wait a minute for GitHub Pages to publish.
3. On your phone, open https://johnd-commits.github.io/football/
4. Add it to your home screen so it opens like an app:

**iPhone (Safari)**
- Share → **Add to Home Screen**
- Name it Playbook → Add

**Android (Chrome)**
- Menu → **Add to Home screen** / **Install app**

After that it launches full-screen, works offline, and keeps your playbook on that phone.

## What it does

- **Practice** — pick offense, defense, or both, then drag each player through his assignment. The app grades the path.
- **Study** — watch the play run, flip sides, peek at an uploaded play card.
- **Plays** — draw formations, type routes in shorthand (`Z slant`, `LC third`), upload photos of play cards, or backup the whole book as `playbook.json`.

Sample plays are included so you can try it immediately.

## Host it yourself

This is a static site. Any host that serves files works:

- GitHub Pages (this repo)
- Netlify, Cloudflare Pages, or a folder on any web server

Just publish the contents of this folder. Do not open `index.html` as a `file://` page if you want install / offline — serve it over https.
