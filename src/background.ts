import browser from "webextension-polyfill";
import { ApplePasswordManager } from "./api";

let api: ApplePasswordManager | null = null;
const getAPI = () => (api ??= new ApplePasswordManager());

getAPI().getCapabilities();

browser.runtime.onMessage.addListener(async (message, sender) => {
  sender; // TODO: Only allow valid sender

  switch (message.cmd) {
    case "IS_READY":
      return api?.ready ?? false;

    case "REQUEST_CHALLENGE_PIN":
      return await getAPI().requestChallengePIN();

    case "SET_CHALLENGE_PIN":
      getAPI().setChallengePIN(message.pake, message.pin);
      return true;

    case "GET_LOGIN_NAMES_FOR_URL":
      return await getAPI().getLoginNamesForURL(message.tabId, message.url);

    case "GET_PASSWORD_FOR_LOGIN_NAME":
      return await getAPI().getPasswordForLoginName(
        message.tabId,
        message.url,
        message.loginName,
      );

    case "AUTO_FILL_PASSWORD":
      const { password } = await getAPI().getPasswordForLoginName(
        message.tabId,
        message.url,
        message.loginName,
      );
      console.log(password); // TODO
  }
});

// browser.windows.onFocusChanged.addListener(async (windowId) => {
//   if (windowId === browser.windows.WINDOW_ID_NONE) return;

//   let tabs = await browser.tabs.query({
//     active: true,
//     currentWindow: true,
//   });

//   if (tabs.length === 0) return;

//   const tabId = tabs[0].id;
//   if (!tabId) return;

//   getAPI().sendActiveTab(tabId, true);
// });

// browser.tabs.onActivated.addListener((activeInfo) => {
//   getAPI().sendActiveTab(activeInfo.tabId, true);
// });

// browser.tabs.onRemoved.addListener((tabId) => {
//   getAPI().sendActiveTab(tabId, false);
// });

browser.runtime.onSuspend.addListener(() => {
  api?.close();
  api = null;
});
