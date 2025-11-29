// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RewardDistributor
 * @dev Distributes rewards to users, but has multiple vulnerabilities.
 */
contract RewardDistributor {
    address public owner;
    uint256 public rewardPool;
    mapping(address => uint256) public rewards;
    address[] public participants;

    constructor() {
        owner = msg.sender;
        rewardPool = 100 ether;
    }

    // ❌ Anyone can add themselves as participant (No access control)
    function register() public {
        participants.push(msg.sender);
    }

    // ❌ Incorrect access control: anyone can call this
    function addReward(address user, uint256 amount) public {
        rewards[user] += amount;
        rewardPool -= amount; // ❌ Underflow/logic error possible
    }

    // ❌ No reentrancy guard
    function claimReward() public {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "No rewards");

        // ❌ Reentrancy risk
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        rewards[msg.sender] = 0;
    }

    // ❌ Dangerous: allows draining ETH sent to contract
    function emergencyWithdraw(address to) public {
        payable(to).transfer(address(this).balance);
    }

    // ❌ No way to fund contract safely
    receive() external payable {}

    // ❌ Returns entire dynamic array (expensive, unbounded)
    function getParticipants() public view returns (address[] memory) {
        return participants;
    }
}
