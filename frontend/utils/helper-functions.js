import { ethers } from "ethers";

export async function ethToWei(ethAmt) {
  return ethers.utils.parseEther(ethAmt);
}

export async function weiToEth(weiAmt) {
  return ethers.utils.formatEther(weiAmt);
}
