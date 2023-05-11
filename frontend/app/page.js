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
  const [signer, setSigner] = useState(undefined);

  const [assetIds, setAssetIds] = useState([]);
  const [assets, setAssets] = useState([]);

  // Staking
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [stakingLength, setStakingLength] = useState(undefined);
  const [stakingPercent, setStakingPercent] = useState(undefined); // interest for staking
  const [stakeAmount, setStakeAmount] = useState(0);
  const [amount, setAmount] = useState(0);

  // Return a new contract instance connected to the signer
  async function createContractInstance(signer) {
    return new ethers.Contract(
      StakeContract.address,
      StakeContract.abi,
      signer
    );
  }

  async function getAssetIds(address, signer) {
    const contract = await createContractInstance(signer);
    const assetIds = await contract.getPositionIdsForAddress(address);
    setAssetIds(assetIds);
  }

  const calcDaysRemaining = (unlockDate) => {
    const timeNow = Date.now() / 1000; // unix timestamp in seconds
    const secondsRemaining = unlockDate - timeNow;
    return Math.max((secondsRemaining / 60 / 60 / 24).toFixed(0), 0);
  };

  const getAssets = async (ids, signer) => {
    const contract = await createContractInstance(signer);
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

  const openStakingModal = (stakingLength, stakingPercent) => {
    setShowStakeModal(true);
    setStakingLength(stakingLength);
    setStakingPercent(stakingPercent);
  };

  const stakeEther = async () => {
    const weiAmt = await ethToWei(amount);
    const contract = await createContractInstance(signer);
    const txn = await contract.stakeEther(stakingLength, { value: weiAmt });
    await txn.wait();
  };

  const withdraw = async (positionId) => {
    const contract = await createContractInstance(signer);
    const txn = await contract.closePosition(positionId);
    await txn.wait();
  };

  async function connectWallet() {
    try {
      const instance = await web3modalRef.current.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      setSigner(signer);
      const signerAddress = await signer.getAddress();

      if ((await provider.getNetwork()).chainId !== StakeContract.chainId) {
        window.alert("Wrong Network");
        throw new Error("Wrong Network");
      }
      setWalletConnected(true);

      // Creating a contract instance.
      const contract = await createContractInstance(signer);
      setContract(contract);

      // Loading connected user assets
      await getAssetIds(signerAddress, signer);
      if (assetIds.length !== 0) {
        await getAssets(assetIds, signer);
      }

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
