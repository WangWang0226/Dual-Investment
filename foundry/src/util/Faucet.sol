pragma solidity 0.8.17;

// SPDX-License-Identifier: MIT

interface token {
    function mint(address to, uint amount) external returns (bool);
}

contract Faucet {
    token public token0;
    token public token1;
    
    uint constant amount0 = 10e18; //WETH
    uint constant amount1 = 10000e6; //USDC

    mapping(address => bool) public tokenClaimed;

    function setToken(address _token0, address _token1) external {
        token0 = token(_token0);
        token1 = token(_token1);
    }

    function claimToken() external {
        require(!tokenClaimed[msg.sender]);
        tokenClaimed[msg.sender] = true;
        token0.mint(msg.sender, amount0);
        token1.mint(msg.sender, amount1);
    }

}
