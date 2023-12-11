import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { InPageView } from "./in-page";

import "./index.scss";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <HashRouter>
    <InPageView />
  </HashRouter>,
);
