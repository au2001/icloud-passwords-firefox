(() => {
  if (globalThis.iCloudPasswordsAutoFillEnabled) return;
  globalThis.iCloudPasswordsAutoFillEnabled = true;

  console.log("iCloud Passwords auto-fill enabled.");
})();
