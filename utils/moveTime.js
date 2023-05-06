const { network } = require("hardhat");

async function moveTime(amount) {
  await network.provider.send("evm_increaseTime", [amount]);
  console.log(`Moved ${amount} seconds`);
}

module.exports = moveTime;
