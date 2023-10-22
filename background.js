const port = browser.runtime.connectNative("com.apple.passwordmanager");

port.onMessage.addListener((response) => {
  console.log(`Received: ${response}`);
});

browser.action.onClicked.addListener(() => {
  console.log("Sending:  ping");
  port.postMessage("ping");
});
