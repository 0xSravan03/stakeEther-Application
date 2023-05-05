// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

contract Staking {
    address public owner;

    struct Position {
        uint256 positionId;
        address walletAddress;
        uint256 createdDate;
        uint256 unlockDate;
        uint256 percentInterest;
        uint256 weiStaked;
        uint256 weiInterest;
        bool open;
    }

    uint256 public currentPositionId; // 0
    Position position;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionIdsByAddress;
    mapping(uint256 => uint256) public tiers;
    uint256[] public lockPeriods;

    constructor() payable {
        owner = msg.sender;
        currentPositionId = 0;

        tiers[30] = 700; // 7 % APY
        tiers[90] = 1000;
        tiers[180] = 1200;

        lockPeriods.push(30);
        lockPeriods.push(90);
        lockPeriods.push(180);
    }

    error Staking__Owner_Error();

    function stakeEther(uint256 numDays) external payable {
        require(tiers[numDays] > 0, "ERROR: NO.OF DAYS NOT FOUND");
        positions[currentPositionId] = Position({
            positionId: currentPositionId,
            walletAddress: msg.sender,
            createdDate: block.timestamp,
            unlockDate: block.timestamp + (numDays * 1 days),
            percentInterest: tiers[numDays],
            weiStaked: msg.value,
            weiInterest: calculateInterest(tiers[numDays], msg.value),
            open: true
        });

        positionIdsByAddress[msg.sender].push(currentPositionId);
        currentPositionId++;
    }

    function calculateInterest(
        uint256 basisPoints,
        uint256 weiAmount
    ) private pure returns (uint256) {
        return (basisPoints * weiAmount) / 10000;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert Staking__Owner_Error();
        }
        _;
    }

    function modifyLockPeriods(
        uint256 numDays,
        uint256 basisPoints
    ) external onlyOwner {
        if (tiers[numDays] == 0) {
            tiers[numDays] = basisPoints;
            lockPeriods.push(numDays);
        } else {
            tiers[numDays] = basisPoints;
        }
    }

    function getsLockPeriods() external view returns (uint256[] memory) {
        return lockPeriods;
    }

    function getInterestRate(uint256 numDays) external view returns (uint256) {
        return tiers[numDays];
    }

    function getPositionById(
        uint256 positionId
    ) external view returns (Position memory) {
        return positions[positionId];
    }

    function getPositionIdsForAddress(
        address walletAddress
    ) external view returns (uint256[] memory) {
        return positionIdsByAddress[walletAddress];
    }
}
