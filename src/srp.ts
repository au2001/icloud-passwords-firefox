import { Buffer } from "buffer";
import {
  mod,
  pad,
  powermod,
  randomBytes,
  readBigInt,
  sha256,
  toBase64,
  toBuffer,
} from "./utils";

// From https://www.rfc-editor.org/rfc/rfc5054#appendix-A
const GROUP_PRIME = BigInt(
  "0x" +
    `
      FFFFFFFF FFFFFFFF C90FDAA2 2168C234 C4C6628B 80DC1CD1 29024E08
      8A67CC74 020BBEA6 3B139B22 514A0879 8E3404DD EF9519B3 CD3A431B
      302B0A6D F25F1437 4FE1356D 6D51C245 E485B576 625E7EC6 F44C42E9
      A637ED6B 0BFF5CB6 F406B7ED EE386BFB 5A899FA5 AE9F2411 7C4B1FE6
      49286651 ECE45B3D C2007CB8 A163BF05 98DA4836 1C55D39A 69163FA8
      FD24CF5F 83655D23 DCA3AD96 1C62F356 208552BB 9ED52907 7096966D
      670C354E 4ABC9804 F1746C08 CA18217C 32905E46 2E36CE3B E39E772C
      180E8603 9B2783A2 EC07A28F B5C55DF0 6F4C52C9 DE2BCBF6 95581718
      3995497C EA956AE5 15D22618 98FA0510 15728E5A 8AAAC42D AD33170D
      04507A33 A85521AB DF1CBA64 ECFB8504 58DBEF0A 8AEA7157 5D060C7D
      B3970F85 A6E1E4C7 ABF5AE8C DB0933D7 1E8C94E0 4A25619D CEE3D226
      1AD2EE6B F12FFA06 D98A0864 D8760273 3EC86A64 521F2B18 177B200C
      BBE11757 7A615D6C 770988C0 BAD946E2 08E24FA0 74E5AB31 43DB5BFC
      E0FD108E 4B82D120 A93AD2CA FFFFFFFF FFFFFFFF
    `.replaceAll(/[^0-9A-F]/g, ""),
); // N
const GROUP_PRIME_BYTES = 3072 >> 3;

const GROUP_GENERATOR = 5n; // g

// See https://www.rfc-editor.org/rfc/rfc2945
export class SRPSession {
  public readonly username: string; // I
  private readonly clientPrivateKey: bigint; // a
  public serverPublicKey?: bigint; // B
  public salt?: bigint; // s
  public sharedKey?: bigint; // x

  private constructor(username: string, clientPrivateKey: bigint) {
    this.username = username;
    this.clientPrivateKey = clientPrivateKey;
  }

  static async new() {
    const username = toBase64(randomBytes(16));

    // TODO: Use crypto.subtle.generateKey
    const clientPrivateKey = readBigInt(randomBytes(32));

    return new SRPSession(username, clientPrivateKey);
  }

  // A
  get clientPublicKey() {
    return powermod(GROUP_GENERATOR, this.clientPrivateKey, GROUP_PRIME);
  }

  setServerPublicKey(serverPublicKey: bigint, salt: bigint) {
    if (mod(serverPublicKey, GROUP_PRIME) === 0n)
      throw new Error("Invalid server hello: invalid public key");

    this.serverPublicKey = serverPublicKey;
    this.salt = salt;
  }

  async setSharedKey(password: string) {
    if (this.serverPublicKey === undefined)
      throw new Error("Invalid session state: missing server public key");
    if (this.salt === undefined)
      throw new Error("Invalid session state: missing salt");

    const [publicKeysHash, multiplier, saltedPassword] = (
      await Promise.all([
        // u
        sha256(
          Buffer.concat([
            pad(toBuffer(this.clientPublicKey), GROUP_PRIME_BYTES),
            pad(toBuffer(this.serverPublicKey), GROUP_PRIME_BYTES),
          ]),
        ),

        // k
        sha256(
          Buffer.concat([
            toBuffer(GROUP_PRIME),
            pad(toBuffer(GROUP_GENERATOR), GROUP_PRIME_BYTES),
          ]),
        ),

        // x
        sha256(this.username + ":" + password).then((hash) =>
          sha256(Buffer.concat([toBuffer(this.salt), hash])),
        ),
      ])
    ).map(readBigInt);

    // (B - (k * g^x)) ^ (a + (u * x)) % N
    const premasterSecret = powermod(
      this.serverPublicKey -
        multiplier * powermod(GROUP_GENERATOR, saltedPassword, GROUP_PRIME),
      this.clientPrivateKey + publicKeysHash * saltedPassword,
      GROUP_PRIME,
    );

    this.sharedKey = readBigInt(await sha256(premasterSecret));
  }

  async computeM() {
    if (this.serverPublicKey === undefined)
      throw new Error("Invalid session state: missing server public key");
    if (this.salt === undefined)
      throw new Error("Invalid session state: missing salt");
    if (this.sharedKey === undefined)
      throw new Error("Invalid session state: missing shared key");

    const [N, g, I] = await Promise.all([
      sha256(GROUP_PRIME),
      sha256(pad(toBuffer(GROUP_GENERATOR), GROUP_PRIME_BYTES)),
      sha256(this.username),
    ]);

    return await sha256(
      Buffer.concat([
        N.map((byte, i) => byte ^ g[i]),
        I,
        toBuffer(this.salt),
        toBuffer(this.clientPublicKey),
        toBuffer(this.serverPublicKey),
        toBuffer(this.sharedKey),
      ]),
    );
  }

  async computeHMAC(data: Buffer) {
    if (this.sharedKey === undefined)
      throw new Error("Invalid session state: missing shared key");

    return await sha256(
      Buffer.concat([
        toBuffer(this.clientPublicKey),
        data,
        toBuffer(this.sharedKey),
      ]),
    );
  }

  async getEncryptionKey() {
    if (this.sharedKey === undefined) return undefined;

    const key = toBuffer(this.sharedKey).subarray(0, 16);

    return await crypto.subtle.importKey("raw", key, "AES-GCM", true, [
      "encrypt",
      "decrypt",
    ]);
  }

  async encrypt(data: any) {
    const encryptionKey = await this.getEncryptionKey();
    if (encryptionKey === undefined)
      throw new Error("Invalid session state: missing encryption key");

    const initializationVector = randomBytes(16);
    return Buffer.concat([
      Buffer.from(
        await crypto.subtle.encrypt(
          {
            name: "AES-GCM",
            iv: initializationVector,
          },
          encryptionKey,
          toBuffer(data),
        ),
      ),
      initializationVector,
    ]);
  }

  async decrypt(data: Buffer) {
    const encryptionKey = await this.getEncryptionKey();
    if (encryptionKey === undefined)
      throw new Error("Invalid session state: missing encryption key");

    const initializationVector = data.subarray(0, 16);
    return Buffer.from(
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: initializationVector,
        },
        encryptionKey,
        data.subarray(16),
      ),
    );
  }
}
