"use client";

import styles from "./page.module.css";
import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import StakeContract from "@/contracts/contract.json";
import { weiToEth, ethToWei } from "@/utils/helper-functions";
import Navbar from "@/components/Navbar/Navbar";
import Image from "next/image";
import { Bank, PiggyBank, Coin } from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.css";
import StakeModal from "@/components/Stakemodal/StakeModal";

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
    console.log("Successfully Staked Ether");
  };

  const withdraw = async (positionId) => {
    const contract = await createContractInstance(signer);
    const txn = await contract.closePosition(positionId);
    await txn.wait();
    console.log("Successfully withdrawn Ether");
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
    <div className={styles.App}>
      <div>
        <Navbar
          connectWallet={connectWallet}
          walletConnected={walletConnected}
        />
      </div>

      <div className={styles.appBody}>
        <div className={styles.marketContainer}>
          <div className={styles.subContainer}>
            <span>
              <Image
                className={styles.logoImg}
                src="/eth-logo-1.svg"
                width={1}
                height={1}
              />
            </span>
            <span className={styles.marketHeader}>Ethereum Market</span>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(30, "7%")}
                className={styles.marketOption}
              >
                <div
                  className={`${styles.glyphContainer} ${styles.hoverButton}`}
                >
                  <span className={styles.glyph}>
                    <Coin />
                  </span>
                </div>
                <div className={styles.optionData}>
                  <span>1 Month</span>
                  <span className={styles.optionPercent}>7%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(90, "10%")}
                className={styles.marketOption}
              >
                <div
                  className={`${styles.glyphContainer} ${styles.hoverButton}`}
                >
                  <span className={styles.glyph}>
                    <Coin />
                  </span>
                </div>
                <div className={styles.optionData}>
                  <span>3 Month</span>
                  <span className={styles.optionPercent}>10%</span>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div
                onClick={() => openStakingModal(180, "12%")}
                className={styles.marketOption}
              >
                <div
                  className={`${styles.glyphContainer} ${styles.hoverButton}`}
                >
                  <span className={styles.glyph}>
                    <Coin />
                  </span>
                </div>
                <div className={styles.optionData}>
                  <span>6 Month</span>
                  <span className={styles.optionPercent}>12%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.assetContainer}>
          <div className={styles.subContainer}>
            <span className={styles.marketHeader}>Staked Assets</span>
          </div>
          <div>
            <div className={`row ${styles.columnHeaders}`}>
              <div className="col-md-2">Assets</div>
              <div className="col-md-2">Percent Interest</div>
              <div className="col-md-2">Staked</div>
              <div className="col-md-2">Interest</div>
              <div className="col-md-2">Days Remaining</div>
              <div className="col-md-2"></div>
            </div>
          </div>
          <br />
          {assets.length > 0 &&
            assets.map((a, idx) => (
              <div className="row" id={idx}>
                <div className="col-md-2">
                  <span>
                    <img className={styles.stakedLogoImg} src="eth-logo.webp" />
                  </span>
                </div>
                <div className="col-md-2">{a.percentInterest} %</div>
                <div className="col-md-2">{a.etherStaked}</div>
                <div className="col-md-2">{a.etherInterest}</div>
                <div className="col-md-2">{a.daysRemaining}</div>
                <div className="col-md-2">
                  {a.open ? (
                    <div
                      onClick={() => withdraw(a.positionId)}
                      className={styles.orangeMiniButton}
                    >
                      Withdraw
                    </div>
                  ) : (
                    <span>closed</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
      {showStakeModal && (
        <StakeModal
          onClose={() => setShowStakeModal(false)}
          stakingLength={stakingLength}
          stakingPercent={stakingPercent}
          amount={amount}
          setAmount={setAmount}
          stakeEther={stakeEther}
        />
      )}
    </div>
  );
}
