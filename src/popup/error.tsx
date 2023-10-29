import { useMemo } from "react";
import browser from "webextension-polyfill";
import styles from "./error.module.scss";

interface Props {
  error: string;
}

export function ErrorView({ error }: Props) {
  const message = useMemo(() => {
    const [code, param] = error.split(":", 2);

    switch (code) {
      case "AUTO_FILL_NO_PASSWORD_FIELD":
        return (
          <>
            No password field was found on the current page. Make sure you have
            the login form open.
          </>
        );

      case "AUTO_FILL_TAB_INACTIVE":
        return (
          <>
            The tab you were auto-filling on is no longer active. Auto-fill was
            cancelled.
          </>
        );

      case "AUTO_FILL_TAB_NOT_FOUND":
        return (
          <>
            The tab you were auto-filling on no longer exists. Auto-fill was
            cancelled.
          </>
        );

      case "AUTO_FILL_TAB_REDIRECTED":
        return (
          <>
            The tab you were auto-filling on changed URL. Auto-fill was
            cancelled.
          </>
        );

      case "LOADING_TIMED_OUT":
        return (
          <>
            iCloud Passwords failed to respond in time. Please try reinstalling
            the extension.
          </>
        );

      case "QUERY_DUPLICATE_ITEM":
        return <>An account already exists under that name.</>;

      case "QUERY_FAILED_TO_DELETE":
        return <>Could not delete this account.</>;

      case "QUERY_FAILED_TO_UPDATE":
        return <>Could not update this account.</>;

      case "QUERY_NO_RESULTS":
        return <>This account could not be found.</>;

      case "UNKNOWN_PROTOCOL_VERSION":
        return <>iCloud Passwords cannot save passwords on this website.</>;

      case "URL_NOT_COMPATIBLE":
        return <>iCloud Passwords cannot save passwords on this website.</>;

      case "LOCKED":
        break;

      case "DECRYPTION_FAILED":
      case "INVALID_HAMK":
      case "INVALID_PAKE":
      case "INVALID_PAKE_TID":
      case "INVALID_PIN":
      case "INVALID_SMSG":
      case "INVALID_SMSG_TID":
      case "MESSAGE_MISMATCH":
      case "MISSING_HAMK":
      case "MISSING_PAKE_B":
      case "MISSING_PAKE_MSG":
      case "MISSING_PAKE_S":
      case "MISSING_SMSG_SDATA":
      case "MISSING_SMSG_TID":
      case "PAKE_MULMOD_ERROR":
      case "QUERY_GENERIC_ERROR":
      case "QUERY_INVALID_MESSAGE_FORMAT":
      case "QUERY_INVALID_PARAM":
      case "QUERY_INVALID_SESSION":
      case "QUERY_UNKNOWN_ACTION":
      case "RANDOM_OUT_OF_RANGE":
      case "UNKNOWN_PAKE_ERROR":
      case "UNKNOWN_QUERY_STATUS":
      case "UNKNOWN_RESPONSE_PAYLOAD":
      case "UNKNOWN_RESPONSE_SMSG":
      default:
        console.error(code, param);
        return (
          <>
            An unknown error occurred. Make sure you have the latest version of
            the extension installed. If the error persists, please try
            restarting Firefox.
          </>
        );
    }
  }, [error]);

  const handleReload = async () => {
    try {
      await browser.runtime.sendMessage({
        cmd: "LOCK",
      });
    } catch (e) {}

    window.location.reload();
  };

  return (
    <div className={styles.error}>
      <h1>Error</h1>
      <p>{message}</p>

      <a
        href=""
        onClick={(e) => {
          e.preventDefault();
          handleReload();
        }}
      >
        Retry
      </a>
    </div>
  );
}
