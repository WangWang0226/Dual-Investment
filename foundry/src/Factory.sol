pragma solidity ^0.8.17;

// SPDX-License-Identifier: MIT

import "./Vault.sol";

contract Factory {
    address public owner;

    address[] public deployedVaults;

    bool public isPermissionless;

    mapping (address => bool) public isAdmin;

    event VaultInitialized(address indexed baseToken, address indexed quoteToken, address vaultAddress, uint256 strikePrice, uint256 expiry, uint256 premium, uint256 maxUnits);
    event VaultCreated(address vault);

    modifier onlyOwner() {
        require(msg.sender == owner, "Factory: Only owner can call this function");
        _;
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    function addAdmin(address _admin) external onlyOwner {
        isAdmin[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        isAdmin[_admin] = false;
    }

    function setPermissionless(bool _isPermissionless) external onlyOwner {
        isPermissionless = _isPermissionless;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Factory: owner is zero address");
        owner = _owner;
    }
    
    function createVault(address _owner) external returns (address newVault) {
        require(msg.sender == owner || isAdmin[msg.sender] || isPermissionless, "Factory: Only owner or admin can call this function");
        newVault = address(new Vault(_owner));
        
        deployedVaults.push(newVault);
        emit VaultCreated(newVault);
    }

    function getDeployedVaultCount() external view returns (uint256) {
        return deployedVaults.length;
    }

    function getDeployedVaults() external view returns (address[] memory) {
        return deployedVaults;
    }
}
