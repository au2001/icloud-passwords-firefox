import sjcl from "sjcl";
import * as utils from "./utils";
import browser, { Runtime } from "webextension-polyfill";
import {
  Action,
  BROWSER_NAME,
  Command,
  GRP,
  KEY_LEN,
  MSGTypes,
  QueryStatus,
  SecretSessionVersion,
} from "./constants";

export class ApplePasswordManager {
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
    // Setup SecureRemotePassword (SRP)
    this.tid = sjcl.bn.fromBits(utils.randomWords(4));
    this.a = sjcl.bn.fromBits(utils.randomWords(8));
  }

  private _connect() {
    if (this.port === undefined) {
      this.port = browser.runtime.connectNative("com.apple.passwordmanager");

      this.port.onDisconnect.addListener((port) => {
        if (this.port !== port) return;
        this.port = undefined;
      });
    }

    return this.port;
  }

  private async _readResponse<T extends Command>(cmd: T) {
    return await new Promise((resolve, reject) => {
      const port = this._connect();

      const callback = async (response: object) => {
        if (!("cmd" in response) || response.cmd !== cmd) return;

        try {
          if ("payload" in response) {
            if (
              typeof response.payload === "object" &&
              response.payload !== null
            ) {
              response = response.payload;
            } else {
              throw new Error(`Failed to parse unknown response: ${response}`);
            }
          }

          if ("SMSG" in response) {
            let smsg = response.SMSG;

            if (typeof smsg === "string") {
              try {
                smsg = JSON.parse(smsg);
              } catch (e) {
                throw new Error(
                  `Unable to decode SMSG from string: ${e} ${smsg}`,
                );
              }
            }

            if (typeof smsg !== "object" || smsg === null) {
              throw new Error(`Failed to parse unknown response: ${response}`);
            }

            if (!("SDATA" in smsg) || typeof smsg.SDATA !== "string")
              throw new Error(
                "Missing or invalid SDATA field in SMSG message.",
              );
            if (!("TID" in smsg) || typeof smsg.TID !== "string")
              throw new Error("Missing or invalid 'TID' field in SMSG object.");

            const capabilities = await this.getCapabilities();
            const tid = sjcl.bn.fromBits(
              utils.stringToBits(smsg.TID, capabilities.shouldUseBase64),
            );
            if (!tid.equals(this.tid))
              throw new Error(
                "Received SMSG message meant for another session.",
              );

            response = JSON.parse(
              sjcl.codec.utf8String.fromBits(
                utils.decrypt(
                  utils.stringToBits(smsg.SDATA, capabilities.shouldUseBase64),
                  this.encKey,
                ),
              ),
            );
          }
          return resolve(response);
        } catch (e) {
          return reject(e);
        } finally {
          port.onMessage.removeListener(callback);
        }
      };

      port.onMessage.addListener(callback);
    });
  }

  private async _postMessage<T extends Command>(
    cmd: T,
    body: object = {},
    expectResponse = true,
  ): Promise<any> {
    const response = expectResponse ? this._readResponse(cmd) : null;

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

  sendActiveTab(tabId: number, active: boolean) {
    this._postMessage(
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
        PAKE: utils.stringToBase64(
          JSON.stringify({
            TID: utils.bitsToString(
              this.tid.toBits(),
              true,
              capabilities.shouldUseBase64,
            ),
            MSG: 0,
            A: utils.bitsToString(
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
      throw new Error(`Unable to parse JSON message: ${e}`);
    }

    if (
      !this.tid.equals(
        sjcl.bn.fromBits(
          utils.stringToBits(pake.TID, capabilities.shouldUseBase64),
        ),
      )
    ) {
      throw new Error("Missing or invalid 'TID' field in PAKE message.");
    }

    if (!pake.MSG) throw new Error("Missing 'MSG' field in PAKE message.");

    if (parseInt(pake.MSG, 10) !== MSGTypes.MSG1) {
      throw new Error(
        `Received Message ${pake.MSG}, but expected Message ${MSGTypes.MSG1}`,
      );
    }

    if (
      typeof pake.PROTO === "number" &&
      Object.values(SecretSessionVersion).includes(pake.PROTO)
    ) {
      capabilities.secretSessionVersion = pake.PROTO;
      this.capabilities = capabilities;
    }

    if (typeof pake.s !== "string" || typeof pake.B !== "string") {
      throw new Error(
        `Message ${MSGTypes.MSG1} is missing some required keys.`,
      );
    }

    // if (pake.VER) const appVer = pake.VER;

    const b = sjcl.bn.fromBits(
      utils.stringToBits(pake.B, capabilities.shouldUseBase64),
    );

    if (b.mod(GRP.N).equals(0)) throw new Error("B.mulmod error");

    return {
      s: pake.s as string,
      B: pake.B as string,
    };
  }

  async setChallengePIN(pake: { s: string; B: string }, pin: string) {
    const capabilities = await this.getCapabilities();

    const x = utils.calculateX(
      pake,
      this.tid,
      pin,
      capabilities.shouldUseBase64,
    );

    this.verifier = GRP.g.powermod(x, GRP.N);

    const sessionKey = utils.createSessionKey(
      pake,
      this.a,
      x,
      capabilities.shouldUseBase64,
    );

    this.encKey = sjcl.bitArray.bitSlice(sessionKey, 0, KEY_LEN);

    const msg: Record<string, string> = {};
    let hamk;
    switch (capabilities.secretSessionVersion) {
      case SecretSessionVersion.SRPWithRFCVerification:
        let m;
        [m, hamk] = utils.calculateM(
          pake,
          sessionKey,
          utils.bitsToString(
            this.tid.toBits(),
            true,
            capabilities.shouldUseBase64,
          ),
          this.a,
          capabilities.shouldUseBase64,
        );

        msg.M = utils.bitsToString(m, false, capabilities.shouldUseBase64);
        break;

      case SecretSessionVersion.SRPWithOldVerification:
        msg.v = utils.bitsToString(
          utils.encrypt(
            capabilities.shouldUseBase64
              ? this.verifier.toBits()
              : sjcl.codec.utf8String.toBits(this.verifier.toString()),
            this.encKey,
          ),
          false,
          capabilities.shouldUseBase64,
        );
        break;

      default:
        throw new Error(
          `Unknown protocol version ${capabilities.secretSessionVersion}`,
        );
    }

    const response = await this._postMessage(Command.ChallengePIN, {
      msg: {
        QID: "m2",
        PAKE: utils.stringToBase64(
          JSON.stringify({
            TID: utils.bitsToString(
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
      throw new Error(`Unable to parse JSON message: ${e}`);
    }

    if (
      !this.tid.equals(
        sjcl.bn.fromBits(
          utils.stringToBits(pake2.TID, capabilities.shouldUseBase64),
        ),
      )
    ) {
      throw new Error("Missing or invalid 'TID' field in PAKE message.");
    }

    if (!pake2.MSG) throw new Error("Missing 'MSG' field in PAKE message.");

    if (parseInt(pake2.MSG, 10) !== MSGTypes.MSG3) {
      throw new Error(
        `Received Message ${pake2.MSG}, but expected Message ${MSGTypes.MSG3}`,
      );
    }

    if (pake2.ErrCode !== 0)
      throw new Error(`Message 3 contained an error: ${pake2.ErrCode}`);

    switch (capabilities.secretSessionVersion) {
      case SecretSessionVersion.SRPWithRFCVerification:
        if (!pake2.HAMK) {
          throw new Error(
            `Message 3 does not contain necessary data: ${pake2.ErrCode}`,
          );
        }

        const a = utils.stringToBits(pake2.HAMK, capabilities.shouldUseBase64);
        if (!sjcl.bitArray.equal(a, hamk!))
          throw new Error("Failed to verify server data.");
        break;

      case SecretSessionVersion.SRPWithOldVerification:
        break;

      default:
        throw new Error(
          `Unknown SecretSessionVersion ${capabilities.secretSessionVersion}.`,
        );
    }

    return true;
  }

  async getLoginNames(tabId: number, url: string) {
    this.sendActiveTab(tabId, true);

    const capabilities = await this.getCapabilities();

    const { hostname } = new URL(url);

    const sdata = utils.encrypt(
      sjcl.codec.utf8String.toBits(
        JSON.stringify({
          ACT: Action.GhostSearch,
          URL: hostname,
        }),
      ),
      this.encKey,
    );

    const response = await this._postMessage(
      Command.GetLoginNames4URL,
      {
        url: hostname,
        tabId,
        frameId: 0,
        payload: {
          QID: "CmdGetLoginNames4URL",
          SMSG: JSON.stringify({
            TID: utils.bitsToString(
              this.tid.toBits(),
              true,
              capabilities.shouldUseBase64,
            ),
            SDATA: utils.bitsToString(
              sdata,
              true,
              capabilities.shouldUseBase64,
            ),
          }),
        },
      },
      true,
    );

    switch (response.STATUS) {
      case QueryStatus.Success:
        return (response.Entries as any[]).map(({ USR, sites }) => ({
          username: USR,
          sites,
        }));

      case QueryStatus.NoResults:
        return [];

      default:
        throw new Error(`Invalid query response status: ${response.STATUS}`);
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
