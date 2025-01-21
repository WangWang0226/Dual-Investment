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
    uint BASE = 100;
    uint INTEREST_RATE = 20;    

    uint immutable OWNER_INIT_WEALTH_PUPU = 100000e18;
    uint immutable OWNER_INIT_WEALTH_USDC = 200000000e6;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        baseToken = address(new ERC20(deployer, "PUPU", "PUPU", 18));
        quoteToken = address(new ERC20(deployer, "USDL", "USDL", 6));
    
        oracle = address(new MockOracle(2000e6)); // 1 ETH = 2000 USDC
        faucet = address(new Faucet());
        factory = address(new Factory(deployer));
        Faucet(faucet).setToken(baseToken, quoteToken);
        ERC20(baseToken).addMinter(faucet);
        ERC20(quoteToken).addMinter(faucet);
        
        // Owner mint tokens
        ERC20(baseToken).mint(deployer, OWNER_INIT_WEALTH_PUPU);
        ERC20(quoteToken).mint(deployer, OWNER_INIT_WEALTH_USDC);

        console.log("PUPU deployed at:", baseToken);
        console.log("USDC deployed at:", quoteToken);
        console.log("Faucet deployed at:", faucet);
        console.log("Factory deployed at:", factory);
        console.log("Oracle deployed at:", oracle);

        address vault = Factory(factory).createVault(deployer);
        console.log("vault deployed at:", vault);

        ERC20(quoteToken).transfer(vault, OWNER_INIT_WEALTH_USDC);
        ERC20(baseToken).transfer(vault, OWNER_INIT_WEALTH_PUPU);
        Vault(vault).init(baseToken, quoteToken, oracle, BASE, INTEREST_RATE);

        console.log("Deploy script successfully completed");
        vm.stopBroadcast();
    }

}