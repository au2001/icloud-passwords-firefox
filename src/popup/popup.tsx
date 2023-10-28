import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";
import { PasswordsView } from "./passwords";
import { GeneratorView } from "./generator";
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
        <HashRouter>
          <Routes>
            <Route index Component={PasswordsView} />
            <Route path="/generate" Component={GeneratorView} />
          </Routes>
        </HashRouter>
      ) : (
        <ChallengeView setReady={() => setReady(true)} />
      )}
    </>
  );
}
