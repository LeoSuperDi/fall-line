// The same view at midday and at sunset, to check the snow reads as snow.
const fs = require('fs'), path = require('path');
const { openGame, travelTo } = require('./harness');
(async () => {
  const dir = path.join(__dirname, 'shots'); fs.mkdirSync(dir, { recursive: true });
  const { browser, page, errors } = await openGame({ width: 960, height: 540 });
  await page.click('#tNew'); await page.waitForTimeout(800);
  await travelTo(page, 'summit'); await page.keyboard.down('ArrowUp'); await page.waitForTimeout(2500); await page.keyboard.up('ArrowUp'); await page.waitForTimeout(1500);
  for (const [t, n] of [[0.3, 'midday'], [0.62, 'sunset']]) { await page.evaluate(t => { __fl.save.time = t; }, t); await page.waitForTimeout(1500); await page.screenshot({ path: path.join(dir, 'light-' + n + '.png') }); }
  console.log('errors', errors); await browser.close();
})();
