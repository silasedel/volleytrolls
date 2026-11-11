# Volley Trolls

A 3D first-person browser game: a show-jumper volleys rainbow trolls, collects golden horseshoes and saddles, and rides a horse-jumping bonus arena.

## Play
Open `index.html` in Chrome, Edge, Firefox or Safari (desktop, keyboard + mouse). Internet is needed once to load three.js from jsDelivr.

## Put it on GitHub Pages
1. Create a new public repository and upload `index.html` (plus this README and the `src` folder if you want the source).
2. Repository **Settings > Pages > Build and deployment**: Source = "Deploy from a branch", Branch = `main`, folder `/ (root)`. Save.
3. After a minute the game is live at `https://<username>.github.io/<repo>/`.

## Build from source
`./build.sh` combines `src/00-head.html`, the sounds in `src/sounds`, the face photo and every `src/NN-*.js` file into `volley-trolls.html`. Copy that to `index.html`.

## Credits and licenses
- Sounds and music: 0 A.D. by Wildfire Games (CC BY-SA 3.0), Battle for Wesnoth (GPL v2+), Blobby Volley 2 (GPL v2), FoFiX (GPL v2). Keep the in-game Credits screen.
- Because GPL and CC BY-SA assets are included, publish this project under the GPL v2 or later and keep these credits.
- 3D engine: three.js (MIT), loaded from jsDelivr.
