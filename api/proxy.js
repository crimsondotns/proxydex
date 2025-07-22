const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // รอจนกว่า __SERVER_DATA จะพร้อม
    await page.waitForFunction(() => {
      return window.__SERVER_DATA?.route?.data?.pairDetails;
    }, { timeout: 10000 });

    const pairDetails = await page.evaluate(() => {
      try {
        const pd = window.__SERVER_DATA?.route?.data?.pairDetails;
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
