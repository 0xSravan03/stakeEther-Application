const { network } = require("hardhat");

async function moveBlock(amount) {
  for (let i = 0; i < amount; i++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
  }
  console.log(`Mined ${amount} blocks`);
}

module.exports = moveBlock;
