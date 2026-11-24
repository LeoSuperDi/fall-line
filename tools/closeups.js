// Close-ups for checking the character and how jumps look, plus a look at the world's edge.
//   node tools/closeups.js
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame();
  await page.click('#tNew'); await page.waitForTimeout(800);
  await page.evaluate(() => { __fl.save.time = 0.3; });
  await travelTo(page, 'village'); await page.waitForTimeout(1500);
  // turn the camera to face the skier from the front-side
  await page.evaluate(() => { const C = __fl.CAM, P = __fl.P; C.mode = 'third'; window.__orbit = true; });
  const frontShot = async (name, setup) => {
    await page.evaluate(setup || (() => {}));
    await page.waitForTimeout(400);
    await page.evaluate(() => { const P = __fl.P, a = P.h + 0.5, d = 3.4; __fl.CAM.lock = { pos: { x: P.x + Math.sin(a) * d, y: P.y + 1.3, z: P.z - Math.cos(a) * d }, look: { x: P.x, y: P.y + 0.85, z: P.z } }; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(dir, name + '.png'), clip: { x: 340, y: 120, width: 600, height: 520 } });
  };
  await page.evaluate(() => { const f = window.requestAnimationFrame; }); // nothing
  await frontShot('char-ski');
  await page.evaluate(() => { __fl.CAM.lock = null; });
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(600); await frontShot('char-tuck'); await page.keyboard.up('ArrowDown');
  await page.evaluate(() => { __fl.CAM.lock = null; __fl.toggleSkis(); }); await page.waitForTimeout(300); await frontShot('char-walk');
  await page.evaluate(() => { __fl.CAM.lock = null; __fl.toggleSkis(); });
  // the far view and the edge of the world, from the top of Ember Peak looking east toward the outer range
  await travelTo(page, 'ember_top'); await page.evaluate(() => { __fl.CAM.lock = null; const P = __fl.P; P.h = Math.PI / 2 + 0.3; __fl.CAM.yaw = P.h; }); await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(dir, 'edge-east.png') });
  await travelTo(page, 'crags_top'); await page.waitForTimeout(5000); await page.screenshot({ path: path.join(dir, 'far-north.png') });
  console.log('errors', errors); await browser.close();
})();
