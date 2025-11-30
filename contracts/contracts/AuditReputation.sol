// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditReputation
 * @dev On-chain reputation system for smart contract auditors
 */
contract AuditReputation is Ownable {
    // Reputation mapping
    mapping(address => uint256) public reputation;
    
    // Detailed tracking
    mapping(address => uint256) public auditsCompleted;
    mapping(address => uint256) public deploymentsCompleted;
    mapping(address => uint256) public fixesApplied;
    mapping(address => uint256) public penalties;
    
    // Leaderboard tracking
    address[] public participants;
    mapping(address => bool) public isParticipant;
    
    // Point values
    uint256 public constant AUDIT_POINTS = 10;
    uint256 public constant DEPLOYMENT_POINTS = 20;
    uint256 public constant FIX_POINTS = 5;
    uint256 public constant PENALTY_POINTS = 10;

    // Events
    event AuditCompleted(address indexed user, uint256 newReputation, uint256 timestamp);
    event DeploymentCompleted(address indexed user, uint256 newReputation, uint256 timestamp);
    event FixApplied(address indexed user, uint256 newReputation, uint256 timestamp);
    event Penalized(address indexed user, uint256 newReputation, uint256 timestamp);
    event ReputationUpdated(address indexed user, uint256 oldReputation, uint256 newReputation, string action);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Add reputation for completing an audit
     */
    function addAudit(address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        
        uint256 oldReputation = reputation[user];
        reputation[user] += AUDIT_POINTS;
        auditsCompleted[user] += 1;
        
        _addParticipant(user);
        
        emit AuditCompleted(user, reputation[user], block.timestamp);
        emit ReputationUpdated(user, oldReputation, reputation[user], "audit");
    }

    /**
     * @dev Add reputation for deploying a contract
     */
    function addDeployment(address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        
        uint256 oldReputation = reputation[user];
        reputation[user] += DEPLOYMENT_POINTS;
        deploymentsCompleted[user] += 1;
        
        _addParticipant(user);
        
        emit DeploymentCompleted(user, reputation[user], block.timestamp);
        emit ReputationUpdated(user, oldReputation, reputation[user], "deployment");
    }

    /**
     * @dev Add reputation for fixing a high-risk issue
     */
    function addFix(address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        
        uint256 oldReputation = reputation[user];
        reputation[user] += FIX_POINTS;
        fixesApplied[user] += 1;
        
        _addParticipant(user);
        
        emit FixApplied(user, reputation[user], block.timestamp);
        emit ReputationUpdated(user, oldReputation, reputation[user], "fix");
    }

    /**
     * @dev Penalize user (e.g., if deployed contract was exploited)
     */
    function penalize(address user) public onlyOwner {
        require(user != address(0), "Invalid user address");
        
        uint256 oldReputation = reputation[user];
        
        // Prevent underflow
        if (reputation[user] >= PENALTY_POINTS) {
            reputation[user] -= PENALTY_POINTS;
        } else {
            reputation[user] = 0;
        }
        
        penalties[user] += 1;
        
        emit Penalized(user, reputation[user], block.timestamp);
        emit ReputationUpdated(user, oldReputation, reputation[user], "penalty");
    }

    /**
     * @dev Get reputation for a user
     */
    function getReputation(address user) public view returns (uint256) {
        return reputation[user];
    }

    /**
     * @dev Get detailed stats for a user
     */
    function getUserStats(address user) public view returns (
        uint256 totalReputation,
        uint256 audits,
        uint256 deployments,
        uint256 fixes,
        uint256 penaltyCount
    ) {
        return (
            reputation[user],
            auditsCompleted[user],
            deploymentsCompleted[user],
            fixesApplied[user],
            penalties[user]
        );
    }

    /**
     * @dev Get top N users by reputation
     */
    function getTopUsers(uint256 limit) public view returns (
        address[] memory users,
        uint256[] memory scores
    ) {
        uint256 totalUsers = participants.length;
        uint256 resultSize = limit > totalUsers ? totalUsers : limit;
        
        users = new address[](resultSize);
        scores = new uint256[](resultSize);
        
        // Copy participants to temp array for sorting
        address[] memory tempUsers = new address[](totalUsers);
        uint256[] memory tempScores = new uint256[](totalUsers);
        
        for (uint256 i = 0; i < totalUsers; i++) {
            tempUsers[i] = participants[i];
            tempScores[i] = reputation[participants[i]];
        }
        
        // Simple bubble sort (descending order)
        for (uint256 i = 0; i < totalUsers; i++) {
            for (uint256 j = i + 1; j < totalUsers; j++) {
                if (tempScores[i] < tempScores[j]) {
                    // Swap scores
                    uint256 tempScore = tempScores[i];
                    tempScores[i] = tempScores[j];
                    tempScores[j] = tempScore;
                    
                    // Swap users
                    address tempUser = tempUsers[i];
                    tempUsers[i] = tempUsers[j];
                    tempUsers[j] = tempUser;
                }
            }
        }
        
        // Return top N
        for (uint256 i = 0; i < resultSize; i++) {
            users[i] = tempUsers[i];
            scores[i] = tempScores[i];
        }
        
        return (users, scores);
    }

    /**
     * @dev Get total number of participants
     */
    function getTotalParticipants() public view returns (uint256) {
        return participants.length;
    }

    /**
     * @dev Internal function to track participants
     */
    function _addParticipant(address user) internal {
        if (!isParticipant[user]) {
            participants.push(user);
            isParticipant[user] = true;
        }
    }
}