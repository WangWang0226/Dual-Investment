pragma solidity ^0.8.17;

// SPDX-License-Identifier: MIT

import "./util/TransferHelper.sol";

interface IERC20 {
    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function transfer(
        address recipient,
        uint256 amount
    ) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface Oracle {
    /// @dev Returns the latest price data from the oracle.
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/// @title Vault - A smart contract for managing Dual Investment trading
/// @dev Provides functionality for option initialization, deposits, settlement, and withdrawals.
contract Vault {
    using TransferHelper for address;

    address public factory;
    address public owner; // market maker, the buyer of the option
    address public baseToken; // asset to be sold when exercising the option
    address public quoteToken; // asset in exchange for baseToken when exercising the option
    address public oracle; // oracle to get the price of baseToken
    // strikePrice is stored in wad(1e18)
    bool public isInitialized;
    uint256 public totalUnits;

    uint256 public BASE;
    uint256 public INTEREST_RATE;

    struct Position {
        uint256 id;
        uint256 investUnits;
        uint256 strikePrice;
        uint256 expiry;
        bool isActive;
    }

    mapping(address => mapping(uint256 => Position)) public userPositions;
    mapping(address => uint256[]) public userPositionIds;

    mapping(address => bool) public isAdmin;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public expiryOf;

    event Deposit(
        address indexed user,
        uint positionId,
        uint investUnits,
        uint strikePrice,
        uint expiry
    );

    event SettleAndWithdraw(address indexed user, uint positionId);

    constructor(address _owner) {
        require(_owner != address(0), "Vault: owner is zero address");
        owner = _owner;
    }

    /// @notice Initializes the vault with option parameters.
    /// @dev This function can only be called once by the owner and sets the initial parameters for the vault.
    /// @param _baseToken The address of the base token used in the vault.
    /// @param _quoteToken The address of the quote token used in the vault.
    /// @param _oracle The address of the price oracle for retrieving price data.
    /// @param _BASE The base value used for interest rate calculations.
    /// @param _INTEREST_RATE The interest rate (in terms of the base value) to be applied for settlements.
    function init(
        address _baseToken,
        address _quoteToken,
        address _oracle,
        uint256 _BASE,
        uint256 _INTEREST_RATE
    ) public onlyOwner {
        require(
            !isInitialized,
            "Vault: contract instance has already been initialized"
        );
        require(_baseToken != address(0), "Vault: baseToken is zero address");
        require(_quoteToken != address(0), "Vault: quoteToken is zero address");
        require(_oracle != address(0), "Vault: oracle is zero address");

        isInitialized = true;
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        oracle = _oracle;
        BASE = _BASE;
        INTEREST_RATE = _INTEREST_RATE;
    }

    /// @notice Allows users to deposit `quoteToken` to purchase the option.
    /// @param to The address to credit the deposit to.
    /// @param cashAmount The amount of `quoteToken` to deposit.
    /// @param expiry The expiry timestamp of this deposit.
    /// @return positionId The ID of this deposit.
    function deposit(
        address to,
        uint256 cashAmount,
        uint256 expiry
    ) external initialized returns (uint positionId) {
        require(cashAmount > 0, "Vault: Deposit amount must be greater than 0");
        require(expiry > block.timestamp, "Vault: Expiry must be in the future");

        positionId = uint256(
            keccak256(abi.encodePacked(to, block.timestamp, cashAmount))
        );

        (, int256 price, , , ) = Oracle(oracle).latestRoundData();
        uint256 strikePrice = uint256(price);

        uint256 baseTokenAmount = (cashAmount * 1e18) / (strikePrice);
        quoteToken.safeTransferFrom(to, address(this), cashAmount);

        userPositions[to][positionId] = Position({
            id: positionId,
            investUnits: baseTokenAmount,
            strikePrice: strikePrice,
            expiry: expiry,
            isActive: true
        });

        userPositionIds[to].push(positionId);

        totalUnits += baseTokenAmount;

        emit Deposit(to, positionId, baseTokenAmount, strikePrice, expiry);
    }

    /// @notice Settles an expired position and withdraws the corresponding tokens.
    /// @dev Determines the payout based on the oracle price at the time of settlement and transfers the respective tokens.
    /// @param positionId The ID of the position to settle.
    /// @return baseTokenAmount The amount of base tokens withdrawn, if applicable.
    /// @return quoteTokenAmount The amount of quote tokens withdrawn, if applicable.
    function settleAndWithdraw(
        uint256 positionId
    )
        external
        initialized
        returns (uint256 baseTokenAmount, uint256 quoteTokenAmount)
    {
        Position storage position = userPositions[msg.sender][positionId];
        require(position.isActive, "Vault: Position is not active");
        require(
            block.timestamp >= position.expiry,
            "Vault: Position has not expired yet"
        );

        uint investUnits = position.investUnits;
        uint strikePrice = position.strikePrice;

        (, int256 price, , , ) = Oracle(oracle).latestRoundData();
        uint256 oraclePrice = uint256(price);
        uint8 state = oraclePrice <= strikePrice ? 1 : 2;

        if (state == 1) {
            uint interest = (investUnits * INTEREST_RATE) / BASE;
            baseTokenAmount = investUnits + interest;
            baseToken.safeTransfer(msg.sender, baseTokenAmount);
        } else {
            uint cashAmount = (investUnits * strikePrice) / 1e18;
            uint interest = (cashAmount * INTEREST_RATE) / BASE;
            quoteTokenAmount = cashAmount + interest;
            quoteToken.safeTransfer(msg.sender, quoteTokenAmount);
        }

        totalUnits -= investUnits;
        position.isActive = false;

        emit SettleAndWithdraw(msg.sender, positionId);
    }

    /// @notice Retrieves the details of a specific position for a user.
    /// @param user The address of the user.
    /// @param positionId The ID of the position to retrieve.
    /// @return id The position ID.
    /// @return investUnits The number of base token units invested.
    /// @return strikePrice The strike price of the position.
    /// @return expiry The expiry timestamp of the position.
    /// @return isActive The active status of the position.
    function getPosition(address user, uint256 positionId)
        external
        view
        returns (
            uint256 id,
            uint256 investUnits,
            uint256 strikePrice,
            uint256 expiry,
            bool isActive
        )
    {
        Position storage position = userPositions[user][positionId];
        return (
            position.id,
            position.investUnits,
            position.strikePrice,
            position.expiry,
            position.isActive
        );
    }

    /// @notice Retrieves all positions of a specific user.
    /// @dev This function returns a list of all positions associated with a user.
    /// @param user The address of the user whose positions are being retrieved.
    /// @return positions An array of `Position` structs containing details of each position.
    function getAllPositions(
        address user
    ) external view returns (Position[] memory) {
        uint256[] storage positionIds = userPositionIds[user];
        Position[] memory positions = new Position[](positionIds.length);

        for (uint256 i = 0; i < positionIds.length; i++) {
            positions[i] = userPositions[user][positionIds[i]];
        }

        return positions;
    }

    /// @notice Allows the owner to withdraw remaining funds from the pool.
    /// @dev This function can only be called by the contract owner and only when all user positions are settled (`totalUnits` is 0).
    function withdrawRemainingFunds() external onlyOwner {
        require(totalUnits == 0, "Vault: Cannot withdraw funds while active positions exist");

        uint256 baseTokenBalance = IERC20(baseToken).balanceOf(address(this));
        uint256 quoteTokenBalance = IERC20(quoteToken).balanceOf(address(this));

        if (baseTokenBalance > 0) {
            baseToken.safeTransfer(owner, baseTokenBalance);
        }

        if (quoteTokenBalance > 0) {
            quoteToken.safeTransfer(owner, quoteTokenBalance);
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
