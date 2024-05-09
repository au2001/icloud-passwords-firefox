import { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export interface LoginName {
  username: string;
  sites: string[];
}

export const useLoginNames = (tabId?: number, url?: string) => {
  const [loginNames, setLoginNames] = useState<LoginName[]>();
  const [error, setError] = useState<string>();

  const refetch = async () => {
    setLoginNames(undefined);
    setError(undefined);

    if (tabId === undefined || url === undefined) return;
    if (url === "" || new URL(url).hostname === "") return;

    try {
      const { success, loginNames, error } = await browser.runtime.sendMessage({
        cmd: "GET_LOGIN_NAMES_FOR_URL",
        tabId,
        url,
      });

      if (error !== undefined || !success) throw error;

      setLoginNames(loginNames);
    } catch (e: any) {
      setError(e.message ?? e.toString());
    }
  };

  useEffect(() => {
    if (tabId === undefined || url === undefined) return;

    // Refresh passwords list every time the URL changes
    refetch();
  }, [tabId, url]);

  return { loginNames, error, refetch };
};
