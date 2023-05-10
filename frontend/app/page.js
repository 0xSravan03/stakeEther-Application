"use client";

import styles from "./page.module.css";
import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import Contract from "@/contracts/contract.json";
import { weiToEth, ethToWei } from "@/utils/helper-functions";

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const web3modalRef = useRef();

  // Staking
  const [stakingPeriod, setStakingPeriod] = useState("");
  const [stakingPercentage, setStakingPercentage] = useState(""); // interest for staking
  const [stakeAmount, setStakeAmount] = useState(0);

  async function connectWallet() {
    try {
      const instance = await web3modalRef.current.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();

      if ((await provider.getNetwork()).chainId !== Contract.chainId) {
        window.alert("Wrong Network");
        throw new Error("Wrong Network");
      }
      setWalletConnected(true);
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
        <button onClick={connectWallet}>Connect Wallet</button>
      </div>
    </main>
  );
}
