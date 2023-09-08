const DcentCLIConnector = require('dcent-cli-connector');

async function main() {
    try {
        DcentCLIConnector.initialize()
        console.log('DcentConnector.initialize')
        var response = await DcentCLIConnector.info()
        console.log('DcentConnector.info response - ', response)

        response = await DcentCLIConnector.getDeviceInfo()
        console.log('DcentConnector.getDeviceInfo response - ', response.body.parameter)

        response = await DcentCLIConnector.setLabel('IoTrust')
        console.log('DcentConnector.setLabel response - ', response)

        // const accountInfos = [
        //     {
        //         coin_group: DcentCLIConnector.coinGroup.STELLAR,
        //         coin_name: DcentCLIConnector.coinName.STELLAR,
        //         label: 'ETH-01',
        //         address_path: "m/44'/60'/0'/0/0",
        //         balance: '0 ETH',
        //     },
        // ]
        // response = await DcentCLIConnector.syncAccount(accountInfos)
        // console.log('DcentConnector.syncAccount response - ', response)

        response = await DcentCLIConnector.getAccountInfo()
        console.log('DcentConnector.getAccountInfo response - ', response)
        console.log('DcentConnector.getAccountInfo - ', response.body.parameter.account)

        const accounts = response.body.parameter.account;

        const stellarAccount = accounts.find((a) => a.coin_name == 'STELLAR');

        let keyPath = stellarAccount.address_path;

        var coinType = DcentCLIConnector.coinType.STELLAR;

        response = await DcentCLIConnector.getXPUB(keyPath);

        console.log('DcentCLIConnector.getXPUB response - ', response);

        response = await DcentCLIConnector.getAddress(coinType, keyPath);

        console.log('DcentConnector.getAddress response - ', response);

        // var transactionJson = {
        //     unsignedTx: '0a1a0a0c088dfbbc9006108885e6a90112080800100018d6c0151800120608001000180318c0843d22020878320072260a240a100a080800100018d6c01510ef8de29a030a100a080800100018f6a72810f08de29a03',
        //     path: `m/44'/3030'/0'`,
        //     symbol: 'HBAR',
        //     decimals: '8',
        // }

        // response = await DcentCLIConnector.getHederaSignedTransaction(transactionJson)
        // console.log('DcentConnector.getHederaSignedTransaction response - ', response)
        
    } catch (error) {
        console.error(error)        
    }
    DcentCLIConnector.finalize()
}

main()