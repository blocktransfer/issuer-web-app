const path = require('path');
const fs = require('fs');

const BT_ISSUER = "GDRM3MK6KMHSYIT4E2AG2S2LWTDBJNYXE4H72C7YTTRWOWX5ZBECFWO7";

const USD_ASSETS = [
    { type: "credit_alphanum4", 
      code: "USDC", 
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    },
	{ type: "credit_alphanum4", 
      code: "BTD", 
      issuer: BT_ISSUER
    },
];

const HORIZON_INST = "https://horizon.stellar.org";
const MAX_SEARCH = "limit=200";

const STREET_NAME_ACCOUNTS = [
    "GAQKSRI4E5643UUUMJT4RWCZVLY25TBNZXDME4WLRIF5IPOLTLV7N4N6" // Cede & Co.
];

const BT_API_SERVER = "https://api.blocktransfer.com";
const BT_STELLAR_TOML = "https://blocktransfer.com/.well-known/stellar.toml";

const ISSUERLINK_SERVER = "https://test-203277609.us-east-2.elb.amazonaws.com";

module.exports = { BT_ISSUER, USD_ASSETS, 
                   HORIZON_INST, MAX_SEARCH, 
                   STREET_NAME_ACCOUNTS,
                   BT_API_SERVER, BT_STELLAR_TOML, ISSUERLINK_SERVER };