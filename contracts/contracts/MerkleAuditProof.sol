// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MerkleAuditProof is Ownable {
    struct AuditProof {
        bytes32 merkleRoot;
        address auditor;
        uint256 timestamp;
        string auditId;
        bool exists;
    }

    mapping(string => AuditProof) public auditProofs;
    string[] public auditIds;

    event AuditProofStored(
        string indexed auditId,
        address indexed auditor,
        bytes32 merkleRoot,
        uint256 timestamp
    );

    event LeafVerified(
        string indexed auditId,
        bytes32 leaf,
        bool isValid
    );

    constructor() Ownable(msg.sender) {}

    function storeAuditProof(
        address auditor,
        bytes32 merkleRoot,
        string memory auditId
    ) public onlyOwner {
        require(!auditProofs[auditId].exists, "Audit proof already exists");
        require(merkleRoot != bytes32(0), "Invalid merkle root");

        auditProofs[auditId] = AuditProof({
            merkleRoot: merkleRoot,
            auditor: auditor,
            timestamp: block.timestamp,
            auditId: auditId,
            exists: true
        });

        auditIds.push(auditId);

        emit AuditProofStored(auditId, auditor, merkleRoot, block.timestamp);
    }

    function verifyLeaf(
        string memory auditId,
        bytes32 leaf,
        bytes32[] calldata merkleProof
    ) public returns (bool) {
        require(auditProofs[auditId].exists, "Audit proof not found");
        
        bytes32 computedHash = leaf;
        bytes32 root = auditProofs[auditId].merkleRoot;

        for (uint256 i = 0; i < merkleProof.length; i++) {
            bytes32 proofElement = merkleProof[i];
            
            if (computedHash < proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        bool isValid = computedHash == root;
        emit LeafVerified(auditId, leaf, isValid);
        
        return isValid;
    }

    function getAuditProof(string memory auditId) public view returns (AuditProof memory) {
        require(auditProofs[auditId].exists, "Audit proof not found");
        return auditProofs[auditId];
    }

    function getTotalProofs() public view returns (uint256) {
        return auditIds.length;
    }
}