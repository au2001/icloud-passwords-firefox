import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { SettingsView } from "./settings";

import "./index.scss";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <HashRouter>
    <SettingsView />
  </HashRouter>,
);
