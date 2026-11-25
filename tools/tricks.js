// Jump and spin, then jump and flip; report what landed.
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(500); await page.evaluate(() => { __fl.save.time = 0.3; });
  await travelTo(page, 'summit'); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowUp');
  for (const k of ['ArrowRight', 'ArrowUp']) {
    const c0 = await page.evaluate(() => __fl.save.coins);
    await page.keyboard.press('Space'); await page.waitForTimeout(40); await page.keyboard.down(k);
    let peak = 0; for (let i = 0; i < 16; i++) { await page.waitForTimeout(50); const r = await page.evaluate(() => [__fl.P.air, Math.abs(__fl.P.spinA) + Math.abs(__fl.P.flipA)]); peak = Math.max(peak, r[1]); if (i === 6) await page.screenshot({ path: path.join(__dirname, 'shots', 'trick-' + k + '.png') }); }
    await page.keyboard.up(k); await page.waitForTimeout(800);
    const st = await page.evaluate(() => [__fl.P.inv, __fl.P.crash]); console.log('inv/crash', st); console.log(k, 'max rotation', peak.toFixed(1), 'rad, crashed', await page.evaluate(() => __fl.P.crash > 0), 'coins +', (await page.evaluate(() => __fl.save.coins)) - c0);
    await page.waitForTimeout(1500);
  }
  console.log('errors', errors); await browser.close();
})();
