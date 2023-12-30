import browser, { Runtime } from "webextension-polyfill";
import { Buffer } from "buffer";
import {
  Action,
  Command,
  MSGTypes,
  QueryStatus,
  SecretSessionVersion,
} from "./enums";
import { SRPSession } from "./srp";
import { readBigInt, throwQueryStatusError, toBase64 } from "./utils";

const BROWSER_NAME = "Firefox";
const VERSION = "1.0";

export class ApplePasswordManager {
  private readonly events = new EventTarget();

  private port?: Runtime.Port;
  private session?: SRPSession;
  private lock = false;

  get ready() {
    // TODO: Check if encryption key has successfully been acquired
    return (
      this.port !== undefined &&
      this.session !== undefined &&
      this.session.serverPublicKey !== undefined &&
      this.session.salt !== undefined &&
      this.session.sharedKey !== undefined
    );
  }

  private async _postMessage<T extends Command, R = any>(
    cmd: T,
    body: object = {},
    delay = 1000,
  ) {
    if (this.port === undefined)
      throw new Error("Invalid session state: connection closed");
    if (this.lock) throw new Error("Invalid session state: locked");
    this.lock = true;

    try {
      const response = new Promise<R | undefined>((resolve, reject) => {
        let timeout: NodeJS.Timeout | undefined;

        const cleanup = () => {
          if (timeout !== undefined) {
            clearTimeout(timeout);
            timeout = undefined;
          }

          this.events.removeEventListener("message", onMessage);
          this.events.removeEventListener("error", onError);
        };

        const onMessage = (event: Event) => {
          const message = (event as CustomEvent).detail ?? event;
          if (message.cmd !== cmd) return;
          cleanup();
          return resolve(message);
        };

        const onError = (event: Event) => {
          const error = (event as CustomEvent).detail ?? event;
          cleanup();
          return reject(error);
        };

        this.events.addEventListener("message", onMessage);
        this.events.addEventListener("error", onError);

        timeout = setTimeout(() => {
          timeout = undefined;
          cleanup();
          resolve(undefined);
        }, delay);
      });

      this.port.postMessage({
        cmd,
        ...body,
      });

      return await response;
    } finally {
      this.lock = false;
    }
  }

  async connect() {
    if (this.port === undefined) {
      this.port = browser.runtime.connectNative("com.apple.passwordmanager");

      this.port?.onMessage.addListener((message, port) => {
        if (this.port !== port) return;

        this.events.dispatchEvent(
          new CustomEvent("message", {
            cancelable: false,
            detail: message,
          }),
        );
      });

      this.port?.onDisconnect.addListener((port) => {
        if (this.port !== port) return;

        this.events.dispatchEvent(
          new CustomEvent("error", {
            cancelable: false,
            detail: port.error ?? browser.runtime.lastError,
          }),
        );

        delete this.port;
      });

      delete this.session;
    }

    if (this.session === undefined) {
      const { capabilities } = await this._postMessage(
        Command.GET_CAPABILITIES,
      );

      if (capabilities.shouldUseBase64 !== true)
        throw new Error("Unsupported capabilities: should use base64");

      if (
        capabilities.secretSessionVersion !== undefined &&
        capabilities.secretSessionVersion !==
          SecretSessionVersion.SRP_WITH_RFC_VERIFICATION
      ) {
        throw new Error(
          "Unsupported capabilities: should use RFC verification",
        );
      }

      this.session = await SRPSession.new();
    }
  }

  async requestChallenge() {
    if (this.session === undefined)
      throw new Error("Invalid session state: not initialized");

    delete this.session.serverPublicKey;
    delete this.session.salt;
    delete this.session.sharedKey;

    const { payload } = await this._postMessage(Command.HANDSHAKE, {
      msg: {
        QID: "m0",
        PAKE: toBase64({
          TID: this.session.username,
          MSG: MSGTypes.CLIENT_KEY_EXCHANGE,
          A: toBase64(this.session.clientPublicKey),
          VER: VERSION,
          PROTO: [SecretSessionVersion.SRP_WITH_RFC_VERIFICATION],
        }),
        HSTBRSR: BROWSER_NAME,
      },
    });

    let pake;
    try {
      pake = JSON.parse(Buffer.from(payload.PAKE, "base64").toString("utf8"));
    } catch (e) {
      throw new Error("Invalid server hello: missing payload");
    }

    if (pake.TID !== this.session.username)
      throw new Error("Invalid server hello: destined to another session");

    if (pake.MSG !== MSGTypes.SERVER_KEY_EXCHANGE)
      throw new Error("Invalid server hello: unexpected message");

    if (pake.PROTO !== SecretSessionVersion.SRP_WITH_RFC_VERIFICATION)
      throw new Error("Invalid server hello: unsupported protocol");

    if ("VER" in pake && pake.VER !== VERSION)
      throw new Error("Invalid server hello: unsupported version");

    const serverPublicKey = readBigInt(Buffer.from(pake.B, "base64"));
    const salt = readBigInt(Buffer.from(pake.s, "base64"));
    this.session.setServerPublicKey(serverPublicKey, salt);
  }

  async verifyChallenge(password: string) {
    if (this.session === undefined)
      throw new Error("Invalid session state: not initialized");

    await this.session.setSharedKey(password);

    const { payload } = await this._postMessage(Command.HANDSHAKE, {
      msg: {
        QID: "m2",
        PAKE: toBase64({
          TID: this.session.username,
          MSG: MSGTypes.CLIENT_VERIFICATION,
          M: toBase64(await this.session.computeM()),
        }),
      },
    });

    let pake;
    try {
      pake = JSON.parse(Buffer.from(payload.PAKE, "base64").toString("utf8"));
    } catch (e) {
      throw new Error("Invalid server verification: missing payload");
    }

    if (pake.TID !== this.session.username) {
      throw new Error(
        "Invalid server verification: destined to another session",
      );
    }

    if (pake.MSG !== MSGTypes.SERVER_VERIFICATION)
      throw new Error("Invalid server verification: unexpected message");

    if (pake.ErrCode !== 0) {
      switch (pake.ErrCode) {
        case 1:
          throw new Error("Incorrect challenge PIN");

        default:
          throw new Error(
            `Invalid server verification: error code ${pake.ErrCode}`,
          );
      }
    }

    // TODO: Verify HAMK
    console.log("HAMK", pake.HAMK);
  }

  async sendActiveTab(tabId: number, active: boolean) {
    await this._postMessage(Command.TAB_EVENT, {
      tabId,
      event: active ? 1 : 0,
    });
  }

  async getLoginNamesForURL(tabId: number, url: string) {
    if (this.session === undefined)
      throw new Error("Invalid session state: not initialized");

    const { hostname } = new URL(url);

    const sdata = toBase64(
      await this.session.encrypt({
        ACT: Action.GHOST_SEARCH,
        URL: hostname,
      }),
    );

    const { payload } = await this._postMessage(
      Command.GET_LOGIN_NAMES_FOR_URL,
      {
        tabId,
        frameId: 0,
        url: hostname,
        payload: {
          QID: "CmdGetLoginNames4URL",
          SMSG: {
            TID: this.session.username,
            SDATA: sdata,
          },
        },
      },
    );

    if (payload.SMSG.TID !== this.session.username)
      throw new Error("Invalid server response: destined to another session");

    let response;
    try {
      const data = await this.session.decrypt(
        Buffer.from(payload.SMSG.SDATA, "base64"),
      );
      response = JSON.parse(data.toString("utf8"));
    } catch (e) {
      console.error(e);
      throw new Error("Invalid server response: missing payload");
    }

    switch (response.STATUS) {
      case QueryStatus.SUCCESS:
        return (response.Entries as any[]).map(({ USR, sites }) => ({
          username: USR,
          sites,
        }));

      case QueryStatus.NO_RESULTS:
        return [];

      default:
        throwQueryStatusError(response.STATUS);
    }
  }

  async getPasswordForLoginName(
    tabId: number,
    url: string,
    loginName: { username: string; sites: string[] },
  ) {
    if (this.session === undefined)
      throw new Error("Invalid session state: not initialized");

    const { hostname } = new URL(url);

    const sdata = toBase64(
      await this.session.encrypt({
        ACT: Action.SEARCH,
        URL: hostname,
        USR: loginName.username,
      }),
    );

    const { payload } = await this._postMessage(
      Command.GET_PASSWORD_FOR_LOGIN_NAME,
      {
        tabId,
        frameId: 0,
        url: loginName.sites?.[0] ?? hostname,
        payload: {
          QID: "CmdGetPassword4LoginName",
          SMSG: {
            TID: this.session.username,
            SDATA: sdata,
          },
        },
      },
      60 * 1000,
    );

    if (payload.SMSG.TID !== this.session.username)
      throw new Error("Invalid server response: destined to another session");

    let response;
    try {
      const data = await this.session.decrypt(
        Buffer.from(payload.SMSG.SDATA, "base64"),
      );
      response = JSON.parse(data.toString("utf8"));
    } catch (e) {
      throw new Error("Invalid server response: missing payload");
    }

    switch (response.STATUS) {
      case QueryStatus.SUCCESS:
        return (response.Entries as any[]).map(({ USR, PWD, sites }) => ({
          username: USR,
          password: PWD,
          sites,
        }))[0];

      default:
        throwQueryStatusError(response.STATUS);
    }
  }

  async close() {
    const port = this.port;
    if (port === undefined) return;

    this._postMessage(Command.END);

    await new Promise<void>((resolve) => {
      port.onDisconnect.addListener(() => resolve());
    });
  }
}
