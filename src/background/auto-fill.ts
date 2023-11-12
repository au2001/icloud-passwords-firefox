import browser from "webextension-polyfill";
import { ApplePasswordManager } from "../utils/api";

const CONTENT_SCRIPT_ID = "auto-fill";

export async function initializeAutoFill(api: ApplePasswordManager) {
  let [{ settings }, permissions] = await Promise.all([
    browser.storage.sync.get("settings"),
    browser.permissions.getAll(),
  ]);
  let ready = api.ready;

  const inject = async () => {
    const enabled =
      ready &&
      settings.autoFill &&
      permissions.permissions?.includes("tabs") &&
      permissions.origins?.includes("<all_urls>");

    try {
      if (enabled) {
        await browser.scripting.registerContentScripts([
          {
            id: CONTENT_SCRIPT_ID,
            matches: ["<all_urls>"],
            allFrames: true,
            js: ["/auto-fill.js"],
          },
        ]);

        (await browser.tabs.query({})).map(async (tab) => {
          if (tab.id === undefined) return;

          await browser.scripting.executeScript({
            target: {
              tabId: tab.id,
              allFrames: true,
            },
            files: ["/auto-fill.js"],
          });
        });
      } else {
        await browser.scripting.unregisterContentScripts({
          ids: [CONTENT_SCRIPT_ID],
        });
      }
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message ===
          `Content script with id "${CONTENT_SCRIPT_ID}" does not exist.` ||
          e.message ===
            `Content script with id "${CONTENT_SCRIPT_ID}" is already registered.`)
      ) {
        return;
      }

      throw e;
    }
  };

  api.addListener("ready", async (newReady) => {
    ready = newReady;
    await inject();
  });

  browser.storage.sync.onChanged.addListener(async (changes) => {
    if (changes.settings !== undefined) {
      settings = changes.settings.newValue;
      await inject();
    }
  });

  browser.permissions.onRemoved.addListener(
    async (oldPermissions: browser.Permissions.Permissions) => {
      const oldPermissionSet = new Set<string>(oldPermissions.permissions);
      const oldOriginSet = new Set(oldPermissions.origins);

      permissions = {
        permissions: permissions.permissions?.filter(
          (permission) => !oldPermissionSet.has(permission),
        ),
        origins: permissions.origins?.filter(
          (origin) => !oldOriginSet.has(origin),
        ),
      };
      await inject();
    },
  );

  browser.permissions.onAdded.addListener(
    async (newPermissions: browser.Permissions.Permissions) => {
      permissions = {
        permissions: Array.from(
          new Set(
            (permissions.permissions ?? []).concat(
              newPermissions.permissions ?? [],
            ),
          ),
        ),
        origins: Array.from(
          new Set(
            (permissions.origins ?? []).concat(newPermissions.origins ?? []),
          ),
        ),
      };
      await inject();
    },
  );

  await inject();
}
