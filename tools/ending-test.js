// Plays the finale panel: unlocks every ending, picks each one and checks the ending screen.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(600);
  for (const id of ['stone', 'proof', 'keeper', 'guide']) {
    await p.evaluate(() => { const S = __hs.save; S.cones = [...Array(12).keys()]; for (let i = 0; i < 22; i++) S.album[i] = 1; __hs.startHub(5); __hs.openFinale(); });
    await p.click(`.prow[data-e="${id}"]`);
    for (let k = 0; k < 30 && (await p.evaluate(() => __hs.state)) === 'dialog'; k++) { await p.keyboard.press('Space'); await p.waitForTimeout(60); }
    console.log(id, await p.evaluate(() => [__hs.state, document.getElementById('endH').textContent, __hs.save.endings.length].join(' | ')));
    if (id === 'keeper') await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-ending-keeper.png') });
    await p.click('#endTitle'); await p.waitForTimeout(200);
  }
  console.log('state after', await p.evaluate(() => __hs.state), 'errors', errs); await b.close();
})();
