import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import styles from "./settings.module.scss";

interface Settings {
  autoFill?: boolean;
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

  useEffect(() => {
    const listener = (newPermissions: browser.Permissions.Permissions) => {
      setPermissions((permissions) => ({
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
      }));
    };

    browser.permissions.onAdded.addListener(listener);

    return () => browser.permissions.onAdded.removeListener(listener);
  }, []);

  const setAutoFill = async (autoFill: boolean) => {
    if (autoFill) {
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
        autoFill,
      },
    });
  };

  return (
    <form className={styles.settings}>
      <fieldset>
        <input
          id="auto-fill"
          type="checkbox"
          checked={
            (settings.autoFill &&
              permissions.permissions?.includes("tabs") &&
              permissions.origins?.includes("<all_urls>")) ??
            false
          }
          onChange={(e) => setAutoFill(e.target.checked)}
        />
        <label htmlFor="auto-fill">Ask to auto-fill on login forms</label>
      </fieldset>
    </form>
  );
}
