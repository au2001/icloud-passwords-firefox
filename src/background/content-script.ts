import browser from "webextension-polyfill";
import { LoginForm, getLoginForms } from "../utils/dom";
import { throttle } from "../utils/timings";

let observing = new Map<HTMLInputElement, () => void>();

const observe = (input: HTMLInputElement, form: LoginForm) => {
  let iframe: HTMLIFrameElement | undefined;

  const onFocus = () => {
    if (iframe !== undefined) return;

    iframe = document.createElement("iframe");
    iframe.src = browser.runtime.getURL("./in_page.html");

    const style = {
      "z-index": "2147483647",
      position: "absolute",
      top: `${input.offsetTop + input.offsetHeight}px`,
      left: `${input.offsetLeft}px`,
      width: `${Math.max(input.offsetWidth, 300)}px`,
      height: "200px",
      border: "none",
      "border-radius": "8px",
      display: "none",
    };

    for (const [property, value] of Object.entries(style))
      iframe.style.setProperty(property, value, "important");

    iframe.addEventListener("load", function () {
      this.style.removeProperty("display");
    });
    input.insertAdjacentElement("afterend", iframe);
  };

  const onBlur = () => {
    iframe?.remove();
    iframe = undefined;
  };

  if (input === document.activeElement) onFocus();

  input.addEventListener("focus", onFocus);
  input.addEventListener("blur", onBlur);

  const cleanup = () => {
    input.removeEventListener("focus", onFocus);
    input.removeEventListener("blur", onBlur);
  };
  observing.set(input, cleanup);
};

const refresh = throttle(() => {
  const forms = getLoginForms();

  const oldInputs = new Map(observing);
  for (const form of forms) {
    if (form.usernameInput !== null && !oldInputs.delete(form.usernameInput))
      observe(form.usernameInput, form);

    if (!oldInputs.delete(form.passwordInput))
      observe(form.passwordInput, form);
  }

  for (const [input, cleanup] of Array.from(oldInputs.entries())) {
    observing.delete(input);
    cleanup();
  }
});

refresh();

new MutationObserver(() => refresh()).observe(document.body, {
  subtree: true,
  childList: true,
});
