/* Frostpeak Frontier: data.js
   Jackets, villagers, quest text, courses and the save format.
   Loaded as a plain script; files share one global scope and load in the order listed in index.html. */
'use strict';

/* ================= data ================= */
const JACKETS = [
  { id: 'ember', name: 'Ember', c: '#ff5a36', price: 0 },
  { id: 'sky', name: 'Sky', c: '#4f8fe0', price: 60 },
  { id: 'snow', name: 'Snowfield', c: '#eef1f7', price: 90 },
  { id: 'night', name: 'Midnight', c: '#2b3555', price: 90 },
  { id: 'mint', name: 'Mint knit', c: '#5fc8a5', quest: 'mittens' },
  { id: 'plum', name: 'Plum coat', c: '#8a5bb5', quest: 'tea' },
  { id: 'forest', name: 'Ranger green', c: '#3f7d5a', quest: 'survey' },
  { id: 'fox', name: 'Fox coat', c: '#e98b3a', quest: 'notes' },
  { id: 'racer', name: 'Race red', c: '#e23a5a', quest: 'gates' },
  { id: 'aurora', name: 'Aurora', c: '#59c3e6', quest: 'crystals' },
  { id: 'gold', name: 'Champion gold', c: '#f0b429', quest: 'wall' }
];
const NPCS = [
  { id: 'bram', name: 'Bram', role: 'Gondola operator', x: -446, z: 652, jacket: '#3d6fb6', hat: '#e8b04a', scarf: '#f0b429', beard: true, goggles: false,
    idle: ["The gondola never sleeps. I do, though. Just not on shift.", "Wind's picking up on the Wall side. Ski it smart.", "Seen any crystals glinting off-piste? Old Tov knows a story about those."] },
  { id: 'sela', name: 'Sela', role: 'Racer', x: -298, z: 658, jacket: '#e23a5a', hat: '#1f2433', scarf: '#ffffff',
    idle: ["Tuck on the flats, carve on the steeps. That's the whole secret.", "If you skid, you're braking. Clean edges are fast edges."] },
  { id: 'pip', name: 'Pip', role: 'Lives at the lodge', x: -262, z: -668, jacket: '#f0b429', hat: '#5fc8a5', scarf: '#3d73d9', small: true, goggles: false,
    idle: ["Mom says no hot cocoa before lunch. Mom is wrong.", "I saw a fox by the lake once. It looked right at me!", "When I grow up I'm going to ski The Wall. Backwards."] },
  { id: 'mira', name: 'Mira', role: 'Mountain ranger', x: 468, z: -100, jacket: '#3f7d5a', hat: '#c9733a', scarf: '#e9a23b', goggles: false,
    idle: ["Avalanche risk is real up here. If you hear a rumble, ski downhill and don't stop.", "Animals spook when you rush them. Coast in slowly."] },
  { id: 'tov', name: 'Old Tov', role: 'Hermit', x: -497, z: 236, jacket: '#8a5b3c', hat: '#7a7f8c', scarf: '#5f6b84', beard: true, goggles: false,
    idle: ["Snow remembers every track for a little while. Then it forgets. Nice, that.", "The shrine stones were here before the lifts. Before the lodge. Before me, even."] },
  { id: 'hanne', name: 'Hanne', role: 'Runs the village shop', x: -352, z: -712, jacket: '#8a3b52', hat: '#e9d9c4', scarf: '#2f5e8c', goggles: false, shop: true,
    idle: ["Cocoa's hot, wax is fresh, and the spyglass is the only one in the valley.", "Take your skis off and have a look around. The village is nicer at walking pace."] },
  { id: 'oskar', name: 'Oskar', role: 'Village lamplighter', x: -238, z: -716, jacket: '#3d5a80', hat: '#c9733a', scarf: '#f0b429', beard: true, goggles: false,
    idle: ["Every lamp in Lowpine has a name. That one's Gerda.", "Dark comes early in the valley. Lamps make it friendlier."] }
];
const QUESTS = {
  first: { title: 'First Tracks', giver: 'bram',
    offer: ["Morning, scout! Welcome to the Frontier. Nobody has properly mapped this mountain yet, so that's your job now.", "Start simple: ski down to the Base Lodge at the bottom and say hello to Pip. The gondola brings you back up whenever you like."],
    steps: [{ t: 'talk', npc: 'pip', text: 'Ski down to the Base Lodge and meet Pip', say: ["Whoa, you skied all the way from the summit? That's so cool!", "I'm Pip. My mom runs the lodge. Bram radioed that a scout was coming."] }],
    reward: { coins: 20 }, remind: "Pip is down at the Base Lodge. Follow any run to the bottom." },
  mittens: { title: 'Lost Mittens', giver: 'pip', req: 'first',
    offer: ["Hey, can you help me? I lost my mittens on Meadow Way, the green run.", "Three of them. Don't ask how I lost three. They're red, so they should stand out!"],
    steps: [{ t: 'collect', item: 'mitten', n: 3, text: 'Find 3 red mittens along Meadow Way' }, { t: 'talk', npc: 'pip', text: 'Bring the mittens back to Pip', say: ["My mittens! You're the best scout ever.", "Mom knitted a jacket that's way too big for me. It's yours now!"] }],
    reward: { coins: 40, color: 'mint' }, remind: 'Red mittens, along the edges of Meadow Way!' },
  survey: { title: 'Survey the Frontier', giver: 'mira',
    offer: ["A new scout! Perfect timing. Our maps are full of blank spots.", "Visit the Lookout Tower, the Old Shrine, the Ice Falls, the Crystal Grotto and the Frozen Lake. Your compass will show the way. Then come tell me what you saw."],
    steps: [{ t: 'visit', pois: ['lookout', 'shrine', 'icefalls', 'grotto', 'lake'], text: 'Visit the 5 landmarks Mira marked' }, { t: 'talk', npc: 'mira', text: 'Report back to Mira at Ranger Camp', say: ["All five landmarks. The Frontier feels a little less wild already.", "Take a ranger jacket. You've earned it."] }],
    reward: { coins: 60, color: 'forest' }, remind: 'Your compass points to every landmark you still need.' },
  notes: { title: 'Field Notes', giver: 'mira', req: 'survey',
    offer: ["One more favor. The animals up here have barely been studied.", "Get close enough to log all five: snowshoe hare, silver fox, alpine ibex, ptarmigan and ermine. Coast in slowly or they'll bolt."],
    steps: [{ t: 'dex', n: 5, text: 'Log all 5 mountain creatures' }, { t: 'talk', npc: 'mira', text: 'Show Mira your field notes', say: ["Five for five! These notes will help us keep them safe.", "Here, a jacket the color of a fox's coat."] }],
    reward: { coins: 80, color: 'fox' }, remind: 'Hares and foxes like the woods. Ibex stay high on rocky ground. Ptarmigan near the treeline. Ermine around rocks and the lake.' },
  tea: { title: "Hermit's Tea", giver: 'tov',
    offer: ["Hm. A visitor. That's rare.", "My knees won't carry me to the lake anymore, and I'm out of frost mint. Four sprigs, please. They grow on the lake shore and glow faintly blue."],
    steps: [{ t: 'collect', item: 'mint', n: 4, text: 'Gather 4 frost mint on the Frozen Lake shore' }, { t: 'talk', npc: 'tov', text: 'Bring the mint to Old Tov', say: ["Ahh, smell that. Sit, sit. Well, don't. You're on skis.", "Take this plum coat. I never wear it."] }],
    reward: { coins: 50, color: 'plum' }, remind: 'Frost mint glows blue on the Frozen Lake shore.' },
  crystals: { title: 'Crystal Lore', giver: 'tov', req: 'tea',
    offer: ["Those crystals glinting off-piste? My grandmother said they're pieces of a star that fell on this peak.", "Find fifteen of them, then come back and I'll tell you the rest of the story."],
    steps: [{ t: 'crystals', n: 15, text: 'Collect 15 snow crystals anywhere on the mountain' }, { t: 'talk', npc: 'tov', text: 'Return to Old Tov', say: ["Fifteen... so the old story is true. The star is waking up.", "Keep looking, scout. And wear this. It shimmers like the northern lights."] }],
    reward: { coins: 100, color: 'aurora' }, remind: 'Crystals hide off the groomed runs: in glades, on ridges, near landmarks.' },
  gates: { title: 'Gate Runner', giver: 'sela',
    offer: ["You look fast. Let's find out.", "I set gates on Fox Run. Ski through the start banner, clear the gates and cross the finish in under 60 seconds. Each missed gate adds 3."],
    steps: [{ t: 'course', id: 'fox', text: "Clear Sela's gates on Fox Run in under 60 s" }, { t: 'talk', npc: 'sela', text: 'Tell Sela your time at the summit', say: ["Not bad, rookie. Not bad at all.", "Take my spare race jacket. You'll need it for the next one."] }],
    reward: { coins: 60, color: 'racer' }, remind: "The start banner is just below the summit on Fox Run." },
  wall: { title: 'Conquer the Wall', giver: 'sela', req: 'gates',
    offer: ["Okay. The real test: The Wall.", "Top to bottom in under 110 seconds. Most people take one look and ride the gondola down."],
    steps: [{ t: 'course', id: 'wall', text: 'Race The Wall top to bottom in under 110 s' }, { t: 'talk', npc: 'sela', text: 'Find Sela at the summit', say: ["...You actually did it. Huh.", "Champion gold. Wear it. You earned it."] }],
    reward: { coins: 120, color: 'gold' }, remind: 'The start banner is at the top of The Wall, east of the summit.' }
};
QUESTS.lamps = { title: 'Lamps of Lowpine', giver: 'oskar',
  offer: ["Evening, scout. My knees and these icy steps don't get along anymore.", "Would you light the five street lamps around the village for me? Take your skis off first, it's easier on foot. Walk up to each one and light it."],
  steps: [{ t: 'light', text: 'Light the 5 lamps around Lowpine Village' }, { t: 'talk', npc: 'oskar', text: 'Tell Oskar the lamps are lit', say: ["Look at that. Lowpine glows again.", "Here, for your trouble. And a cup of cocoa on me."] }],
  reward: { coins: 45, item: ['cocoa', 1] }, remind: 'Five lamps: around the square, by the shop, and along the lane to the lodge. Skis off, then walk up and press E.' };
const COURSES = { fox: { run: 1, f0: 0.07, f1: 0.42, limit: 60, gates: true }, wall: { run: 2, f0: 0.045, f1: 0.965, limit: 110, gates: false } };
const SPAWNS = { summit: [-432, 646, 0], base: [-250, -648, Math.PI], ranger: [466, -88, 0], hermit: [-486, 224, 0.5], village: [-246, -776, Math.PI] };
REGIONS.forEach(r => { if (r.id === 'frost') return; const dh = r.row > 0 ? 0 : Math.PI, [tx, tz] = toWorld(r, r.topU - 28, 30), [bx, bz] = toWorld(r, 108, 60), lm = LANDMARK[r.id], [lx, lz] = toWorld(r, lm[2] - 24, lm[3]);
  SPAWNS[r.id + '_top'] = [tx, tz, dh]; SPAWNS[r.id + '_base'] = [bx, bz, dh + Math.PI]; SPAWNS[lm[0]] = [lx, lz, dh]; if (r.id === 'ember') { const [rx, rz] = toWorld(r, r.uS - 186, 0); SPAWNS[lm[0]] = [rx, rz, dh + Math.PI]; } }); // the crater rim, looking in

/* ================= save ================= */
const SAVE_KEY = 'frostpeak_save_v1';
function newSave() { return { v: 1, q: {}, disc: [], crystals: [], items: {}, dex: {}, coins: 0, colors: ['ember'], color: 'ember', pos: { x: -432, z: 646, h: 0 }, time: 0.04, cam: 'third', inv: {}, lit: [], foot: false, regions: [] }; }
let save = newSave();
const stats = { crashes: 0 };
function persist() { save.pos = { x: P.x, z: P.z, h: P.h }; save.cam = CAM.mode; save.foot = P.foot; store.set(SAVE_KEY, save); }
