const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Deploying contract...");
  const StakingFactory = await ethers.getContractFactory("Staking", signer);
  const Staking = await StakingFactory.deploy({
    value: ethers.utils.parseEther("10"),
  });
  await Staking.deployed();
  console.log(`Contract Deployed at : ${Staking.address} by ${signer.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
