"use client";

import styles from "./Stakemodal.module.css";
import "bootstrap/dist/css/bootstrap.css";

export default function StakeModal({onClose, stakingLength, stakingPercent, amount, setAmount, stakeEther}) {
    return (
        <div>
            <div className={`${styles.modalClass}`} onClick={onClose}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <div>
                        <h2 className="titleHeader">Stake Ether</h2>
                        <div className="row">
                            <div className="col-md-9 fieldContainer">
                                <input
                                className={styles.inputField}
                                placeholder="0.0"
                                onChange={e => setAmount(e.target.value)}
                                />
                            </div>
                            <div className={`col-md-3 ${styles.inputFieldUnitsContainer}`}>
                                <span>ETH</span>
                            </div>
                        </div>
                        <div className="row">
                            <h6 className={styles.stakingTerms}>{stakingLength} days @ {stakingPercent} APY</h6>
                        </div>
                        <div className="row">
                            <div
                                onClick={() => stakeEther()}
                                className={styles.orangeButton}
                            >
                                Stake
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}