import React from "react";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";
import { ListView } from "./list";

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
      {ready === false && <ChallengeView setReady={() => setReady(true)} />}
      {ready === true && <ListView />}
      {ready === undefined && <p>Loading...</p>}
    </>
  );
}
