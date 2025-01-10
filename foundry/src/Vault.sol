pragma solidity ^0.8.17;

// SPDX-License-Identifier: MIT

import "./util/TransferHelper.sol";


interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface Oracle {
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

contract Vault {
    using TransferHelper for address;

    address public factory;
    address public owner; // market maker, the buyer of the option
    address public baseToken; // asset to be sold when exercising the option
    address public quoteToken; // asset in exchange for baseToken when exercising the option
    address public oracle; // oracle to get the price of baseToken
    uint256 public expiry;
    uint256 public strikePrice; // quoteToken per baseToken
    uint256 public premium; // amount of quoteToken per unit the owner is willing to pay
                         // strikePrice and premium is stored in wad(1e18)
                         // eg. if premium is 20 USDC per ETH, it should be 1e18 * 20e6 / 1e18 
    uint256 public maxUnits; // maxUnits is stored in the same decimals as baseToken
    uint256 public totalUnits;
    uint8 public state; // 0: ongoing, 1: exercised(user gets baseToken), 2: not exercised(user gets quoteToken)
    uint256 public finalTotalUnits;
    bool public isInitialized;

    mapping (address => bool) public isAdmin;
    mapping (address => uint256) public balances;

    event Deposit(address indexed user, uint256 cashAmount);
    event ExerciseOption();
    event AdjustOption(uint256 premium, uint256 maxUnits);
    event Withdraw(address indexed user, uint256 baseTokenAmount, uint256 quoteTokenAmount);

    constructor(address _owner) {
        require(_owner != address(0), "Vault: owner is zero address");
        owner = _owner;
    }

    function init(
        address _baseToken,
        address _quoteToken,
        address _oracle,
        uint256 _expiry,
        uint256 _strikePrice,
        uint256 _premium,
        uint256 _maxUnits
    ) external onlyOwner {
        require(!isInitialized, "Vault: contract instance has already been initialized");
        require(_baseToken != address(0), "Vault: baseToken is zero address");
        require(_quoteToken != address(0), "Vault: quoteToken is zero address");
        require(_oracle != address(0), "Vault: oracle is zero address");
        require(_expiry > block.timestamp, "Vault: wrong expiry");
        require(_premium > 0 && _premium < _strikePrice, "Vault: invalid premium");
        require(_maxUnits > 0, "Vault: maxUnits is zero");

        isInitialized = true;
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        oracle = _oracle;
        expiry = _expiry;
        strikePrice = _strikePrice;
        premium = _premium;
        maxUnits = _maxUnits;

        // market maker have to deposit enough quoteToken and baseToken for maxUnits
        uint baseTokenAmt = _maxUnits;
        uint quoteTokenAmt = _maxUnits * premium / 1e18;
        quoteToken.safeTransferFrom(owner, address(this), quoteTokenAmt);
        baseToken.safeTransferFrom(owner, address(this), baseTokenAmt);
    }

    // cashAmount is denoted in quoteToken
    function deposit(address to, uint256 cashAmount) external initialized {
        require(block.timestamp <= expiry, "Vault: deposit period has ended");
        uint256 baseTokenAmount = cashAmount * 1e18 / (strikePrice - premium);
        require(totalUnits + baseTokenAmount <= maxUnits, "Vault: maxUnits exceeded");
        quoteToken.safeTransferFrom(msg.sender, address(this), cashAmount);
        balances[to] += baseTokenAmount;
        totalUnits += baseTokenAmount;
        emit Deposit(to, cashAmount);
    }

    function settle() public initialized returns (uint256) {
        require(state == 0, "Vault: settled already");
        require(block.timestamp >= expiry, "Vault: expiry has not passed yet");
        (,int256 price,,,) = Oracle(oracle).latestRoundData();
        uint256 oraclePrice = uint256(price);
        state = oraclePrice <= strikePrice ? 1 : 2;
        finalTotalUnits = totalUnits;
        return state;
    }

    function withdraw() external initialized returns (uint256 baseTokenAmount, uint256 quoteTokenAmount) {
        if(state == 0) settle();

        baseTokenAmount = balances[msg.sender];

        if(state == 1) {
            baseToken.safeTransfer(msg.sender, baseTokenAmount);
        }
        else {
            quoteTokenAmount = baseTokenAmount * strikePrice / 1e18;
            quoteToken.safeTransfer(msg.sender, quoteTokenAmount);
        }

        balances[msg.sender] = 0;
        totalUnits -= baseTokenAmount;

        emit Withdraw(msg.sender, baseTokenAmount, quoteTokenAmount);
    }

    function adminWithdraw() external onlyOwner initialized {
        if(state == 0) settle();

        if(state == 1) {
            quoteToken.safeTransfer(msg.sender, IERC20(quoteToken).balanceOf(address(this)));
            if (finalTotalUnits < maxUnits) {
                uint adminOwn = maxUnits - finalTotalUnits;
                baseToken.safeTransfer(msg.sender, adminOwn);
            }
        }
        else {
            baseToken.safeTransfer(msg.sender, IERC20(baseToken).balanceOf(address(this)));
            if (finalTotalUnits < maxUnits) {
                uint adminOwn = premium * (maxUnits - finalTotalUnits) / 1e18;
                quoteToken.safeTransfer(msg.sender, adminOwn);
            }
        }
    }

    modifier initialized() {
        require(isInitialized, "Contract instance has not been initialized");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Vault: caller is not the owner");
        _;
    }
}