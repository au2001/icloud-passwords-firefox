import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { useCurrentTab } from "./hooks";
import { Loading } from "./loading";
import styles from "./passwords.module.scss";
import { KeyIcon } from "./icons/key";

interface LoginName {
  username: string;
  sites: string[];
}

export function PasswordsView() {
  const tab = useCurrentTab();
  const [loginNames, setLoginNames] = useState<LoginName[]>();
  const [error, setError] = useState<unknown>();

  const fetchLoginNames = async (tabId: number, url: string) => {
    setLoginNames(undefined);
    setError(undefined);

    if (new URL(url).hostname === "") return;

    try {
      const loginNames = await browser.runtime.sendMessage({
        cmd: "GET_LOGIN_NAMES_FOR_URL",
        tabId,
        url,
      });

      setLoginNames(loginNames);
    } catch (e) {
      setError(e);
    }
  };

  useEffect(() => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    fetchLoginNames(tab.id, tab.url);
  }, [tab?.url]);

  const handleAutoFillPassword = async (loginName: LoginName) => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    setError(undefined);

    try {
      // Can't use GET_PASSWORD_FOR_LOGIN_NAME here
      // See https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
      await browser.runtime.sendMessage({
        cmd: "AUTO_FILL_PASSWORD",
        tabId: tab.id,
        url: tab.url,
        loginName,
      });
    } catch (e) {
      setError(e);
    }
  };

  const handleLock = async () => {
    setError(undefined);

    try {
      await browser.runtime.sendMessage({
        cmd: "LOCK",
      });

      window.close();
    } catch (e) {
      setError(e);
    }
  };

  if (tab?.id === undefined || tab?.url === undefined) return <Loading />;
  if (new URL(tab.url).hostname === "") return <p>Not compatible.</p>;
  if (loginNames === undefined) return <Loading />;
  if (loginNames.length === 0) return <p>No password.</p>;

  return (
    <div className={styles.passwords}>
      <header>
        <img src="/images/PasswordsExtensionIcon_32.png" alt="" />
        <h1>iCloud Passwords</h1>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleLock();
          }}
        >
          Lock
        </a>
      </header>

      <h2>Choose a saved password to use:</h2>

      <ul>
        {loginNames?.map((loginName, i) => (
          <li
            key={i}
            onClick={(e) => {
              e.preventDefault();
              handleAutoFillPassword(loginName);
            }}
          >
            <KeyIcon />
            <div>
              <span>{loginName.username}</span>
              <span>{loginName.sites[0] ?? ""}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
