# Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/gibalers-rgb/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/gibalers-rgb/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photo and a caption into Vice City style cover art — the multi-panel GTA poster look with bold lettering and a neon sunset grade — and export it as a PNG to share. It runs offline in a desktop browser from its own static files: your photos never leave the machine.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## How it works

1. Pick a layout: Poster (one tall hero panel + two scenes), Trio (three panels) or Duo (two panels).
2. Fill each panel with your own photo or one of the three built-in sample scenes, then crop it with zoom and pan.
3. Choose a colour grade (sunset, neon, noir), write a title and a subtitle ribbon, pick the lettering style.
4. Export as PNG in 1080 x 1080, 1080 x 1350 or 1920 x 1080.

The cover engine (`app/src/cover.js`) draws everything on canvas: white-guttered panels, the sunset/neon grade wash, a halftone print texture, and bold outlined caption lettering with a gradient fill. All art is original — sample photos were made with an image model, the lettering is hand-drawn system type, and there is no Rockstar logo, artwork or font anywhere.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
