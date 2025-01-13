pragma solidity 0.8.17;

// SPDX-License-Identifier: MIT

import "forge-std/Test.sol";
import "../src/Vault.sol";
import "../src/Factory.sol";
import "../src/util/Faucet.sol";
import "../src/util/ERC20.sol";
import "../src/util/MockOracle.sol";

import "forge-std/Script.sol";


contract Deploy is Script {
    address public faucet;
    address public baseToken;
    address public quoteToken;
    address public factory;
    address public oracle; 

    uint256 timestamp = block.timestamp;
    uint256 strikePrice = 1e18 * 2000e6 / 1e18; // 2000 USDC per WETH
    uint256 premium = 1e18 * 20e6 / 1e18 ; // 20 USDC per ETH
    uint256 expiry = timestamp + 1 days; // 1 day
    uint256 maxUnits = 100 * 1e18;

    uint immutable OWNER_INIT_WEALTH_WETH = 100000e18;
    uint immutable OWNER_INIT_WEALTH_USDC = 200000000e6;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        baseToken = address(new ERC20(deployer, "WETHL", "WETHL", 18));
        quoteToken = address(new ERC20(deployer, "USDL", "USDCL", 6));
    
        oracle = address(new MockOracle(2000e6)); // 1 ETH = 2000 USDC
        faucet = address(new Faucet());
        factory = address(new Factory(deployer));
        Faucet(faucet).setToken(baseToken, quoteToken);
        ERC20(baseToken).addMinter(faucet);
        ERC20(quoteToken).addMinter(faucet);
        
        // Owner mint tokens
        ERC20(baseToken).mint(deployer, OWNER_INIT_WEALTH_WETH);
        ERC20(quoteToken).mint(deployer, OWNER_INIT_WEALTH_USDC);

        console.log("WETH deployed at:", baseToken);
        console.log("USDC deployed at:", quoteToken);
        console.log("Faucet deployed at:", faucet);
        console.log("Factory deployed at:", factory);
        console.log("Oracle deployed at:", oracle);

        // The following should be called from backend
        address vault = Factory(factory).createVault(deployer);
        console.log("vault deployed at:", vault);

        ERC20(quoteToken).approve(vault, type(uint).max);
        ERC20(baseToken).approve(vault, type(uint).max);
        Vault(vault).init(baseToken, quoteToken, oracle, expiry, strikePrice, premium, maxUnits);

        console.log("Deploy script successfully completed");
        vm.stopBroadcast();
    }

}