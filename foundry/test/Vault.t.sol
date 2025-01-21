pragma solidity ^0.8.17;

// SPDX-License-Identifier: MIT

import "forge-std/console2.sol";
import "forge-std/Test.sol";
import "../src/Vault.sol";
import "../src/util/ERC20.sol";
import "../src/util/MockOracle.sol";
import "../src/Factory.sol";

contract VaultTest is Test {

    address owner = address(this);

    address baseToken = address(new ERC20(owner, "WETH", "WETH", 18)); // WETH
    address quoteToken = address(new ERC20(owner, "USDC", "USDC", 6)); // USDC
    
    uint256 public currentTimestamp = block.timestamp; 
    uint BASE = 100;
    uint INTEREST_RATE = 20;    // Interest rate = 20 / 100 = 20%

    Vault public vault;
    
    MockOracle public oracle; 
    
    address public alice;
    address public bob;
    uint immutable USER_INIT_WEALTH = 10000e6;
    
    uint immutable OWNER_INIT_WEALTH_WETH = 10000e18;
    uint immutable OWNER_INIT_WEALTH_USDC = 2000000e6;
    uint defaultStrikePrice = 2000e6;

    function setUp() public {  
        
        oracle = new MockOracle(int256(defaultStrikePrice)); // 1 ETH = 2000 USDC

        Factory factory = new Factory(owner);  
        vault = Vault(factory.createVault(owner));

        alice = vm.addr(1);
        bob = vm.addr(2);

        // Give alice, bob and owner enough USDC
        deal(quoteToken, alice, USER_INIT_WEALTH);
        deal(quoteToken, bob, USER_INIT_WEALTH);
        deal(baseToken, owner, OWNER_INIT_WEALTH_WETH);
        deal(quoteToken, owner, OWNER_INIT_WEALTH_USDC);

        IERC20(quoteToken).transfer(address(vault), OWNER_INIT_WEALTH_USDC);
        IERC20(baseToken).transfer(address(vault), OWNER_INIT_WEALTH_WETH);

        vault.init(baseToken, quoteToken, address(oracle), BASE, INTEREST_RATE);

        assertEq(IERC20(quoteToken).balanceOf(alice), USER_INIT_WEALTH);
        assertEq(IERC20(quoteToken).balanceOf(bob), USER_INIT_WEALTH);

        assertEq(IERC20(baseToken).balanceOf(address(vault)), OWNER_INIT_WEALTH_WETH);
        assertEq(IERC20(quoteToken).balanceOf(address(vault)), OWNER_INIT_WEALTH_USDC);
        
        assertEq(IERC20(baseToken).balanceOf(owner), 0);
        assertEq(IERC20(quoteToken).balanceOf(owner), 0);
    }

    function test_Deposit() public {
        // ----- Action -----
        // Alice deposit 3 units (3 ETH = 6000 USDC)
        uint expiry = block.timestamp + 7 days;
        uint quoteAmount = 6000e6;
        uint baseAmount = quoteAmount / defaultStrikePrice * 1e18; // 6000 / 2000 = 3
        uint positionId = userDeposit(alice, quoteAmount, expiry);

        (uint256 id,
        uint256 investUnits,
        uint256 strikePrice,
        uint256 _expiry,
        bool isActive) = vault.getPosition(alice, positionId);

        // ----- Expect -----
        assertEq(IERC20(quoteToken).balanceOf(alice), 4000e6); // Alice has 4000 USDC left
        assertEq(id, positionId);
        assertEq(investUnits, baseAmount);
        assertEq(strikePrice, defaultStrikePrice);
        assertEq(_expiry, expiry);
        assertEq(isActive, true);
        assertEq(vault.totalUnits(), 3e18);
    }

    function test_DepositRevert_When_Expiry_Too_Early() public {
        // Alice deposit 3 units (3 ETH = 6000 USDC)
        uint expiry = block.timestamp - 1;
        uint quoteAmount = 6000e6;

        // ----- Action & Expect -----
        vm.startPrank(alice);
        IERC20(quoteToken).approve(address(vault), quoteAmount);
        vm.expectRevert(bytes("Vault: Expiry must be in the future"));      
        vault.deposit(alice, quoteAmount, expiry);
        vm.stopPrank();
    }

    function test_DepositRevert_When_Amount_Too_Small() public {
        // Alice deposit 3 units (3 ETH = 6000 USDC)
        uint expiry = block.timestamp + 7 days;
        uint quoteAmount = 0;

        // ----- Action & Expect -----
        vm.startPrank(alice);
        IERC20(quoteToken).approve(address(vault), quoteAmount);
        vm.expectRevert(bytes("Vault: Deposit amount must be greater than 0"));      
        vault.deposit(alice, quoteAmount, expiry);
        vm.stopPrank();
    }

    function test_Settle_When_OraclePriceOverStrikePrice() public {
        // ----- Condition -----
        // Alice deposit 3 units 
        uint expiry = block.timestamp + 7 days;
        uint quoteAmount = 6000e6;
        uint baseAmount = quoteAmount / defaultStrikePrice * 1e18; // 6000 / 2000 = 3
        uint positionId = userDeposit(alice, quoteAmount, expiry);

        vm.warp(expiry + 1);
        oracle.setCurrentPrice(2500e6); // oracle price(2500) is over strike price(2000)

        // ----- Action -----
        vm.startPrank(alice);
        (uint baseTokenAmount, uint quoteTokenAmount) = vault.settleAndWithdraw(positionId);
        vm.stopPrank();

        (uint256 id,
        uint256 investUnits,
        uint256 strikePrice,
        uint256 _expiry,
        bool isActive) = vault.getPosition(alice, positionId);

        // ----- Expect -----
        assertEq(quoteTokenAmount, 7200e6); // 3 units = 6000 U, 6000*120% = 7200 U
        assertEq(baseTokenAmount, 0); 
        assertEq(isActive, false); 
        assertEq(vault.totalUnits(), 0); 
    }

    function test_Settle_When_OraclePriceBelowStrikePrice() public {
        // ----- Condition -----
        // Alice deposit 3 units 
        uint expiry = block.timestamp + 7 days;
        uint quoteAmount = 6000e6;
        uint baseAmount = quoteAmount / defaultStrikePrice * 1e18; // 6000 / 2000 = 3
        uint positionId = userDeposit(alice, quoteAmount, expiry);

        vm.warp(expiry + 1);
        oracle.setCurrentPrice(1500e6); // oracle price(1500) is below strike price(2000)

        // ----- Action -----
        vm.startPrank(alice);
        (uint baseTokenAmount, uint quoteTokenAmount) = vault.settleAndWithdraw(positionId);
        vm.stopPrank();

        (uint256 id,
        uint256 investUnits,
        uint256 strikePrice,
        uint256 _expiry,
        bool isActive) = vault.getPosition(alice, positionId);

        // ----- Expect -----
        assertEq(quoteTokenAmount, 0); 
        assertEq(baseTokenAmount, 3.6e18); // 3 units * 120% = 3.6
        assertEq(isActive, false); 
        assertEq(vault.totalUnits(), 0); 
    }

    function test_SettleRevert_When_NotExpired() public {
        // ----- Condition -----
        // Alice deposit 30 units 
        uint positionId = userDeposit(alice, 6000e6, block.timestamp + 1);

        // ----- Action & Expect -----
        vm.expectRevert(bytes("Vault: Position has not expired yet"));
        vm.prank(alice);
        vault.settleAndWithdraw(positionId); 
    }

    function test_SettleRevert_When_Not_Active() public {
        // ----- Condition -----
        // Alice deposit 30 units 
        uint positionId = userDeposit(alice, 6000e6, block.timestamp + 1);

        vm.warp(block.timestamp + 2);
        vm.prank(alice);
        vault.settleAndWithdraw(positionId); 

        // ----- Action & Expect -----
        vm.expectRevert(bytes("Vault: Position is not active"));
        vm.prank(alice);
        vault.settleAndWithdraw(positionId); 
    }
    
    function userDeposit(address user, uint amount, uint expiry) private returns (uint positionId) {
        vm.startPrank(user);
        IERC20(quoteToken).approve(address(vault), amount);
        positionId = vault.deposit(user, amount, expiry); 
        vm.stopPrank(); 
    }
    
}