import { Header } from "../shared/header";
import styles from "./challenge.module.scss";

export function ChallengeView() {
  return (
    <>
      <Header />

      <div className={styles.challenge}>
        <h1>Enable Password Auto-Fill</h1>
        <p>
          Click the toolbar button to enable the iCloud Passwords extension for
          Firefox.
        </p>
      </div>
    </>
  );
}
