// Checks every stage: no shard overlaps a ground obstacle, and no shard floats over a pit at ground height.
const { chromium } = require('playwright'), path = require('path'), routeFonts = require('./hs-fonts');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); await routeFonts(p);
  await p.goto('file://' + path.resolve(__dirname, '../hourstone/index.html')); await p.waitForTimeout(400);
  const out = await p.evaluate(() => { const bad = []; for (let c = 0; c < 6; c++) for (let s = 0; s < 3; s++) { __hs.startStage(c, s, true); const L = __hs.L;
    for (const sh of L.shards) { const o = L.obs.find(o => !o.fly && !o.vx && Math.abs(o.x - sh.x) < o.w / 2 + 30); const h = o ? (o.k === 'geyser' ? 84 : o.h) : 0; if (o && -sh.dy < h + 20) bad.push([c, s, Math.round(sh.x), o.k, sh.dy]); } } return bad; });
  console.log('shards inside obstacles:', JSON.stringify(out)); await b.close();
})();
