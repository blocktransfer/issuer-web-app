const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    await page.goto('https://stellar.expert/explorer/public/payment-locator/api?asset[]=DEMO-GDRM3MK6KMHSYIT4E2AG2S2LWTDBJNYXE4H72C7YTTRWOWX5ZBECFWO7-1');

    const transactionTable = await page.waitForSelector('body > div:nth-child(2) > div > div.page-container > div > div > div > div.space > div > table');
    
    await transactionTable.waitForSelector('tbody tr');
    
    const transactionRows = await transactionTable.$$eval('tbody tr', rows =>
        rows.map(row => row.textContent)
    );

    let transfers = [];
    let trades = [];

    const transfersPattern = /sent.*to/;

    for (const row of transactionRows) {
        if (transfersPattern.test(row)) {
            console.log(row);
        }
    }

    await browser.close();
  })();