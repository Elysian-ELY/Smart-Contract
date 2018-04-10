pragma solidity 0.4.19;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "./ElyToken.sol";
import "./ICO.sol";
import "./Ownable.sol";


contract ElyAllocation is Ownable {

    ElyToken public token;
    ICO public ico;

    using SafeMath for uint256;

    uint256 public constant DECIMALS = 18;

    uint256 public remainingTeamTokens = uint256(100000000).mul(uint(10) ** uint(DECIMALS));

    uint256 public remainingGrowthTokens = uint256(350000000).mul(uint(10) ** uint(DECIMALS));

    address public growthTokensAddress;

    uint256 public lastReleaseTime;
    uint256 public growthTokensLastClaim;

    address[] public team;

    function ElyAllocation(
        address _token,
        address _ico,
        address _growthTokensAddress
    ) public {
        require(_token != address(0) && _ico != address(0) && _growthTokensAddress != address(0));
        token = ElyToken(_token);
        ico = ICO(_ico);
        lastReleaseTime = ico.endTime().add(1 days);
        growthTokensLastClaim = ico.endTime();
        growthTokensAddress = _growthTokensAddress;
    }

    function setTokenContract(address _token) public onlyOwner {
        require(_token != address(0));
        token = ElyToken(_token);
    }

    function setICO(address _ico) public onlyOwner {
        require(_ico != address(0));
        ico = ICO(_ico);
    }

    function setTeamAddresses(address[] _team) public onlyOwner {
        if (_team.length == 0) {
            return;
        }
        for (uint256 i = 0; i < _team.length; i++) {
            if (_team[i] == address(0)) {
                return;
            }
        }
        team = _team;
    }

    function claimGrowthTokens() public {
        if (growthTokensLastClaim > ico.endTime() && growthTokensLastClaim.add(1 years) > block.timestamp) {
            return;
        }

        uint256 amount = uint256(50000000).mul(uint(10) ** uint(DECIMALS));

        require(
            remainingGrowthTokens >= amount &&
            msg.sender == growthTokensAddress &&
            amount == token.mint(msg.sender, amount)
        );
        remainingGrowthTokens = remainingGrowthTokens.sub(amount);
        growthTokensLastClaim = growthTokensLastClaim.add(1 years);
    }

    function claim() public {
        if (team.length == 0 || lastReleaseTime.add(30 days) > block.timestamp) {
            return;
        }

        uint256 totalAmount = remainingTeamTokens.div(100);
        uint256 amount = totalAmount.div(team.length);

        if (totalAmount == 0 || amount == 0) {
            return;
        }

        for (uint256 i = 0; i < team.length; i++) {
            require(amount == token.mint(team[i], amount));
        }

        lastReleaseTime = lastReleaseTime.add(30 days);
        remainingTeamTokens = remainingTeamTokens.sub(totalAmount);
    }

}