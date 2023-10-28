import { useMemo } from "react";
import styles from "./error.module.scss";

export enum ErrorCode {
  URL_NOT_COMPATIBLE,
  LOADING_TIMED_OUT,
}

interface Props {
  code: ErrorCode;
}

export function ErrorView({ code }: Props) {
  const message = useMemo(() => {
    switch (code) {
      case ErrorCode.URL_NOT_COMPATIBLE:
        return <>iCloud Passwords cannot save passwords on this website.</>;

      case ErrorCode.LOADING_TIMED_OUT:
        return (
          <>
            iCloud Passwords failed to respond in time. Please try reinstalling
            the extension.
          </>
        );

      default:
        console.error(code);
        return (
          <>
            An unknown error occurred. Please try restarting Firefox. If the
            issue persists, report the bug here.
          </>
        );
    }
  }, [code]);

  return (
    <div className={styles.error}>
      <h1>Error</h1>
      <p>{message}</p>
    </div>
  );
}
