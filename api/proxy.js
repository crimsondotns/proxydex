const express = require('express');
const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();

app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath || '/usr/bin/chromium-browser',
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });

    // Extract pairDetails from window.__SERVER_DATA
    const pairDetails = await page.evaluate(() => {
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
    res.status(200).json(pairDetails || { error: 'pairDetails not found' });

  } catch (err) {
    if (browser) await browser.close();
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy failed', message: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
