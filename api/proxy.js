const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) {
    res.status(400).json({ error: 'Missing url parameter' });
    return;
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'networkidle2' });

  let pairDetails = await page.evaluate(() => {
    try {
      const pd = window.__SERVER_DATA?.route?.data?.pairDetails;
      if (!pd) return null;
      return {
        schemaVersion: pd.schemaVersion,
        gp: pd.gp ?? null,
        cg: pd.cg ?? null,
        holdersCount: pd.holders?.count ?? null,
        holdersTotalSupply: pd.holders?.totalSupply ?? null
      };
    } catch (e) {
      return null;
    }
  });

  await browser.close();
  res.status(200).json(pairDetails);
};