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
        new BigNumber('119493000').valueOf(), //_etherPriceInUSD
        new BigNumber('40000000').mul(precision).valueOf()//_maxTokenSupply
    );
    const ico = await ICO.new(
        token.address, //_token
        etherHolder, //_etherHolder
        compensationAddress, //_compensationAddress
        new BigNumber('119493000').valueOf(), //_etherPriceInUSD
        new BigNumber('150000000').mul(precision).valueOf()//_maxTokenSupply
    );

    const lockup = await LockupContract.new(token.address, ico.address, ico.address);

    return {token, privateico, lockup, ico};
}

contract('Token', function (accounts) {

    it("deploy & check constructor info & check: setICO setPrivateSale setLockupContract setPrivateSale, SetLocked with transfers", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({token, privateico}, {
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
            }
        });

        //setICO
        await token.setICO(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setICO(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setICO(accounts[2])
            .then(Utils.receiptShouldSucceed);
        //setPrivateSale
        await token.setPrivateSale(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setPrivateSale(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setPrivateSale(accounts[2])
            .then(Utils.receiptShouldSucceed);
        //setLockupContract
        await token.setLockupContract(accounts[2], {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setLockupContract(0x0)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.setLockupContract(accounts[2])
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({token}, {
            token: {
                ico: accounts[2],
                privateSale: accounts[2],
                lockupContract: accounts[2],
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
            }
        });

        await token.testSetFreezing(false);
        await token.addMinter(accounts[3]);
        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));

        //SetLocked with transfers
        await token.setLocked(true, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        assert.equal(await token.locked.call(), false, 'locked is not equal')
        await token.setLocked(true)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await token.locked.call(), true, 'locked is not equal')

        await Utils.checkState({token}, {
            token: {
                ico: accounts[2],
                privateSale: accounts[2],
                lockupContract: accounts[2],
                bountyAddress: bountyAddress,
                transferFrozen: false,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: true,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').mul(1).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.approve(accounts[1], 500);

        await token.transferFrom.call(accounts[0], accounts[1], 500, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.setLocked(false)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await token.locked.call(), false, 'locked is not equal');
        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
                privateSale: accounts[2],
                lockupContract: accounts[2],
                bountyAddress: bountyAddress,
                transferFrozen: false,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

        await token.setLockupContract(lockup.address);

        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldSucceed);
        await token.approve(accounts[1], 500);
        await token.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]});

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
                privateSale: accounts[2],
                lockupContract: lockup.address,
                bountyAddress: bountyAddress,
                transferFrozen: false,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').valueOf()},
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

    });

    it("deploy & freezing with transfers", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await Utils.checkState({token, privateico}, {
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
            }
        });

        await token.addMinter(accounts[3]);

        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));

        await Utils.checkState({token}, {
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
                    {[accounts[0]]: new BigNumber('1000').mul(1).valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

        await token.freezing(false, {from: accounts[1]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        assert.equal(await token.transferFrozen.call(), true, 'transferFrozen is not equal');
        await token.freezing(false);
        assert.equal(await token.transferFrozen.call(), true, 'transferFrozen is not equal');

        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);
        await token.approve(accounts[1], 500);
        await token.transferFrom.call(accounts[0], accounts[1], 500, {from: accounts[0]})
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await ico.changeICODates(1, parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));
        await ico.changeICODates(3, parseInt(new Date().getTime() / 1000 - 7200), parseInt(new Date().getTime() / 1000 - 3600));
        await token.setICO(ico.address)
            .then(Utils.receiptShouldSucceed);
        await token.setLockupContract(lockup.address)
            .then(Utils.receiptShouldSucceed);
        assert.equal(await ico.isActive.call().valueOf(), false, "ico.isActive().valueOf() not equal");
        await token.freezing(false);
        assert.equal(await token.transferFrozen.call(), false, 'transferFrozen is not equal');

        await token.transfer(accounts[1], 500)
            .then(Utils.receiptShouldSucceed);
        await token.approve(accounts[1], 500);
        await token.transferFrom(accounts[0], accounts[1], 500, {from: accounts[1]})
            .then(Utils.receiptShouldSucceed);

        await Utils.checkState({token}, {
            token: {
                ico: ico.address,
                privateSale: 0x0,
                lockupContract: lockup.address,
                bountyAddress: bountyAddress,
                transferFrozen: false,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[1]]: new BigNumber('1000').mul(1).valueOf()},
                    {[accounts[0]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

    });

    it("check burns", async function () {
        const {token, privateico, lockup, ico} = await deploy();

        await token.setICO(accounts[4])
            .then(Utils.receiptShouldSucceed);
        await token.setPrivateSale(accounts[8])
            .then(Utils.receiptShouldSucceed);

        await token.addMinter(accounts[3]);

        await token.mint(accounts[0], 1000, {from: accounts[3]})
            .then(() => Utils.balanceShouldEqualTo(token, accounts[0], 1000));

        await Utils.checkState({token, privateico}, {
            token: {
                ico: accounts[4],
                privateSale: accounts[8],
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1000').valueOf(),
                owner: accounts[0]
            }
        });

        await token.burnTokens(new BigNumber(10).mul(precision).valueOf())
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        await token.burnInvestorTokens(accounts[0])
            .then(Utils.receiptShouldFailed)
            .catch(Utils.catchReceiptShouldFailed);

        let burnedAmount = await token.burnInvestorTokens(accounts[0], {from: accounts[4]});
        assert.equal(new BigNumber(burnedAmount).valueOf(), new BigNumber('1000').valueOf(), 'burnedAmount is not equal');

        await token.burnTokens(new BigNumber('10').valueOf(), {from: accounts[8]});

        await Utils.checkState({token, privateico}, {
            token: {
                ico: accounts[4],
                privateSale: accounts[8],
                lockupContract: 0x0,
                bountyAddress: bountyAddress,
                transferFrozen: true,
                standard: 'ELY 0.1',
                maxSupply: new BigNumber('1000000000').mul(precision).valueOf(),
                minters: [
                    {[accounts[0]]: true},
                    {[accounts[1]]: false},
                    {[accounts[3]]: true},
                ],
                decimals: 18,
                name: 'Elycoin',
                symbol: 'ELY',
                locked: false,
                balanceOf: [
                    {[accounts[0]]: new BigNumber('1000').valueOf()},
                    {[accounts[1]]: new BigNumber('0').mul(precision).valueOf()},
                ],
                totalSupply: new BigNumber('10000000').mul(precision).add('1010').valueOf(),
                owner: accounts[0]
            }
        });
    });
});