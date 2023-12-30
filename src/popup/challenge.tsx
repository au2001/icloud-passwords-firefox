import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { LoadingView } from "./loading";
import { ErrorView } from "./error";
import styles from "./challenge.module.scss";

interface Props {
  setReady: () => void;
}

export function ChallengeView({ setReady }: Props) {
  const [requested, setRequested] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>();

  const requestChallenge = async () => {
    setRequested(false);

    try {
      const { success, error } = await browser.runtime.sendMessage({
        cmd: "REQUEST_CHALLENGE",
      });

      if (error !== undefined || !success) throw error;

      setRequested(true);
    } catch (e: any) {
      setError(e.message ?? e.toString());
    }
  };

  const verifyChallenge = async (pin: string) => {
    setError(undefined);

    try {
      const { success, error } = await browser.runtime.sendMessage({
        cmd: "VERIFY_CHALLENGE",
        pin,
      });

      if (error !== undefined || !success) throw error;

      setReady();
    } catch (e: any) {
      setError(e.message ?? e.toString());
      await requestChallenge();
      setPin("");
    }
  };

  useEffect(() => {
    requestChallenge();
  }, []);

  useEffect(() => {
    if (!requested || pin.length !== 6) return;

    // Verifying the challenge PIN freezes the UI, so we delay it by 1 render frame for the input to have time to update one more time
    setTimeout(async () => {
      verifyChallenge(pin);
    }, 0);
  }, [requested, pin]);

  const handleChangePin = (pin: string) => {
    setError(undefined);

    pin = pin.replace(/\D/g, "");
    if (pin.length > 6) return;
    setPin(pin);
  };

  if (error !== undefined && error !== "Incorrect challenge PIN")
    return <ErrorView error={error} />;
  if (!requested) return <LoadingView action="REQUEST_CHALLENGE" />;

  return (
    <div className={styles.challenge}>
      <img src="/images/logo-128.png" alt="" />
      <div>
        <h1>Enable Password AutoFill</h1>
        <p>
          {navigator.platform === "MacIntel" ||
          navigator.userAgent.includes("Intel Mac OS X") ? (
            <>
              Enter the verification code generated by your Mac to unlock iCloud
              Keychain.
            </>
          ) : (
            <>
              Enter the verification code sent by iCloud for Windows to unlock
              iCloud Keychain.
            </>
          )}
        </p>
        <input
          type="text"
          value={pin}
          onChange={(e) => handleChangePin(e.target.value)}
          autoFocus
          disabled={pin.length === 6}
          className={error !== undefined ? styles.invalid : undefined}
        />
      </div>
    </div>
  );
}