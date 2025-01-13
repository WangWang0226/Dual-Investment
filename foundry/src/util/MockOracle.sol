
pragma solidity ^0.8.17;

// SPDX-License-Identifier: MIT

contract MockOracle {

    int256 currentPrice; // stored in 1e6

    constructor(int256 price) {
        currentPrice = price;
    }
    
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        return (0, currentPrice, 0, 0, 0);
    }

    function setCurrentPrice(int256 price) public {
        currentPrice = price;
    }
}

