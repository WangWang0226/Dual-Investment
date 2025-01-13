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
    uint256 public strikePrice = 1e18 * 2000e6 / 1e18; // 2000 USDC per WETH
    uint256 public premium = 1e18 * 20e6 / 1e18 ; // 20 USDC per ETH
    uint256 public expiry = currentTimestamp + 2 days; // 2 day
    uint256 public maxUnits = 100e18;


    Vault public vault;
    
    MockOracle public oracle; 
    
    address public alice;
    address public bob;
    uint immutable USER_INIT_WEALTH = 120000e6;
    // Give owner 100(max units) WETH
    // Give owner 100(units) * 20(premium) * 1e6  USDC
    uint immutable OWNER_INIT_WEALTH_WETH = 100e18;
    uint immutable OWNER_INIT_WEALTH_USDC = 2000e6;

    function setUp() public {  
        
        oracle = new MockOracle(2000e6); // 1 ETH = 2000 USDC

        Factory factory = new Factory(owner);  
        vault = Vault(factory.createVault(owner));

        alice = vm.addr(1);
        bob = vm.addr(2);

        // Give alice, bob and owner enough USDC
        deal(quoteToken, alice, USER_INIT_WEALTH);
        deal(quoteToken, bob, USER_INIT_WEALTH);
        deal(baseToken, owner, OWNER_INIT_WEALTH_WETH);
        deal(quoteToken, owner, OWNER_INIT_WEALTH_USDC);

        // owner approve vault to transfer all its quoteToken and baseToken
        IERC20(quoteToken).approve(address(vault), OWNER_INIT_WEALTH_USDC);
        IERC20(baseToken).approve(address(vault), OWNER_INIT_WEALTH_WETH);
        

        vault.init(baseToken, quoteToken, address(oracle), expiry, strikePrice, premium, maxUnits);

        assertEq(IERC20(quoteToken).balanceOf(alice), USER_INIT_WEALTH);
        assertEq(IERC20(quoteToken).balanceOf(bob), USER_INIT_WEALTH);

        assertEq(IERC20(baseToken).balanceOf(address(vault)), OWNER_INIT_WEALTH_WETH);
        assertEq(IERC20(quoteToken).balanceOf(address(vault)), OWNER_INIT_WEALTH_USDC);
        
        assertEq(IERC20(baseToken).balanceOf(owner), 0);
        assertEq(IERC20(quoteToken).balanceOf(owner), 0);
    }

    function test_Deposit() public {
        // ----- Action -----
        // Alice deposit 30 units (30 ETH => 60000 USDC), premium = 20 U per unit,
        // So Alice depoists 60000 - 20 * 30 = 59400 quoteToken, owner deposits 600 quoteToken and 30 baseToken
        userDeposit(alice, 59400e6);

        // Bob deposit 60 units (60 ETH => 120000 USDC), premium = 20 U per unit,
        // So Bob deposits 120000 - 20 * 60 = 118800 quoteToken, owner deposits 1200 quoteToken and 60 baseToken
        userDeposit(bob, 118800e6);

        // ----- Expect -----
        assertEq(IERC20(quoteToken).balanceOf(alice), 60600e6); // Alice has 40600 USDC left
        assertEq(IERC20(quoteToken).balanceOf(bob), 1200e6); // Bob has 1200 USDC left
        assertEq(vault.balances(alice), 30e18);
        assertEq(vault.balances(bob), 60e18);
        assertEq(vault.totalUnits(), 90e18);
    }

    function test_DepositRevert_When_MaxUnitsExceeded() public {
        // ----- Action -----
        // Alice deposit 50 units (50 ETH = 100000 USDC), 100000 - 20 * 50 = 99000 USDC
        userDeposit(alice, 99000e6);

        // ----- Expect -----
        // Bob deposit 60 units -> 118800e6 USDC. 60 + 50 > 100, exceeded maxUnits.
        vm.startPrank(bob);
        IERC20(quoteToken).approve(address(vault), 120000e6);
        vm.expectRevert(bytes("Vault: maxUnits exceeded"));
        vault.deposit(bob, 118800e6);
        vm.stopPrank();
    }

    function test_DepositRevert_When_Expiry() public {
        // ----- Condition -----
        vm.warp(expiry + 1);

        // ----- Action & Expect -----
        vm.startPrank(alice);
        IERC20(quoteToken).approve(address(vault), 100000e6);
        vm.expectRevert(bytes("Vault: deposit period has ended"));        
        vault.deposit(alice, 59400e6);
        vm.stopPrank();
    }

    function test_Settle_When_OraclePriceOverStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units 
        userDeposit(alice, 59400e6);

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(2500e6); // oracle price(2500) is over strike price(2000)

        // ----- Action -----
        vault.settle();

        // ----- Expect -----
        assertEq(vault.state(), 2);
    }

    function test_Settle_When_OraclePriceUnderStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units 
        userDeposit(alice, 59400e6);

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(1600e6); // oracle price(1600) is lower than strike price(2000)

        // ----- Action -----
        vault.settle();

        // ----- Expect -----
        assertEq(vault.state(), 1);
    }

    function test_SettleRevert_When_NotExpired() public {
        // ----- Condition -----
        // Alice deposit 30 units 
        userDeposit(alice, 59400e6);

        // ----- Action & Expect -----
        vm.expectRevert(bytes("Vault: expiry has not passed yet"));
        vault.settle(); 
    }

    // all users withdraw first, then owner withdraw
    function test_WithdrawByOrderType1_When_OraclePriceOverStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units 
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);
        

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(2500e6); // oracle price(2500) is over strike price(2000)

        // ----- Action -----
        vault.settle();
        
        vm.prank(alice);
        vault.withdraw();
        
        vm.prank(bob);
        vault.withdraw();

        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all ETH and 800 USDC ((100-60)*20 = 800)

        // ----- Expect -----
        assertEq(IERC20(quoteToken).balanceOf(alice), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(bob), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(owner), 800e6); // 2000 - 1200 = 800
        assertEq(IERC20(baseToken).balanceOf(owner), 100e18);  // maintain unchanged
        checkAllStateReturnToZero();
    }

    // all users withdraw first, then owner withdraw
    function test_WithdrawByOrderType1_When_OraclePriceUnderStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units in 2 vault respectively.
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);
        

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(1600e6); // oracle price(1600) is lower than strike price(2000)

        // ----- Action -----
        vault.settle();
        
        vm.prank(alice);
        vault.withdraw();

        vm.prank(bob);
        vault.withdraw();

        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all USDC and 40 USDC (100 - 60 = 40)

        // ----- Expect -----
        assertEq(IERC20(baseToken).balanceOf(alice), 30e18); // 30  
        assertEq(IERC20(baseToken).balanceOf(bob), 30e18); // 30 

        assertEq(IERC20(quoteToken).balanceOf(owner), 120800e6); // 2000 - 1200 (premium for vault) + 60000*2 = 120800 
        assertEq(IERC20(baseToken).balanceOf(owner), 40e18);  // 100 - 60  = 40
        checkAllStateReturnToZero();
    }

    // user1 withdraw first, then owner withdraw, then user2 withdraw
    function test_WithdrawByOrderType2_When_OraclePriceOverStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units in 2 vault respectively.
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);
        

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(2500e6); // oracle price(2500) is over strike price(2000)

        // ----- Action -----
        vault.settle();
        
        vm.prank(alice);
        vault.withdraw();

        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all ETH and 800 USDC ((100-60)*20 = 800)

        vm.prank(bob);
        vault.withdraw();

        // ----- Expect -----
        assertEq(IERC20(quoteToken).balanceOf(alice), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(bob), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(owner), 800e6); // 2000 - 1200 = 800
        assertEq(IERC20(baseToken).balanceOf(owner), 100e18);  // maintain unchanged
        checkAllStateReturnToZero();
    }

    // user1 withdraw first, then owner withdraw, then user2 withdraw
    function test_WithdrawByOrderType2_When_OraclePriceUnderStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units in 2 vault respectively.
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(1600e6); // oracle price(1600) is lower than strike price(2000)

        // ----- Action -----
        vault.settle();
        
        vm.prank(alice);
        vault.withdraw();

        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all USDC and 40 USDC (100 - 60 = 40)

        vm.prank(bob);
        vault.withdraw();

       // ----- Expect -----
        assertEq(IERC20(baseToken).balanceOf(alice), 30e18); // 30  
        assertEq(IERC20(baseToken).balanceOf(bob), 30e18); // 30 

        assertEq(IERC20(quoteToken).balanceOf(owner), 120800e6); // 2000 - 1200 (premium for vault) + 60000*2 = 120800 
        assertEq(IERC20(baseToken).balanceOf(owner), 40e18);  // 100 - 60  = 40
        checkAllStateReturnToZero();
    }

    // owner withdraw first, then users withdraw
    function test_WithdrawByOrderType3_When_OraclePriceOverStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units in 2 vault respectively.
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(2500e6); // oracle price(2500) is over strike price(2000)

        // ----- Action -----
        vault.settle();

        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all ETH and 800 USDC ((100-60)*20 = 800)
        
        vm.prank(alice);
        vault.withdraw();

        vm.prank(bob);
        vault.withdraw();

        // ----- Expect -----
        assertEq(IERC20(quoteToken).balanceOf(alice), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(bob), 120600e6); // 120000 - 59400 + 60000 = 120600
        assertEq(IERC20(quoteToken).balanceOf(owner), 800e6); // 2000 - 1200 = 800
        assertEq(IERC20(baseToken).balanceOf(owner), 100e18);  // maintain unchanged
        checkAllStateReturnToZero();
    }

    // owner withdraw first, then users withdraw
    function test_WithdrawByOrderType3_When_OraclePriceUnderStrikePrice() public {
        // ----- Condition -----
        // Alice & Bob deposit 30 units in 2 vault respectively.
        userDeposit(alice, 59400e6);
        userDeposit(bob, 59400e6);

        vm.warp(currentTimestamp + 3 days);
        oracle.setCurrentPrice(1600e6); // oracle price(1600) is lower than strike price(2000)

        // ----- Action -----
        vault.settle();
        
        // owner withdraw
        vault.adminWithdraw(); // owner withdraw all USDC and 40 USDC (100 - 60 = 40)

        vm.prank(alice);
        vault.withdraw();

        vm.prank(bob);
        vault.withdraw();

        // ----- Expect -----
        assertEq(IERC20(baseToken).balanceOf(alice), 30e18); // 30  
        assertEq(IERC20(baseToken).balanceOf(bob), 30e18); // 30 

        assertEq(IERC20(quoteToken).balanceOf(owner), 120800e6); // 2000 - 1200 (premium for vault) + 60000*2 = 120800 
        assertEq(IERC20(baseToken).balanceOf(owner), 40e18);  // 100 - 60  = 40
        checkAllStateReturnToZero();
    }
    
    function userDeposit(address user, uint amount) private {
        vm.startPrank(user);
        IERC20(quoteToken).approve(address(vault), amount);
        vault.deposit(user, amount); 
        vm.stopPrank(); 
    }

    function checkAllStateReturnToZero() view private {
        assertEq(vault.balances(alice), 0);
        assertEq(vault.balances(bob), 0);
        assertEq(IERC20(quoteToken).balanceOf(address(vault)), 0);
        assertEq(IERC20(baseToken).balanceOf(address(vault)), 0);
        assertEq(vault.totalUnits(), 0);
    }
    
}