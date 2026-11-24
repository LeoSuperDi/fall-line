# Frostpeak Frontier

A cozy open-world ski resort in the browser: six mountains on one map, a village, quests, wildlife and secrets.
Made with three.js (r128 from a CDN). There is no build step: open `index.html` through any static web server.

```
index.html        page markup (HUD, menus, dialogs) and the list of scripts
css/ui.css        the interface: trail-sign boards and field-journal paper
js/               the game, as plain scripts that share one global scope, loaded in this order:
  core.js         small helpers: maths, seeded noise, safe storage, device checks
  world.js        the map: six mountains, the valley, ground height anywhere, places, trails, snow types
  scene.js        renderer, scene, camera, toon materials, painted textures
  terrain.js      ground colours and the 400 m tiles that load in as you travel
  models.js       shape builders: pines, birches, rocks, ground-cover props; the collision grid
  sky.js          sky dome, sun, clouds, distant ranges
  scenery.js      forests and props per tile, buildings, Lowpine Village, gondolas, each mountain's set pieces
  characters.js   people and animal models
  player.js       skiing, walking and jumping; the camera; how the skier is posed
  effects.js      spray, falling snow, sparkles, ski grooves, smoke and steam
  data.js         jackets, villagers, quest text, courses, the save format
  gameplay.js     items, pack and shop, quests, races, wildlife, random events, discovery
  audio.js        generated sound effects and music
  ui.js           HUD, dialogs, travel, trail map, journal, menus, controls
  main.js         light and weather, the main loop, start-up
tools/            headless checks and screenshots (not needed to play)
legacy/           the original 2D Fall Line game
```

A file can use anything from files listed above it in `index.html` while it loads; functions can be used from
anywhere once the game is running.

## Running it locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Checks and screenshots

```bash
cd tools && npm install
node check.js
node screenshot.js village crater
```

`check.js` loads the game in headless Chromium and confirms there are no errors, all 60 trails exist, and that
skiing, jumping and the lamp quest work. `screenshot.js` saves pictures of named places to `tools/shots/`.

## Controls

Arrows or WASD steer, tuck and push. Space jumps, Shift stops, F takes skis off or puts them on, E talks or uses,
I opens the pack, M the map, J the journal, C switches camera, N toggles sound.
