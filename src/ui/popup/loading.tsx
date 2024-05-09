import { useEffect, useState } from "react";
import { ErrorView } from "./error";
import styles from "./loading.module.scss";

const TIME_OUT = 10 * 1000;
const DOT_INTERVAL = 800;

interface Props {
  action: string;
}

export function LoadingView({ action }: Props) {
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

  if (timedOut)
    return (
      <ErrorView error={`Loading timed out while waiting for ${action}`} />
    );

  return <p className={styles.loading}>Loading{".".repeat((count + 3) % 4)}</p>;
}
