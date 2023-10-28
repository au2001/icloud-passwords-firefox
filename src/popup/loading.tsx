import { useEffect, useState } from "react";
import styles from "./loading.module.scss";
import { ErrorCode, ErrorView } from "./error";

const TIME_OUT = 10 * 1000;
const DOT_INTERVAL = 800;

export function LoadingView() {
  const [count, setCount] = useState(0);

  const timedOut = count * DOT_INTERVAL >= TIME_OUT;

  useEffect(() => {
    if (timedOut) return;

    const interval = setInterval(
      () => setCount((count) => count + 1),
      DOT_INTERVAL,
    );

    return () => clearInterval(interval);
  }, [timedOut]);

  if (timedOut) return <ErrorView code={ErrorCode.LOADING_TIMED_OUT} />;

  return <p className={styles.loading}>Loading{".".repeat((count + 3) % 4)}</p>;
}
