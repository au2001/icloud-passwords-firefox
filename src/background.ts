import browser from "webextension-polyfill";
import { ApplePasswordManager } from "./api";
import { autoFillPassword } from "./auto-fill";

let api: ApplePasswordManager | null = null;
const getAPI = () => (api ??= new ApplePasswordManager());

getAPI().getCapabilities();

browser.runtime.onMessage.addListener(async (message, sender) => {
  try {
    sender; // TODO: Only allow valid sender

    switch (message.cmd) {
      case "IS_READY":
        return api?.ready ?? false;

      case "LOCK":
        if (!api?.ready) return false;

        api.close();
        api = null;
        return true;

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

      case "AUTO_FILL_PASSWORD": {
        const { username, password } = await getAPI().getPasswordForLoginName(
          message.tabId,
          message.url,
          message.loginName,
        );

        const tab = await browser.tabs.get(message.tabId);
        if (tab.id === undefined) {
          throw new Error(
            `Failed to find tab ${message.tabId}, stopping auto-fill`,
          );
        } else if (!tab.active) {
          throw new Error(
            `Tab ${message.tabId} no longer active, stopping auto-fill`,
          );
        } else if (tab.url !== message.url) {
          throw new Error(
            `Tab ${message.tabId} got redirected from ${message.url} to ${tab.url}, stopping auto-fill`,
          );
        }

        const results = await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          func: autoFillPassword,
          args: [username, password],
        });

        const errors = results.flatMap(({ error }) => error ?? []);
        if (errors.length !== 0) throw errors.length === 1 ? errors[0] : errors;

        return true;
      }

      case "COPY_PASSWORD": {
        const { password } = await getAPI().getPasswordForLoginName(
          message.tabId,
          message.url,
          message.loginName,
        );

        await navigator.clipboard.writeText(password);

        return true;
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
});

browser.runtime.onSuspend.addListener(() => {
  api?.close();
  api = null;
});
