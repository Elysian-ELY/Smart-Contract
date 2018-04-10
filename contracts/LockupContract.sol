pragma solidity 0.4.19;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./Ownable.sol";
import "./ElyToken.sol";
import "./SellableToken.sol";
import "./Referral.sol";


contract LockupContract is Ownable {

    ElyToken public token;
    SellableToken public ico;
    Referral public referral;

    using SafeMath for uint256;

    uint256 public lockPeriod = 2 weeks;
    uint256 public contributionLockPeriod = uint256(1 years).div(2);

    mapping (address => uint256) public lockedAmount;
    mapping (address => uint256) public lockedContributions;

    function LockupContract(
        address _token,
        address _ico,
        address _referral
    ) public {
        require(_token != address(0) && _ico != address(0) && _referral != address(0));
        token = ElyToken(_token);
        ico = SellableToken(_ico);
        referral = Referral(_referral);
    }

    function setTokenContract(address _token) public onlyOwner {
        require(_token != address(0));
        token = ElyToken(_token);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = SellableToken(_ico);
    }

    function setRefferal(address _referral) public onlyOwner {
        require(_referral != address(0));
        referral = Referral(_referral);
    }

    function setLockPeriod(uint256 _period) public onlyOwner {
        lockPeriod = _period;
    }

    function setContributionLockPeriod(uint256 _period) public onlyOwner {
        contributionLockPeriod = _period;
    }

    function log(address _address, uint256 _amount) public {
        if (msg.sender == address(referral) || msg.sender == address(token)) {
            lockedAmount[_address] = lockedAmount[_address].add(_amount);
        }
    }

    function logLargeContribution(address _address, uint256 _amount) public {
        if (msg.sender == address(ico)) {
            lockedContributions[_address] = lockedContributions[_address].add(_amount);
        }
    }

    function isTransferAllowed(address _address, uint256 _value) public view returns (bool) {
        if (ico.endTime().add(lockPeriod) < block.timestamp) {
            return checkLargeContributionsLock(_address, _value);
        }
        if (token.balanceOf(_address).sub(lockedAmount[_address]) >= _value) {
            return checkLargeContributionsLock(_address, _value);
        }

        return false;
    }

    function checkLargeContributionsLock(address _address, uint256 _value) public view returns (bool) {
        if (ico.endTime().add(contributionLockPeriod) < block.timestamp) {
            return true;
        }
        if (token.balanceOf(_address).sub(lockedContributions[_address]) >= _value) {
            return true;
        }

        return false;
    }

}