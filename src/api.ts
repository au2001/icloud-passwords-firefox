import sjcl from "sjcl";
import * as utils from "./utils";
import browser, { Runtime } from "webextension-polyfill";
import {
  BROWSER_NAME,
  Command,
  GRP,
  KEY_LEN,
  MSGTypes,
  QID,
  SecretSessionVersion,
} from "./constants";

export class ApplePasswordManager {
  private readonly port: Runtime.Port;
  private readonly tid: sjcl.BigNumber;
  private readonly a: sjcl.BigNumber;

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
    this.port = browser.runtime.connectNative("com.apple.passwordmanager");

    // Setup SecureRemotePassword (SRP)
    this.tid = sjcl.bn.fromBits(utils.randomWords(4));
    this.a = sjcl.bn.fromBits(utils.randomWords(8));
  }

  private async _readResponse<T extends Command>(cmd: T, qid: QID<T>) {
    return await new Promise((resolve) => {
      const callback = (response: object) => {
        if (!("cmd" in response) || response.cmd !== cmd) return;

        if ("payload" in response) {
          if (
            typeof response.payload === "object" &&
            response.payload !== null
          ) {
            response = response.payload;
          } else {
            console.warn("Failed to parse unknown response:", response);
            return;
          }
        }

        if (qid !== null && (!("QID" in response) || response.QID !== qid))
          return;

        this.port.onMessage.removeListener(callback);
        resolve(response);
      };

      this.port.onMessage.addListener(callback);
    });
  }

  private async _postMessage<T extends Command>(
    cmd: T,
    qid: QID<T>,
    body: object = {},
    expectResponse = true,
  ): Promise<any> {
    const response = expectResponse ? this._readResponse(cmd, qid) : null;

    this.port.postMessage({
      cmd,
      ...(qid !== null
        ? {
            msg: JSON.stringify({
              QID: qid,
              ...body,
            }),
          }
        : body),
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
      const { capabilities } =
        (await this._postMessage(Command.Hello, null)) ?? {};

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
      null,
      {
        tabId,
        event: active ? 1 : 0,
      },
      false,
    );
  }

  async requestChallengePIN() {
    const capabilities = await this.getCapabilities();

    const response = await this._postMessage(Command.ChallengePIN, "m0", {
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

    const response = await this._postMessage(Command.ChallengePIN, "m2", {
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

  close() {
    this._postMessage(Command.EndOp, null);
  }
}
