const { count } = require('console');
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const urls = [
    'https://dexscreener.com/base/0xac0182b0151d710acc126166650f835e4d0274d4'
  ];

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'networkidle2' });

    let pairDetails = null;
    for (let i = 0; i < 40; i++) {
      pairDetails = await page.evaluate(() => {
        try {
          const pd = window.__SERVER_DATA?.route?.data?.pairDetails;
          if (!pd) return null;
          if (pd.cg) {
            return {
              schemaVersion: pd.schemaVersion,
              gp: pd.gp ?? null,
              cg: pd.cg,
              holdersCount: pd.holders.count ?? null,
              holdersTotalSupply: pd.holders.totalSupply ?? null
            };
          } else if (pd.holders) {
            return {
              schemaVersion: pd.schemaVersion,
              gp: pd.gp ?? null,
              holdersCount: pd.holders.count ?? null,
              holdersTotalSupply: pd.holders.totalSupply ?? null
            };
          } else {
            return null;
          }
        } catch (e) {
          return null;
        }
      });
      if (pairDetails && (pairDetails.cg || pairDetails.holdersCount || pairDetails.holdersTotalSupply)) break;
      await new Promise(res => setTimeout(res, 500));
    }

    if (pairDetails && (pairDetails.cg || pairDetails.holdersCount || pairDetails.holdersTotalSupply)) {
      console.log(JSON.stringify(pairDetails, null, 2));
    } else {
      console.log('ไม่พบข้อมูล pairDetails.cg หรือ holders ใน window.__SERVER_DATA');
    }
  }

  await browser.close();
})();