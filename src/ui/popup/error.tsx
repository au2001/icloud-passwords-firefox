import { useMemo } from "react";
import browser from "webextension-polyfill";
import styles from "./error.module.scss";

interface Props {
  error: string;
}

export function ErrorView({ error }: Props) {
  const message = useMemo(() => {
    const [code, param] = error?.toString().split(":", 2) ?? [];
    param;

    switch (code) {
      case "LOADING_TIMED_OUT":
        return (
          <>
            iCloud Passwords failed to respond in time. Please try reinstalling
            the extension.
          </>
        );

      case "MISSING_CONNECT_NATIVE_HOST":
        if (
          navigator.platform === "MacIntel" ||
          navigator.userAgent.includes("Intel Mac OS X")
        ) {
          return (
            <>
              iCloud Passwords requires macOS Sonoma or later to be installed.
              Please upgrade to be able to use this extension.
            </>
          );
        } else {
          let downloadUrl: string | undefined;

          const windowsVersion = /\(Windows\s*\w*\s*(\d+)[._](\d+)/i.exec(
            navigator.userAgent,
          );
          if (windowsVersion !== null && windowsVersion.length !== 3) {
            const major = parseInt(windowsVersion?.[1], 10),
              minor = parseInt(windowsVersion?.[2], 10);

            if (major >= 10) {
              // Windows 10+
              downloadUrl = "ms-windows-store://pdp/?productid=9PKTQ5699M62";
            } else if (major >= 6 && minor >= 1) {
              // Windows 7-8 (NT 6.1 - 6.3)
              downloadUrl = "https://support.apple.com/kb/DL1455";
            }
          }

          if (downloadUrl !== undefined) {
            return (
              <>
                iCloud Passwords requires iCloud for Windows to be installed.
                You can download it{" "}
                <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                  here
                </a>
                .
              </>
            );
          } else {
            return (
              <>
                iCloud Passwords is designed to run on Windows 10 or later.
                Please upgrade to be able to use this extension.
              </>
            );
          }
        }

      case "MISSING_CONNECT_NATIVE_PERMISSION":
        return (
          <>
            The setup process could not complete successfully. Follow{" "}
            <a
              href="https://github.com/aurelien-garnier/icloud-passwords-firefox#README"
              target="_blank"
              rel="noopener noreferrer"
            >
              these instructions
            </a>{" "}
            to use the extension.
          </>
        );

      case "NO_PASSWORD_FIELD":
        return (
          <>
            No password field was found on the current page. Make sure you have
            the login form open.
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

      case "TAB_INACTIVE":
        return (
          <>
            The tab you were auto-filling on is no longer active. Auto-fill was
            cancelled.
          </>
        );

      case "TAB_NOT_FOUND":
        return (
          <>
            The tab you were auto-filling on no longer exists. Auto-fill was
            cancelled.
          </>
        );

      case "TAB_REDIRECTED":
        return (
          <>
            The tab you were auto-filling on changed URL. Auto-fill was
            cancelled.
          </>
        );

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
        if (error) console.error(error);
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
    } catch (e) {
      // Can't do much, we'll try reloading the page anyway
    }

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
