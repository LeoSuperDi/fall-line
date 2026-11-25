// Screenshots the sketchbook with every find unlocked, then with a few found.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 900 } }); await routeFonts(p);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(500);
  await p.evaluate(() => { for (let i = 0; i < 30; i++) __hs.save.album[i] = i % 7 ? 1 : 2; __hs.startHub(0); __hs.openAlbum(); });
  for (let k = 0; k < 3; k++) { await p.evaluate(k => { document.querySelector('.book').scrollTop = k * 520; }, k); await p.waitForTimeout(150); await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-book-' + k + '.png') }); }
  await p.evaluate(() => { __hs.save.album = { 0: 1, 3: 1, 7: 2 }; document.getElementById('hubPanel').classList.add('hidden'); __hs.startHub(0); __hs.openAlbum(); }); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(__dirname, 'shots', 'hs-book-few.png') });
  console.log('errors', errs); await b.close();
})();
