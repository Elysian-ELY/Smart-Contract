var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    ICO = artifacts.require("./test/TestICO.sol"),
    DiscToken = artifacts.require("./test/TestElyToken.sol"),
    LockupContract = artifacts.require("./LockupContract.sol"),

    Utils = require("./utils"),
    BigNumber = require('BigNumber.js'),

    precision = new BigNumber("1000000000000000000"),
    usdPrecision = new BigNumber("100000"),
    icoSince = parseInt(new Date().getTime() / 1000 - 3600),
    icoTill = parseInt(new Date().getTime() / 1000) + 3600,
    signAddress = web3.eth.accounts[0],
    bountyAddress = web3.eth.accounts[5],
    compensationAddress = web3.eth.accounts[6],
    multivestAddress = web3.eth.accounts[7],
    etherHolder = web3.eth.accounts[9];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js');

async function deploy() {
    const token = await DiscToken.new(bountyAddress, false);
    const privateico = await PrivateSale.new(
        token.address, //_token
        etherHolder, //_etherHolder
        compensationAddress, //_compensationAddress
        icoSince, //_startTime
        icoTill,//_endTime
        new BigNumber('100000000').valueOf(), //_etherPriceInUSD
        new BigNumber('40000000').mul(precision).valueOf()//_maxTokenSupply
    );
    const ico = await ICO.new(
        token.address, //_token
        etherHolder, //_etherHolder
        compensationAddress, //_compensationAddress
        new BigNumber('100000000').valueOf(), //_etherPriceInUSD
        new BigNumber('150000000').mul(precision).valueOf()//_maxTokenSupply
    );

    const lockup = await LockupContract.new(token.address, ico.address, ico.address);

    await ico.setLockupContract(lockup.address);

    return {token, privateico, lockup, ico};
}

contract('ICO', function (accounts) {

    it("deploy & check constructor info & setPrivateSale & getStats", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        let preICOStats = await ico.getPreICOStats();
        assert.equal(preICOStats[0], new BigNumber('0').valueOf(), "soldTokens is not equal");
        assert.equal(preICOStats[1], new BigNumber('0').valueOf(), "collectedUSD is not equal");
        assert.equal(preICOStats[2], new BigNumber('0').valueOf(), "collectedEthers is not equal");
        assert.equal(preICOStats[3], false, "burned is not equal");

        await ico.setPrivateSale(privateico.address, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await ico.setPrivateSale(privateico.address)
            .then(Utils.receiptShouldSucceed);

        let stats = await ico.getStats.call();
        assert.equal(stats[0], new BigNumber(1526256000).valueOf(), "startTime is not equal");
        assert.equal(stats[1], new BigNumber(1527984000).valueOf(), "endTime is not equal");
        assert.equal(stats[9][0], new BigNumber('40000000').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[9][1], new BigNumber('0.06').mul(usdPrecision).valueOf(), "price is not equal");
        assert.equal(stats[9][2], new BigNumber(1525046400).valueOf(), "startTime is not equal");
        assert.equal(stats[9][3], new BigNumber(1525564800).valueOf(), "endTime is not equal");
        assert.equal(stats[9][4], new BigNumber('150000000').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[9][5], new BigNumber('0.08').mul(usdPrecision).valueOf(), "price is not equal");
        assert.equal(stats[9][6], new BigNumber(1526256000).valueOf(), "startTime is not equal");
        assert.equal(stats[9][7], new BigNumber(1526774400).valueOf(), "endTime is not equal");
        assert.equal(stats[9][8], new BigNumber('150000000').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[9][9], new BigNumber('0.10').mul(usdPrecision).valueOf(), "price is not equal");
        assert.equal(stats[9][10], new BigNumber(1526860800).valueOf(), "startTime is not equal");
        assert.equal(stats[9][11], new BigNumber(1527379200).valueOf(), "endTime is not equal");
        assert.equal(stats[9][12], new BigNumber('150000000').mul(precision).valueOf(), "maxAmount is not equal");
        assert.equal(stats[9][13], new BigNumber('0.12').mul(usdPrecision).valueOf(), "price is not equal");
        assert.equal(stats[9][14], new BigNumber(1527465600).valueOf(), "startTime is not equal");
        assert.equal(stats[9][15], new BigNumber(1527984000).valueOf(), "endTime is not equal");

    });

    it("calculateTokensAmount ", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({ico}, {
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await ico.setPrivateSale(privateico.address)
            .then(Utils.receiptShouldSucceed);

        let tokensAmount = await ico.calculateTokensAmount(new BigNumber('1').mul(precision).valueOf(), true);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('16666.666666666666666666').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('100000000').valueOf(),
            "tokensAmount is not equal"
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber('0').mul(precision).valueOf(), true);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('0').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('0').valueOf(),
            "tokensAmount is not equal"
        );
        //mininvest

        let minInvest = await ico.getMinEthersInvestment();

        tokensAmount = await ico.calculateTokensAmount(new BigNumber(minInvest).valueOf(), true);
        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('166.666666666666666666').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('1000000').valueOf(),
            "usdAmount is not equal"
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber(minInvest).sub(1).valueOf(), true);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('0').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('0').valueOf(),
            "tokensAmount is not equal"
        );

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        assert.equal(
            await ico.getActiveTier.call(),
            new BigNumber('1').valueOf(),
            "ActiveTier is not equal"
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber('1').mul(precision).valueOf(), true);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('12500').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('100000000').valueOf(),
            "tokensAmount is not equal"
        );

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            2,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber('1').mul(precision).valueOf(), true);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('10000').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('100000000').valueOf(),
            "tokensAmount is not equal"
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber('1000').mul(usdPrecision).valueOf(), false);

        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('10000').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('1').mul(precision).valueOf(),
            "EthersAmount is not equal"
        );

        tokensAmount = await ico.calculateTokensAmount(new BigNumber('10').mul(usdPrecision).valueOf(), false);
        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('100').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('0.01').mul(precision).valueOf(),
            "EthersAmount is not equal"
        );
        tokensAmount = await ico.calculateTokensAmount(new BigNumber('9').mul(usdPrecision).valueOf(), false);
        assert.equal(
            new BigNumber(tokensAmount[0]).valueOf(),
            new BigNumber('0').mul(precision).valueOf(),
            "tokensAmount is not equal"
        );
        assert.equal(
            new BigNumber(tokensAmount[1]).valueOf(),
            new BigNumber('0').mul(precision).valueOf(),
            "EthersAmount is not equal"
        );
    });

    it("check buy & transfer ethers", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        let compensationAddressBalance = await Utils.getEtherBalance(compensationAddress).valueOf();
        let ethHolderBalance = await Utils.getEtherBalance(etherHolder).valueOf();

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.updateWhitelist(accounts[3], true);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.addMinter(ico.address);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        let preICOStats = await ico.getPreICOStats();
        assert.equal(preICOStats[0], new BigNumber('16666.666666666666666666').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(preICOStats[1], new BigNumber('1000').mul(usdPrecision).valueOf(), "collectedUSD is not equal");
        assert.equal(preICOStats[2], new BigNumber('1').mul(precision).valueOf(), "collectedEthers is not equal");
        assert.equal(preICOStats[3], false, "burned is not equal");

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').add('12500').add('16666.666666666666666666').add('62.5').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('12500').add('16666.666666666666666666').mul(precision).valueOf()},
                    {[compensationAddress]: new BigNumber('62.5').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('12500').mul(precision).valueOf(),
                collectedEthers: new BigNumber('1').mul(precision).valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('1000').mul(usdPrecision).valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                    {[accounts[3]]: new BigNumber('1').mul(precision).valueOf()},
                ],
            }
        });

        await ico.testChangeSoftCap(new BigNumber('3000').mul(usdPrecision).valueOf());
        await ico.testChangeCompensationAmount(new BigNumber('2000').mul(usdPrecision).valueOf());

        await ico.sendTransaction({value: new BigNumber('2').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.transferEthers();

        console.log('compensation address balance before', new BigNumber(compensationAddressBalance).valueOf());
        console.log('compensation address balance afterr', new BigNumber( await Utils.getEtherBalance(compensationAddress).valueOf()).valueOf());
        console.log('should be', new BigNumber('2').mul(precision).valueOf());
        console.log('---------', new BigNumber( await Utils.getEtherBalance(compensationAddress).sub(compensationAddressBalance).valueOf()).valueOf());

        console.log('etherHolder address balance before', new BigNumber(ethHolderBalance).valueOf());
        console.log('etherHolder address balance afterr', new BigNumber( await Utils.getEtherBalance(etherHolder).valueOf()).valueOf());
        console.log('should be', new BigNumber('2').mul(precision).valueOf());
        console.log('---------', new BigNumber(await Utils.getEtherBalance(etherHolder).sub(ethHolderBalance).valueOf()).valueOf());

    });

    it("check refund", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);
        await token.setPrivateSale(privateico.address)
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        let acc0Balance = await Utils.getEtherBalance(accounts[0]).valueOf();
        let acc3Balance = await Utils.getEtherBalance(accounts[3]).valueOf();

        await ico.updateWhitelist(accounts[3], true);
        await ico.updateWhitelist(accounts[0], true);

        await token.addMinter(ico.address);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value: new BigNumber('2').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        assert.equal(
            await ico.isRefundPossible.call(),
            false,
            "isRefundPossible is not equal"
        );

        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            2,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            3,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        await ico.testCollectedUSD(new BigNumber('300000000000'.valueOf()));

        assert.equal(
            await ico.isRefundPossible.call(),
            false,
            "isRefundPossible is not equal"
        );

        await ico.testCollectedUSD(new BigNumber('299999999999'.valueOf()));

        assert.equal(
            await ico.isRefundPossible.call(),
            true,
            "isRefundPossible is not equal"
        );

        assert.equal(await ico.refund.call(), true, 'refund is not equal');
        assert.equal(await ico.refund.call({from: accounts[2]}), false, 'refund is not equal');
        assert.equal(await ico.refund.call({from: accounts[3]}), true, 'refund is not equal');

        let acc0Balance1 = await Utils.getEtherBalance(accounts[0]).valueOf();
        let acc3Balance1 = await Utils.getEtherBalance(accounts[3]).valueOf();

        await ico.refund();
        await ico.refund({from: accounts[3]});

        console.log('acc0 balance before transactions -', new BigNumber(acc0Balance).valueOf());
        console.log('              after transactions -', new BigNumber(acc0Balance1).valueOf());
        console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[0])).valueOf());
        console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[0]))).sub(acc0Balance1).div(precision).valueOf());

        console.log('acc3 balance before transactions -', new BigNumber(acc3Balance).valueOf());
        console.log('              after transactions -', new BigNumber(acc3Balance1).valueOf());
        console.log('              after refunddddddd -', new BigNumber(await Utils.getEtherBalance(accounts[3])).valueOf());
        console.log('                     differencee -', new BigNumber(new BigNumber(await Utils.getEtherBalance(accounts[3]))).sub(acc3Balance1).div(precision).valueOf());

    });

    it("check burn", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('0').mul(precision).valueOf(),
                collectedEthers: new BigNumber('0').valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('0').valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: false},
                    {[accounts[1]]: false},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('0').valueOf()},
                    {[accounts[1]]: new BigNumber('0').valueOf()},
                ],
            }
        });

        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);
        await token.setPrivateSale(privateico.address)
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        await ico.updateWhitelist(accounts[3], true);
        await ico.updateWhitelist(accounts[0], true);

        await token.addMinter(ico.address);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.changePreICODates(
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 + 3600)
        );

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf(), from: accounts[3]})
            .then(Utils.receiptShouldSucceed);

        await ico.sendTransaction({value: new BigNumber('1').mul(precision).valueOf()})
            .then(Utils.receiptShouldSucceed);

        await ico.changeICODates(
            1,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            2,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );
        await ico.changeICODates(
            3,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').add('16666.666666666666666666').add('12500').add('62.5').add('12500').add('62.5').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('16666.666666666666666666').add('12500').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('12500').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('150000000').mul(precision).valueOf(),
                soldTokens: new BigNumber('12500').add('12500').mul(precision).valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('2000').mul(usdPrecision).valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('1').mul(precision).valueOf()},
                ],
            }
        });

        await ico.burnUnsoldTokens({from:accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.burnUnsoldTokens();
        await ico.burnUnsoldTokens();

        let preICOStats = await ico.getPreICOStats();
        assert.equal(preICOStats[0], new BigNumber('16666.666666666666666666').mul(precision).valueOf(), "soldTokens is not equal");
        assert.equal(preICOStats[1], new BigNumber('1000').mul(usdPrecision).valueOf(), "collectedUSD is not equal");
        assert.equal(preICOStats[2], new BigNumber('1').mul(precision).valueOf(), "collectedEthers is not equal");
        assert.equal(preICOStats[3], true, "burned is not equal");

        await Utils.checkState({ico, token}, {
            token: {
                totalSupply: new BigNumber('10000000').add('16666.666666666666666666').add('12500').add('62.5').add('12500').add('62.5').add('40000000').sub('16666.666666666666666666').add('150000000').sub('12500').sub('12500').mul(precision).valueOf(),
                balanceOf: [
                    {[accounts[3]]: new BigNumber('16666.666666666666666666').add('12500').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('12500').mul(precision).valueOf()},
                ],
            },
            ico: {
                privateSale: 0x0,
                token: token.address,
                minPurchase: new BigNumber('10').mul(usdPrecision).valueOf(),
                softCap: new BigNumber('3000000').mul(usdPrecision).valueOf(),
                hardCap: new BigNumber('15000000').mul(usdPrecision).valueOf(),
                compensationAmount: new BigNumber('51000').mul(usdPrecision).valueOf(),
                maxTokenSupply: new BigNumber('12500').add('12500').mul(precision).valueOf(),
                soldTokens: new BigNumber('12500').add('12500').mul(precision).valueOf(),
                collectedEthers: new BigNumber('2').mul(precision).valueOf(),
                etherHolder: etherHolder,
                compensationAddress: compensationAddress,
                collectedUSD: new BigNumber('2000').mul(usdPrecision).valueOf(),
                etherPriceInUSD: new BigNumber('100000000').valueOf(),
                allowedMultivests: [
                    {[multivestAddress]: false},
                    {[bountyAddress]: false},
                ],
                whitelist: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                etherBalances: [
                    {[accounts[0]]: new BigNumber('1').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('1').mul(precision).valueOf()},
                ],
            }
        });
    });

});