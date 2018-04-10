pragma solidity 0.4.19;


import "./Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract Multivest is Ownable {

    using SafeMath for uint256;

    /* public variables */
    mapping (address => bool) public allowedMultivests;

    /* events */
    event MultivestSet(address multivest);

    event MultivestUnset(address multivest);

    event Contribution(address holder, uint256 value, uint256 tokens);

    modifier onlyAllowedMultivests(address _addresss) {
        require(allowedMultivests[_addresss] == true);
        _;
    }

    /* constructor */
    function Multivest() public {}

    function setAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = true;
        MultivestSet(_address);
    }

    function unsetAllowedMultivest(address _address) public onlyOwner {
        allowedMultivests[_address] = false;
        MultivestUnset(_address);
    }

    function multivestBuy(address _address, uint256 _value) public onlyAllowedMultivests(msg.sender) {
        require(buy(_address, _value) == true);
    }

    function multivestBuy(
        address _address,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public payable onlyAllowedMultivests(verify(keccak256(msg.sender), _v, _r, _s)) {
        require(_address == msg.sender && buy(msg.sender, msg.value) == true);
    }

    function verify(bytes32 _hash, uint8 _v, bytes32 _r, bytes32 _s) internal pure returns (address) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";

        return ecrecover(keccak256(prefix, _hash), _v, _r, _s);
    }

    function buy(address _address, uint256 _value) internal returns (bool);

}
