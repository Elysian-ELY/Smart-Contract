pragma solidity 0.4.19;


import "../ICO.sol";


contract TestICO is ICO {
    function TestICO(
    address _token,
    address _etherHolder,
    address _compensationAddress,
    uint256 _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
    uint256 _maxTokenSupply
    ) public ICO(
    _token,
    _etherHolder,
    _compensationAddress,
    _etherPriceInUSD, // if price 709.38000 the  value has to be 70938000
    _maxTokenSupply
    ) {

    }

    function getPreICOStats() public view returns (
    uint256,
    uint256,
    uint256,
    bool
    ) {
        return (
        preICOStats.soldTokens,
        preICOStats.collectedUSD,
        preICOStats.collectedEthers,
        preICOStats.burned
        );
    }

    function testCollectedUSD(uint256 _val) public {
        collectedUSD = _val;
    }

    function testChangeSoftCap(uint256 _val) public {
        softCap = _val;
    }

    function testChangeCompensationAmount(uint256 _val) public {
        compensationAmount = _val;
    }


    //    function() public payable {
    //        require(buy(msg.sender, msg.value) == true);
    //    }

    //    function testChangeICOPeriod(uint256 _start, uint256 _end) public {
    //        startTime = _start;
    //        endTime = _end;
    //    }

    //    function testChangeSoldTokens(uint256 _sold) public {
    //        soldTokens = _sold;
    //    }
    //
    //    function testCalculateTokensAmount(uint256 _value, uint256 _soldTokens) public returns (uint256) {
    //        soldTokens = _soldTokens;
    //
    //        return calculateTokensAmount(_value);
    //    }
    //
    //    function testCalculateEthersAmount(uint256 _value, uint256 _soldTokens) public returns (uint256) {
    //        soldTokens = _soldTokens;
    //
    //        return calculateEthersAmount(_value);
    //    }

}
