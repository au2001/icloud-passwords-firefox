import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";
import { ListView } from "./list";
import { Loading } from "./loading";

export function Popup() {
  const [ready, setReady] = useState<boolean>();

  useEffect(() => {
    browser.runtime
      .sendMessage({
        cmd: "IS_READY",
      })
      .then(setReady);
  }, []);

  if (ready === undefined) return <Loading />;

  return (
    <>
      {ready ? <ListView /> : <ChallengeView setReady={() => setReady(true)} />}
    </>
  );
}
