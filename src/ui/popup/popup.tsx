import { Route, Routes } from "react-router-dom";
import { useReady } from "../shared/hooks/use-ready";
import { ChallengeView } from "./challenge";
import { PasswordsView } from "./passwords";
import { GeneratorView } from "./generator";
import { LoadingView } from "./loading";
import { ErrorView } from "./error";

export function PopupView() {
  const { ready, error, refetch } = useReady();

  if (error !== undefined) return <ErrorView error={error} />;
  if (ready === undefined) return <LoadingView action="IS_READY" />;

  return (
    <>
      {ready ? (
        <Routes>
          <Route index Component={PasswordsView} />
          <Route path="/generate" Component={GeneratorView} />
        </Routes>
      ) : (
        <ChallengeView setReady={() => refetch()} />
      )}
    </>
  );
}
