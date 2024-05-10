import { useLocation } from "react-router-dom";
import { useReady } from "../shared/hooks/use-ready";
import { ChallengeView } from "./challenge";
import { SuggestionsView } from "./suggestions";
import { ErrorView } from "../shared/error";
import { LoadingView } from "../shared/loading";

export function InPageView() {
  const { pathname } = useLocation();
  const { ready, error } = useReady();

  const search = new URLSearchParams(pathname.substring(1));
  const url = search.get("u") ?? window.location.href;
  const isPassword = search.get("p") === "1";
  const query = search.get("q") ?? "";

  if (error !== undefined) return <ErrorView error={error} />;
  if (ready === undefined) return <LoadingView action="IS_READY" />;

  return (
    <>
      {ready ? (
        <SuggestionsView url={url} isPassword={isPassword} query={query} />
      ) : (
        <ChallengeView />
      )}
    </>
  );
}
