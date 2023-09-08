const express = require('express');
const cors = require('cors');
const app = express();
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) =>
    fetch(...args));
const toml = require('toml');
const { BT_ISSUERS, HORIZON_INST, MAX_SEARCH, USD_ASSETS, MICR_TXT, BT_WELL_KNOWN, BT_API_SERVER } = require('./globals');
const { response } = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const aws = require('aws-sdk');

const apigClientFactory = require('aws-api-gateway-client').default;
const apigClient = apigClientFactory.newClient({
    invokeUrl: BT_API_SERVER, // REQUIRED
    accessKey: process.env.AWS_ACCESS_KEY_ID, // REQUIRED
    secretKey: process.env.AWS_SECRET_ACCESS_KEY, // REQUIRED
    sessionToken: '', //OPTIONAL: If you are using temporary credentials you must include the session token
    region: 'us-east-2', // REQUIRED: The region where the API is deployed.
    systemClockOffset: 0, // OPTIONAL: An offset value in milliseconds to apply to signing time
    retries: 4, // OPTIONAL: Number of times to retry before failing. Uses axon-retry plugin.
    retryCondition: (err) => { // OPTIONAL: Callback to further control if request should be retried.  Uses axon-retry plugin.
      return err.response && err.response.status === 500;
    }
});

app.get('/asset-class-data/:assetCode', cors(), async (req, res) => {
    try {
        let response = [];
        
        const assetTOML = await getAssetTOML(req.params.assetCode);

        const stocks = assetTOML.STOCKS;

        for (let i in stocks) {
            let stock = stocks[i];

            let stats;

            // console.log(stock.code);

            // TODO: Fix below
            try {
                stats = await getAssetStats(assetTOML, stock.code);
            } catch(err) {
                console.log(err);
                continue;
            }

            response.push({ companyName: assetTOML.ISSUER.name, code: stock.code, 
                            class: stock.class, par: stock.par, stats: stats });
        }

        res.send(JSON.parse(JSON.stringify(response)));
    } catch(err) {
        console.log(err);
        res.status(500).send('Something went wrong');
    }
});

app.get('/asset-classes/:assetCode', cors(), async (req, res) => {
    try {
        let response = [];
        
        const assetTOML = await getAssetTOML(req.params.assetCode);

        const stocks = assetTOML.STOCKS;

        for (let i in stocks) {
            let stock = stocks[i];

            response.push({ class: stock.class, code: stock.code });
        }

        res.send(JSON.parse(JSON.stringify(response)));
    } catch(err) {
        console.log(err);
        res.status(500).send('Something went wrong');
    }
});

app.get('/get-top-investors/:assetCode', cors(), async (req, res) => {
    try {
        let issuer = await getAssetIssuer(req.params.assetCode);

        let requestAddr = await getAssetAccountsAddress(req.params.assetCode, issuer);

        let ledger = await fetch(requestAddr);
        let ledgerJSON = await ledger.json();
        let ledgerBalances = [];
        
        while (ledgerJSON._embedded.records.length > 0) {
            for (let i in ledgerJSON._embedded.records) {
                let accounts = ledgerJSON._embedded.records[i];
                let account = accounts.id;

                for (let b in accounts.balances) {
                    let balances = accounts.balances[b];

                    if (!('asset_code' in balances) || !('asset_issuer' in balances)) {
                        continue;
                    }

                    if (balances.asset_code == req.params.assetCode 
                        && balances.asset_issuer == issuer) {
                        let balance = parseFloat(balances.balance);
                        
                        if (balance > 0) {
                            ledgerBalances.push({ account_id: account, balance: balance });
                        }

                        break;
                    }
                }
            }

            ledgerJSON = await getNextLedgerJSON(ledgerJSON);
        }

        // ledgerBalances = ledgerBalances.slice(0, 50);

        // Fetch legal names using getPIIFromAddresses
        const addresses = ledgerBalances.map(investor => investor.account_id);
        const piiData = await getPIIFromAddresses(addresses);
        const piiJSON = piiData.map(item => aws.DynamoDB.Converter.unmarshall(item));

        // Merge legal names with investor balances
        ledgerBalances.forEach(investor => {
            const piiInfo = piiJSON.find(pii => pii.PK === investor.account_id);
            if (piiInfo && piiInfo.legalName) {
                investor.legalName = piiInfo.legalName;
            }

            if (piiInfo && piiInfo.address) {
                investor.address = piiInfo.address;
            }

            if (piiInfo && piiInfo.citizen) {
                investor.citizen = piiInfo.citizen;
            }
        });

        ledgerBalances.sort((a, b) => {
            if (a.balance < b.balance) {
                return 1;
            }

            if (a.balance > b.balance) {
                return -1;
            }

            return 0;
        });

        res.send(ledgerBalances);
    } catch(err) {
        console.log(err);
        res.status(500).send('Something went wrong');
    }
});

app.get('/get-activity/:assetCode', cors(), async (req, res) => {
    try {
        const assetCode = req.params.assetCode;
        const timeframe = req.query.timeframe || 'max';

        let [activity, stats] = await getActivityAndStatsForAsset(assetCode, timeframe);

        res.send({'activity': activity, 'stats': stats});
    } catch(err) {
        console.log(err);
        res.status(500).send('Something went wrong');
    }
});

async function getAssetStats(assetTOML, assetCode) {
    let sharesInDTC = await getFederationResolvedBalance('cede*blocktransfer.io', assetCode);
    let treasuryShares = await getFederationResolvedBalance(assetCode + '*treasury.holdings', assetCode);

    let assetAddr = await getAssetAddress(assetCode);

    const assetResp = await fetch(assetAddr);
    let assetJSON = await assetResp.json();

    const assetData = assetJSON._embedded.records[0];

    let explicitRestrictedShares = parseFloat(assetData.claimable_balances_amount);

    let implicitRestrictedShares = 0.0;

    for (let classifiers in assetData.balances) {
        let balances = assetData.balances[classifiers];

        if (classifiers != 'authorized') {
            implicitRestrictedShares += parseFloat(balances);
        }
    }

    let restrictedShares = explicitRestrictedShares + implicitRestrictedShares;

    let dsppShares = await getFederationResolvedBalance(assetCode + '*authorized.DSPP.holdings', assetCode);
    let pendingIPOShares = await getFederationResolvedBalance(assetCode + '*initial.offering.holdings', assetCode);
    let regAShares = await getFederationResolvedBalance(assetCode + '*reg.a.offering.holdings', assetCode);
    let regCFShares = await getFederationResolvedBalance(assetCode + '*reg.cf.offering.holdings', assetCode);
    let privatePlacementShares = await getFederationResolvedBalance(assetCode + '*reg.d.offering.holdings', assetCode);
    let shelfShares = await getFederationResolvedBalance(assetCode + '*shelf.offering.holdings', assetCode);

    let reservedShares = dsppShares + pendingIPOShares + regAShares + regCFShares + privatePlacementShares + shelfShares;

    let stock = assetTOML.STOCKS.find((s) => s.code == assetCode);

    let authorizedShares = stock.authorized;

    let shares = parseFloat(assetData.liquidity_pools_amount);

    for (let classifiers in assetData.balances) {
        let balances = assetData.balances[classifiers];

        shares += parseFloat(balances);
    }
    
    shares += parseFloat(assetData.claimable_balances_amount);

    let outstandingShares = shares - treasuryShares - reservedShares;

    return { sharesInDTC: sharesInDTC, 
        treasuryShares: treasuryShares, 
        restrictedShares: restrictedShares,
        dsppShares: dsppShares,
        pendingIPOShares: pendingIPOShares,
        regAShares: regAShares,
        regCFShares: regCFShares,
        privatePlacementShares: privatePlacementShares,
        shelfShares: shelfShares,
        reservedShares: reservedShares,
        authorizedShares: authorizedShares,
        outstandingShares: outstandingShares };
}

async function getAssetTOML(assetCode) {
    const btStellarResponse = await fetch(BT_WELL_KNOWN + '/stellar.toml');

    const btStellarTxt = await btStellarResponse.text();

    const btStellarTOML = toml.parse(btStellarTxt);

    const asset = btStellarTOML.CURRENCIES.find((c) => c.code == assetCode);

    const tomlLink = asset.attestation_of_reserve;

    const apiResponse = await fetch(tomlLink);

    let apiResponseTxt = await apiResponse.text();

    apiResponseTxt = apiResponseTxt.replace("desc.main", "desc-main");
    apiResponseTxt = apiResponseTxt.replace("desc.business", "desc-business");
    apiResponseTxt = apiResponseTxt.replace("desc.facilities", "desc-facilities");
    apiResponseTxt = apiResponseTxt.replace("desc.products", "desc-products");

    apiResponseTxt = apiResponseTxt.replace("ir.email", "ir-email");
    apiResponseTxt = apiResponseTxt.replace("ir.phone", "ir-phone");

    apiResponseTxt = apiResponseTxt.replace("blue_sky.states", "blue_sky-states");
    apiResponseTxt = apiResponseTxt.replace("blue_sky.exchange", "blue_sky-exchange");

    apiResponseTxt = apiResponseTxt.replace("jurisdiction.country", "jurisdiction-country");
    apiResponseTxt = apiResponseTxt.replace("jurisdiction.subdivision", "jurisdiction-subdivision");

    apiResponseTxt = apiResponseTxt.replace("reg.d.506b.offering", "reg-d-506b-offering");

    const assetTOML = toml.parse(apiResponseTxt);

    return assetTOML;
}

async function getFederationResolvedBalance(federationAddr, assetCode) {
    const federationResp = await fetch(
        'https://stellarid.io/federation/?q=' + federationAddr + '&type=name');

    let federationJSON = await federationResp.json();
    let addr = federationJSON.account_id;

    let balance = await getAccountBalance(addr, assetCode);

    return balance;
}

async function getAccountBalance(addr, assetCode) {
    let shares = 0;

    const accountDataResp = await fetch(HORIZON_INST + '/accounts/' + addr);

    let accountDataJSON = await accountDataResp.json();

    for (let i in accountDataJSON.balances) {
        let balance = accountDataJSON.balances[i];

        if (balance.asset_type == assetCode) {
            shares += parseFloat(balance.balance);
            break;
        }
    }

    return shares;
}

async function getAssetIssuer(queryAsset) {
    let requestAddr = HORIZON_INST + '/assets?asset_code=' + queryAsset + '&asset_issuer=';

    for (let i in BT_ISSUERS) {
        let address = BT_ISSUERS[i];

        const assetIssuerResp = await fetch(requestAddr + address);
        let assetIssuerJSON = await assetIssuerResp.json();

        if (assetIssuerJSON._embedded.records.length > 0) {
            return address;
        }
    }

    throw new Error("Could not find asset " + queryAsset);
}

async function getAssetAddress(queryAsset) {
    let issuer = await getAssetIssuer(queryAsset);

    return HORIZON_INST + '/assets?asset_code=' 
                + queryAsset + '&asset_issuer=' + issuer;
}

async function getAssetAccountsAddress(queryAsset, issuer) {
    return HORIZON_INST + '/accounts?asset=' + queryAsset 
            + ':' + issuer + '&' + MAX_SEARCH;
}

async function formatRawHref(href) {
    return href.replace(/%3A/g, ":").replace(/\u0026/g, "&")
        .replace("{?cursor,limit,order}", "?" + MAX_SEARCH);
}

async function getNextLedgerJSON(ledgerJSON) {
    let nextAddr = await formatRawHref(ledgerJSON._links.next.href);

    let response = await fetch(nextAddr);

    let responseJSON = await response.json();

    return responseJSON;
}

async function getAllPublicKeys() {
    return new Promise((resolve, reject) => {
        let publicKeys = [];
        const stream = fs.createReadStream(MICR_TXT, { encoding: 'utf8' });
        let lineNumber = 1;
    
        stream.on('data', (data) => {
          const lines = data.split('\n');
    
          lines.forEach((line) => {
            if (lineNumber > 1) {
              let account = line.split('|');
    
              if (account[0].length > 0) {
                publicKeys.push(account[0]);
              }
            }
    
            lineNumber++;
          });
        });
    
        stream.on('end', () => {
            // console.log(publicKeys);
          resolve(publicKeys); // Resolve the Promise with publicKeys when data processing is complete
        });
    
        stream.on('error', (err) => {
          reject(err); // Reject the Promise if there is an error reading the file
        });
    });
}

async function requestAssetAccounts(queryAsset) {
    let currPublicKeys = [];

    let issuer = await getAssetIssuer(queryAsset);

    let url = HORIZON_INST + "/accounts?asset=" 
        + queryAsset + ":" + issuer + "&" + MAX_SEARCH;
    
    let response = await fetch(url);

    let responseJSON = await response.json();

    return responseJSON;
}

async function debugGetAllCurrPublicKeysForAsset() {
    var pathParams = {
    };
    // Template syntax follows url-template https://www.npmjs.com/package/url-template
    var pathTemplate = '/accounts/public-keys/all'
    var method = 'GET';
    var additionalParams = {
        headers: {
        },
        queryParams: {
        }
    };
    var body = {
    
    };

    try {
        const result = await apigClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);
        return result.data;
    } catch (error) {
        console.log(error);
        throw new Error("Request for accounts data was unsuccessful");
    }
}

async function getPaymentsLedger(address) {
    const accountDataResp = await fetch(HORIZON_INST + '/accounts/' + address);

    let accountDataJSON = await accountDataResp.json();

    let paymentsLink = await formatRawHref(accountDataJSON._links.payments.href);

    // console.log(paymentsLink);

    let payments = await fetch(paymentsLink);

    let paymentsJSON = await payments.json();

    return paymentsJSON;
}

function checkDateWithinTimeframe(dateInstance, timeframe) {
    const currentDate = new Date();

    if (timeframe === "today") {
        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);
        return dateInstance >= startOfDay && dateInstance <= endOfDay;
    } else if (timeframe === "week") {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setHours(0, 0, 0, 0);

        // dayOfWeek is the numbered day within the week, with Monday being the first day (0)
        // in other words, monday = 0, tuesday = 1, wednesday = 2, thursday = 3, etc.
        const dayOfWeek = (date.getDay() - 1 + 7) % 7;

        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return dateInstance >= startOfWeek && dateInstance <= endOfWeek;
    } else if (timeframe === "month") {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        return dateInstance >= startOfMonth && dateInstance <= endOfMonth;
    } else if (timeframe === "quarter") {
        const quarter = Math.floor(currentDate.getMonth() / 3);
        const startOfQuarter = new Date(currentDate.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(currentDate.getFullYear(), quarter * 3 + 3, 0);
        endOfQuarter.setHours(23, 59, 59, 999);
        return dateInstance >= startOfQuarter && dateInstance <= endOfQuarter;
    } else if (timeframe === "year") {
        const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
        const endOfYear = new Date(currentDate.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        return dateInstance >= startOfYear && dateInstance <= endOfYear;
    } else if (timeframe === "max") {
        return true; // No restriction on timeframe
    }

    return false; // Invalid timeframe
}

async function getActivityAndStatsForAsset(queryAsset, timeframe='max') {
    let activity = {};

    let issuer = await getAssetIssuer(queryAsset);

    let allPublicKeys = await debugGetAllCurrPublicKeysForAsset(queryAsset);

    let totalTransfers = 0;
    let totalTrades = 0;

    const piiData = await getPIIFromAddresses(allPublicKeys);
    const piiJSON = piiData.map(item => aws.DynamoDB.Converter.unmarshall(item));

    let piiMap = {};
    for (const piiItem of piiJSON) {
        piiMap[piiItem.PK] = piiItem.legalName;
    }

    piiMap[BT_ISSUERS] = 'BT_ISSUER';

    // Due to the fact that transfers are recorded on both
    // the source account and destination account ledgers,
    // transfers are typically double counted. That is why
    // activity is a dictionary with the transaction
    // hash as the key to prevent duplicate entries
    for (let i in allPublicKeys) {
        let addresses = allPublicKeys[i];

        let paymentsLedger = await getPaymentsLedger(addresses);

        let paymentRecords = paymentsLedger._embedded.records;

        while (paymentRecords.length > 0) {
            for (let j in paymentRecords) {
                let payments = paymentRecords[j];

                if (payments.type == "payment" &&
                    payments.asset_type != "native" &&
                    BT_ISSUERS.includes(payments.asset_issuer) &&
                    payments.asset_code == queryAsset) {

                    let paymentDate = new Date(payments.created_at);

                    // If the transaction was not counted already and is within the timeframe
                    if (checkDateWithinTimeframe(paymentDate, timeframe)
                        && !(payments.transaction_hash in activity)) {
                        totalTransfers++;
                    }

                    let from = payments.from;
                    let to = payments.to;

                    const fromPII = piiMap[payments.from];
                    const toPII = piiMap[payments.to];

                    if (fromPII) {
                        from = fromPII;
                    }

                    if (toPII) {
                        to = toPII;
                    }

                    activity[payments.transaction_hash] = {
                        "type": "transfer",
                        "txHash": payments.transaction_hash,
                        "asset": queryAsset,
                        "amount": parseFloat(payments.amount),
                        "from": from,
                        "to": to,
                        "timestamp": payments.created_at
                    };
                }
            }

            paymentsLedger = await getNextLedgerJSON(paymentsLedger);

            paymentRecords = paymentsLedger._embedded.records;
        }
    }

    for (let i in USD_ASSETS) {
        let usdAsset = USD_ASSETS[i];

        let usdType = usdAsset.type;
        let usdCode = usdAsset.code;
        let usdIssuer = usdAsset.issuer;

        let tradesEndpoint = "https://horizon.stellar.org/trades?base_asset_type=credit_alphanum4&base_asset_issuer=" +
                                issuer + "&base_asset_code=" + queryAsset + 
                                "&counter_asset_type=" + usdType + "&counter_asset_issuer=" + usdIssuer + 
                                "&counter_asset_code=" + usdCode + "&limit=200&order=desc";

        let tradesResp = await fetch(tradesEndpoint);   
        
        let tradesJSON = await tradesResp.json();

        if (tradesJSON._embedded) {
            let tradeRecords = tradesJSON._embedded.records;

            while (tradeRecords.length > 0) {
                for (let j in tradeRecords) {
                    let trade = tradesJSON._embedded.records[j];
        
                    if (trade.base_is_seller) {
                        let pagingToken = trade.paging_token.split('-')[0];

                        let paymentDate = new Date(trade.ledger_close_time);

                        if (checkDateWithinTimeframe(paymentDate, timeframe)
                            && !(pagingToken in activity)) {
                            totalTrades++;
                        }

                        let from = trade.base_account;
                        let to = trade.counter_account;
    
                        const fromPII = piiMap[trade.base_account];
                        const toPII = piiMap[trade.counter_account];
    
                        if (fromPII) {
                            from = fromPII;
                        }
    
                        if (toPII) {
                            to = toPII;
                        }

                        activity[pagingToken] = {
                            type: "trade",
                            operationID: trade.id.split('-')[0],
                            asset: queryAsset,
                            from: from,
                            to: to,
                            total_base: trade.base_amount,
                            total_usd: trade.counter_amount,
                            price_per_share: trade.price.n / trade.price.d,
                            timestamp: trade.ledger_close_time
                        };
                    }
                }

                tradesJSON = await getNextLedgerJSON(tradesJSON);

                tradeRecords = tradesJSON._embedded.records;
            }
        }
    }

    let transactionsList = Object.values(activity);

    transactionsList.sort((a, b) => {
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return [transactionsList, { 'totalTransfers': totalTransfers, 'totalTrades': totalTrades }];
}

app.use('/login', async (req, res) => {
    res.send({
        token: 'test123'
    });
});

// Create a middleware to track pending requests
// This executes after every route handler executes
// const trackRequests = (req, res, next) => {
//     const originalEnd = res.end;
//     res.end = function (...args) {
//       res.end = originalEnd;
//       res.end(...args);
//       clearTimeout(graceTimeout);
//       graceTimeout = setTimeout(() => {
//         if (!pendingRequests) {
//           // No pending requests during the grace period, stop the profiler
//           profiler.stopProfiling(profile);
//         }
//       }, gracePeriod);
//       pendingRequests--;
//     };
  
//     pendingRequests++;
//     next();
//   };

app.use(cors());
// app.use(trackRequests);

app.listen(8080, () => console.log('API is running on port 8080'));

async function getPIIFromAddresses(addresses) {
    // console.log(addresses);
    const commaSeparatedAddresses = addresses.join(',');

    var pathParams = {
    };
    // Template syntax follows url-template https://www.npmjs.com/package/url-template
    var pathTemplate = '/PII'
    var method = 'GET';
    var additionalParams = {
        headers: {
        },
        queryParams: {
            "PKs": commaSeparatedAddresses
        }
    };
    var body = {
    
    };

    try {
        const result = await apigClient.invokeApi(pathParams, pathTemplate, method, additionalParams, body);

        return result.data;
    } catch (error) {
        console.log(error);
        throw new Error("Request for PII data was unsuccessful");
    }
}

// (async () => {
//     try {
//         const piiData = await getPIIFromAddresses(['GDRM3MK6KMHSYIT4E2AG2S2LWTDBJNYXE4H72C7YTTRWOWX5ZBECFWO7', 'GD2OUJ4QKAPESM2NVGREBZTLFJYMLPCGSUHZVRMTQMF5T34UODVHPRCY']);
//     } catch (error) {
//         console.error(error.message);
//     }
// })();
