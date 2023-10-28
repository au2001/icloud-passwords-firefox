import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";
import { PasswordsView } from "./passwords";
import { LoadingView } from "./loading";

export function PopupView() {
  const [ready, setReady] = useState<boolean>();

  useEffect(() => {
    browser.runtime
      .sendMessage({
        cmd: "IS_READY",
      })
      .then(setReady);
  }, []);

  if (ready === undefined) return <LoadingView />;

  return (
    <>
      {ready ? (
        <PasswordsView />
      ) : (
        <ChallengeView setReady={() => setReady(true)} />
      )}
    </>
  );
}
