"use client";

import styles from "./page.module.css";
import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import StakeContract from "@/contracts/contract.json";
import { weiToEth, ethToWei } from "@/utils/helper-functions";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const web3modalRef = useRef();
  const [contract, setContract] = useState(undefined);

  const [assetIds, setAssetIds] = useState([]);
  const [assets, setAssets] = useState([]);

  // Staking
  const [stakingPeriod, setStakingPeriod] = useState("");
  const [stakingPercentage, setStakingPercentage] = useState(""); // interest for staking
  const [stakeAmount, setStakeAmount] = useState(0);

  // Return a new contract instance connected to the signer
  async function createContractInstance(signer) {
    return new ethers.Contract(
      StakeContract.address,
      StakeContract.abi,
      signer
    );
  }

  async function getAssetIds(address) {
    const assetIds = await contract.getPositionIdsForAddress(address);
    setAssetIds(assetIds);
  }

  const getAssets = async (ids) => {
    const queriedAssets = await Promise.all(
      ids.map((id) => contract.getPositionById(id))
    );

    queriedAssets.map(async (asset) => {
      const parsedAsset = {
        positionId: asset.positionId,
        percentInterest: Number(asset.percentInterest) / 100,
        daysRemaining: calcDaysRemaining(Number(asset.unlockDate)),
        etherInterest: toEther(asset.weiInterest),
        etherStaked: toEther(asset.weiStaked),
        open: asset.open,
      };

      setAssets((prev) => [...prev, parsedAsset]);
    });
  };

  async function connectWallet() {
    try {
      const instance = await web3modalRef.current.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();

      if ((await provider.getNetwork()).chainId !== StakeContract.chainId) {
        window.alert("Wrong Network");
        throw new Error("Wrong Network");
      }
      setWalletConnected(true);

      // Creating a contract instance.
      const contract = await createContractInstance(signer);
      setContract(contract);

      return signer;
    } catch (error) {
      console.log(error.message);
    }
  }

  useEffect(() => {
    web3modalRef.current = new Web3Modal({
      providerOptions: {},
      network: "localhost",
      disableInjectedProvider: false,
    });
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1>Hello World</h1>
        <button onClick={connectWallet}>
          {walletConnected ? "Connected" : "Connect Wallet"}
        </button>
      </div>
    </main>
  );
}
