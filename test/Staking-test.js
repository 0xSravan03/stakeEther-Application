const { ethers } = require("hardhat");
const { assert, expect } = require("chai");
const moveBlock = require("../utils/moveBlock");
const moveTime = require("../utils/moveTime");

describe("Staking", function () {
  let Staking;

  beforeEach(async function () {
    const factory = await ethers.getContractFactory("Staking");
    Staking = await factory.deploy({ value: ethers.utils.parseEther("100") });
    await Staking.deployed();
  });

  describe("deploy", function () {
    it("should set the owner", async function () {
      const [deployer] = await ethers.getSigners(); // because by default first account will be used for deploying
      const owner = await Staking.owner();
      assert.equal(deployer.address, owner);
    });

    it("initial balance should be 100 ETH", async function () {
      const expectedVal = "100.0";
      const Balance = await ethers.provider.getBalance(Staking.address);
      assert.equal(expectedVal, ethers.utils.formatEther(Balance).toString());
    });

    it("should setup tiers and lock periods", async function () {
      expect((await Staking.lockPeriods(0)).toString()).to.equal("30");
      expect((await Staking.lockPeriods(1)).toString()).to.equal("90");
      expect((await Staking.lockPeriods(2)).toString()).to.equal("180");

      expect((await Staking.tiers(30)).toString()).to.equal("700");
      expect((await Staking.tiers(90)).toString()).to.equal("1000");
      expect((await Staking.tiers(180)).toString()).to.equal("1200");
    });
  });

  describe("stake ETH", function () {
    it("should transfer ether", async function () {
      // using second account as user, first account will be the deployer
      const [, user] = await ethers.getSigners();
      const userBalanceBeforeStake = await user.getBalance();
      const contractBalanceBeforeStake = await ethers.provider.getBalance(
        Staking.address
      );

      // user sending transaction (calling stake function)
      const tx = await Staking.connect(user).stakeEther(30, {
        value: ethers.utils.parseEther("5"),
      });
      const receipt = await tx.wait();

      const gasUsed = receipt.gasUsed;
      const effectiveGasPrice = receipt.effectiveGasPrice;
      const gasFees = gasUsed.mul(effectiveGasPrice);

      const userBalanceAfterStake = await user.getBalance();
      const contractBalanceAfterStake = await ethers.provider.getBalance(
        Staking.address
      );

      expect(userBalanceBeforeStake).to.be.equal(
        userBalanceAfterStake.add(gasFees).add(ethers.utils.parseEther("5"))
      );
      expect(contractBalanceAfterStake).to.be.equal(
        contractBalanceBeforeStake.add(ethers.utils.parseEther("5"))
      );
    });

    it("should revert if stake amount is zero", async function () {
      await expect(Staking.stakeEther(30)).to.be.revertedWith(
        "ERROR: INVALID ETH AMOUNT"
      );
    });

    it("should revert if wrong tier value used", async function () {
      // allowed tier 30, 90, 180
      await expect(
        Staking.stakeEther(50, { value: ethers.utils.parseEther("8") })
      ).to.be.revertedWith("ERROR: NO.OF DAYS NOT FOUND");
    });

    it("should add a position to Positions", async function () {
      // Before calling Stake function
      const position = await Staking.positions(0);
      expect(position.positionId).to.equal(0);
      expect(position.walletAddress).to.equal(ethers.constants.AddressZero);
      expect(position.createdDate).to.equal(0);
      expect(position.unlockDate).to.equal(0);
      expect(position.percentInterest).to.equal(0);
      expect(position.weiStaked).to.equal(0);
      expect(position.weiInterest).to.equal(0);
      expect(position.open).to.equal(false);

      const tx = await Staking.stakeEther(30, {
        value: ethers.utils.parseEther("5"),
      });
      const receipt = await tx.wait();

      const blockNumber = receipt.blockNumber;
      const block = await ethers.provider.getBlock(blockNumber);

      const positionNew = await Staking.positions(0);
      expect(positionNew.positionId).to.equal(0);
      expect(positionNew.walletAddress).to.equal(Staking.signer.address);
      expect(positionNew.weiStaked).to.equal(ethers.utils.parseEther("5"));
      expect(positionNew.open).to.equal(true);
      expect(positionNew.percentInterest).to.equal(700);
      expect(positionNew.createdDate).to.equal(block.timestamp);
      expect(positionNew.unlockDate).to.equal(block.timestamp + 86400 * 30);
      expect(positionNew.weiInterest).to.equal(
        ethers.BigNumber.from(700)
          .mul(ethers.utils.parseEther("5"))
          .div(ethers.BigNumber.from(10000))
      );
    });
  });

  describe("lock period", function () {
    it("owner should able to add / modify the lock period", async function () {
      // adding new lockperiod
      const tx = await Staking.modifyLockPeriods(45, 900);
      await tx.wait();
      expect(await Staking.tiers(45)).to.equal(900);

      // modifying existing lockperiod
      const txn = await Staking.modifyLockPeriods(30, 800);
      await txn.wait();
      expect(await Staking.tiers(30)).to.equal(800);
    });

    it("only owner should able to add / modify lock period", async function () {
      const [, user] = await ethers.getSigners(); // Getting second account
      const StakingNew = await Staking.connect(user);
      await expect(
        StakingNew.modifyLockPeriods(45, 900)
      ).to.be.revertedWithCustomError(StakingNew, "Staking__Owner_Error");
    });
  });

  describe("change unlock date", function () {
    it("owner should able to change the unlock date of a position", async function () {
      const [owner, user] = await ethers.getSigners();
      const StakingNew = await Staking.connect(user);
      const tx = await StakingNew.stakeEther(30, {
        value: ethers.utils.parseEther("8"),
      });
      await tx.wait();
      const position = await StakingNew.positions(0);
      expect(position.positionId).to.equal(0);
      expect(position.walletAddress).to.equal(user.address);

      const StakingOwner = await Staking.connect(owner);

      // Math.floor(Date.now() / 1000) - return current unix timestamp in seconds
      const newUnlockDate = Math.floor(Date.now() / 1000) + 86400 * 180;
      const txn = await StakingOwner.changeUnlockDate(0, newUnlockDate);
      await txn.wait();
      const positionNew = await StakingNew.positions(0);
      expect(positionNew.unlockDate).to.equal(newUnlockDate);
    });
  });

  describe("close position", function () {
    it("only position creator can close it", async function () {
      const [, user1, user2] = await ethers.getSigners();
      const Stake = await Staking.connect(user1);
      const tx = await Stake.stakeEther(30, {
        value: ethers.utils.parseEther("15"),
      });
      await tx.wait();
      const position = await Stake.positions(0);
      expect(position.walletAddress).to.equal(user1.address);

      const StakeNew = await Staking.connect(user2);
      await expect(StakeNew.closePosition(0)).to.be.revertedWith(
        "ERROR: INVALID STAKING"
      );
    });

    it("should return only staked ETH if closed before unlockdate", async function () {
      const [, user] = await ethers.getSigners();
      const UserStake = await Staking.connect(user);
      const tx = await UserStake.stakeEther(30, {
        value: ethers.utils.parseEther("15"),
      });
      await tx.wait();

      const balanceBeforeUnStake = await user.getBalance();

      await moveBlock(1);
      await moveTime(25 * 86400);

      const txn = await UserStake.closePosition(0);
      const receipt = await txn.wait();
      const gasUsed = receipt.gasUsed;
      const effectiveGasPrice = receipt.effectiveGasPrice;
      const gasFees = gasUsed.mul(effectiveGasPrice);

      const balanceAfterUnStake = await user.getBalance();

      expect(balanceAfterUnStake).to.equal(
        balanceBeforeUnStake.add(ethers.utils.parseEther("15")).sub(gasFees)
      );
    });
  });
});
