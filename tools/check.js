// Quick health check: the game loads without errors, all trails exist, skiing, jumping and the lamp quest work.
//   node tools/check.js
const { openGame, travelTo } = require('./harness');
(async () => {
  const { browser, page, errors, loadSeconds } = await openGame({ width: 960, height: 540 });
  const out = { loadSeconds };
  await page.click('#tNew'); await page.waitForTimeout(800);
  out.trails = await page.evaluate(() => __fl.RUNS.length);
  await travelTo(page, 'pine_top'); await page.waitForTimeout(800);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(2500); await page.keyboard.up('ArrowUp');
  await page.keyboard.press('Space');
  let air = false; for (let i = 0; i < 25; i++) { await page.waitForTimeout(60); if (await page.evaluate(() => __fl.P.air)) air = true; }
  out.jumped = air; out.landedSafely = await page.evaluate(() => !__fl.P.air && __fl.P.crash <= 0);
  out.speedKmh = await page.evaluate(() => Math.round(Math.hypot(__fl.P.vx, __fl.P.vz) * 3.6));
  out.lampQuest = await page.evaluate(async () => {
    const F = __fl, P = F.P; P.x = -300; P.z = -690; P.s = 0; P.vx = P.vz = 0; if (!P.foot) F.toggleSkis(); F.startQuest('lamps');
    for (const l of F.LANTERNS) { P.x = l.x + 1.5; P.z = l.z + 0.5; await new Promise(r => setTimeout(r, 120)); F.interact(); }
    return F.save.lit.length === F.LANTERNS.length && F.save.q.lamps.step === 1;
  });
  out.errors = errors;
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
  process.exit(errors.length || !out.jumped || !out.lampQuest ? 1 : 0);
})();
