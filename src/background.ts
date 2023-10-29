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
        return {
          success: true,
          ready: api?.ready ?? false,
        };

      case "LOCK":
        if (!api?.ready) return false;

        api.close();
        api = null;
        return {
          success: true,
          locked: true,
        };

      case "REQUEST_CHALLENGE_PIN":
        return {
          success: true,
          pake: await getAPI().requestChallengePIN(),
        };

      case "SET_CHALLENGE_PIN":
        await getAPI().setChallengePIN(message.pake, message.pin);
        return {
          success: true,
        };

      case "GET_LOGIN_NAMES_FOR_URL":
        return {
          success: true,
          loginNames: await getAPI().getLoginNamesForURL(
            message.tabId,
            message.url,
          ),
        };

      case "GET_PASSWORD_FOR_LOGIN_NAME":
        return {
          success: true,
          loginName: await getAPI().getPasswordForLoginName(
            message.tabId,
            message.url,
            message.loginName,
          ),
        };

      case "AUTO_FILL_PASSWORD": {
        const { username, password } = await getAPI().getPasswordForLoginName(
          message.tabId,
          message.url,
          message.loginName,
        );

        const tab = await browser.tabs.get(message.tabId);
        if (tab.id === undefined) throw "AUTO_FILL_TAB_NOT_FOUND";
        if (!tab.active) throw "AUTO_FILL_TAB_INACTIVE";
        if (tab.url !== message.url) throw "AUTO_FILL_TAB_REDIRECTED";

        const [{ result, error }] = await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          func: autoFillPassword,
          args: [username, password],
        });

        if (error !== undefined) throw error;

        const { success, warnings } = result;
        (warnings as string[]).forEach((warning) => {
          switch (warning) {
            case "MULTIPLE_PASSWORD_FIELDS":
              console.warn(
                `Multiple password input fields found on ${window.location}`,
              );
              break;

            case "NO_USERNAME_FIELD":
              console.warn(
                `No username input field found on ${window.location}`,
              );
              break;

            default:
              console.warn(warning);
          }
        });

        return {
          success,
          warnings,
        };
      }

      case "COPY_PASSWORD": {
        const { password } = await getAPI().getPasswordForLoginName(
          message.tabId,
          message.url,
          message.loginName,
        );

        await navigator.clipboard.writeText(password);

        return {
          success: true,
        };
      }
    }
  } catch (e) {
    return {
      success: false,
      error: e,
    };
  }
});

browser.runtime.onSuspend.addListener(() => {
  api?.close();
  api = null;
});
