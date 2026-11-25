# Hourstone (2D) and Frostpeak Frontier (3D)

`hourstone/index.html` is the current game: a side-scrolling arcade ski adventure in one file. Arlo Finch chases a
yeti through six eras (forest, caves, a 1924 expedition, the Ice Age glacier, the Snowglobe at the end of time, and a
volcano before the first winter). Six chapters of three stages each, with a story told between stages; about an hour
to finish. Space jumps, arrows brake, push and flip, down tucks and grabs. `node tools/hourstone-bot.js` plays stages
with a bot that tucks, pushes and jumps; `node tools/hourstone-shots.js [--mobile]` screenshots every screen.

Interface: a camcorder overlay, because Arlo is filming everything. Viewfinder corners, REC timecode and a battery in
play; film letterbox bars with subtitles for story; a printed frame grab for stage results; chapters are tapes.
Fonts: Big Shoulders Display (titles), Hanken Grotesk (reading), VT323 (camcorder readouts).

The 3D game below is kept for reference.

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

`features.js` stands at each bridge, canyon or tunnel. `tracks.js` looks back at fresh ski grooves.
`ride.js` skis down from every summit and reports drop, top speed, crashes and unasked-for air time.
`closeups.js` frames the skier from the front (skiing, tucking, walking) and looks at the far view and the outer range.
`check.js` loads the game in headless Chromium and confirms there are no errors, all 60 trails exist, and that
skiing, jumping and the lamp quest work. `screenshot.js` saves pictures of named places to `tools/shots/`.

## Controls

Arrows or WASD steer, tuck and push. Space jumps, Shift stops, F takes skis off or puts them on, E talks or uses,
I opens the pack, M the map, J the journal, C switches camera, N toggles sound.
