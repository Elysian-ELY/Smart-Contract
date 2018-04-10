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

    const lockup = await LockupContract.new(token.address, ico.address, privateico.address);

    await ico.setLockupContract(lockup.address);

    return {token, privateico, lockup, ico};
}

contract('Lockup', function (accounts) {

    it("check", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await lockup.setRefferal(accounts[0]);
        await token.addMinter(accounts[3]);
        await token.mint(accounts[1], new BigNumber('100').mul(precision).valueOf(), {from: accounts[3]});

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            true,
            "isTransferAllowed is not equal"
        );

        await lockup.log(accounts[1], new BigNumber('10').mul(precision).valueOf());
        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            false,
            "isTransferAllowed is not equal"
        );

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('90').mul(precision).valueOf()),
            true,
            "isTransferAllowed is not equal"
        );

        await ico.changeICODates(
            3,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            parseInt(new Date().getTime() / 1000 - 3600)
        );

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            false,
            "isTransferAllowed is not equal"
        );

        let since = parseInt(new Date().getTime() / 1000) - 3600 * 24 * 16;

        await ico.changeICODates(
            3,
            since,
            since + 3600 * 24
        );

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            true,
            "isTransferAllowed is not equal"
        );

        await lockup.setICO(accounts[0]);
        await lockup.logLargeContribution(accounts[1], new BigNumber('50').mul(precision).valueOf());
        await lockup.setICO(ico.address);

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            false,
            "isTransferAllowed is not equal"
        );

        await ico.changeICODates(
            3,
            since - 15778476 - 3600,
            since - 15778476
        );

        assert.equal(
            await lockup.isTransferAllowed.call(accounts[1], new BigNumber('100').mul(precision).valueOf()),
            true,
            "isTransferAllowed is not equal"
        );
    });

});