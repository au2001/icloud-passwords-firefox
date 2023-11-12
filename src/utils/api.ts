import sjcl from "sjcl";
import browser, { Runtime } from "webextension-polyfill";
import { EventEmitter } from "events";
import {
  Action,
  BROWSER_NAME,
  Command,
  GRP,
  KEY_LEN,
  MSGTypes,
  QUERY_STATUS_ERRORS,
  QueryStatus,
  SecretSessionVersion,
} from "./constants";
import {
  bitsToString,
  calculateM,
  calculateX,
  createSessionKey,
  decrypt,
  encrypt,
  randomWords,
  stringToBase64,
  stringToBits,
} from "./crypto";

export class ApplePasswordManager extends EventEmitter {
  private readonly tid: sjcl.BigNumber;
  private readonly a: sjcl.BigNumber;

  private port?: Runtime.Port;
  private capabilities?: {
    shouldUseBase64: boolean;
    secretSessionVersion: SecretSessionVersion;
    canFillOneTimeCodes?: boolean;
    operatingSystem: {
      majorVersion?: number;
      minorVersion?: number;
      name?: string;
    };
    supportsSubURLs: boolean;
    scanForOTPURI: boolean;
  };
  private verifier?: sjcl.BigNumber;
  private encKey?: sjcl.BitArray;

  constructor() {
    super();

    // Setup SecureRemotePassword (SRP)
    this.tid = sjcl.bn.fromBits(randomWords(4));
    this.a = sjcl.bn.fromBits(randomWords(8));
  }

  private _connect() {
    if (this.port === undefined) {
      this.port = browser.runtime.connectNative("com.apple.passwordmanager");

      this.port.onDisconnect.addListener((port) => {
        if (this.port !== port) return;

        const message = port.error?.message ?? browser.runtime.lastError?.message;

        let error;
        switch (message) {
          case "No such native application com.apple.passwordmanager":
          case "Specified native messaging host not found.":
            error = "MISSING_CONNECT_NATIVE_HOST";
            break;

          case "Access to the specified native messaging host is forbidden.":
            error = "MISSING_CONNECT_NATIVE_PERMISSION";
            break;

          default:
            error = message;
            break;
        }

        this.emit("error", error);

        this.port = undefined;
      });
    }

    return this.port;
  }

  private async _readResponse<T extends Command>(cmd: T) {
    return await new Promise((resolve, reject) => {
      let port: browser.Runtime.Port;

      const callback = async (response: object) => {
        if (!("cmd" in response) || response.cmd !== cmd) return;

        try {
          if ("payload" in response) {
            const payload = response.payload;

            if (typeof payload === "object" && payload !== null) {
              response = payload;
            } else if (typeof payload === "string") {
              // Do nothing
            } else {
              throw `UNKNOWN_RESPONSE_PAYLOAD:${response}`;
            }
          }

          if ("SMSG" in response) {
            let smsg = response.SMSG;

            if (typeof smsg === "string") {
              try {
                smsg = JSON.parse(smsg);
              } catch (e) {
                throw `INVALID_SMSG:${smsg}`;
              }
            }

            if (typeof smsg !== "object" || smsg === null)
              throw `UNKNOWN_RESPONSE_SMSG:${response}`;

            if (!("SDATA" in smsg) || typeof smsg.SDATA !== "string")
              throw "MISSING_SMSG_SDATA";
            if (!("TID" in smsg) || typeof smsg.TID !== "string")
              throw "MISSING_SMSG_TID";

            const capabilities = await this.getCapabilities();
            const tid = sjcl.bn.fromBits(
              stringToBits(smsg.TID, capabilities.shouldUseBase64),
            );
            if (!tid.equals(this.tid)) throw "INVALID_SMSG_TID";

            response = JSON.parse(
              sjcl.codec.utf8String.fromBits(
                decrypt(
                  stringToBits(smsg.SDATA, capabilities.shouldUseBase64),
                  this.encKey,
                ),
              ),
            );
          }

          return resolve(response);
        } catch (e) {
          return reject(e);
        } finally {
          this.removeListener("error", callback);
          port.onMessage.removeListener(callback);
        }
      };

      const onError = (error: string | null) => {
        this.removeListener("error", callback);
        port.onMessage.removeListener(callback);
        return reject(error);
      };

      this.addListener("error", onError);
      port = this._connect();
      port.onMessage.addListener(callback);
    });
  }

  private async _postMessage<T extends Command>(
    cmd: T,
    body: object = {},
    expectResponse = true,
  ): Promise<any> {
    let response;

    if (expectResponse) {
      response = this._readResponse(cmd);
    } else {
      response = new Promise<void>((resolve, reject) => {
        let timeout: NodeJS.Timeout;

        const onError = (error: string | null) => {
          this.removeListener("error", onError);
          clearTimeout(timeout);
          return reject(error);
        };

        timeout = setTimeout(() => {
          this.removeListener("error", onError);
          resolve();
        }, 200);

        this.addListener("error", onError);
      });
    }

    this._connect().postMessage({
      cmd,
      ...body,
    });

    return await response;
  }

  get ready() {
    return (
      this.capabilities !== undefined &&
      this.verifier !== undefined &&
      this.encKey !== undefined
    );
  }

  async getCapabilities(refresh = false) {
    if (this.capabilities === undefined || refresh) {
      const { capabilities } = (await this._postMessage(Command.Hello)) ?? {};

      this.capabilities = {
        shouldUseBase64: capabilities.shouldUseBase64 ?? false,
        secretSessionVersion:
          capabilities.secretSessionVersion ??
          SecretSessionVersion.SRPWithOldVerification,
        canFillOneTimeCodes: capabilities.canFillOneTimeCodes ?? false,
        operatingSystem: capabilities.operatingSystem ?? {},
        supportsSubURLs: capabilities.supportsSubURLs ?? false,
        scanForOTPURI: capabilities.scanForOTPURI ?? false,
      };
    }

    return this.capabilities;
  }

  async sendActiveTab(tabId: number, active: boolean) {
    await this._postMessage(
      Command.TabEvent,
      {
        tabId,
        event: active ? 1 : 0,
      },
      false,
    );
  }

  async requestChallengePIN() {
    const capabilities = await this.getCapabilities();

    const response = await this._postMessage(Command.ChallengePIN, {
      msg: {
        QID: "m0",
        PAKE: stringToBase64(
          JSON.stringify({
            TID: bitsToString(
              this.tid.toBits(),
              true,
              capabilities.shouldUseBase64,
            ),
            MSG: 0,
            A: bitsToString(
              GRP.g.powermod(this.a, GRP.N).toBits(),
              true,
              capabilities.shouldUseBase64,
            ),
            VER: "1.0",
            PROTO: [
              SecretSessionVersion.SRPWithOldVerification,
              SecretSessionVersion.SRPWithRFCVerification,
            ],
          }),
        ),
        HSTBRSR: BROWSER_NAME,
      },
    });

    let pake;
    try {
      pake = JSON.parse(
        sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(response.PAKE)),
      );
    } catch (e) {
      throw `INVALID_PAKE:${response.PAKE}`;
    }

    if (
      !this.tid.equals(
        sjcl.bn.fromBits(stringToBits(pake.TID, capabilities.shouldUseBase64)),
      )
    ) {
      throw "INVALID_PAKE_TID";
    }

    if (!pake.MSG) throw "MISSING_PAKE_MSG";

    if (parseInt(pake.MSG, 10) !== MSGTypes.MSG1)
      throw `MESSAGE_MISMATCH:${pake.MSG}`;

    if (
      typeof pake.PROTO === "number" &&
      Object.values(SecretSessionVersion).includes(pake.PROTO)
    ) {
      capabilities.secretSessionVersion = pake.PROTO;
      this.capabilities = capabilities;
    }

    if (typeof pake.s !== "string") throw "MISSING_PAKE_S";
    if (typeof pake.B !== "string") throw "MISSING_PAKE_B";

    // if (pake.VER) const appVer = pake.VER;

    const b = sjcl.bn.fromBits(
      stringToBits(pake.B, capabilities.shouldUseBase64),
    );

    if (b.mod(GRP.N).equals(0)) throw "PAKE_MULMOD_ERROR";

    return {
      s: pake.s as string,
      B: pake.B as string,
    };
  }

  async setChallengePIN(pake: { s: string; B: string }, pin: string) {
    const capabilities = await this.getCapabilities();

    const x = calculateX(pake, this.tid, pin, capabilities.shouldUseBase64);

    const verifier = GRP.g.powermod(x, GRP.N);

    const sessionKey = createSessionKey(
      pake,
      this.a,
      x,
      capabilities.shouldUseBase64,
    );

    const encKey = sjcl.bitArray.bitSlice(sessionKey, 0, KEY_LEN);

    const msg: Record<string, string> = {};
    let hamk;
    switch (capabilities.secretSessionVersion) {
      case SecretSessionVersion.SRPWithRFCVerification:
        let m;
        [m, hamk] = calculateM(
          pake,
          sessionKey,
          bitsToString(this.tid.toBits(), true, capabilities.shouldUseBase64),
          this.a,
          capabilities.shouldUseBase64,
        );

        msg.M = bitsToString(m, false, capabilities.shouldUseBase64);
        break;

      case SecretSessionVersion.SRPWithOldVerification:
        msg.v = bitsToString(
          encrypt(
            capabilities.shouldUseBase64
              ? verifier.toBits()
              : sjcl.codec.utf8String.toBits(verifier.toString()),
            encKey,
          ),
          false,
          capabilities.shouldUseBase64,
        );
        break;

      default:
        throw `UNKNOWN_PROTOCOL_VERSION:${capabilities.secretSessionVersion}`;
    }

    const response = await this._postMessage(Command.ChallengePIN, {
      msg: {
        QID: "m2",
        PAKE: stringToBase64(
          JSON.stringify({
            TID: bitsToString(
              this.tid.toBits(),
              true,
              capabilities.shouldUseBase64,
            ),
            MSG: 2,
            ...msg,
          }),
        ),
      },
    });

    let pake2;
    try {
      pake2 = JSON.parse(
        sjcl.codec.utf8String.fromBits(sjcl.codec.base64.toBits(response.PAKE)),
      );
    } catch (e) {
      throw `INVALID_PAKE:${response.PAKE}`;
    }

    if (
      !this.tid.equals(
        sjcl.bn.fromBits(stringToBits(pake2.TID, capabilities.shouldUseBase64)),
      )
    ) {
      throw "INVALID_PAKE_TID";
    }

    if (!pake2.MSG) throw "MISSING_PAKE_MSG";

    if (parseInt(pake2.MSG, 10) !== MSGTypes.MSG3)
      throw `MESSAGE_MISMATCH:${pake2.MSG}`;

    if (pake2.ErrCode !== 0) {
      switch (pake2.ErrCode) {
        case 1:
          throw "INVALID_PIN";

        default:
          throw `UNKNOWN_PAKE_ERROR:${pake2.ErrCode}`;
      }
    }

    switch (capabilities.secretSessionVersion) {
      case SecretSessionVersion.SRPWithRFCVerification:
        if (!pake2.HAMK) {
          throw "MISSING_HAMK";
        }

        const a = stringToBits(pake2.HAMK, capabilities.shouldUseBase64);
        if (!sjcl.bitArray.equal(a, hamk!)) throw `INVALID_HAMK:${pake2.HAMK}`;
        break;

      case SecretSessionVersion.SRPWithOldVerification:
        break;

      default:
        throw `UNKNOWN_PROTOCOL_VERSION:${capabilities.secretSessionVersion}`;
    }

    this.verifier = verifier;
    this.encKey = encKey;
    this.emit("ready", true);
  }

  async getLoginNamesForURL(tabId: number, url: string) {
    const capabilities = await this.getCapabilities();

    const { hostname } = new URL(url);

    const sdata = encrypt(
      sjcl.codec.utf8String.toBits(
        JSON.stringify({
          ACT: Action.GhostSearch,
          URL: hostname,
        }),
      ),
      this.encKey,
    );

    const response = await this._postMessage(Command.GetLoginNames4URL, {
      tabId,
      frameId: 0,
      url: hostname,
      payload: {
        QID: "CmdGetLoginNames4URL",
        SMSG: {
          TID: bitsToString(
            this.tid.toBits(),
            true,
            capabilities.shouldUseBase64,
          ),
          SDATA: bitsToString(sdata, true, capabilities.shouldUseBase64),
        },
      },
    });

    switch (response.STATUS) {
      case QueryStatus.Success:
        return (response.Entries as any[]).map(({ USR, sites }) => ({
          username: USR,
          sites,
        }));

      case QueryStatus.NoResults:
        return [];

      default:
        throw (
          QUERY_STATUS_ERRORS[response.STATUS as QueryStatus] ??
          `UNKNOWN_QUERY_STATUS:${response.STATUS}`
        );
    }
  }

  async getPasswordForLoginName(
    tabId: number,
    url: string,
    loginName: { username: string; sites: string[] },
  ) {
    const capabilities = await this.getCapabilities();

    const { hostname } = new URL(url);

    const sdata = encrypt(
      sjcl.codec.utf8String.toBits(
        JSON.stringify({
          ACT: Action.Search,
          URL: hostname,
          USR: loginName.username,
        }),
      ),
      this.encKey,
    );

    const response = await this._postMessage(Command.GetPassword4LoginName, {
      tabId,
      frameId: 0,
      url: loginName.sites?.[0] ?? hostname,
      payload: {
        QID: "CmdGetPassword4LoginName",
        SMSG: {
          TID: bitsToString(
            this.tid.toBits(),
            true,
            capabilities.shouldUseBase64,
          ),
          SDATA: bitsToString(sdata, true, capabilities.shouldUseBase64),
        },
      },
    });

    switch (response.STATUS) {
      case QueryStatus.Success:
        return (response.Entries as any[]).map(({ USR, PWD, sites }) => ({
          username: USR,
          password: PWD,
          sites,
        }))[0];

      default:
        throw (
          QUERY_STATUS_ERRORS[response.STATUS as QueryStatus] ??
          `UNKNOWN_QUERY_STATUS:${response.STATUS}`
        );
    }
  }

  async close() {
    const port = this.port;
    if (port === undefined) return;

    this._postMessage(Command.EndOp);

    await new Promise<void>((resolve) => {
      port.onDisconnect.addListener(() => resolve());
    });
  }
}
