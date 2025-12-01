// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditBadgeNFT
 * @dev ERC721 NFT representing skill badges with progression levels
 */
contract AuditBadgeNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct BadgeMetadata {
        string badgeType;           
        string level;               
        uint8 tier;               
        uint256 timestamp;         
        bytes32 auditId;           
        bytes32 auditHash;         
        bytes32 fixedCodeHash;  
        address auditorAddress;     
        uint256 reputationSnapshot;
        MetricsSnapshot metricsSnapshot;
        string ipfsMetadataCID;    
        uint256 supersededBy;       
        bool isCurrent;             
        bool isSoulbound;           
    }

    struct MetricsSnapshot {
        uint256 totalAudits;
        uint256 totalVulnerabilities;
        uint256 totalFixes;
        uint256 perfectScores;
        uint256 criticalVulns;
        uint256 highVulns;
    }

    // Token ID => Badge Metadata
    mapping(uint256 => BadgeMetadata) public badgeMetadata;
    
    // User address => badge type => current token ID (0 if none)
    mapping(address => mapping(string => uint256)) public currentBadgeByType;
    
    // User address => array of all badge token IDs (including superseded)
    mapping(address => uint256[]) public userBadges;
    
    // Badge type => tier => criteria requirements
    mapping(string => mapping(uint8 => BadgeCriteria)) public badgeCriteria;

    struct BadgeCriteria {
        uint256 minAudits;
        uint256 minVulnerabilities;
        uint256 minFixes;
        uint256 minCriticalVulns;
        uint256 minHighVulns;
        uint256 minReputation;
        uint256 minPerfectScores;
        uint256 minGasOptimizations;
        uint256 minChainAudits;
    }

    // Audit hash => bool (prevents duplicate badge minting from same audit)
    mapping(bytes32 => mapping(string => bool)) public auditBadgeMinted;

    event BadgeMinted(
        uint256 indexed tokenId,
        address indexed auditor,
        string badgeType,
        string level,
        uint8 tier,
        bytes32 auditId,
        uint256 reputationSnapshot
    );

    event BadgeSuperseded(
        uint256 indexed oldTokenId,
        uint256 indexed newTokenId,
        address indexed auditor,
        string badgeType
    );

    constructor() ERC721("Smart Contract Audit Badge", "SCAB") Ownable(msg.sender) {
        _initializeBadgeCriteria();
    }

    /**
     * @dev Initialize badge criteria for all badge types
     */
    function _initializeBadgeCriteria() internal {
        // Vulnerability Hunter
        badgeCriteria["Vulnerability Hunter"][1] = BadgeCriteria(0, 5, 0, 0, 0, 0, 0, 0, 0);
        badgeCriteria["Vulnerability Hunter"][2] = BadgeCriteria(0, 15, 0, 0, 5, 0, 0, 0, 0);
        badgeCriteria["Vulnerability Hunter"][3] = BadgeCriteria(0, 30, 0, 0, 10, 0, 0, 0, 0);
        badgeCriteria["Vulnerability Hunter"][4] = BadgeCriteria(0, 50, 0, 5, 15, 0, 0, 0, 0);
        badgeCriteria["Vulnerability Hunter"][5] = BadgeCriteria(0, 100, 0, 10, 30, 0, 0, 0, 0);

        // Gas Optimizer
        badgeCriteria["Gas Optimizer"][1] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 10, 0);
        badgeCriteria["Gas Optimizer"][2] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 25, 0);
        badgeCriteria["Gas Optimizer"][3] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 50, 0);
        badgeCriteria["Gas Optimizer"][4] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 100, 0);
        badgeCriteria["Gas Optimizer"][5] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 200, 0);

        // Security Expert
        badgeCriteria["Security Expert"][1] = BadgeCriteria(0, 0, 3, 1, 2, 0, 0, 0, 0);
        badgeCriteria["Security Expert"][2] = BadgeCriteria(0, 0, 10, 3, 7, 0, 0, 0, 0);
        badgeCriteria["Security Expert"][3] = BadgeCriteria(0, 0, 25, 8, 17, 0, 0, 0, 0);
        badgeCriteria["Security Expert"][4] = BadgeCriteria(0, 0, 50, 15, 35, 0, 0, 0, 0);
        badgeCriteria["Security Expert"][5] = BadgeCriteria(0, 0, 100, 30, 70, 0, 0, 0, 0);

        // Bug Fixer
        badgeCriteria["Bug Fixer"][1] = BadgeCriteria(5, 0, 0, 0, 0, 0, 0, 0, 0);
        badgeCriteria["Bug Fixer"][2] = BadgeCriteria(15, 0, 0, 0, 0, 0, 0, 0, 0);
        badgeCriteria["Bug Fixer"][3] = BadgeCriteria(30, 0, 0, 0, 0, 0, 0, 0, 0);
        badgeCriteria["Bug Fixer"][4] = BadgeCriteria(60, 0, 0, 0, 0, 0, 0, 0, 0);
        badgeCriteria["Bug Fixer"][5] = BadgeCriteria(120, 0, 0, 0, 0, 0, 0, 0, 0);

        // Verified Auditor
        badgeCriteria["Verified Auditor"][1] = BadgeCriteria(0, 0, 0, 0, 0, 100, 0, 0, 0);
        badgeCriteria["Verified Auditor"][2] = BadgeCriteria(0, 0, 0, 0, 0, 500, 0, 0, 0);
        badgeCriteria["Verified Auditor"][3] = BadgeCriteria(0, 0, 0, 0, 0, 1500, 0, 0, 0);
        badgeCriteria["Verified Auditor"][4] = BadgeCriteria(0, 0, 0, 0, 0, 5000, 0, 0, 0);
        badgeCriteria["Verified Auditor"][5] = BadgeCriteria(0, 0, 0, 0, 0, 15000, 0, 0, 0);

        // Perfect Score
        badgeCriteria["Perfect Score"][1] = BadgeCriteria(0, 0, 0, 0, 0, 0, 3, 0, 0);
        badgeCriteria["Perfect Score"][2] = BadgeCriteria(0, 0, 0, 0, 0, 0, 10, 0, 0);
        badgeCriteria["Perfect Score"][3] = BadgeCriteria(0, 0, 0, 0, 0, 0, 25, 0, 0);
        badgeCriteria["Perfect Score"][4] = BadgeCriteria(0, 0, 0, 0, 0, 0, 50, 0, 0);
        badgeCriteria["Perfect Score"][5] = BadgeCriteria(0, 0, 0, 0, 0, 0, 100, 0, 0);

        // Chain Specialist (example for one chain type)
        badgeCriteria["Chain Specialist"][1] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 0, 10);
        badgeCriteria["Chain Specialist"][2] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 0, 30);
        badgeCriteria["Chain Specialist"][3] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 0, 75);
        badgeCriteria["Chain Specialist"][4] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 0, 150);
        badgeCriteria["Chain Specialist"][5] = BadgeCriteria(0, 0, 0, 0, 0, 0, 0, 0, 300);
    }

    /**
     * @dev Mint a new badge NFT (only owner/authorized minter)
     */
    function mintBadge(
        address to,
        string memory badgeType,
        string memory level,
        uint8 tier,
        bytes32 auditId,
        bytes32 auditHash,
        bytes32 fixedCodeHash,
        uint256 reputationSnapshot,
        MetricsSnapshot memory metrics,
        string memory ipfsMetadataCID,
        bool isSoulbound
    ) public onlyOwner returns (uint256) {
        require(tier >= 1 && tier <= 5, "Invalid tier");
        require(!auditBadgeMinted[auditHash][badgeType], "Badge already minted for this audit");
        
        // Validate criteria
        BadgeCriteria memory criteria = badgeCriteria[badgeType][tier];
        require(_validateCriteria(metrics, reputationSnapshot, criteria), "Does not meet badge criteria");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);
        
        string memory tokenURI = string(abi.encodePacked("ipfs://", ipfsMetadataCID));
        _setTokenURI(newTokenId, tokenURI);

        // Store metadata in memory first, then save to storage
        BadgeMetadata memory newBadge = BadgeMetadata({
            badgeType: badgeType,
            level: level,
            tier: tier,
            timestamp: block.timestamp,
            auditId: auditId,
            auditHash: auditHash,
            fixedCodeHash: fixedCodeHash,
            auditorAddress: to,
            reputationSnapshot: reputationSnapshot,
            metricsSnapshot: metrics,
            ipfsMetadataCID: ipfsMetadataCID,
            supersededBy: 0,
            isCurrent: true,
            isSoulbound: isSoulbound
        });

        badgeMetadata[newTokenId] = newBadge;

        // Check if user has existing badge of this type
        uint256 existingTokenId = currentBadgeByType[to][badgeType];
        if (existingTokenId != 0) {
            // Supersede old badge
            badgeMetadata[existingTokenId].supersededBy = newTokenId;
            badgeMetadata[existingTokenId].isCurrent = false;
            emit BadgeSuperseded(existingTokenId, newTokenId, to, badgeType);
        }

        currentBadgeByType[to][badgeType] = newTokenId;
        userBadges[to].push(newTokenId);
        auditBadgeMinted[auditHash][badgeType] = true;

        emit BadgeMinted(
            newTokenId,
            to,
            badgeType,
            level,
            tier,
            auditId,
            reputationSnapshot
        );

        return newTokenId;
    }

    /**
     * @dev Validate if metrics meet criteria
     */
    function _validateCriteria(
        MetricsSnapshot memory metrics,
        uint256 reputation,
        BadgeCriteria memory criteria
    ) internal pure returns (bool) {
        if (criteria.minAudits > 0 && metrics.totalAudits < criteria.minAudits) return false;
        if (criteria.minVulnerabilities > 0 && metrics.totalVulnerabilities < criteria.minVulnerabilities) return false;
        if (criteria.minFixes > 0 && metrics.totalFixes < criteria.minFixes) return false;
        if (criteria.minCriticalVulns > 0 && metrics.criticalVulns < criteria.minCriticalVulns) return false;
        if (criteria.minHighVulns > 0 && metrics.highVulns < criteria.minHighVulns) return false;
        if (criteria.minReputation > 0 && reputation < criteria.minReputation) return false;
        if (criteria.minPerfectScores > 0 && metrics.perfectScores < criteria.minPerfectScores) return false;
        return true;
    }

    /**
     * @dev Get all badge token IDs for a user (including superseded)
     */
    function getUserBadges(address user) public view returns (uint256[] memory) {
        return userBadges[user];
    }

    /**
     * @dev Get current badge token ID for a specific badge type
     */
    function getCurrentBadge(address user, string memory badgeType) public view returns (uint256) {
        return currentBadgeByType[user][badgeType];
    }

    /**
     * @dev Get badge metadata
     */
    function getBadgeMetadata(uint256 tokenId) public view returns (BadgeMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Badge does not exist");
        return badgeMetadata[tokenId];
    }

    /**
     * @dev Override transfer to implement soulbound logic
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        if (from != address(0)) {
            // Check if soulbound
            require(!badgeMetadata[tokenId].isSoulbound, "Soulbound badge cannot be transferred");
        }
        
        return super._update(to, tokenId, auth);
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}