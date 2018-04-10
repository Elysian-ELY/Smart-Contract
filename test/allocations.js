var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    ICO = artifacts.require("./test/TestICO.sol"),
    DiscToken = artifacts.require("./test/TestElyToken.sol"),
    LockupContract = artifacts.require("./LockupContract.sol"),
    Allocations = artifacts.require("./test/TestAllocation.sol"),

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
    growthAddresses = web3.eth.accounts[8],
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
    const alloc = await Allocations.new(token.address, ico.address, growthAddresses);

    await ico.setLockupContract(lockup.address);

    return {token, privateico, lockup, ico, alloc};
}

contract('Allocations', function (accounts) {

    it("deploy & check claim", async function () {
        const {token, privateico, lockup, ico, alloc} = await deploy();

        await token.addMinter(alloc.address);

        await alloc.claim();

        await alloc.setTeamAddresses([accounts[1],accounts[2], accounts[3], accounts[4]]);

        await alloc.claim();

        await Utils.checkState({token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                ]
            }
        });

        await alloc.setLastReleaseTime(parseInt(new Date().getTime() / 1000 - 3600 * 24 * 31));

        await alloc.claim();

        let val = new BigNumber('100000000').mul(precision).div('100').div('4').valueOf();

        await Utils.checkState({token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[1]]: val},
                    {[accounts[2]]: val},
                    {[accounts[3]]: val},
                ]
            }
        });

    });

    it("deploy & check claim growth", async function () {
        const {token, privateico, lockup, ico, alloc} = await deploy();

        let till = parseInt(new Date().getTime() / 1000 - 3600);

        await token.addMinter(alloc.address);
        await ico.changeICODates(
            3,
            parseInt(new Date().getTime() / 1000 - 3600 * 2),
            till
        );
        await alloc.setGrowthTokensLastClaim(till);

        await alloc.claimGrowthTokens()
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed)

        await Utils.checkState({token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[4]]: new BigNumber('0').mul(precision).valueOf()},
                    {[growthAddresses]: new BigNumber('0').mul(precision).valueOf()},
                ]
            }
        });
        await alloc.claimGrowthTokens({from: growthAddresses})

        await Utils.checkState({token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[growthAddresses]: new BigNumber('50000000').mul(precision).valueOf()},
                ]
            }
        });

        await alloc.claimGrowthTokens({from: growthAddresses})

        await Utils.checkState({token, ico}, {
            token: {
                balanceOf: [
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[2]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[3]]: new BigNumber('0').mul(precision).valueOf()},
                    {[growthAddresses]: new BigNumber('50000000').mul(precision).valueOf()},
                ]
            }
        });
    });

});