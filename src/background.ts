import browser from "webextension-polyfill";
import { ApplePasswordManager } from "./api";
import { autoFillPassword } from "./auto-fill";

let api: ApplePasswordManager | null = null;
const getAPI = () => (api ??= new ApplePasswordManager());

browser.runtime.onMessage.addListener(async (message) => {
  try {
    switch (message.cmd) {
      case "IS_READY":
        return {
          success: true,
          ready: api?.ready ?? false,
        };

      case "LOCK":
        if (!api?.ready) return false;

        await api.close();
        api = null;

        return {
          success: true,
          locked: true,
        };

      case "REQUEST_CHALLENGE":
        await getAPI().connect();
        await getAPI().requestChallenge();

        try {
          // On Windows, the PIN notification closes the extension popup
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1292701
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1378527
          await browser.action.openPopup();
        } catch (e) {
          // https://bugzilla.mozilla.org/show_bug.cgi?id=1799344
        }

        return {
          success: true,
        };

      case "VERIFY_CHALLENGE":
        await getAPI().verifyChallenge(message.pin);
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
        if (tab.id === undefined)
          throw new Error("AutoFill failed: tab no longer exists");
        if (!tab.active)
          throw new Error("AutoFill failed: tab is no longer active");
        if (tab.url !== message.url)
          throw new Error("AutoFill failed: tab has changed URL");

        const [{ result, error }] = await browser.scripting.executeScript({
          target: {
            tabId: tab.id,
          },
          func: autoFillPassword,
          args: [username, password],
        });

        if (error !== undefined) throw error;

        const { success, warnings } = result;
        (warnings as string[]).forEach((warning) => console.warn(warning));

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
    console.error(e);
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
