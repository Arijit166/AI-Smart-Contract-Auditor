// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AuditRegistry
 * @dev Immutable registry storing audit hashes and IPFS references
 */
contract AuditRegistry is Ownable {
    struct AuditRecord {
        bytes32 originalCodeHash;
        bytes32 fixedCodeHash;
        uint256 riskScore;
        string ipfsPdfCID;
        string ipfsCodeCID;
        uint256 timestamp;
        address auditor;
        bool exists;
    }

    // Contract address => Audit Record
    mapping(address => AuditRecord) public audits;
    
    // Array of all audited contract addresses
    address[] public auditedContracts;

    event AuditPublished(
        address indexed contractAddress,
        address indexed auditor,
        bytes32 originalCodeHash,
        bytes32 fixedCodeHash,
        uint256 riskScore,
        string ipfsPdfCID,
        string ipfsCodeCID,
        uint256 timestamp
    );

    event AuditVerified(
        address indexed contractAddress,
        address indexed verifier,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Publish an audit record for a contract
     * @param contractAddress Address of the audited contract
     * @param originalCodeHash Keccak256 hash of original code
     * @param fixedCodeHash Keccak256 hash of fixed code
     * @param riskScore Risk score (0-100)
     * @param ipfsPdfCID IPFS CID of the audit PDF report
     * @param ipfsCodeCID IPFS CID of the code files
     */
    function publishAudit(
        address contractAddress,
        bytes32 originalCodeHash,
        bytes32 fixedCodeHash,
        uint256 riskScore,
        string memory ipfsPdfCID,
        string memory ipfsCodeCID
    ) public onlyOwner {
        require(contractAddress != address(0), "Invalid contract address");
        require(riskScore <= 100, "Risk score must be <= 100");
        require(!audits[contractAddress].exists, "Audit already exists");

        audits[contractAddress] = AuditRecord({
            originalCodeHash: originalCodeHash,
            fixedCodeHash: fixedCodeHash,
            riskScore: riskScore,
            ipfsPdfCID: ipfsPdfCID,
            ipfsCodeCID: ipfsCodeCID,
            timestamp: block.timestamp,
            auditor: tx.origin,
            exists: true
        });

        auditedContracts.push(contractAddress);

        emit AuditPublished(
            contractAddress,
            tx.origin,
            originalCodeHash,
            fixedCodeHash,
            riskScore,
            ipfsPdfCID,
            ipfsCodeCID,
            block.timestamp
        );
    }

    /**
     * @dev Get audit record for a contract
     */
    function getAudit(address contractAddress) public view returns (AuditRecord memory) {
        require(audits[contractAddress].exists, "Audit not found");
        return audits[contractAddress];
    }

    /**
     * @dev Check if a contract has been audited
     */
    function isAudited(address contractAddress) public view returns (bool) {
        return audits[contractAddress].exists;
    }

    /**
     * @dev Verify an audit (emit event for transparency)
     */
    function verifyAudit(address contractAddress) public {
        require(audits[contractAddress].exists, "Audit not found");
        
        emit AuditVerified(contractAddress, msg.sender, block.timestamp);
    }

    /**
     * @dev Get total number of audited contracts
     */
    function getTotalAudits() public view returns (uint256) {
        return auditedContracts.length;
    }

    /**
     * @dev Get all audited contract addresses
     */
    function getAllAuditedContracts() public view returns (address[] memory) {
        return auditedContracts;
    }
}