import React from "react";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";

export function Popup() {
  const [ready, setReady] = React.useState<boolean>();

  React.useEffect(() => {
    browser.runtime
      .sendMessage({
        cmd: "IS_READY",
      })
      .then(setReady);
  }, []);

  return (
    <>
      {ready === false && <ChallengeView />}
      {ready === true && <ChallengeView />}
    </>
  );
}
