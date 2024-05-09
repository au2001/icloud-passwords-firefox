import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styles from "./settings.module.scss";

interface Settings {
  inPage?: boolean;
}

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>({});
  const [permissions, setPermissions] =
    useState<browser.Permissions.AnyPermissions>({});

  useEffect(() => {
    browser.storage.sync
      .get("settings")
      .then(({ settings }) => setSettings(settings ?? {}));

    browser.permissions
      .getAll()
      .then((permissions) => setPermissions(permissions));
  }, []);

  useEffect(() => {
    const listener = (
      changes: browser.Storage.StorageAreaSyncOnChangedChangesType,
    ) => {
      if (changes.settings !== undefined)
        setSettings(changes.settings.newValue);
    };

    browser.storage.sync.onChanged.addListener(listener);

    return () => browser.storage.sync.onChanged.removeListener(listener);
  }, []);

  useEffect(() => {
    const listener = (newPermissions: browser.Permissions.Permissions) => {
      setPermissions((permissions) => ({
        permissions: [
          ...new Set(
            (permissions.permissions ?? []).concat(
              newPermissions.permissions ?? [],
            ),
          ),
        ],
        origins: [
          ...new Set(
            (permissions.origins ?? []).concat(newPermissions.origins ?? []),
          ),
        ],
      }));
    };

    browser.permissions.onAdded.addListener(listener);

    return () => browser.permissions.onAdded.removeListener(listener);
  }, []);

  useEffect(() => {
    const listener = (oldPermissions: browser.Permissions.Permissions) => {
      const oldPermissionSet = new Set<string>(oldPermissions.permissions);
      const oldOriginSet = new Set(oldPermissions.origins);

      setPermissions((permissions) => ({
        permissions: permissions.permissions?.filter(
          (permission) => !oldPermissionSet.has(permission),
        ),
        origins: permissions.origins?.filter(
          (origin) => !oldOriginSet.has(origin),
        ),
      }));
    };

    browser.permissions.onRemoved.addListener(listener);

    return () => browser.permissions.onRemoved.removeListener(listener);
  }, []);

  const setInPage = async (inPage: boolean) => {
    if (inPage) {
      const success = await browser.permissions.request({
        permissions: ["tabs"],
        origins: ["<all_urls>"],
      });

      if (!success) return;
    } else {
      const success = await browser.permissions.remove({
        permissions: ["tabs"],
        origins: ["<all_urls>"],
      });

      if (!success) return;
    }

    await browser.storage.sync.set({
      settings: {
        ...settings,
        inPage,
      },
    });
  };

  return (
    <form className={styles.settings}>
      <fieldset>
        <input
          id="in-page"
          type="checkbox"
          checked={
            (settings.inPage &&
              permissions.permissions?.includes("tabs") &&
              permissions.origins?.includes("<all_urls>")) ??
            false
          }
          onChange={(e) => setInPage(e.target.checked)}
        />
        <label htmlFor="in-page">In-Page Auto-Fill</label>
      </fieldset>
    </form>
  );
}
