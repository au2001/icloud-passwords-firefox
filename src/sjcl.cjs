"use strict";
var sjcl = {
  cipher: {},
  hash: {},
  keyexchange: {},
  mode: {},
  misc: {},
  codec: {},
  exception: {
    corrupt: function (a) {
      this.toString = function () {
        return "CORRUPT: " + this.message;
      };
      this.message = a;
    },
    invalid: function (a) {
      this.toString = function () {
        return "INVALID: " + this.message;
      };
      this.message = a;
    },
    bug: function (a) {
      this.toString = function () {
        return "BUG: " + this.message;
      };
      this.message = a;
    },
    notReady: function (a) {
      this.toString = function () {
        return "NOT READY: " + this.message;
      };
      this.message = a;
    },
  },
};
sjcl.cipher.aes = function (a) {
  this.w[0][0][0] || this.L();
  var b,
    c,
    d,
    e,
    f = this.w[0][4],
    g = this.w[1];
  b = a.length;
  var h = 1;
  if (4 !== b && 6 !== b && 8 !== b)
    throw new sjcl.exception.invalid("invalid aes key size");
  this.b = [(d = a.slice(0)), (e = [])];
  for (a = b; a < 4 * b + 28; a++) {
    c = d[a - 1];
    if (0 === a % b || (8 === b && 4 === a % b))
      (c =
        (f[c >>> 24] << 24) ^
        (f[(c >> 16) & 255] << 16) ^
        (f[(c >> 8) & 255] << 8) ^
        f[c & 255]),
        0 === a % b &&
          ((c = (c << 8) ^ (c >>> 24) ^ (h << 24)),
          (h = (h << 1) ^ (283 * (h >> 7))));
    d[a] = d[a - b] ^ c;
  }
  for (b = 0; a; b++, a--)
    (c = d[b & 3 ? a : a - 4]),
      (e[b] =
        4 >= a || 4 > b
          ? c
          : g[0][f[c >>> 24]] ^
            g[1][f[(c >> 16) & 255]] ^
            g[2][f[(c >> 8) & 255]] ^
            g[3][f[c & 255]]);
};
sjcl.cipher.aes.prototype = {
  encrypt: function (a) {
    return t(this, a, 0);
  },
  decrypt: function (a) {
    return t(this, a, 1);
  },
  w: [
    [[], [], [], [], []],
    [[], [], [], [], []],
  ],
  L: function () {
    var a = this.w[0],
      b = this.w[1],
      c = a[4],
      d = b[4],
      e,
      f,
      g,
      h = [],
      k = [],
      m,
      p,
      l,
      n;
    for (e = 0; 0x100 > e; e++) k[(h[e] = (e << 1) ^ (283 * (e >> 7))) ^ e] = e;
    for (f = g = 0; !c[f]; f ^= m || 1, g = k[g] || 1)
      for (
        l = g ^ (g << 1) ^ (g << 2) ^ (g << 3) ^ (g << 4),
          l = (l >> 8) ^ (l & 255) ^ 99,
          c[f] = l,
          d[l] = f,
          p = h[(e = h[(m = h[f])])],
          n = (0x1010101 * p) ^ (0x10001 * e) ^ (0x101 * m) ^ (0x1010100 * f),
          p = (0x101 * h[l]) ^ (0x1010100 * l),
          e = 0;
        4 > e;
        e++
      )
        (a[e][f] = p = (p << 24) ^ (p >>> 8)),
          (b[e][l] = n = (n << 24) ^ (n >>> 8));
    for (e = 0; 5 > e; e++) (a[e] = a[e].slice(0)), (b[e] = b[e].slice(0));
  },
};
function t(a, b, c) {
  if (4 !== b.length)
    throw new sjcl.exception.invalid("invalid aes block size");
  var d = a.b[c],
    e = b[0] ^ d[0],
    f = b[c ? 3 : 1] ^ d[1],
    g = b[2] ^ d[2];
  b = b[c ? 1 : 3] ^ d[3];
  var h,
    k,
    m,
    p = d.length / 4 - 2,
    l,
    n = 4,
    r = [0, 0, 0, 0];
  h = a.w[c];
  a = h[0];
  var q = h[1],
    u = h[2],
    x = h[3],
    y = h[4];
  for (l = 0; l < p; l++)
    (h =
      a[e >>> 24] ^ q[(f >> 16) & 255] ^ u[(g >> 8) & 255] ^ x[b & 255] ^ d[n]),
      (k =
        a[f >>> 24] ^
        q[(g >> 16) & 255] ^
        u[(b >> 8) & 255] ^
        x[e & 255] ^
        d[n + 1]),
      (m =
        a[g >>> 24] ^
        q[(b >> 16) & 255] ^
        u[(e >> 8) & 255] ^
        x[f & 255] ^
        d[n + 2]),
      (b =
        a[b >>> 24] ^
        q[(e >> 16) & 255] ^
        u[(f >> 8) & 255] ^
        x[g & 255] ^
        d[n + 3]),
      (n += 4),
      (e = h),
      (f = k),
      (g = m);
  for (l = 0; 4 > l; l++)
    (r[c ? 3 & -l : l] =
      (y[e >>> 24] << 24) ^
      (y[(f >> 16) & 255] << 16) ^
      (y[(g >> 8) & 255] << 8) ^
      y[b & 255] ^
      d[n++]),
      (h = e),
      (e = f),
      (f = g),
      (g = b),
      (b = h);
  return r;
}
sjcl.bitArray = {
  bitSlice: function (a, b, c) {
    a = sjcl.bitArray.X(a.slice(b / 32), 32 - (b & 31)).slice(1);
    return void 0 === c ? a : sjcl.bitArray.clamp(a, c - b);
  },
  extract: function (a, b, c) {
    var d = Math.floor((-b - c) & 31);
    return (
      (((b + c - 1) ^ b) & -32
        ? (a[(b / 32) | 0] << (32 - d)) ^ (a[(b / 32 + 1) | 0] >>> d)
        : a[(b / 32) | 0] >>> d) &
      ((1 << c) - 1)
    );
  },
  concat: function (a, b) {
    if (0 === a.length || 0 === b.length) return a.concat(b);
    var c = a[a.length - 1],
      d = sjcl.bitArray.getPartial(c);
    return 32 === d
      ? a.concat(b)
      : sjcl.bitArray.X(b, d, c | 0, a.slice(0, a.length - 1));
  },
  bitLength: function (a) {
    var b = a.length;
    return 0 === b ? 0 : 32 * (b - 1) + sjcl.bitArray.getPartial(a[b - 1]);
  },
  clamp: function (a, b) {
    if (32 * a.length < b) return a;
    a = a.slice(0, Math.ceil(b / 32));
    var c = a.length;
    b = b & 31;
    0 < c &&
      b &&
      (a[c - 1] = sjcl.bitArray.partial(
        b,
        a[c - 1] & (2147483648 >> (b - 1)),
        1,
      ));
    return a;
  },
  partial: function (a, b, c) {
    return 32 === a ? b : (c ? b | 0 : b << (32 - a)) + 0x10000000000 * a;
  },
  getPartial: function (a) {
    return Math.round(a / 0x10000000000) || 32;
  },
  equal: function (a, b) {
    if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) return !1;
    var c = 0,
      d;
    for (d = 0; d < a.length; d++) c |= a[d] ^ b[d];
    return 0 === c;
  },
  X: function (a, b, c, d) {
    var e;
    e = 0;
    for (void 0 === d && (d = []); 32 <= b; b -= 32) d.push(c), (c = 0);
    if (0 === b) return d.concat(a);
    for (e = 0; e < a.length; e++)
      d.push(c | (a[e] >>> b)), (c = a[e] << (32 - b));
    e = a.length ? a[a.length - 1] : 0;
    a = sjcl.bitArray.getPartial(e);
    d.push(sjcl.bitArray.partial((b + a) & 31, 32 < b + a ? c : d.pop(), 1));
    return d;
  },
  ka: function (a, b) {
    return [a[0] ^ b[0], a[1] ^ b[1], a[2] ^ b[2], a[3] ^ b[3]];
  },
  byteswapM: function (a) {
    var b, c;
    for (b = 0; b < a.length; ++b)
      (c = a[b]),
        (a[b] =
          (c >>> 24) | ((c >>> 8) & 0xff00) | ((c & 0xff00) << 8) | (c << 24));
    return a;
  },
};
sjcl.codec.utf8String = {
  fromBits: function (a) {
    var b = "",
      c = sjcl.bitArray.bitLength(a),
      d,
      e;
    for (d = 0; d < c / 8; d++)
      0 === (d & 3) && (e = a[d / 4]),
        (b += String.fromCharCode(((e >>> 8) >>> 8) >>> 8)),
        (e <<= 8);
    return decodeURIComponent(escape(b));
  },
  toBits: function (a) {
    a = unescape(encodeURIComponent(a));
    var b = [],
      c,
      d = 0;
    for (c = 0; c < a.length; c++)
      (d = (d << 8) | a.charCodeAt(c)), 3 === (c & 3) && (b.push(d), (d = 0));
    c & 3 && b.push(sjcl.bitArray.partial(8 * (c & 3), d));
    return b;
  },
};
sjcl.codec.hex = {
  fromBits: function (a) {
    var b = "",
      c;
    for (c = 0; c < a.length; c++)
      b += ((a[c] | 0) + 0xf00000000000).toString(16).substr(4);
    return b.substr(0, sjcl.bitArray.bitLength(a) / 4);
  },
  toBits: function (a) {
    var b,
      c = [],
      d;
    a = a.replace(/\s|0x/g, "");
    d = a.length;
    a = a + "00000000";
    for (b = 0; b < a.length; b += 8) c.push(parseInt(a.substr(b, 8), 16) ^ 0);
    return sjcl.bitArray.clamp(c, 4 * d);
  },
};
sjcl.codec.base64 = {
  P: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  fromBits: function (a, b, c) {
    var d = "",
      e = 0,
      f = sjcl.codec.base64.P,
      g = 0,
      h = sjcl.bitArray.bitLength(a);
    c && (f = f.substr(0, 62) + "-_");
    for (c = 0; 6 * d.length < h; )
      (d += f.charAt((g ^ (a[c] >>> e)) >>> 26)),
        6 > e ? ((g = a[c] << (6 - e)), (e += 26), c++) : ((g <<= 6), (e -= 6));
    for (; d.length & 3 && !b; ) d += "=";
    return d;
  },
  toBits: function (a, b) {
    a = a.replace(/\s|=/g, "");
    var c = [],
      d,
      e = 0,
      f = sjcl.codec.base64.P,
      g = 0,
      h;
    b && (f = f.substr(0, 62) + "-_");
    for (d = 0; d < a.length; d++) {
      h = f.indexOf(a.charAt(d));
      if (0 > h) throw new sjcl.exception.invalid("this isn't base64!");
      26 < e
        ? ((e -= 26), c.push(g ^ (h >>> e)), (g = h << (32 - e)))
        : ((e += 6), (g ^= h << (32 - e)));
    }
    e & 56 && c.push(sjcl.bitArray.partial(e & 56, g, 1));
    return c;
  },
};
sjcl.codec.base64url = {
  fromBits: function (a) {
    return sjcl.codec.base64.fromBits(a, 1, 1);
  },
  toBits: function (a) {
    return sjcl.codec.base64.toBits(a, 1);
  },
};
sjcl.codec.bytes = {
  fromBits: function (a) {
    var b = [],
      c = sjcl.bitArray.bitLength(a),
      d,
      e;
    for (d = 0; d < c / 8; d++)
      0 === (d & 3) && (e = a[d / 4]), b.push(e >>> 24), (e <<= 8);
    return b;
  },
  toBits: function (a) {
    var b = [],
      c,
      d = 0;
    for (c = 0; c < a.length; c++)
      (d = (d << 8) | a[c]), 3 === (c & 3) && (b.push(d), (d = 0));
    c & 3 && b.push(sjcl.bitArray.partial(8 * (c & 3), d));
    return b;
  },
};
sjcl.hash.sha256 = function (a) {
  this.b[0] || this.L();
  a
    ? ((this.i = a.i.slice(0)), (this.f = a.f.slice(0)), (this.c = a.c))
    : this.reset();
};
sjcl.hash.sha256.hash = function (a) {
  return new sjcl.hash.sha256().update(a).finalize();
};
sjcl.hash.sha256.prototype = {
  blockSize: 512,
  reset: function () {
    this.i = this.C.slice(0);
    this.f = [];
    this.c = 0;
    return this;
  },
  update: function (a) {
    "string" === typeof a && (a = sjcl.codec.utf8String.toBits(a));
    var b,
      c = (this.f = sjcl.bitArray.concat(this.f, a));
    b = this.c;
    a = this.c = b + sjcl.bitArray.bitLength(a);
    if (0x1fffffffffffff < a)
      throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
    if ("undefined" !== typeof Uint32Array) {
      var d = new Uint32Array(c),
        e = 0;
      for (b = 512 + b - ((512 + b) & 0x1ff); b <= a; b += 512)
        this.m(d.subarray(16 * e, 16 * (e + 1))), (e += 1);
      c.splice(0, 16 * e);
    } else
      for (b = 512 + b - ((512 + b) & 0x1ff); b <= a; b += 512)
        this.m(c.splice(0, 16));
    return this;
  },
  finalize: function () {
    var a,
      b = this.f,
      c = this.i,
      b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
    for (a = b.length + 2; a & 15; a++) b.push(0);
    b.push(Math.floor(this.c / 0x100000000));
    for (b.push(this.c | 0); b.length; ) this.m(b.splice(0, 16));
    this.reset();
    return c;
  },
  C: [],
  b: [],
  L: function () {
    function a(a) {
      return (0x100000000 * (a - Math.floor(a))) | 0;
    }
    for (var b = 0, c = 2, d, e; 64 > b; c++) {
      e = !0;
      for (d = 2; d * d <= c; d++)
        if (0 === c % d) {
          e = !1;
          break;
        }
      e &&
        (8 > b && (this.C[b] = a(Math.pow(c, 0.5))),
        (this.b[b] = a(Math.pow(c, 1 / 3))),
        b++);
    }
  },
  m: function (a) {
    var b,
      c,
      d,
      e = this.i,
      f = this.b,
      g = e[0],
      h = e[1],
      k = e[2],
      m = e[3],
      p = e[4],
      l = e[5],
      n = e[6],
      r = e[7];
    for (b = 0; 64 > b; b++)
      16 > b
        ? (c = a[b])
        : ((c = a[(b + 1) & 15]),
          (d = a[(b + 14) & 15]),
          (c = a[b & 15] =
            (((c >>> 7) ^ (c >>> 18) ^ (c >>> 3) ^ (c << 25) ^ (c << 14)) +
              ((d >>> 17) ^ (d >>> 19) ^ (d >>> 10) ^ (d << 15) ^ (d << 13)) +
              a[b & 15] +
              a[(b + 9) & 15]) |
            0)),
        (c =
          c +
          r +
          ((p >>> 6) ^
            (p >>> 11) ^
            (p >>> 25) ^
            (p << 26) ^
            (p << 21) ^
            (p << 7)) +
          (n ^ (p & (l ^ n))) +
          f[b]),
        (r = n),
        (n = l),
        (l = p),
        (p = (m + c) | 0),
        (m = k),
        (k = h),
        (h = g),
        (g =
          (c +
            ((h & k) ^ (m & (h ^ k))) +
            ((h >>> 2) ^
              (h >>> 13) ^
              (h >>> 22) ^
              (h << 30) ^
              (h << 19) ^
              (h << 10))) |
          0);
    e[0] = (e[0] + g) | 0;
    e[1] = (e[1] + h) | 0;
    e[2] = (e[2] + k) | 0;
    e[3] = (e[3] + m) | 0;
    e[4] = (e[4] + p) | 0;
    e[5] = (e[5] + l) | 0;
    e[6] = (e[6] + n) | 0;
    e[7] = (e[7] + r) | 0;
  },
};
sjcl.hash.sha1 = function (a) {
  a
    ? ((this.i = a.i.slice(0)), (this.f = a.f.slice(0)), (this.c = a.c))
    : this.reset();
};
sjcl.hash.sha1.hash = function (a) {
  return new sjcl.hash.sha1().update(a).finalize();
};
sjcl.hash.sha1.prototype = {
  blockSize: 512,
  reset: function () {
    this.i = this.C.slice(0);
    this.f = [];
    this.c = 0;
    return this;
  },
  update: function (a) {
    "string" === typeof a && (a = sjcl.codec.utf8String.toBits(a));
    var b,
      c = (this.f = sjcl.bitArray.concat(this.f, a));
    b = this.c;
    a = this.c = b + sjcl.bitArray.bitLength(a);
    if (0x1fffffffffffff < a)
      throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
    if ("undefined" !== typeof Uint32Array) {
      var d = new Uint32Array(c),
        e = 0;
      for (
        b = this.blockSize + b - ((this.blockSize + b) & (this.blockSize - 1));
        b <= a;
        b += this.blockSize
      )
        this.m(d.subarray(16 * e, 16 * (e + 1))), (e += 1);
      c.splice(0, 16 * e);
    } else
      for (
        b = this.blockSize + b - ((this.blockSize + b) & (this.blockSize - 1));
        b <= a;
        b += this.blockSize
      )
        this.m(c.splice(0, 16));
    return this;
  },
  finalize: function () {
    var a,
      b = this.f,
      c = this.i,
      b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
    for (a = b.length + 2; a & 15; a++) b.push(0);
    b.push(Math.floor(this.c / 0x100000000));
    for (b.push(this.c | 0); b.length; ) this.m(b.splice(0, 16));
    this.reset();
    return c;
  },
  C: [1732584193, 4023233417, 2562383102, 271733878, 3285377520],
  b: [1518500249, 1859775393, 2400959708, 3395469782],
  m: function (a) {
    var b,
      c,
      d,
      e,
      f,
      g,
      h = this.i,
      k;
    if ("undefined" !== typeof Uint32Array)
      for (k = Array(80), c = 0; 16 > c; c++) k[c] = a[c];
    else k = a;
    c = h[0];
    d = h[1];
    e = h[2];
    f = h[3];
    g = h[4];
    for (a = 0; 79 >= a; a++)
      16 <= a &&
        ((b = k[a - 3] ^ k[a - 8] ^ k[a - 14] ^ k[a - 16]),
        (k[a] = (b << 1) | (b >>> 31))),
        (b =
          19 >= a
            ? (d & e) | (~d & f)
            : 39 >= a
            ? d ^ e ^ f
            : 59 >= a
            ? (d & e) | (d & f) | (e & f)
            : 79 >= a
            ? d ^ e ^ f
            : void 0),
        (b =
          (((c << 5) | (c >>> 27)) +
            b +
            g +
            k[a] +
            this.b[Math.floor(a / 20)]) |
          0),
        (g = f),
        (f = e),
        (e = (d << 30) | (d >>> 2)),
        (d = c),
        (c = b);
    h[0] = (h[0] + c) | 0;
    h[1] = (h[1] + d) | 0;
    h[2] = (h[2] + e) | 0;
    h[3] = (h[3] + f) | 0;
    h[4] = (h[4] + g) | 0;
  },
};
sjcl.mode.gcm = {
  name: "gcm",
  encrypt: function (a, b, c, d, e) {
    var f = b.slice(0);
    b = sjcl.bitArray;
    d = d || [];
    a = sjcl.mode.gcm.S(!0, a, f, d, c, e || 128);
    return b.concat(a.data, a.tag);
  },
  decrypt: function (a, b, c, d, e) {
    var f = b.slice(0),
      g = sjcl.bitArray,
      h = g.bitLength(f);
    e = e || 128;
    d = d || [];
    e <= h
      ? ((b = g.bitSlice(f, h - e)), (f = g.bitSlice(f, 0, h - e)))
      : ((b = f), (f = []));
    a = sjcl.mode.gcm.S(!1, a, f, d, c, e);
    if (!g.equal(a.tag, b))
      throw new sjcl.exception.corrupt("gcm: tag doesn't match");
    return a.data;
  },
  ea: function (a, b) {
    var c,
      d,
      e,
      f,
      g,
      h = sjcl.bitArray.ka;
    e = [0, 0, 0, 0];
    f = b.slice(0);
    for (c = 0; 128 > c; c++) {
      (d = 0 !== (a[Math.floor(c / 32)] & (1 << (31 - (c % 32))))) &&
        (e = h(e, f));
      g = 0 !== (f[3] & 1);
      for (d = 3; 0 < d; d--) f[d] = (f[d] >>> 1) | ((f[d - 1] & 1) << 31);
      f[0] >>>= 1;
      g && (f[0] ^= -0x1f000000);
    }
    return e;
  },
  s: function (a, b, c) {
    var d,
      e = c.length;
    b = b.slice(0);
    for (d = 0; d < e; d += 4)
      (b[0] ^= 0xffffffff & c[d]),
        (b[1] ^= 0xffffffff & c[d + 1]),
        (b[2] ^= 0xffffffff & c[d + 2]),
        (b[3] ^= 0xffffffff & c[d + 3]),
        (b = sjcl.mode.gcm.ea(b, a));
    return b;
  },
  S: function (a, b, c, d, e, f) {
    var g,
      h,
      k,
      m,
      p,
      l,
      n,
      r,
      q = sjcl.bitArray;
    l = c.length;
    n = q.bitLength(c);
    r = q.bitLength(d);
    h = q.bitLength(e);
    g = b.encrypt([0, 0, 0, 0]);
    96 === h
      ? ((e = e.slice(0)), (e = q.concat(e, [1])))
      : ((e = sjcl.mode.gcm.s(g, [0, 0, 0, 0], e)),
        (e = sjcl.mode.gcm.s(g, e, [
          0,
          0,
          Math.floor(h / 0x100000000),
          h & 0xffffffff,
        ])));
    h = sjcl.mode.gcm.s(g, [0, 0, 0, 0], d);
    p = e.slice(0);
    d = h.slice(0);
    a || (d = sjcl.mode.gcm.s(g, h, c));
    for (m = 0; m < l; m += 4)
      p[3]++,
        (k = b.encrypt(p)),
        (c[m] ^= k[0]),
        (c[m + 1] ^= k[1]),
        (c[m + 2] ^= k[2]),
        (c[m + 3] ^= k[3]);
    c = q.clamp(c, n);
    a && (d = sjcl.mode.gcm.s(g, h, c));
    a = [
      Math.floor(r / 0x100000000),
      r & 0xffffffff,
      Math.floor(n / 0x100000000),
      n & 0xffffffff,
    ];
    d = sjcl.mode.gcm.s(g, d, a);
    k = b.encrypt(e);
    d[0] ^= k[0];
    d[1] ^= k[1];
    d[2] ^= k[2];
    d[3] ^= k[3];
    return { tag: q.bitSlice(d, 0, f), data: c };
  },
};
sjcl.prng = function (a) {
  this.j = [new sjcl.hash.sha256()];
  this.u = [0];
  this.M = 0;
  this.D = {};
  this.K = 0;
  this.R = {};
  this.W = this.l = this.v = this.da = 0;
  this.b = [0, 0, 0, 0, 0, 0, 0, 0];
  this.o = [0, 0, 0, 0];
  this.I = void 0;
  this.J = a;
  this.B = !1;
  this.H = { progress: {}, seeded: {} };
  this.A = this.ca = 0;
  this.F = 1;
  this.G = 2;
  this.$ = 0x10000;
  this.O = [0, 48, 64, 96, 128, 192, 0x100, 384, 512, 768, 1024];
  this.aa = 3e4;
  this.Z = 80;
};
sjcl.prng.prototype = {
  randomWords: function (a, b) {
    var c = [],
      d;
    d = this.isReady(b);
    var e;
    if (d === this.A)
      throw new sjcl.exception.notReady("generator isn't seeded");
    if (d & this.G) {
      d = !(d & this.F);
      e = [];
      var f = 0,
        g;
      this.W = e[0] = new Date().valueOf() + this.aa;
      for (g = 0; 16 > g; g++) e.push((0x100000000 * Math.random()) | 0);
      for (
        g = 0;
        g < this.j.length &&
        ((e = e.concat(this.j[g].finalize())),
        (f += this.u[g]),
        (this.u[g] = 0),
        d || !(this.M & (1 << g)));
        g++
      );
      this.M >= 1 << this.j.length &&
        (this.j.push(new sjcl.hash.sha256()), this.u.push(0));
      this.l -= f;
      f > this.v && (this.v = f);
      this.M++;
      this.b = sjcl.hash.sha256.hash(this.b.concat(e));
      this.I = new sjcl.cipher.aes(this.b);
      for (
        d = 0;
        4 > d && ((this.o[d] = (this.o[d] + 1) | 0), !this.o[d]);
        d++
      );
    }
    for (d = 0; d < a; d += 4)
      0 === (d + 1) % this.$ && v(this),
        (e = w(this)),
        c.push(e[0], e[1], e[2], e[3]);
    v(this);
    return c.slice(0, a);
  },
  setDefaultParanoia: function (a, b) {
    if (
      0 === a &&
      "Setting paranoia=0 will ruin your security; use it only for testing" !==
        b
    )
      throw new sjcl.exception.invalid(
        "Setting paranoia=0 will ruin your security; use it only for testing",
      );
    this.J = a;
  },
  addEntropy: function (a, b, c) {
    c = c || "user";
    var d,
      e,
      f = new Date().valueOf(),
      g = this.D[c],
      h = this.isReady(),
      k = 0;
    d = this.R[c];
    void 0 === d && (d = this.R[c] = this.da++);
    void 0 === g && (g = this.D[c] = 0);
    this.D[c] = (this.D[c] + 1) % this.j.length;
    switch (typeof a) {
      case "number":
        void 0 === b && (b = 1);
        this.j[g].update([d, this.K++, 1, b, f, 1, a | 0]);
        break;
      case "object":
        c = Object.prototype.toString.call(a);
        if ("[object Uint32Array]" === c) {
          e = [];
          for (c = 0; c < a.length; c++) e.push(a[c]);
          a = e;
        } else
          for (
            "[object Array]" !== c && (k = 1), c = 0;
            c < a.length && !k;
            c++
          )
            "number" !== typeof a[c] && (k = 1);
        if (!k) {
          if (void 0 === b)
            for (c = b = 0; c < a.length; c++)
              for (e = a[c]; 0 < e; ) b++, (e = e >>> 1);
          this.j[g].update([d, this.K++, 2, b, f, a.length].concat(a));
        }
        break;
      case "string":
        void 0 === b && (b = a.length);
        this.j[g].update([d, this.K++, 3, b, f, a.length]);
        this.j[g].update(a);
        break;
      default:
        k = 1;
    }
    if (k)
      throw new sjcl.exception.bug(
        "random: addEntropy only supports number, array of numbers or string",
      );
    this.u[g] += b;
    this.l += b;
    h === this.A &&
      (this.isReady() !== this.A && z("seeded", Math.max(this.v, this.l)),
      z("progress", this.getProgress()));
  },
  isReady: function (a) {
    a = this.O[void 0 !== a ? a : this.J];
    return this.v && this.v >= a
      ? this.u[0] > this.Z && new Date().valueOf() > this.W
        ? this.G | this.F
        : this.F
      : this.l >= a
      ? this.G | this.A
      : this.A;
  },
  getProgress: function (a) {
    a = this.O[a ? a : this.J];
    return this.v >= a ? 1 : this.l > a ? 1 : this.l / a;
  },
  startCollectors: function () {
    if (!this.B) {
      this.a = {
        loadTimeCollector: A(this, this.ha),
        mouseCollector: A(this, this.ia),
        keyboardCollector: A(this, this.ga),
        accelerometerCollector: A(this, this.ba),
        touchCollector: A(this, this.ja),
      };
      if (window.addEventListener)
        window.addEventListener("load", this.a.loadTimeCollector, !1),
          window.addEventListener("mousemove", this.a.mouseCollector, !1),
          window.addEventListener("keypress", this.a.keyboardCollector, !1),
          window.addEventListener(
            "devicemotion",
            this.a.accelerometerCollector,
            !1,
          ),
          window.addEventListener("touchmove", this.a.touchCollector, !1);
      else if (document.attachEvent)
        document.attachEvent("onload", this.a.loadTimeCollector),
          document.attachEvent("onmousemove", this.a.mouseCollector),
          document.attachEvent("keypress", this.a.keyboardCollector);
      else throw new sjcl.exception.bug("can't attach event");
      this.B = !0;
    }
  },
  stopCollectors: function () {
    this.B &&
      (window.removeEventListener
        ? (window.removeEventListener("load", this.a.loadTimeCollector, !1),
          window.removeEventListener("mousemove", this.a.mouseCollector, !1),
          window.removeEventListener("keypress", this.a.keyboardCollector, !1),
          window.removeEventListener(
            "devicemotion",
            this.a.accelerometerCollector,
            !1,
          ),
          window.removeEventListener("touchmove", this.a.touchCollector, !1))
        : document.detachEvent &&
          (document.detachEvent("onload", this.a.loadTimeCollector),
          document.detachEvent("onmousemove", this.a.mouseCollector),
          document.detachEvent("keypress", this.a.keyboardCollector)),
      (this.B = !1));
  },
  addEventListener: function (a, b) {
    this.H[a][this.ca++] = b;
  },
  removeEventListener: function (a, b) {
    var c,
      d,
      e = this.H[a],
      f = [];
    for (d in e) e.hasOwnProperty(d) && e[d] === b && f.push(d);
    for (c = 0; c < f.length; c++) (d = f[c]), delete e[d];
  },
  ga: function () {
    B(this, 1);
  },
  ia: function (a) {
    var b, c;
    try {
      (b = a.x || a.clientX || a.offsetX || 0),
        (c = a.y || a.clientY || a.offsetY || 0);
    } catch (d) {
      c = b = 0;
    }
    0 != b && 0 != c && this.addEntropy([b, c], 2, "mouse");
    B(this, 0);
  },
  ja: function (a) {
    a = a.touches[0] || a.changedTouches[0];
    this.addEntropy([a.pageX || a.clientX, a.pageY || a.clientY], 1, "touch");
    B(this, 0);
  },
  ha: function () {
    B(this, 2);
  },
  ba: function (a) {
    a =
      a.accelerationIncludingGravity.x ||
      a.accelerationIncludingGravity.y ||
      a.accelerationIncludingGravity.z;
    if (window.orientation) {
      var b = window.orientation;
      "number" === typeof b && this.addEntropy(b, 1, "accelerometer");
    }
    a && this.addEntropy(a, 2, "accelerometer");
    B(this, 0);
  },
};
function z(a, b) {
  var c,
    d = sjcl.random.H[a],
    e = [];
  for (c in d) d.hasOwnProperty(c) && e.push(d[c]);
  for (c = 0; c < e.length; c++) e[c](b);
}
function B(a, b) {
  "undefined" !== typeof window &&
  window.performance &&
  "function" === typeof window.performance.now
    ? a.addEntropy(window.performance.now(), b, "loadtime")
    : a.addEntropy(new Date().valueOf(), b, "loadtime");
}
function v(a) {
  a.b = w(a).concat(w(a));
  a.I = new sjcl.cipher.aes(a.b);
}
function w(a) {
  for (var b = 0; 4 > b && ((a.o[b] = (a.o[b] + 1) | 0), !a.o[b]); b++);
  return a.I.encrypt(a.o);
}
function A(a, b) {
  return function () {
    b.apply(a, arguments);
  };
}
sjcl.random = new sjcl.prng(6);
a: try {
  var C, D, E, F;
  if ((F = "undefined" !== typeof module && module.exports)) {
    var G;
    try {
      G = require("crypto");
    } catch (a) {
      G = null;
    }
    F = D = G;
  }
  if (F && D.randomBytes)
    (C = D.randomBytes(128)),
      (C = new Uint32Array(new Uint8Array(C).buffer)),
      sjcl.random.addEntropy(C, 1024, "crypto['randomBytes']");
  else if (
    "undefined" !== typeof window &&
    "undefined" !== typeof Uint32Array
  ) {
    E = new Uint32Array(32);
    if (window.crypto && window.crypto.getRandomValues)
      window.crypto.getRandomValues(E);
    else if (window.msCrypto && window.msCrypto.getRandomValues)
      window.msCrypto.getRandomValues(E);
    else break a;
    sjcl.random.addEntropy(E, 1024, "crypto['getRandomValues']");
  }
} catch (a) {
  "undefined" !== typeof window &&
    window.console &&
    (pwlog("There was an error collecting entropy from the browser:"),
    pwlog(a));
}
sjcl.bn = function (a) {
  this.initWith(a);
};
sjcl.bn.prototype = {
  radix: 24,
  maxMul: 8,
  h: sjcl.bn,
  copy: function () {
    return new this.h(this);
  },
  initWith: function (a) {
    var b = 0,
      c;
    switch (typeof a) {
      case "object":
        this.limbs = a.limbs.slice(0);
        break;
      case "number":
        this.limbs = [a];
        this.normalize();
        break;
      case "string":
        a = a.replace(/^0x/, "");
        this.limbs = [];
        c = this.radix / 4;
        for (b = 0; b < a.length; b += c)
          this.limbs.push(
            parseInt(
              a.substring(Math.max(a.length - b - c, 0), a.length - b),
              16,
            ),
          );
        break;
      default:
        this.limbs = [0];
    }
    return this;
  },
  equals: function (a) {
    "number" === typeof a && (a = new this.h(a));
    var b = 0,
      c;
    this.fullReduce();
    a.fullReduce();
    for (c = 0; c < this.limbs.length || c < a.limbs.length; c++)
      b |= this.getLimb(c) ^ a.getLimb(c);
    return 0 === b;
  },
  getLimb: function (a) {
    return a >= this.limbs.length ? 0 : this.limbs[a];
  },
  greaterEquals: function (a) {
    "number" === typeof a && (a = new this.h(a));
    var b = 0,
      c = 0,
      d,
      e,
      f;
    for (d = Math.max(this.limbs.length, a.limbs.length) - 1; 0 <= d; d--)
      (e = this.getLimb(d)),
        (f = a.getLimb(d)),
        (c |= (f - e) & ~b),
        (b |= (e - f) & ~c);
    return (c | ~b) >>> 31;
  },
  toString: function () {
    this.fullReduce();
    var a = "",
      b,
      c,
      d = this.limbs;
    for (b = 0; b < this.limbs.length; b++) {
      for (c = d[b].toString(16); b < this.limbs.length - 1 && 6 > c.length; )
        c = "0" + c;
      a = c + a;
    }
    return "0x" + a;
  },
  addM: function (a) {
    "object" !== typeof a && (a = new this.h(a));
    var b = this.limbs,
      c = a.limbs;
    for (a = b.length; a < c.length; a++) b[a] = 0;
    for (a = 0; a < c.length; a++) b[a] += c[a];
    return this;
  },
  doubleM: function () {
    var a,
      b = 0,
      c,
      d = this.radix,
      e = this.radixMask,
      f = this.limbs;
    for (a = 0; a < f.length; a++)
      (c = f[a]), (c = c + c + b), (f[a] = c & e), (b = c >> d);
    b && f.push(b);
    return this;
  },
  halveM: function () {
    var a,
      b = 0,
      c,
      d = this.radix,
      e = this.limbs;
    for (a = e.length - 1; 0 <= a; a--)
      (c = e[a]), (e[a] = (c + b) >> 1), (b = (c & 1) << d);
    e[e.length - 1] || e.pop();
    return this;
  },
  subM: function (a) {
    "object" !== typeof a && (a = new this.h(a));
    var b = this.limbs,
      c = a.limbs;
    for (a = b.length; a < c.length; a++) b[a] = 0;
    for (a = 0; a < c.length; a++) b[a] -= c[a];
    return this;
  },
  mod: function (a) {
    var b = !this.greaterEquals(new sjcl.bn(0));
    a = new sjcl.bn(a).normalize();
    var c = new sjcl.bn(this).normalize(),
      d = 0;
    for (b && (c = new sjcl.bn(0).subM(c).normalize()); c.greaterEquals(a); d++)
      a.doubleM();
    for (b && (c = a.sub(c).normalize()); 0 < d; d--)
      a.halveM(), c.greaterEquals(a) && c.subM(a).normalize();
    return c.trim();
  },
  inverseMod: function (a) {
    var b = new sjcl.bn(1),
      c = new sjcl.bn(0),
      d = new sjcl.bn(this),
      e = new sjcl.bn(a),
      f,
      g = 1;
    if (!(a.limbs[0] & 1))
      throw new sjcl.exception.invalid("inverseMod: p must be odd");
    do
      for (
        d.limbs[0] & 1 &&
          (d.greaterEquals(e) ||
            ((f = d), (d = e), (e = f), (f = b), (b = c), (c = f)),
          d.subM(e),
          d.normalize(),
          b.greaterEquals(c) || b.addM(a),
          b.subM(c)),
          d.halveM(),
          b.limbs[0] & 1 && b.addM(a),
          b.normalize(),
          b.halveM(),
          f = g = 0;
        f < d.limbs.length;
        f++
      )
        g |= d.limbs[f];
    while (g);
    if (!e.equals(1))
      throw new sjcl.exception.invalid(
        "inverseMod: p and x must be relatively prime",
      );
    return c;
  },
  add: function (a) {
    return this.copy().addM(a);
  },
  sub: function (a) {
    return this.copy().subM(a);
  },
  mul: function (a) {
    "number" === typeof a ? (a = new this.h(a)) : a.normalize();
    this.normalize();
    var b,
      c = this.limbs,
      d = a.limbs,
      e = c.length,
      f = d.length,
      g = new this.h(),
      h = g.limbs,
      k,
      m = this.maxMul;
    for (b = 0; b < this.limbs.length + a.limbs.length + 1; b++) h[b] = 0;
    for (b = 0; b < e; b++) {
      k = c[b];
      for (a = 0; a < f; a++) h[b + a] += k * d[a];
      --m || ((m = this.maxMul), g.cnormalize());
    }
    return g.cnormalize().reduce();
  },
  square: function () {
    return this.mul(this);
  },
  power: function (a) {
    a = new sjcl.bn(a).normalize().trim().limbs;
    var b,
      c,
      d = new this.h(1),
      e = this;
    for (b = 0; b < a.length; b++)
      for (c = 0; c < this.radix; c++) {
        a[b] & (1 << c) && (d = d.mul(e));
        if (b == a.length - 1 && 0 == a[b] >> (c + 1)) break;
        e = e.square();
      }
    return d;
  },
  mulmod: function (a, b) {
    return this.mod(b).mul(a.mod(b)).mod(b);
  },
  powermod: function (a, b) {
    a = new sjcl.bn(a);
    b = new sjcl.bn(b);
    if (1 == (b.limbs[0] & 1)) {
      var c = this.montpowermod(a, b);
      if (0 != c) return c;
    }
    for (
      var d, e = a.normalize().trim().limbs, f = new this.h(1), g = this, c = 0;
      c < e.length;
      c++
    )
      for (d = 0; d < this.radix; d++) {
        e[c] & (1 << d) && (f = f.mulmod(g, b));
        if (c == e.length - 1 && 0 == e[c] >> (d + 1)) break;
        g = g.mulmod(g, b);
      }
    return f;
  },
  montpowermod: function (a, b) {
    function c(a, b) {
      var c = b % a.radix;
      return (a.limbs[Math.floor(b / a.radix)] & (1 << c)) >> c;
    }
    function d(a, c) {
      var d,
        e,
        f = (1 << (m + 1)) - 1;
      d = a.mul(c);
      e = d.mul(r);
      e.limbs = e.limbs.slice(0, k.limbs.length);
      e.limbs.length == k.limbs.length && (e.limbs[k.limbs.length - 1] &= f);
      e = e.mul(b);
      e = d.add(e).normalize().trim();
      e.limbs = e.limbs.slice(k.limbs.length - 1);
      for (d = 0; d < e.limbs.length; d++)
        0 < d && (e.limbs[d - 1] |= (e.limbs[d] & f) << (g - m - 1)),
          (e.limbs[d] >>= m + 1);
      e.greaterEquals(b) && e.subM(b);
      return e;
    }
    a = new sjcl.bn(a).normalize().trim();
    b = new sjcl.bn(b);
    var e,
      f,
      g = this.radix,
      h = new this.h(1);
    e = this.copy();
    var k, m, p;
    p = a.bitLength();
    k = new sjcl.bn({
      limbs: b
        .copy()
        .normalize()
        .trim()
        .limbs.map(function () {
          return 0;
        }),
    });
    for (m = this.radix; 0 < m; m--)
      if (1 == ((b.limbs[b.limbs.length - 1] >> m) & 1)) {
        k.limbs[k.limbs.length - 1] = 1 << m;
        break;
      }
    if (0 == p) return this;
    p = 18 > p ? 1 : 48 > p ? 3 : 144 > p ? 4 : 768 > p ? 5 : 6;
    var l = k.copy(),
      n = b.copy();
    f = new sjcl.bn(1);
    for (var r = new sjcl.bn(0), q = k.copy(); q.greaterEquals(1); )
      q.halveM(),
        0 == (f.limbs[0] & 1)
          ? (f.halveM(), r.halveM())
          : (f.addM(n), f.halveM(), r.halveM(), r.addM(l));
    f = f.normalize();
    r = r.normalize();
    l.doubleM();
    n = l.mulmod(l, b);
    if (!l.mul(f).sub(b.mul(r)).equals(1)) return !1;
    e = d(e, n);
    h = d(h, n);
    l = {};
    f = (1 << (p - 1)) - 1;
    l[1] = e.copy();
    l[2] = d(e, e);
    for (e = 1; e <= f; e++) l[2 * e + 1] = d(l[2 * e - 1], l[2]);
    for (e = a.bitLength() - 1; 0 <= e; )
      if (0 == c(a, e)) (h = d(h, h)), --e;
      else {
        for (n = e - p + 1; 0 == c(a, n); ) n++;
        q = 0;
        for (f = n; f <= e; f++) (q += c(a, f) << (f - n)), (h = d(h, h));
        h = d(h, l[q]);
        e = n - 1;
      }
    return d(h, 1);
  },
  trim: function () {
    var a = this.limbs,
      b;
    do b = a.pop();
    while (a.length && 0 === b);
    a.push(b);
    return this;
  },
  reduce: function () {
    return this;
  },
  fullReduce: function () {
    return this.normalize();
  },
  normalize: function () {
    var a = 0,
      b,
      c = this.placeVal,
      d = this.ipv,
      e,
      f = this.limbs,
      g = f.length,
      h = this.radixMask;
    for (b = 0; b < g || (0 !== a && -1 !== a); b++)
      (a = (f[b] || 0) + a), (e = f[b] = a & h), (a = (a - e) * d);
    -1 === a && (f[b - 1] -= c);
    this.trim();
    return this;
  },
  cnormalize: function () {
    var a = 0,
      b,
      c = this.ipv,
      d,
      e = this.limbs,
      f = e.length,
      g = this.radixMask;
    for (b = 0; b < f - 1; b++)
      (a = e[b] + a), (d = e[b] = a & g), (a = (a - d) * c);
    e[b] += a;
    return this;
  },
  toBits: function (a) {
    this.fullReduce();
    a = a || this.exponent || this.bitLength();
    var b = Math.floor((a - 1) / 24),
      c = sjcl.bitArray,
      d = [
        c.partial(((a + 7) & -8) % this.radix || this.radix, this.getLimb(b)),
      ];
    for (b--; 0 <= b; b--)
      (d = c.concat(d, [c.partial(Math.min(this.radix, a), this.getLimb(b))])),
        (a -= this.radix);
    return d;
  },
  bitLength: function () {
    this.fullReduce();
    for (
      var a = this.radix * (this.limbs.length - 1),
        b = this.limbs[this.limbs.length - 1];
      b;
      b >>>= 1
    )
      a++;
    return (a + 7) & -8;
  },
};
sjcl.bn.fromBits = function (a) {
  var b = new this(),
    c = [],
    d = sjcl.bitArray,
    e = this.prototype,
    f = Math.min(this.bitLength || 0x100000000, d.bitLength(a)),
    g = f % e.radix || e.radix;
  for (c[0] = d.extract(a, 0, g); g < f; g += e.radix)
    c.unshift(d.extract(a, g, e.radix));
  b.limbs = c;
  return b;
};
sjcl.bn.prototype.ipv =
  1 / (sjcl.bn.prototype.placeVal = Math.pow(2, sjcl.bn.prototype.radix));
sjcl.bn.prototype.radixMask = (1 << sjcl.bn.prototype.radix) - 1;
sjcl.bn.pseudoMersennePrime = function (a, b) {
  function c(a) {
    this.initWith(a);
  }
  var d = (c.prototype = new sjcl.bn()),
    e,
    f,
    g;
  g = d.modOffset = Math.ceil((f = a / d.radix));
  d.exponent = a;
  d.offset = [];
  d.factor = [];
  d.minOffset = g;
  d.fullMask = 0;
  d.fullOffset = [];
  d.fullFactor = [];
  d.modulus = c.modulus = new sjcl.bn(Math.pow(2, a));
  d.fullMask = 0 | -Math.pow(2, a % d.radix);
  for (e = 0; e < b.length; e++)
    (d.offset[e] = Math.floor(b[e][0] / d.radix - f)),
      (d.fullOffset[e] = Math.floor(b[e][0] / d.radix) - g + 1),
      (d.factor[e] =
        b[e][1] * Math.pow(0.5, a - b[e][0] + d.offset[e] * d.radix)),
      (d.fullFactor[e] =
        b[e][1] * Math.pow(0.5, a - b[e][0] + d.fullOffset[e] * d.radix)),
      d.modulus.addM(new sjcl.bn(Math.pow(2, b[e][0]) * b[e][1])),
      (d.minOffset = Math.min(d.minOffset, -d.offset[e]));
  d.h = c;
  d.modulus.cnormalize();
  d.reduce = function () {
    var a,
      b,
      c,
      d = this.modOffset,
      e = this.limbs,
      f = this.offset,
      g = this.offset.length,
      q = this.factor,
      u;
    for (a = this.minOffset; e.length > d; ) {
      c = e.pop();
      u = e.length;
      for (b = 0; b < g; b++) e[u + f[b]] -= q[b] * c;
      a--;
      a || (e.push(0), this.cnormalize(), (a = this.minOffset));
    }
    this.cnormalize();
    return this;
  };
  d.Y =
    -1 === d.fullMask
      ? d.reduce
      : function () {
          var a = this.limbs,
            b = a.length - 1,
            c,
            d;
          this.reduce();
          if (b === this.modOffset - 1) {
            d = a[b] & this.fullMask;
            a[b] -= d;
            for (c = 0; c < this.fullOffset.length; c++)
              a[b + this.fullOffset[c]] -= this.fullFactor[c] * d;
            this.normalize();
          }
        };
  d.fullReduce = function () {
    var a, b;
    this.Y();
    this.addM(this.modulus);
    this.addM(this.modulus);
    this.normalize();
    this.Y();
    for (b = this.limbs.length; b < this.modOffset; b++) this.limbs[b] = 0;
    a = this.greaterEquals(this.modulus);
    for (b = 0; b < this.limbs.length; b++)
      this.limbs[b] -= this.modulus.limbs[b] * a;
    this.cnormalize();
    return this;
  };
  d.inverse = function () {
    return this.power(this.modulus.sub(2));
  };
  c.fromBits = sjcl.bn.fromBits;
  return c;
};
var H = sjcl.bn.pseudoMersennePrime;
sjcl.bn.prime = {
  p127: H(127, [[0, -1]]),
  p25519: H(255, [[0, -19]]),
  p192k: H(192, [
    [32, -1],
    [12, -1],
    [8, -1],
    [7, -1],
    [6, -1],
    [3, -1],
    [0, -1],
  ]),
  p224k: H(224, [
    [32, -1],
    [12, -1],
    [11, -1],
    [9, -1],
    [7, -1],
    [4, -1],
    [1, -1],
    [0, -1],
  ]),
  p256k: H(0x100, [
    [32, -1],
    [9, -1],
    [8, -1],
    [7, -1],
    [6, -1],
    [4, -1],
    [0, -1],
  ]),
  p192: H(192, [
    [0, -1],
    [64, -1],
  ]),
  p224: H(224, [
    [0, 1],
    [96, -1],
  ]),
  p256: H(0x100, [
    [0, -1],
    [96, 1],
    [192, 1],
    [224, -1],
  ]),
  p384: H(384, [
    [0, -1],
    [32, 1],
    [96, -1],
    [128, -1],
  ]),
  p521: H(521, [[0, -1]]),
};
sjcl.bn.random = function (a, b) {
  "object" !== typeof a && (a = new sjcl.bn(a));
  for (
    var c, d, e = a.limbs.length, f = a.limbs[e - 1] + 1, g = new sjcl.bn();
    ;

  ) {
    do
      (c = sjcl.random.randomWords(e, b)),
        0 > c[e - 1] && (c[e - 1] += 0x100000000);
    while (Math.floor(c[e - 1] / f) === Math.floor(0x100000000 / f));
    c[e - 1] %= f;
    for (d = 0; d < e - 1; d++) c[d] &= a.radixMask;
    g.limbs = c;
    if (!g.greaterEquals(a)) return g;
  }
};
sjcl.keyexchange.srp = {
  makeVerifier: function (a, b, c, d) {
    a = sjcl.keyexchange.srp.makeX(a, b, c);
    a = sjcl.bn.fromBits(a);
    return d.g.powermod(a, d.N);
  },
  makeX: function (a, b, c) {
    a = sjcl.hash.sha1.hash(a + ":" + b);
    return sjcl.hash.sha1.hash(sjcl.bitArray.concat(c, a));
  },
  knownGroup: function (a) {
    "string" !== typeof a && (a = a.toString());
    sjcl.keyexchange.srp.T || sjcl.keyexchange.srp.fa();
    return sjcl.keyexchange.srp.V[a];
  },
  T: !1,
  fa: function () {
    var a, b;
    for (a = 0; a < sjcl.keyexchange.srp.U.length; a++)
      (b = sjcl.keyexchange.srp.U[a].toString()),
        (b = sjcl.keyexchange.srp.V[b]),
        (b.N = new sjcl.bn(b.N)),
        (b.g = new sjcl.bn(b.g));
    sjcl.keyexchange.srp.T = !0;
  },
  U: [1024, 1536, 2048, 3072, 0x1000, 6144, 8192],
  V: {
    1024: {
      N: "EEAF0AB9ADB38DD69C33F80AFA8FC5E86072618775FF3C0B9EA2314C9C256576D674DF7496EA81D3383B4813D692C6E0E0D5D8E250B98BE48E495C1D6089DAD15DC7D7B46154D6B6CE8EF4AD69B15D4982559B297BCF1885C529F566660E57EC68EDBC3C05726CC02FD4CBF4976EAA9AFD5138FE8376435B9FC61D2FC0EB06E3",
      g: 2,
    },
    1536: {
      N: "9DEF3CAFB939277AB1F12A8617A47BBBDBA51DF499AC4C80BEEEA9614B19CC4D5F4F5F556E27CBDE51C6A94BE4607A291558903BA0D0F84380B655BB9A22E8DCDF028A7CEC67F0D08134B1C8B97989149B609E0BE3BAB63D47548381DBC5B1FC764E3F4B53DD9DA1158BFD3E2B9C8CF56EDF019539349627DB2FD53D24B7C48665772E437D6C7F8CE442734AF7CCB7AE837C264AE3A9BEB87F8A2FE9B8B5292E5A021FFF5E91479E8CE7A28C2442C6F315180F93499A234DCF76E3FED135F9BB",
      g: 2,
    },
    2048: {
      N: "AC6BDB41324A9A9BF166DE5E1389582FAF72B6651987EE07FC3192943DB56050A37329CBB4A099ED8193E0757767A13DD52312AB4B03310DCD7F48A9DA04FD50E8083969EDB767B0CF6095179A163AB3661A05FBD5FAAAE82918A9962F0B93B855F97993EC975EEAA80D740ADBF4FF747359D041D5C33EA71D281E446B14773BCA97B43A23FB801676BD207A436C6481F1D2B9078717461A5B9D32E688F87748544523B524B0D57D5EA77A2775D2ECFA032CFBDBF52FB3786160279004E57AE6AF874E7303CE53299CCC041C7BC308D82A5698F3A8D0C38271AE35F8E9DBFBB694B5C803D89F7AE435DE236D525F54759B65E372FCD68EF20FA7111F9E4AFF73",
      g: 2,
    },
    3072: {
      N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A93AD2CAFFFFFFFFFFFFFFFF",
      g: 5,
    },
    0x1000: {
      N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C934063199FFFFFFFFFFFFFFFF",
      g: 5,
    },
    6144: {
      N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DCC4024FFFFFFFFFFFFFFFF",
      g: 5,
    },
    8192: {
      N: "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AAAC42DAD33170D04507A33A85521ABDF1CBA64ECFB850458DBEF0A8AEA71575D060C7DB3970F85A6E1E4C7ABF5AE8CDB0933D71E8C94E04A25619DCEE3D2261AD2EE6BF12FFA06D98A0864D87602733EC86A64521F2B18177B200CBBE117577A615D6C770988C0BAD946E208E24FA074E5AB3143DB5BFCE0FD108E4B82D120A92108011A723C12A787E6D788719A10BDBA5B2699C327186AF4E23C1A946834B6150BDA2583E9CA2AD44CE8DBBBC2DB04DE8EF92E8EFC141FBECAA6287C59474E6BC05D99B2964FA090C3A2233BA186515BE7ED1F612970CEE2D7AFB81BDD762170481CD0069127D5B05AA993B4EA988D8FDDC186FFB7DC90A6C08F4DF435C93402849236C3FAB4D27C7026C1D4DCB2602646DEC9751E763DBA37BDF8FF9406AD9E530EE5DB382F413001AEB06A53ED9027D831179727B0865A8918DA3EDBEBCF9B14ED44CE6CBACED4BB1BDB7F1447E6CC254B332051512BD7AF426FB8F401378CD2BF5983CA01C64B92ECF032EA15D1721D03F482D7CE6E74FEF6D55E702F46980C82B5A84031900B1C9E59E7C97FBEC7E8F323A97A7E36CC88BE0F1D45B7FF585AC54BD407B22B4154AACC8F6D7EBF48E1D814CC5ED20F8037E0A79715EEF29BE32806A1D58BB7C5DA76F550AA3D8A1FBFF0EB19CCB1A313D55CDA56C9EC2EF29632387FE8D76E3C0468043E8F663F4860EE12BF2D5B0B7474D6E694F91E6DBE115974A3926F12FEE5E438777CB6A932DF8CD8BEC4D073B931BA3BC832B68D9DD300741FA7BF8AFC47ED2576F6936BA424663AAB639C5AE4F5683423B4742BF1C978238F16CBE39D652DE3FDB8BEFC848AD922222E04A4037C0713EB57A81A23F0C73473FC646CEA306B4BCBC8862F8385DDFA9D4B7FA2C087E879683303ED5BDD3A062B3CF5B3A278A66D2A13F83F44F82DDF310EE074AB6A364597E899A0255DC164F31CC50846851DF9AB48195DED7EA1B1D510BD7EE74D73FAF36BC31ECFA268359046F4EB879F924009438B481C6CD7889A002ED5EE382BC9190DA6FC026E479558E4475677E9AA9E3050E2765694DFC81F56E880B96E7160C980DD98EDD3DFFFFFFFFFFFFFFFFF",
      g: 19,
    },
  },
};
"undefined" !== typeof module && module.exports && (module.exports = sjcl);
"function" === typeof define &&
  define([], function () {
    return sjcl;
  });
