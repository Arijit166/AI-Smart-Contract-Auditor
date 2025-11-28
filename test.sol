// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Counter {
    uint256 public count;

    // Increment the counter
    function increment() public {
        count += 1;
    }

    // ❌ BUG: This can underflow if count is 0
    function decrement() public {
        count -= 1; // No check → underflow reverts in Solidity 0.8+
    }

    // Set counter to a specific value
    function set(uint256 value) public {
        count = value;
    }
}
