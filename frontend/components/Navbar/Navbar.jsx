import styles from "./Navbar.module.css";

export default function Navbar({connectWallet, walletConnected}) {
    return (
        <div>
            <div className={styles.navBar}>
                <div className={styles.navButton}>Markets</div>
                <div className={styles.navButton}>Assets</div>
            </div>
            {walletConnected ? (
                <div className={styles.connectButton}>
                    Connected
                </div>
            ) : (
                <div
                    onClick={connectWallet}
                    className={styles.connectButton}>
                    Connect Wallet
                </div>
            )}
        </div>
    );
}