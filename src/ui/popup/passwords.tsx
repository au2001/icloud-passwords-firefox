import { useState } from "react";
import { Link } from "react-router-dom";
import browser from "webextension-polyfill";
import { useCurrentTab } from "../shared/hooks/use-current-tab";
import { LoginName, useLoginNames } from "../shared/hooks/use-login-names";
import { LoadingView } from "./loading";
import { ErrorView } from "./error";
import { Header } from "../shared/header";
import { KeyIcon } from "../shared/icons/key";
import { CopyIcon } from "../shared/icons/copy";
import styles from "./passwords.module.scss";

export function PasswordsView() {
  const tab = useCurrentTab();
  const { loginNames, error } = useLoginNames(tab?.id, tab?.url);
  const [fillError, setFillError] = useState<string>();

  const handleFillPassword = async (
    loginName: LoginName,
    action: "FILL" | "COPY" = "FILL",
  ) => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    setFillError(undefined);

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

      for (const warning of warnings as string[]) console.warn(warning);
    } catch (e: any) {
      setFillError(e);
    }
  };

  const handleLock = async () => {
    setFillError(undefined);

    try {
      const { success, error } = await browser.runtime.sendMessage({
        cmd: "LOCK",
      });

      if (error !== undefined || !success) throw error;

      // We don't want to show the challenge view right away, so we close the extension instead
      // Next time the user opens the extension, they will see the challenge view automatically
      window.close();
    } catch (e: any) {
      setFillError(e);
    }
  };

  if (error !== undefined) return <ErrorView error={error} />;
  if (fillError !== undefined) return <ErrorView error={fillError} />;
  if (tab?.id === undefined || tab?.url === undefined)
    return <LoadingView action="CURRENT_TAB" />;
  if (new URL(tab.url).hostname === "")
    return <ErrorView error={`URL_NOT_COMPATIBLE:${tab.url}`} />;
  if (loginNames === undefined)
    return <LoadingView action="GET_LOGIN_NAMES_FOR_URL" />;

  return (
    <div className={styles.passwords}>
      <Header sticky actionLabel="Lock" action={handleLock} />

      {loginNames.length > 0 ? (
        <>
          <h2>Choose a saved password to use:</h2>

          <ul>
            {loginNames.map((loginName, i) => (
              <li
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  handleFillPassword(loginName);
                }}
              >
                <KeyIcon title="Password item" />
                <div>
                  <span>{loginName.username}</span>
                  <span>{loginName.sites[0] ?? ""}</span>
                </div>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleFillPassword(loginName, "COPY");
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
