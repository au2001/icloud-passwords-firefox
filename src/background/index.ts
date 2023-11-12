import { ApplePasswordManager } from "../utils/api";
import { initializeMessaging } from "./messaging";
import { initializeAutoFill } from "./auto-fill";

(async () => {
  let api = new ApplePasswordManager();

  await Promise.all([initializeMessaging(api), initializeAutoFill(api)]);
})().catch(console.error);
