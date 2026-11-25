# Frostpeak Frontier

3D skiing/exploration game (three.js r128 from cdnjs, no build step). `index.html` is markup only; styles are in
`css/ui.css`; the game is in `js/*.js`, plain scripts sharing one global scope, loaded in the order listed in
`index.html` (see README.md for what each file holds). Code that runs while a file loads may only use things
defined in files listed above it.
`legacy/fall-line-2d.html` is the older 2D game, kept for reference.
Published as a claude.ai artifact: https://claude.ai/artifact/2WBf8tn6SdUXG4n26vdm9W

## World
One connected map (`WORLD`, about 4 km x 3.4 km). A valley runs east-west with Lowpine Village on its north edge.
Six standalone peaks (600-1050 m tall, 10 trails each) in `REGIONS`: north row Pine Ridge (forest), Frostpeak (the original),
Ember Peak (volcano with crater); south row Sunset Dunes (sand), Windswept Crags (rocky), Aurora Peak (night glacier). Each is a cone-like peak (`mountainH`) with a summit at (uS, vS),
slopes reaching rvN/rvP sideways and `back` behind; `exp` sets how pointed it is. Height is
`valleyH + max(peaks)` in `Hraw`. Gondolas run straight up the front face to just below the summit.
Use `toWorld(region, u, v)` to place things: u = metres up the fall line from the valley, v = metres across.
Runs are defined as shares of the room available at each height (`runV`), so they stay on the mountain. A trail's height
is the ground's own height smoothed along it; `Hm` only flattens small bumps across a trail (never cuts walls), packs it
0.35 m lower and adds soft snowbanks. Neighbouring peaks are joined by saddle ridges (`shoulderH`). Each `kind` has its
own silhouette: pine ridge, aurora horn, dunes mesa, crags crown of spikes, volcano crater, frost classic.
Connector trails (`LINKS` in world.js, `link: true`) ring the six mountains and cross the valley. They are graded to
`Hbase` (the land without `creekH` and the placed `FEATS` landforms), so each landform becomes a canyon (cut), tunnel
(cut >= CAVE_D, terrain left intact, `buildTunnel`) or bridge (fill > BRIDGE_D, `buildBridge`); path points carry
`mode`. `H(x, z, yHint)` returns bridge decks / tunnel floors via `linkDeck`, otherwise the drawn mesh height (`meshH`).
Obstacles may carry a `y` (rails, tunnel walls) and `kind: 'rail'` pushes without crashing. `node tools/features.js`
(MODE=bridge|tunnel BACK=n) screenshots them.
Only Space leaves the ground; there are no automatic launches. Before publishing, run `node tools/ride.js` too.
Snow is a real 0.5 m layer (`SNOW_D` in `Hm`), thinner where meadows show through. Space jumps (`groundStep`), Shift stops.
Terrain is 400 m tiles: a coarse mesh for every tile at start (so everything is visible), detailed mesh + trees
built a few milliseconds per frame (generators drained by `updateTiles`) when the camera gets within `HI_R`;
tiles outside the camera frustum skip drawing trees and props. Resolution drops automatically on slow frames. Trees and rocks are generated per tile
from a seeded RNG, so they are the same every visit.
Each mountain has a gondola (`LIFTS`), runs (`RUNS`, appended per region), camps for fast travel (`POIS`),
and a snowcat stop (`CATS`) for crossing the valley. Per-mountain mood lives in `ENV_T` (night, storms, haze).

## Art and UI rules
- 3D: soft toon shading (5-band ramp), ACES tone mapping, cool blue-white snow, original characters and real mountain animals only (no existing game IP).
- UI is built from mountain materials, not generic app chrome:
  - trail signs: pine boards (`.sign`), condensed sign lettering (Barlow Condensed)
  - ranger's field journal: plain cool paper (`.paper`), book serif (Literata) for anything people say or write
  - one accent, ski-patrol orange `#f2661c`; pine `#1d3a33`, snow paper `#eef3f8`, glacier `#2f5e8c`
- Sentence case everywhere. No ALL-CAPS labels, no "A · B · C" strings, no frosted-glass cards.
- The one big UI moment is the discovery signpost (`bannerShow`). Keep other motion minimal.

## Testing
`cd tools && npm install`, then `node check.js` (must pass before publishing) and `node screenshot.js <spawn names>`.
`tools/harness.js` serves three.js and the fonts from npm (cdnjs and Google Fonts are blocked in the cloud sandbox)
and exposes internals as `window.__fl` by injecting a line into `js/main.js` as it is served.

## Publishing
The artifact needs every file: publish `index.html` with `files` mapping `css/ui.css` and each `js/*.js`.
