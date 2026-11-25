// Arlo close-ups: skiing, in the air, grabbing, walking in camp, and the dialogue portrait.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { __hs.startStage(0, 0, true); __hs.L.obs.length = 0; }); await p.waitForTimeout(1500);
  const clip = async n => { const pos = await p.evaluate(() => { const sc = innerHeight / 540, L = __hs.P; return [0, 0]; }); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-arlo-' + n + '.png'), clip: { x: 260, y: 160, width: 420, height: 300 } }); };
  await clip('ski');
  await p.keyboard.press('Space'); await p.waitForTimeout(200); await clip('air');
  await p.keyboard.down('ArrowDown'); await p.waitForTimeout(150); await clip('grab'); await p.keyboard.up('ArrowDown');
  await p.waitForTimeout(1500);
  await p.evaluate(() => { __hs.startHub(0); }); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-arlo-walk.png'), clip: { x: 440, y: 260, width: 400, height: 260 } }); await p.keyboard.up('ArrowRight');
  await p.evaluate(() => __hs.dialog([['arlo', 'Day 212. Still no yeti.']], () => {})); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-arlo-face.png'), clip: { x: 0, y: 580, width: 360, height: 140 } });
  console.log('errors', errs); await b.close();
})();
