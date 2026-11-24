# Frostpeak Frontier

Single-file 3D skiing/exploration game: `index.html` (three.js r128 from cdnjs, no build step).
`legacy/fall-line-2d.html` is the older 2D game, kept for reference.
Published as a claude.ai artifact: https://claude.ai/artifact/2WBf8tn6SdUXG4n26vdm9W

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
