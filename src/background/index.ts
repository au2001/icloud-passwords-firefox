import browser from "webextension-polyfill";
import { ApplePasswordManager } from "../utils/api";

const api = new ApplePasswordManager();

browser.runtime.onMessage.addListener(async (message) => {
  try {
    switch (message.cmd) {
      case "IS_READY":
        return {
          success: true,
          ready: api.ready,
        };

      case "LOCK":
        if (!api.ready) return false;

        await api.close();

        return {
          success: true,
          locked: true,
        };

      case "REQUEST_CHALLENGE_PIN":
        return {
          success: true,
          pake: await api.requestChallengePIN(),
        };

      case "SET_CHALLENGE_PIN":
        await api.setChallengePIN(message.pake, message.pin);
        return {
          success: true,
        };

      case "GET_LOGIN_NAMES_FOR_URL":
        return {
          success: true,
          loginNames: await api.getLoginNamesForURL(message.tabId, message.url),
        };

      case "GET_PASSWORD_FOR_LOGIN_NAME":
        return {
          success: true,
          loginName: await api.getPasswordForLoginName(
            message.tabId,
            message.url,
            message.loginName,
          ),
        };

      case "FILL_PASSWORD": {
        const { username, password } = await api.getPasswordForLoginName(
          message.tabId,
          message.url,
          message.loginName,
        );

        const tab = await browser.tabs.get(message.tabId);
        if (tab.id === undefined) throw "TAB_NOT_FOUND";
        if (!tab.active) throw "TAB_INACTIVE";
        if (tab.url !== message.url) throw "TAB_REDIRECTED";

        await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          files: ["./fill_password.js"],
        });

        const [{ result, error }] = await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          func: (username, password) =>
            window.iCloudPasswordsFill(username, password),
          args: [username, password],
        });

        if (error !== undefined) throw error;

        const { success, warnings } = result;
        for (const warning of warnings as string[]) {
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
        }

        return {
          success,
          warnings,
        };
      }

      case "COPY_PASSWORD": {
        const { password } = await api.getPasswordForLoginName(
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
