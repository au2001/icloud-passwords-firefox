import React from "react";
import browser from "webextension-polyfill";
import { useCurrentTab } from "./hooks";

interface LoginName {
  username: string;
  sites: string[];
}

export function ListView() {
  const tab = useCurrentTab();
  const [loginNames, setLoginNames] = React.useState<LoginName[]>();

  React.useEffect(() => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    browser.runtime
      .sendMessage({
        cmd: "GET_LOGIN_NAMES",
        tabId: tab.id,
        url: tab.url,
      })
      .then(setLoginNames);
  }, [tab?.url]);

  const handleAutoFillLogin = (loginName: LoginName) => {
    if (tab?.id === undefined || tab?.url === undefined) return;

    console.log(loginName.username);
  };

  if (
    tab?.id === undefined ||
    tab?.url === undefined ||
    loginNames === undefined
  ) {
    return <p>Loading...</p>;
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
                handleAutoFillLogin(loginName);
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
