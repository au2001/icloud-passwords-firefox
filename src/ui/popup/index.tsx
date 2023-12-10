import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { PopupView } from "./popup";

import "./index.scss";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <HashRouter>
    <PopupView />
  </HashRouter>,
);
