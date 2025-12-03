// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SubscriptionManager is Ownable {
    
    IERC20 public auditToken;
    
    enum Tier { NONE, BASIC, PRO, ELITE }
    
    struct Subscription {
        Tier tier;
        uint256 expiry;
        uint256 subscribedAt;
    }
    
    mapping(address => Subscription) public subscriptions;
    mapping(uint256 => uint256) public tierPrices;
    mapping(uint256 => uint256) public tierDurations; // in seconds
    
    event Subscribed(address indexed user, uint256 tier, uint256 expiry, uint256 timestamp);
    event PriceUpdated(uint256 tier, uint256 newPrice);
    
    constructor(address _auditToken) Ownable(msg.sender) {
        auditToken = IERC20(_auditToken);
        
        // Default prices (in AUDIT tokens with 18 decimals)
        tierPrices[uint256(Tier.BASIC)] = 10 * 10**18;   // 10 AUDIT
        tierPrices[uint256(Tier.PRO)] = 50 * 10**18;     // 50 AUDIT
        tierPrices[uint256(Tier.ELITE)] = 100 * 10**18;  // 100 AUDIT
        
        // Default durations (30 days)
        tierDurations[uint256(Tier.BASIC)] = 30 days;
        tierDurations[uint256(Tier.PRO)] = 30 days;
        tierDurations[uint256(Tier.ELITE)] = 30 days;
    }
    
    function subscribe(uint256 tier) external {
        require(tier > 0 && tier <= uint256(Tier.ELITE), "Invalid tier");
        require(tierPrices[tier] > 0, "Tier not available");
        
        uint256 price = tierPrices[tier];
        require(auditToken.balanceOf(msg.sender) >= price, "Insufficient tokens");
        
        // Transfer tokens from user to contract
        require(auditToken.transferFrom(msg.sender, address(this), price), "Transfer failed");
        
        // Calculate expiry
        uint256 currentExpiry = subscriptions[msg.sender].expiry;
        uint256 newExpiry;
        
        if (currentExpiry > block.timestamp) {
            // Extend existing subscription
            newExpiry = currentExpiry + tierDurations[tier];
        } else {
            // New subscription
            newExpiry = block.timestamp + tierDurations[tier];
        }
        
        subscriptions[msg.sender] = Subscription({
            tier: Tier(tier),
            expiry: newExpiry,
            subscribedAt: block.timestamp
        });
        
        emit Subscribed(msg.sender, tier, newExpiry, block.timestamp);
    }
    
    function isSubscriptionActive(address user) external view returns (bool) {
        return subscriptions[user].expiry > block.timestamp;
    }
    
    function getUserSubscription(address user) external view returns (Tier tier, uint256 expiry, bool active) {
        Subscription memory sub = subscriptions[user];
        return (sub.tier, sub.expiry, sub.expiry > block.timestamp);
    }
    
    function setTierPrice(uint256 tier, uint256 price) external onlyOwner {
        require(tier > 0 && tier <= uint256(Tier.ELITE), "Invalid tier");
        tierPrices[tier] = price;
        emit PriceUpdated(tier, price);
    }
    
    function setTierDuration(uint256 tier, uint256 duration) external onlyOwner {
        require(tier > 0 && tier <= uint256(Tier.ELITE), "Invalid tier");
        tierDurations[tier] = duration;
    }
    
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        require(auditToken.transfer(to, amount), "Transfer failed");
    }
}