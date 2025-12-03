// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AuditToken is ERC20, Ownable {
    
    mapping(address => uint256) public auditorRewards;
    mapping(address => uint256) public auditorAuditCount;
    
    event RewardGiven(address indexed auditor, uint256 amount, uint256 timestamp);
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor() ERC20("AUDIT Token", "AUDIT") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10**decimals()); // Initial supply: 1M tokens
    }
    
    function rewardAuditor(address auditor, uint256 amount) external onlyOwner {
        require(auditor != address(0), "Invalid auditor address");
        require(amount > 0, "Amount must be positive");
        
        _mint(auditor, amount);
        auditorRewards[auditor] += amount;
        auditorAuditCount[auditor] += 1;
        
        emit RewardGiven(auditor, amount, block.timestamp);
    }
    
    function mintTokens(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    function getAuditorStats(address auditor) external view returns (uint256 totalRewards, uint256 auditCount) {
        return (auditorRewards[auditor], auditorAuditCount[auditor]);
    }
}