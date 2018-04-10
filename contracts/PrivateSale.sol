pragma solidity 0.4.19;


import "./SellableToken.sol";


contract PrivateSale is SellableToken {

    uint256 public price = 4000;//0.04 cents * 10 ^ 5

    function PrivateSale(
        address _token,
        address _etherHolder,
        address _compensationAddress,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
        uint256 _maxTokenSupply
    ) public SellableToken(
        _token,
        _etherHolder,
        _compensationAddress,
        _etherPriceInUSD,
        _maxTokenSupply
    ) {
        require(_startTime > 0 && _endTime > _startTime);
        startTime = _startTime;
        endTime = _endTime;
    }

    function burnUnsoldTokens() public onlyOwner {
        if (block.timestamp >= endTime && maxTokenSupply > soldTokens) {
            token.burnTokens(maxTokenSupply.sub(soldTokens));
            maxTokenSupply = soldTokens;
        }
    }

    function calculateTokensAmount(uint256 _value) public view returns (uint256 tokenAmount, uint256 usdAmount) {
        if (_value == 0) {
            return (0, 0);
        }

        usdAmount = _value.mul(etherPriceInUSD);
        tokenAmount = usdAmount.div(price);

        if (usdAmount < minPurchase.mul(1 ether)) {
            return (0, 0);
        }
        usdAmount = usdAmount.div(1 ether);
    }

    function calculateEthersAmount(uint256 _amount) public view returns (uint256 ethersAmount) {
        if (_amount == 0 || _amount.mul(price) < minPurchase) {
            return 0;
        }

        ethersAmount = _amount.mul(price).div(etherPriceInUSD);
    }

    function getMinEthersInvestment() public view returns (uint256) {
        return uint256(1 ether).mul(minPurchase).div(etherPriceInUSD);
    }

    function getStats() public view returns (
        uint256 start,
        uint256 end,
        uint256 sold,
        uint256 maxSupply,
        uint256 min,
        uint256 soft,
        uint256 hard,
        uint256 priceAmount,
        uint256 tokensPerEth
    ) {
        start = startTime;
        end = endTime;
        sold = soldTokens;
        maxSupply = maxTokenSupply;
        min = minPurchase;
        soft = softCap;
        hard = hardCap;
        priceAmount = price;
        uint256 usd;
        (tokensPerEth, usd) = calculateTokensAmount(1 ether);
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        if (_value == 0) {
            return false;
        }
        require(_address != address(0) && withinPeriod());

        uint256 tokenAmount;
        uint256 usdAmount;

        (tokenAmount, usdAmount) = calculateTokensAmount(_value);

        uint256 mintedAmount = token.mint(_address, tokenAmount);
        soldTokens = soldTokens.add(tokenAmount);
        require(mintedAmount == tokenAmount && maxTokenSupply >= soldTokens && usdAmount > 0 && mintedAmount > 0);

        collectedEthers = collectedEthers.add(_value);
        collectedUSD = collectedUSD.add(usdAmount);

        Contribution(_address, _value, tokenAmount);

        etherHolder.transfer(this.balance);
        return true;
    }

}
