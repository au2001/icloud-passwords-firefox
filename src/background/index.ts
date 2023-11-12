import { ApplePasswordManager } from "../utils/api";
import { initializeMessaging } from "./messaging";

(async () => {
  let api = new ApplePasswordManager();

  await initializeMessaging(api);
})().catch(console.error);
