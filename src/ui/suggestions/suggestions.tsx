import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export function SuggestionsView() {
  const [ready, setReady] = useState<boolean>();
  const [error, setError] = useState<string>();

  const checkReady = async () => {
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
    checkReady();
  }, []);

  if (error !== undefined) return <p>Error: {error}</p>;
  if (ready === undefined) return <p>Loading...</p>;

  return <>{ready ? <p>Suggestions:</p> : <p>Please login</p>}</>;
}
