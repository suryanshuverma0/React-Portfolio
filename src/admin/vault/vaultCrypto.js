/* ========================================
   VAULT CRYPTO — all encryption happens
   here, in the browser (WebCrypto). The
   server only ever receives ciphertext.

   vault key (VK)  random AES-256-GCM
     ├─ wrapped by PBKDF2-SHA256(password, 600k)
     └─ wrapped by HKDF(recovery key)  ← 256-bit, shown once
   item key (IK)   random per item, wrapped by VK
     ├─ meta: JSON (title, fields, notes, file list)
     └─ files: 1 MB chunks, each AES-GCM with
        its index/count as AAD (no reordering,
        no truncation)
   auth token      HKDF(VK, "vault-auth") — its
                   hash lets the server accept
                   password changes only from
                   someone who opened the vault.
========================================= */

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const dec = new TextDecoder();
export const PBKDF2_ITERATIONS = 600000;
const CHUNK = 1024 * 1024;
const MAGIC = [0x56, 0x4c, 0x54, 0x31]; // "VLT1"

export const toB64 = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
export const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const random = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));

/* ---------- recovery key (Crockford base32, groups of 4) ---------- */

const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const toB32 = (bytes) => {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
};
const fromB32 = (str) => {
  const clean = str.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const c of clean) {
    const v = B32.indexOf(c);
    if (v < 0) throw new Error("That recovery key has a typo");
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
};
export const formatRecovery = (bytes) => toB32(bytes).match(/.{1,4}/g).join("-");

/* ---------- key derivation ---------- */

const passwordKey = async (password, salt, iterations) => {
  const base = await subtle.importKey("raw", enc.encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, base, { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
};

const recoveryKeyKey = async (recoveryBytes, salt) => {
  const base = await subtle.importKey("raw", recoveryBytes, "HKDF", false, ["deriveKey"]);
  return subtle.deriveKey({ name: "HKDF", hash: "SHA-256", salt, info: enc.encode("vault-recovery-v1") }, base, { name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]);
};

export const authToken = async (vk) => {
  const raw = await subtle.exportKey("raw", vk);
  const base = await subtle.importKey("raw", raw, "HKDF", false, ["deriveBits"]);
  const bits = await subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: new Uint8Array(32), info: enc.encode("vault-auth-v1") }, base, 256);
  return toB64(bits);
};

const wrap = async (key, wrappingKey) => {
  const iv = random(12);
  return { iv: toB64(iv), ct: toB64(await subtle.wrapKey("raw", key, wrappingKey, { name: "AES-GCM", iv })) };
};
const unwrap = (sealedKey, wrappingKey) =>
  subtle.unwrapKey("raw", fromB64(sealedKey.ct), wrappingKey, { name: "AES-GCM", iv: fromB64(sealedKey.iv) }, { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]);
const newKey = () => subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt", "wrapKey", "unwrapKey"]);

export const seal = async (key, value) => {
  const iv = random(12);
  const bytes = value instanceof Uint8Array ? value : enc.encode(JSON.stringify(value));
  return { iv: toB64(iv), ct: toB64(await subtle.encrypt({ name: "AES-GCM", iv }, key, bytes)) };
};
export const openJson = async (key, sealedValue) => JSON.parse(dec.decode(await subtle.decrypt({ name: "AES-GCM", iv: fromB64(sealedValue.iv) }, key, fromB64(sealedValue.ct))));

/* ---------- vault setup / unlock ---------- */

const CHECK = "vault-ok-v1";

const passwordWrap = async (vk, password) => {
  const salt = random(16);
  const kdf = { name: "PBKDF2", hash: "SHA-256", iterations: PBKDF2_ITERATIONS, salt: toB64(salt) };
  return { kdf, byPassword: await wrap(vk, await passwordKey(password, salt, PBKDF2_ITERATIONS)) };
};
const recoveryWrap = async (vk) => {
  const recovery = random(32);
  const salt = random(16);
  return { recovery: formatRecovery(recovery), byRecovery: { salt: toB64(salt), ...(await wrap(vk, await recoveryKeyKey(recovery, salt))) } };
};

export const createVault = async (password) => {
  const vk = await newKey();
  const { kdf, byPassword } = await passwordWrap(vk, password);
  const { recovery, byRecovery } = await recoveryWrap(vk);
  return { vk, recovery, body: { kdf, byPassword, byRecovery, check: await seal(vk, CHECK), authKey: await authToken(vk) } };
};

const verify = async (vk, config) => {
  if ((await openJson(vk, config.check)) !== CHECK) throw new Error("bad");
  return vk;
};

export const unlockWithPassword = async (config, password) => {
  try {
    const kek = await passwordKey(password, fromB64(config.kdf.salt), config.kdf.iterations);
    return await verify(await unwrap(config.byPassword, kek), config);
  } catch {
    throw new Error("That vault password isn't right");
  }
};

export const unlockWithRecovery = async (config, recoveryText) => {
  let bytes;
  try {
    bytes = fromB32(recoveryText);
  } catch (e) {
    throw new Error(e.message, { cause: e });
  }
  if (bytes.length < 32) throw new Error("That recovery key is too short");
  try {
    const kek = await recoveryKeyKey(bytes.slice(0, 32), fromB64(config.byRecovery.salt));
    return await verify(await unwrap(config.byRecovery, kek), config);
  } catch {
    throw new Error("That recovery key isn't right");
  }
};

// New password (and optionally a fresh recovery key) for an open vault.
export const rewrap = async (vk, password, { newRecovery = false } = {}) => {
  const body = { ...(await passwordWrap(vk, password)), authKey: await authToken(vk) };
  let recovery = null;
  if (newRecovery) {
    const r = await recoveryWrap(vk);
    recovery = r.recovery;
    body.byRecovery = r.byRecovery;
  }
  return { body, recovery };
};

/* ---------- items ---------- */

export const newItemKey = async (vk) => {
  const ik = await newKey();
  return { ik, wrapped: await wrap(ik, vk) };
};
export const openItemKey = (vk, wrapped) => unwrap(wrapped, vk);

/* ---------- files ---------- */

export const encryptFile = async (ik, file, onProgress) => {
  const buffer = new Uint8Array(await file.arrayBuffer());
  const count = Math.max(1, Math.ceil(buffer.length / CHUNK));
  const parts = [new Uint8Array([...MAGIC]), new Uint8Array(new Uint32Array([CHUNK, count]).buffer)];
  for (let i = 0; i < count; i += 1) {
    const iv = random(12);
    const ct = new Uint8Array(await subtle.encrypt({ name: "AES-GCM", iv, additionalData: enc.encode(`${i}/${count}`) }, ik, buffer.subarray(i * CHUNK, (i + 1) * CHUNK)));
    parts.push(iv, new Uint8Array(new Uint32Array([ct.length]).buffer), ct);
    onProgress?.((i + 1) / count);
  }
  return new Blob(parts, { type: "application/octet-stream" });
};

export const decryptFile = async (ik, data, type = "application/octet-stream") => {
  const bytes = new Uint8Array(data);
  if (!MAGIC.every((b, i) => bytes[i] === b)) throw new Error("Not a vault file");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(8, true);
  let offset = 12;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const iv = bytes.subarray(offset, offset + 12);
    const len = view.getUint32(offset + 12, true);
    const ct = bytes.subarray(offset + 16, offset + 16 + len);
    out.push(new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv, additionalData: enc.encode(`${i}/${count}`) }, ik, ct)));
    offset += 16 + len;
  }
  if (offset !== bytes.length) throw new Error("This file was altered");
  return new Blob(out, { type });
};
