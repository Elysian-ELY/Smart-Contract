pragma solidity ^0.4.18;

import "../ElyToken.sol";

contract TestElyToken is ElyToken {
    function TestElyToken(
        address _bountyAddress,
        bool _locked
    ) public ElyToken(_bountyAddress, _locked)
    { }

    function testSetFreezing(bool _isFrozen) public {
        transferFrozen = _isFrozen;
    }

}
