pragma solidity 0.8.17;

// SPDX-License-Identifier: MIT

import "forge-std/Test.sol";
import "../src/Vault.sol";
import "../src/Factory.sol";
import "../src/util/Faucet.sol";
import "../src/util/ERC20.sol";
import "forge-std/Script.sol";


contract Deploy is Script {
    address public faucet;
    address public token0;
    address public token1;

    address public vault;
    address public factory;

    uint256 timestamp = block.timestamp;
    uint256 strikePrice = 1e18 * 2000e6 / 1e18; // 2000 USDC per WETH
    uint256 premium = 1e18 * 20e6 / 1e18 ; // 20 USDC per ETH
    uint256 expiry = timestamp + 2 days; // 2 day
    uint256 maxUnits = 100 * 1e18;

    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        token0 = address(new ERC20(deployer, "WETH", "WETH", 18));
        token1 = address(new ERC20(deployer, "USDC", "USDC", 6));
    
        faucet = address(new Faucet());
        factory = address(new Factory(deployer));
        Faucet(faucet).setToken(token0, token1);
        ERC20(token0).addMinter(faucet);
        ERC20(token1).addMinter(faucet);
        
        ERC20(token0).transferOwnership(owner);
        ERC20(token1).transferOwnership(owner);
        Factory(factory).transferOwnership(owner);

        console.log("WETH deployed at:", token0);
        console.log("USDC deployed at:", token1);
        console.log("Faucet deployed at:", faucet);
        console.log("Factory deployed at:", factory);

        vm.stopBroadcast();
    }

}