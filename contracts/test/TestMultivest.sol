pragma solidity ^0.4.13;

import '../Multivest.sol';

contract TestMultivest is Multivest {
    function TestMultivest(address allowedMultivest) public
    Multivest()
    {
        setAllowedMultivest(allowedMultivest);
    }

    function buy(address _address, uint256 _value) internal returns (bool) {
        _address = _address;
        _value = _value;
    }
}