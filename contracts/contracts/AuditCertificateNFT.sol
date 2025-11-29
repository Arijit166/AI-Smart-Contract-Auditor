// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditCertificateNFT
 * @dev ERC721 NFT representing audit certificates with IPFS metadata
 */
contract AuditCertificateNFT is ERC721, ERC721URIStorage, Ownable {
    // Replace Counters with simple uint256
    uint256 private _tokenIdCounter;

    struct AuditMetadata {
        bytes32 originalCodeHash;
        bytes32 fixedCodeHash;
        uint256 riskScore;
        uint256 timestamp;
        address auditor;
        string ipfsMetadataCID;
    }

    // Token ID => Audit Metadata
    mapping(uint256 => AuditMetadata) public auditMetadata;
    
    // User address => array of their token IDs
    mapping(address => uint256[]) public userCertificates;

    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed auditor,
        bytes32 originalCodeHash,
        bytes32 fixedCodeHash,
        uint256 riskScore,
        string ipfsMetadataCID
    );

    constructor() ERC721("Smart Contract Audit Certificate", "SCAC") Ownable(msg.sender) {}

    /**
     * @dev Mint a new audit certificate NFT
     */
    function mintCertificate(
        address to,
        bytes32 originalCodeHash,
        bytes32 fixedCodeHash,
        uint256 riskScore,
        string memory ipfsMetadataCID
    ) public onlyOwner returns (uint256) {
        require(riskScore <= 100, "Risk score must be <= 100");
        
        // Increment counter
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(to, newTokenId);
        
        // Set token URI to IPFS metadata
        string memory tokenURI = string(abi.encodePacked("ipfs://", ipfsMetadataCID));
        _setTokenURI(newTokenId, tokenURI);

        // Store metadata on-chain
        auditMetadata[newTokenId] = AuditMetadata({
            originalCodeHash: originalCodeHash,
            fixedCodeHash: fixedCodeHash,
            riskScore: riskScore,
            timestamp: block.timestamp,
            auditor: to,
            ipfsMetadataCID: ipfsMetadataCID
        });

        userCertificates[to].push(newTokenId);

        emit CertificateMinted(
            newTokenId,
            to,
            originalCodeHash,
            fixedCodeHash,
            riskScore,
            ipfsMetadataCID
        );

        return newTokenId;
    }

    /**
     * @dev Get all certificate token IDs for a user
     */
    function getUserCertificates(address user) public view returns (uint256[] memory) {
        return userCertificates[user];
    }

    /**
     * @dev Get audit metadata for a certificate
     */
    function getAuditMetadata(uint256 tokenId) public view returns (AuditMetadata memory) {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        return auditMetadata[tokenId];
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}