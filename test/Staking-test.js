const { ethers } = require("hardhat");
const { assert, expect } = require("chai");

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
      await tx.wait();

      const positionNew = await Staking.positions(0);
      expect(positionNew.positionId).to.equal(0);
      expect(positionNew.walletAddress).to.equal(Staking.signer.address);
      expect(positionNew.weiStaked).to.equal(ethers.utils.parseEther("5"));
      expect(positionNew.open).to.equal(true);
      expect(positionNew.percentInterest).to.equal(700);
    });
  });
});
