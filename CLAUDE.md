# Frostpeak Frontier

Single-file 3D skiing/exploration game: `index.html` (three.js r128 from cdnjs, no build step).
`legacy/fall-line-2d.html` is the older 2D game, kept for reference.
Published as a claude.ai artifact: https://claude.ai/artifact/2WBf8tn6SdUXG4n26vdm9W

## World
One connected map (`WORLD`, about 4 km x 3.4 km). A valley runs east-west with Lowpine Village on its north edge.
Six standalone peaks in `REGIONS`: north row Pine Ridge, Frostpeak (the original), Powder Bowl; south row
The Glacier, Windswept Crags, Aurora Peak. Each is a cone-like peak (`mountainH`) with a summit at (uS, vS),
slopes reaching rvN/rvP sideways and `back` behind; `exp` sets how pointed it is. Height is
`valleyH + max(peaks)` in `Hraw`. Gondolas run straight up the front face to just below the summit.
Use `toWorld(region, u, v)` to place things: u = metres up the fall line from the valley, v = metres across.
Runs are defined as shares of the room available at each height (`RUN_SHAPES`, `runV`), so they stay on the mountain.
Terrain is 400 m tiles: a coarse mesh for every tile at start (so everything is visible), detailed mesh + trees
built one per frame when the camera gets within `HI_R` (`updateTiles`). Trees and rocks are generated per tile
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
cdnjs is blocked in the cloud sandbox: serve `three@0.128.0` from npm via Playwright `page.route`, and Barlow Condensed / Literata from `@fontsource`. Expose internals by injecting `window.__fl = {...}` before `function init()` in a test copy.
