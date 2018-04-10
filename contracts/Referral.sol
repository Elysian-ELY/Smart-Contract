pragma solidity 0.4.19;


import "./Multivest.sol";
import "./ElyToken.sol";
import "./LockupContract.sol";


contract Referral is Multivest {

    ElyToken public token;
    LockupContract public lockupContract;

    uint256 public constant DECIMALS = 18;

    uint256 public totalSupply = 10000000 * 10 ** DECIMALS;

    address public tokenHolder;

    mapping (address => bool) public claimed;

    /* constructor */
    function Referral(
        address _token,
        address _tokenHolder
    ) public Multivest() {
        require(_token != address(0) && _tokenHolder != address(0));
        token = ElyToken(_token);
        tokenHolder = _tokenHolder;
    }

    function setTokenContract(address _token) public onlyOwner {
        if (_token != address(0)) {
            token = ElyToken(_token);
        }
    }

    function setLockupContract(address _lockupContract) public onlyOwner {
        require(_lockupContract != address(0));
        lockupContract = LockupContract(_lockupContract);
    }

    function setTokenHolder(address _tokenHolder) public onlyOwner {
        if (_tokenHolder != address(0)) {
            tokenHolder = _tokenHolder;
        }
    }

    function multivestMint(
        address _address,
        uint256 _amount,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public onlyAllowedMultivests(verify(keccak256(msg.sender, _amount), _v, _r, _s)) {
        _amount = _amount.mul(10 ** DECIMALS);
        require(
            claimed[_address] == false &&
            _address == msg.sender &&
            _amount > 0 &&
            _amount <= totalSupply &&
            _amount == token.mint(_address, _amount)
        );

        totalSupply = totalSupply.sub(_amount);
        claimed[_address] = true;
        lockupContract.log(_address, _amount);
    }

    function claimUnsoldTokens() public {
        if (msg.sender == tokenHolder && totalSupply > 0) {
            require(totalSupply == token.mint(msg.sender, totalSupply));
            totalSupply = 0;
        }
    }

    function buy(address _address, uint256 value) internal returns (bool) {
        _address = _address;
        value = value;
        return true;
    }
}
