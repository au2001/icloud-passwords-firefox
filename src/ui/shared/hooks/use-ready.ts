import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export const useReady = () => {
  const [ready, setReady] = useState<boolean>();
  const [error, setError] = useState<string>();

  const refetch = async () => {
    try {
      const { success, ready, error } = await browser.runtime.sendMessage({
        cmd: "IS_READY",
      });

      if (error !== undefined || !success) throw error;

      setReady(ready);
    } catch (e: any) {
      setError(e);
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  return { ready, error, refetch };
};
