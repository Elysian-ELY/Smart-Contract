pragma solidity 0.4.19;

import "./SellableToken.sol";
import "./LockupContract.sol";


contract ICO is SellableToken {

    SellableToken public privateSale;
    LockupContract public lockupContract;

    uint8 public constant PRE_ICO_TIER = 0;
    uint8 public constant ICO_TIER_FIRST = 1;
    uint8 public constant ICO_TIER_TWO = 2;
    uint8 public constant ICO_TIER_LAST = 3;

    Stats public preICOStats;

    uint256 public lockupThreshold = 10000000000;

    struct Stats {
        uint256 soldTokens;
        uint256 collectedUSD;
        uint256 collectedEthers;
        bool burned;
    }

    function ICO(
        address _token,
        address _etherHolder,
        address _compensationAddress,
        uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        uint256 _maxTokenSupply
    ) public SellableToken(
        _token,
        _etherHolder,
        _compensationAddress,
        _etherPriceInUSD,
        _maxTokenSupply
    ) {
        tiers.push(
            Tier(
                uint256(40000000).mul(uint256(10) ** DECIMALS),
                uint256(6000),
                1525046400,
                1525564800
            )
        );//@ 0,06 USD PreICO
        tiers.push(
            Tier(
                uint256(150000000).mul(uint256(10) ** DECIMALS),
                uint256(8000),
                1526256000,
                1526774400
            )
        );//@ 0,08 USD
        tiers.push(
            Tier(
                uint256(150000000).mul(uint256(10) ** DECIMALS),
                uint256(10000),
                1526860800,
                1527379200
            )
        );//@ 0,10 USD
        tiers.push(
            Tier(
                uint256(150000000).mul(uint256(10) ** DECIMALS),
                uint256(12000),
                1527465600,
                1527984000
            )
        );//@ 0,12 USD

        startTime = 1526256000;
        endTime = 1527984000;
    }

    function setPrivateSale(address _privateSale) public onlyOwner {
        if (_privateSale != address(0)) {
            privateSale = SellableToken(_privateSale);
        }
    }

    function setLockupContract(address _lockupContract) public onlyOwner {
        require(_lockupContract != address(0));
        lockupContract = LockupContract(_lockupContract);
    }

    function changePreICODates(uint256 _start, uint256 _end) public onlyOwner {
        if (_start != 0 && _start < _end) {
            Tier storage preICOTier = tiers[PRE_ICO_TIER];
            preICOTier.startTime = _start;
            preICOTier.endTime = _end;
        }
    }

    function changeICODates(uint8 _tierId, uint256 _start, uint256 _end) public onlyOwner {
        if (_start != 0 && _start < _end && _tierId < tiers.length) {
            Tier storage icoTier = tiers[_tierId];
            icoTier.startTime = _start;
            icoTier.endTime = _end;
            if (_tierId == ICO_TIER_FIRST) {
                startTime = _start;
            } else if (_tierId == ICO_TIER_LAST) {
                endTime = _end;
            }
        }
    }

    function burnUnsoldTokens() public onlyOwner {
        if (block.timestamp >= tiers[PRE_ICO_TIER].endTime && preICOStats.burned == false) {
            token.burnTokens(tiers[PRE_ICO_TIER].maxAmount.sub(preICOStats.soldTokens));
            preICOStats.burned = true;
        }
        if (block.timestamp >= endTime && maxTokenSupply > soldTokens) {
            token.burnTokens(maxTokenSupply.sub(soldTokens));
            maxTokenSupply = soldTokens;
        }
    }

    function transferEthers() public onlyOwner {
        super.transferEthersInternal();
    }

    function transferCompensationEthers() public {
        if (msg.sender == compensationAddress) {
            super.transferEthersInternal();
        }
    }

    function getActiveTier() public view returns (uint8) {
        for (uint8 i = 0; i < tiers.length; i++) {
            if (block.timestamp >= tiers[i].startTime && block.timestamp <= tiers[i].endTime) {
                return i;
            }
        }

        return uint8(tiers.length);
    }

    function calculateTokensAmount(uint256 _value, bool _isEther) public view returns (
        uint256 tokenAmount,
        uint256 currencyAmount
    ) {
        if (_value == 0) {
            return (0, 0);
        }
        uint8 activeTier = getActiveTier();

        if (activeTier == tiers.length) {
            if (endTime < block.timestamp) {
                return (0, 0);
            }
            if (startTime > block.timestamp) {
                activeTier = PRE_ICO_TIER;
            }
        }

        if (_isEther) {
            currencyAmount = _value.mul(etherPriceInUSD);
            tokenAmount = currencyAmount.div(tiers[activeTier].price);
            if (currencyAmount < minPurchase.mul(1 ether)) {
                return (0, 0);
            }
            currencyAmount = currencyAmount.div(1 ether);
        } else {
            if (_value < minPurchase) {
                return (0, 0);
            }
            currencyAmount = uint256(1 ether).mul(_value).div(etherPriceInUSD);
            tokenAmount = _value.mul(uint256(10) ** DECIMALS).div(tiers[activeTier].price);
        }
    }

    function calculateEthersAmount(uint256 _amount) public view returns (uint256 ethersAmount) {
        uint8 activeTier = getActiveTier();

        if (activeTier == tiers.length) {
            if (endTime < block.timestamp) {
                return 0;
            }
            if (startTime > block.timestamp) {
                activeTier = PRE_ICO_TIER;
            }
        }

        if (_amount == 0 || _amount.mul(tiers[activeTier].price) < minPurchase) {
            return 0;
        }

        ethersAmount = _amount.mul(tiers[activeTier].price).div(etherPriceInUSD);
    }

    function getMinEthersInvestment() public view returns (uint256) {
        return uint256(1 ether).mul(minPurchase).div(etherPriceInUSD);
    }

    function getStats() public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 totalSoldTokens,
        uint256 maxSupply,
        uint256 min,
        uint256 soft,
        uint256 hard,
        uint256 tokensPerEth,
        uint256[16] tiersData
    ) {
        start = startTime;
        end = endTime;
        sold = soldTokens;
        totalSoldTokens = soldTokens.add(preICOStats.soldTokens);
        if (address(privateSale) != address(0)) {
            totalSoldTokens = totalSoldTokens.add(privateSale.soldTokens());
        }
        maxSupply = maxTokenSupply;
        min = minPurchase;
        soft = softCap;
        hard = hardCap;
        uint256 usd;
        (tokensPerEth, usd) = calculateTokensAmount(1 ether, true);
        uint256 j = 0;
        for (uint256 i = 0; i < tiers.length; i++) {
            tiersData[j++] = uint256(tiers[i].maxAmount);
            tiersData[j++] = uint256(tiers[i].price);
            tiersData[j++] = uint256(tiers[i].startTime);
            tiersData[j++] = uint256(tiers[i].endTime);
        }
    }

    function isRefundPossible() public view returns (bool) {
        if (getActiveTier() != tiers.length || block.timestamp < startTime || collectedUSD >= softCap) {
            return false;
        }
        return true;
    }

    function refund() public returns (bool) {
        if (!isRefundPossible() || etherBalances[msg.sender] == 0) {
            return false;
        }

        msg.sender.transfer(etherBalances[msg.sender]);
        uint256 burnedAmount = token.burnInvestorTokens(msg.sender);
        if (burnedAmount == 0) {
            return false;
        }

        Refund(msg.sender, etherBalances[msg.sender], burnedAmount);
        etherBalances[msg.sender] = 0;

        return true;
    }

    function mintPreICO(address _address, uint256 _tokenAmount, uint256 _ethAmount, uint256 _usdAmount) internal returns (uint256) {
        uint256 mintedAmount = token.mint(_address, _tokenAmount);

        require(mintedAmount == _tokenAmount);

        preICOStats.soldTokens = preICOStats.soldTokens.add(_tokenAmount);
        preICOStats.collectedEthers = preICOStats.collectedEthers.add(_ethAmount);
        preICOStats.collectedUSD = preICOStats.collectedUSD.add(_usdAmount);

        require(tiers[PRE_ICO_TIER].maxAmount >= preICOStats.soldTokens);

        if (preICOStats.collectedUSD <= compensationAmount) {
            compensatedAmount = compensatedAmount.add(_usdAmount);
            compensationAddress.transfer(this.balance);
        }

        return _tokenAmount;
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0 || _address == address(0)) {
            return false;
        }
        uint8 activeTier = getActiveTier();
        if (activeTier == tiers.length) {
            return false;
        }

        uint256 tokenAmount;
        uint256 usdAmount;
        uint256 mintedAmount;

        (tokenAmount, usdAmount) = calculateTokensAmount(_value, true);

        if (usdAmount >= lockupThreshold) {
            lockupContract.logLargeContribution(_address, tokenAmount);
        }

        if (activeTier == PRE_ICO_TIER) {
            mintedAmount = mintPreICO(_address, tokenAmount, _value, usdAmount);
            require(usdAmount > 0 && mintedAmount > 0);
        } else {
            mintedAmount = mintInternal(_address, tokenAmount);

            collectedEthers = collectedEthers.add(_value);
            collectedUSD = collectedUSD.add(usdAmount);

            require(hardCap >= collectedUSD && usdAmount > 0 && mintedAmount > 0);

            etherBalances[_address] = etherBalances[_address].add(_value);
        }

        Contribution(_address, _value, tokenAmount);

        return true;
    }

}
