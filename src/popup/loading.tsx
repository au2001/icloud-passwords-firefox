import { useEffect, useState } from "react";
import styles from "./styles.module.scss";

export function Loading() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCount((count) => count + 1), 800);

    return () => clearInterval(interval);
  }, []);

  return <p className={styles.loading}>Loading{".".repeat(count % 4)}</p>;
}
