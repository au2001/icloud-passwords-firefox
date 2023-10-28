import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { useCurrentTab } from "./hooks";
import { Loading } from "./loading";

interface LoginName {
  username: string;
  sites: string[];
}

export function ListView() {
  const tab = useCurrentTab();
  const [loginNames, setLoginNames] = useState<LoginName[]>();

  useEffect(() => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    browser.runtime
      .sendMessage({
        cmd: "GET_LOGIN_NAMES_FOR_URL",
        tabId: tab.id,
        url: tab.url,
      })
      .then(setLoginNames);
  }, [tab?.url]);

  const handleAutoFillPassword = (loginName: LoginName) => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    // Can't use GET_PASSWORD_FOR_LOGIN_NAME here
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
    browser.runtime.sendMessage({
      cmd: "AUTO_FILL_PASSWORD",
      tabId: tab.id,
      url: tab.url,
      loginName,
    });
  };

  if (
    tab?.id === undefined ||
    tab?.url === undefined ||
    loginNames === undefined
  ) {
    return <Loading />;
  }

  return (
    <>
      <h1>{new URL(tab.url).hostname}</h1>
      <ul>
        {loginNames?.map((loginName, i) => (
          <li key={i}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleAutoFillPassword(loginName);
              }}
            >
              {loginName.username}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
