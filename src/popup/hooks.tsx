import React from "react";
import browser from "webextension-polyfill";

export function useCurrentTab() {
  const [window, setWindow] = React.useState<browser.Windows.Window>();
  const [tab, setTab] = React.useState<browser.Tabs.Tab>();

  React.useEffect(() => {
    browser.windows.getCurrent().then(setWindow);
  }, []);

  React.useEffect(() => {
    if (window?.id === undefined) return;

    browser.tabs
      .query({
        windowId: window.id,
        active: true,
      })
      .then(([tab]) => setTab(tab));

    const listener = async (
      activeInfo: browser.Tabs.OnActivatedActiveInfoType,
    ) => {
      if (activeInfo.windowId !== window.id) return;

      const tab = await browser.tabs.get(activeInfo.tabId);
      if (tab.windowId !== window.id || !tab.active) return;
      setTab(tab);
    };

    browser.tabs.onActivated.addListener(listener);
    return () => browser.tabs.onActivated.removeListener(listener);
  }, [window]);

  React.useEffect(() => {
    if (tab?.id === undefined || tab.id === browser.tabs.TAB_ID_NONE) return;

    const listener = (
      _tabId: number,
      _changeInfo: browser.Tabs.OnUpdatedChangeInfoType,
      tab: browser.Tabs.Tab,
    ) => {
      setTab(tab);
    };

    browser.tabs.onUpdated.addListener(listener, { tabId: tab.id });
    return () => browser.tabs.onUpdated.removeListener(listener);
  }, [tab]);

  return tab;
}
