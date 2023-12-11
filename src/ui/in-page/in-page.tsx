import { useLocation } from "react-router-dom";
import { Header } from "../shared/header";
import { useReady } from "../shared/hooks/use-ready";
import { ChallengeView } from "./challenge";
import { SuggestionsView } from "./suggestions";

export function InPageView() {
  const { pathname } = useLocation();
  const { ready, error } = useReady();

  const search = new URLSearchParams(pathname.substring(1));
  const tabId = parseInt(search.get("t") ?? "-1");
  const url = search.get("u") ?? window.location.href;
  const isPassword = search.get("p") === "1";
  const query = search.get("q") ?? "";

  if (error !== undefined) return <p>Error: {error}</p>;
  if (ready === undefined) return <p>Loading...</p>;

  return (
    <>
      <Header />
      {ready ? (
        <SuggestionsView
          tabId={tabId}
          url={url}
          isPassword={isPassword}
          query={query}
        />
      ) : (
        <ChallengeView />
      )}
    </>
  );
}
