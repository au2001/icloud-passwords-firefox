import { useEffect, useState } from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import browser from "webextension-polyfill";
import { ChallengeView } from "./challenge";
import { PasswordsView } from "./passwords";
import { GeneratorView } from "./generator";
import { LoadingView } from "./loading";
import { ErrorView } from "./error";

export function PopupView() {
  const [ready, setReady] = useState<boolean>();
  const [error, setError] = useState<string>();

  const checkReady = async () => {
    try {
      const { success, ready, error } = await browser.runtime.sendMessage({
        cmd: "IS_READY",
      });

      if (error !== undefined || !success) throw error;

      setReady(ready);
    } catch (e: any) {
      setError(e);
    }
  };

  useEffect(() => {
    checkReady();
  }, []);

  if (error !== undefined) return <ErrorView error={error} />;
  if (ready === undefined) return <LoadingView action="IS_READY" />;

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
