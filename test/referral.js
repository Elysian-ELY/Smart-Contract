var
    PrivateSale = artifacts.require("./PrivateSale.sol"),
    ICO = artifacts.require("./test/TestICO.sol"),
    DiscToken = artifacts.require("./test/TestElyToken.sol"),
    LockupContract = artifacts.require("./LockupContract.sol"),
    Referral = artifacts.require("./Referral.sol"),

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
    tokensHolder = web3.eth.accounts[8],
    etherHolder = web3.eth.accounts[9];

var abi = require('ethereumjs-abi'),
    BN = require('bn.js'),
    signAddress = multivestAddress,
    wrongSigAddress = web3.eth.accounts[5];

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
    const ref = await Referral.new(
        token.address,
        tokensHolder,
    );

    await ico.setLockupContract(lockup.address);

    return {token, privateico, lockup, ico, ref};
}

async function makeTransaction(instance, sign, address, amount) {
    'use strict';
    var h = abi.soliditySHA3(['address', 'uint256'], [new BN(address.substr(2), 16), amount]),
        sig = web3.eth.sign(sign, h.toString('hex')).slice(2),
        r = `0x${sig.slice(0, 64)}`,
        s = `0x${sig.slice(64, 128)}`,
        v = web3.toDecimal(sig.slice(128, 130)) + 27;

    var data = abi.simpleEncode('multivestMint(address,uint256,uint8,bytes32,bytes32)', address, amount, v, r, s);

    return instance.sendTransaction({from: address, data: data.toString('hex')});
}

contract('Referral', function (accounts) {

    it("deploy & multivestMint", async function () {
        const {token, privateico, lockup, ico, ref} = await deploy();

        await Utils.checkState({token, ico, ref}, {
            ref: {
                totalSupply: new BigNumber('10000000').mul(precision).valueOf()
            },
            token: {
                ico: 0x0,
                privateSale: 0x0,
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).valueOf(),
                owner: accounts[0]
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

        await token.addMinter(ref.address);
        await ref.setAllowedMultivest(signAddress);
        await ref.setLockupContract(lockup.address);

        await makeTransaction(ref, wrongSigAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await makeTransaction(ref, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldSucceed);

        await makeTransaction(ref, signAddress, accounts[1], new BigNumber('1000').valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await Utils.checkState({ico, token, ref}, {
            ref: {
                totalSupply: new BigNumber('10000000').sub('1000').mul(precision).valueOf()
            },
            token: {
                ico: 0x0,
                privateSale: 0x0,
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').add('1000').mul(precision).valueOf(),
                owner: accounts[0]
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
                    {[signAddress]: false},
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

        await ref.claimUnsoldTokens();

        await Utils.checkState({ico, token, ref}, {
            ref: {
                totalSupply: new BigNumber('10000000').sub('1000').mul(precision).valueOf()
            },
            token: {
                ico: 0x0,
                privateSale: 0x0,
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[tokensHolder]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').add('1000').mul(precision).valueOf(),
                owner: accounts[0]
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
                    {[signAddress]: false},
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

        await ref.claimUnsoldTokens({from: tokensHolder})
            .then(Utils.receiptShouldSucceed);
        await ref.claimUnsoldTokens({from: tokensHolder});

        await Utils.checkState({ico, token, ref}, {
            ref: {
                totalSupply: new BigNumber('0').mul(precision).valueOf()
            },
            token: {
                ico: 0x0,
                privateSale: 0x0,
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').mul(precision).valueOf()},
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                    {[tokensHolder]: new BigNumber('10000000').sub('1000').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').add('1000').add(new BigNumber('10000000').sub('1000')).mul(precision).valueOf(),
                owner: accounts[0]
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
                    {[signAddress]: false},
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

    });

});