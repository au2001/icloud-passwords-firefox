import sjcl from "sjcl";
import { GRP, KEY_LEN } from "./constants";

export function randomWords(length: number) {
  const array = new Int32Array(length);
  self.crypto.getRandomValues(array);
  return Array.from(array);
}

export function stringToBase64(str: string) {
  const bits = sjcl.codec.utf8String.toBits(str);
  return sjcl.codec.base64.fromBits(bits);
}

export function bitsToString(
  bits: any[],
  hexPrefix: boolean,
  shouldUseBase64: boolean,
) {
  return shouldUseBase64
    ? sjcl.codec.base64.fromBits(bits)
    : (hexPrefix ? "0x" : "") + sjcl.codec.hex.fromBits(bits);
}

export function stringToBits(str: string, shouldUseBase64: boolean) {
  return shouldUseBase64
    ? sjcl.codec.base64.toBits(str)
    : sjcl.codec.hex.toBits(str);
}

export function padToModulusLength(str: string) {
  str = str.replace(/^0x/, "");
  const t =
    2 * ((sjcl.bitArray.bitLength(GRP.N.toBits()) + 7) >> 3) - str.length;
  return "0".repeat(t) + str;
}

export function calculateX(
  pake: { s: string },
  tid: sjcl.BigNumber,
  pin: string,
  shouldUseBase64: boolean,
) {
  // Same as sjcl.keyexchange.srp.makeX but with sha256 instead of sha1
  return sjcl.bn.fromBits(
    sjcl.hash.sha256.hash(
      stringToBits(pake.s, shouldUseBase64).concat(
        sjcl.hash.sha256.hash(
          bitsToString(tid.toBits(), true, shouldUseBase64) + ":" + pin,
        ),
      ),
    ),
  );
}

export function createSessionKey(
  pake: { B: string },
  a: sjcl.BigNumber,
  x: sjcl.BigNumber,
  shouldUseBase64: boolean,
) {
  const verifier = GRP.g.powermod(x, GRP.N);

  // TODO: Deobfuscate variable names
  const b = sjcl.bn.fromBits(stringToBits(pake.B, shouldUseBase64));
  const o = padToModulusLength(GRP.g.powermod(a, GRP.N).toString()).concat(
    padToModulusLength(b.toString()),
  );
  const c = a.add(
    sjcl.bn.fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(o))).mul(x),
  );
  const l = GRP.N.toString() + padToModulusLength(GRP.g.toString());
  const d = sjcl.bn
    .fromBits(sjcl.hash.sha256.hash(sjcl.codec.hex.toBits(l)))
    .mulmod(verifier, GRP.N);

  return sjcl.hash.sha256.hash(b.sub(d).powermod(c, GRP.N).toBits());
}

export function calculateM(
  pake: { s: string; B: string },
  sessionKey: sjcl.BitArray,
  tid: string,
  a: sjcl.BigNumber,
  shouldUseBase64: boolean,
) {
  // TODO: Deobfuscate variable names
  const n = sjcl.hash.sha256.hash(GRP.N.toBits());
  const r = sjcl.hash.sha256.hash(
    sjcl.codec.hex.toBits(padToModulusLength(GRP.g.toString())),
  );
  const o = sjcl.bitArray.bitLength(n) / 32;
  for (let e = 0; e < o; ++e) n[e] = n[e] ^ r[e];
  const i = sjcl.hash.sha256.hash(tid);

  const c1 = new sjcl.hash.sha256();
  c1.update(n);
  c1.update(i);
  c1.update(stringToBits(pake.s, shouldUseBase64));
  c1.update(GRP.g.powermod(a, GRP.N).toBits());
  c1.update(sjcl.bn.fromBits(stringToBits(pake.B, shouldUseBase64)).toBits());
  c1.update(sessionKey);
  const l = c1.finalize();

  const c2 = new sjcl.hash.sha256();
  c2.update(GRP.g.powermod(a, GRP.N).toBits());
  c2.update(l);
  c2.update(sessionKey);

  return [l, c2.finalize()];
}

export function encrypt(data: sjcl.BitArray, encKey?: sjcl.BitArray) {
  if (!encKey) throw new Error("Called encrypt() without a session key");

  const salt = randomWords(4);
  return sjcl.bitArray.concat(
    sjcl.mode.gcm.encrypt(new sjcl.cipher.aes(encKey), data, salt),
    salt,
  );
}

export function decrypt(data: sjcl.BitArray, encKey?: sjcl.BitArray) {
  if (!encKey) throw new Error("Called decrypt() without a session key!");

  const salt = sjcl.bitArray.clamp(data, KEY_LEN);
  data = sjcl.bitArray.bitSlice(data, KEY_LEN, undefined as unknown as number);

  try {
    return sjcl.mode.gcm.decrypt(new sjcl.cipher.aes(encKey), data, salt);
  } catch (e) {
    throw new Error(`Exception while decrypting message. ${e}`);
  }
}
