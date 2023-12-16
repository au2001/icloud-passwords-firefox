import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import browser from "webextension-polyfill";
import { useCurrentTab } from "./hooks";
import { LoadingView } from "./loading";
import { ErrorView } from "./error";
import { CopyIcon } from "./icons/copy";
import styles from "./passwords.module.scss";

interface LoginName {
  username: string;
  sites: string[];
}

export function PasswordsView() {
  const tab = useCurrentTab();
  const [loginNames, setLoginNames] = useState<LoginName[]>();
  const [error, setError] = useState<string>();

  const fetchLoginNames = async (tabId: number, url: string) => {
    setLoginNames(undefined);
    setError(undefined);

    if (new URL(url).hostname === "") return;

    try {
      const { success, loginNames, error } = await browser.runtime.sendMessage({
        cmd: "GET_LOGIN_NAMES_FOR_URL",
        tabId,
        url,
      });

      if (error !== undefined || !success) throw error;

      setLoginNames(loginNames);
    } catch (e: any) {
      setError(e);
    }
  };

  useEffect(() => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    // Refresh passwords list every time the URL changes
    fetchLoginNames(tab.id, tab.url);
  }, [tab?.url]);

  const handleAutoFillPassword = async (
    loginName: LoginName,
    action: "AUTO_FILL" | "COPY" = "AUTO_FILL",
  ) => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    setError(undefined);

    try {
      // Can't use GET_PASSWORD_FOR_LOGIN_NAME here
      // See https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
      const { success, warnings, error } = await browser.runtime.sendMessage({
        cmd: `${action}_PASSWORD`,
        tabId: tab.id,
        url: tab.url,
        loginName,
      });

      if (error !== undefined || !success) throw error;

      (warnings as string[]).forEach((warning) => console.warn(warning));
    } catch (e: any) {
      setError(e);
    }
  };

  const handleLock = async () => {
    setError(undefined);

    try {
      const { success, error } = await browser.runtime.sendMessage({
        cmd: "LOCK",
      });

      if (error !== undefined || !success) throw error;

      // We don't want to show the challenge view right away, so we close the extension instead
      // Next time the user opens the extension, they will see the challenge view automatically
      window.close();
    } catch (e: any) {
      setError(e);
    }
  };

  if (error !== undefined) return <ErrorView error={error} />;
  if (tab?.id === undefined || tab?.url === undefined)
    return <LoadingView action="CURRENT_TAB" />;
  if (new URL(tab.url).hostname === "")
    return <ErrorView error={`URL_NOT_COMPATIBLE:${tab.url}`} />;
  if (loginNames === undefined)
    return <LoadingView action="GET_LOGIN_NAMES_FOR_URL" />;

  return (
    <div className={styles.passwords}>
      <header>
        <img src="/images/logo-32.png" alt="" />
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

      {loginNames.length > 0 ? (
        <>
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
                <div>
                  <span>{loginName.username}</span>
                  <span>{loginName.sites[0] ?? ""}</span>
                </div>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAutoFillPassword(loginName, "COPY");
                  }}
                >
                  <CopyIcon title="Copy password to clipboard" />
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>
          <br />
          No passwords saved on this website.
          <br />
          <br />
        </p>
      )}

      <hr />

      <p>
        <Link to="/generate">Create Strong Password...</Link>
      </p>
    </div>
  );
}
