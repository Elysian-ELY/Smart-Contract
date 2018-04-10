pragma solidity 0.4.19;


import "../ElyAllocation.sol";


contract TestAllocation is ElyAllocation {

    function TestAllocation(
        address _token,
        address _ico,
        address _growthTokensAddress
    ) public ElyAllocation(
        _token,
        _ico,
        _growthTokensAddress
    ) {}

    function setLastReleaseTime(uint256 _val) public {
        lastReleaseTime = _val;
    }

    function setGrowthTokensLastClaim(uint256 _val) public {
        growthTokensLastClaim = _val;
    }

}