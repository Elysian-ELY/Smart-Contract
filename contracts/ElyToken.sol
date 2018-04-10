pragma solidity 0.4.19;


import "./MintingERC20.sol";
import "./SellableToken.sol";
import "./LockupContract.sol";


contract ElyToken is MintingERC20 {

    SellableToken public ico;
    SellableToken public privateSale;
    LockupContract public lockupContract;

    address public bountyAddress;

    bool public transferFrozen = true;

    modifier onlySellable() {
        require(msg.sender == address(ico) || msg.sender == address(privateSale));
        _;
    }

    function ElyToken(
        address _bountyAddress,
        bool _locked
    )
        public MintingERC20(0, maxSupply, "Elycoin", 18, "ELY", false, _locked)
    {
        require(_bountyAddress != address(0));
        bountyAddress = _bountyAddress;
        standard = "ELY 0.1";
        maxSupply = uint(1000000000).mul(uint(10) ** decimals);
        require(uint(10000000).mul(uint(10) ** decimals) == super.mint(bountyAddress, uint(10000000).mul(uint(10) ** decimals)));
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = SellableToken(_ico);
    }

    function setPrivateSale(address _privateSale) public onlyOwner {
        require(_privateSale != address(0));
        privateSale = SellableToken(_privateSale);
    }

    function setLockupContract(address _lockupContract) public onlyOwner {
        require(_lockupContract != address(0));
        lockupContract = LockupContract(_lockupContract);
    }

    function setLocked(bool _locked) public onlyOwner {
        locked = _locked;
    }

    function freezing(bool _transferFrozen) public onlyOwner {
        if (address(ico) != address(0) && !ico.isActive() && block.timestamp >= ico.startTime()) {
            transferFrozen = _transferFrozen;
        }
    }

    function mint(address _addr, uint256 _amount) public onlyMinters returns (uint256) {
        if (msg.sender == owner) {
            require(address(ico) != address(0));
            if (!ico.isActive()) {
                return super.mint(_addr, _amount);
            }
            return uint256(0);
        }
        return super.mint(_addr, _amount);
    }

    function transferAllowed(address _address, uint256 _amount) public view returns (bool) {
        return !transferFrozen && lockupContract.isTransferAllowed(_address, _amount);
    }

    function transfer(address _to, uint _value) public returns (bool) {
        require(msg.sender == bountyAddress || transferAllowed(msg.sender, _value));
        if (msg.sender == bountyAddress) {
            lockupContract.log(_to, _value);
        }
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool success) {
        require(_from == bountyAddress || transferAllowed(_from, _value));
        if (_from == bountyAddress) {
            lockupContract.log(_to, _value);
        }
        return super.transferFrom(_from, _to, _value);
    }

    function burnTokens(uint256 _amount) public onlySellable {
        if (totalSupply_.add(_amount) > maxSupply) {
            Transfer(address(this), address(0), maxSupply.sub(totalSupply_));
            totalSupply_ = maxSupply;
        } else {
            totalSupply_ = totalSupply_.add(_amount);
            Transfer(address(this), address(0), _amount);
        }
    }

    function burnInvestorTokens(address _address) public constant onlySellable returns (uint256 amount) {
        amount = balances[_address];
        balances[_address] = 0;
        Transfer(_address, address(0), amount);
    }

}
