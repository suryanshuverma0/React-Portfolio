/* ========================================
   PASSWORD TOOLS — everything runs in the
   browser:
   - generator (crypto RNG, rejection
     sampling, no modulo bias) + passphrases
   - strength estimate (entropy-ish, penalises
     patterns), reuse detection
   - TOTP codes (RFC 6238, HMAC-SHA1) for
     saved 2FA secrets
   - breach check via Have I Been Pwned's
     k-anonymity range API: only the first 5
     hex chars of the SHA-1 hash ever leave
     the device, never the password
   - CSV import (Chrome / Edge / Bitwarden /
     generic) and export
========================================= */

const randInt = (max) => {
  // Uniform integer in [0, max) without modulo bias.
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  for (;;) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
};

const SETS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};
const AMBIGUOUS = { lower: "l", upper: "IO", digits: "01" };

export const generatePassword = ({ length = 20, lower = true, upper = true, digits = true, symbols = true, ambiguous = false } = {}) => {
  const groups = Object.entries({ lower, upper, digits, symbols })
    .filter(([, on]) => on)
    .map(([k]) => SETS[k] + (ambiguous ? AMBIGUOUS[k] || "" : ""));
  if (!groups.length) groups.push(SETS.lower);
  const all = groups.join("");
  // One from each chosen group, the rest from everything, then shuffle.
  const chars = groups.map((g) => g[randInt(g.length)]);
  while (chars.length < length) chars.push(all[randInt(all.length)]);
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.slice(0, length).join("");
};

// ~640 short, common, easy-to-type words → ~9.3 bits each.
const WORDS = (
  "able acid aged also area army away baby back bake ball band bank barn base bath bead beam bean bear beat beef bell belt bend best bike bird bite blue boat body bold bolt bone book boot born boss both bowl brad brick bridge brief bring brisk broad broom brown brush bulb bull bump burn bush busy cabin cable cake calm camp cane card care cart case cash cast cave cell chair chalk charm chart chef chess chew chin chip city clam clay clean clerk cliff climb clock cloud clown club coal coat code coin cold cook cool copy cord core corn cost couch crab crane crisp crop crow crown cube cup curl curve cute daily dance dark dash date dawn deal deck deep deer desk dial dice dish dock dome door dove draft drama dream dress drift drill drink drum duck dune dust eagle early earth easy echo edge eight elbow elder elk empty equal even exam extra fable face fact fair fall fame farm fast fawn feast fence fern few field film find fire firm fish five flag flame flash fleet flint float flock flood floor flour fluid flute foam focus fog folk food foot fork form fort fox frame fresh frog frost fruit fuel fun fury game gate gear gem gift glad glass globe glove glow glue goat gold golf good grab grain grape grass gravy great green grid grin grip group grove guard guest guide gulf habit hair half hall hand harbor hard harp hat hawk hazel head heap heart heat hedge hello helm herb hero hill hint hive hobby hold holly home honey hood hook hope horn horse host hotel house human humor hunt husky ice icon idea inch index ink inner iron island ivory ivy jade jam jar jazz jeep jelly jewel job jog joke jolly judge juice jump jungle kayak keen kettle key kick kind king kite kiwi knee knife knock koala label lace lady lake lamb lamp land lane large laser latch lava lawn layer leaf lean lemon lens level lift light lilac lily lime line lion list llama loaf lobby local lodge logic loose lotus loud lucky lunar lunch magic maize major mango maple march marsh mask match maze meadow medal melon menu merit metal milk mint mist moat model mole money moon moose moss motor mouse mud mug music nail name navy neat nest net never night noble noise north nose note novel nut oak oasis ocean olive omega onion open opera orbit orchid otter oval oven owl ozone paddle page paint palm panda paper park party pasta path peach pearl pedal penny pepper piano pickle pilot pine pink pipe pixel pizza plain plane plant plate plaza plum poem polar pond pony pool poppy porch pound power prism prize proud puma pumpkin pupil puppy quart quest quick quiet quilt quote rabbit radar radio rain ranch rapid raven razor ready relay remix ridge ring river road robin robot rock rocket roof room rope rose round royal ruby rugby ruler sable sail salad salt sand satin sauce scale scarf scene scout seal seed shade shark sheep shelf shell shine ship shoe shore silk silver sketch skate sky slate sleep slice slope smile smoke snack snail snow soap sofa solar sonic soup space spark spice spike spoon spring spruce square squid stage stamp star steam steel stem stone storm story straw stream sugar sun swan sweet swift table taco tale tango tea teal tent thorn tiger tile timber toast token tomato tooth topaz torch tower toy track trail train tree trend tribe trout truck tulip tuna tunnel turtle twig umbrella uncle union unit urban vapor vase velvet violet violin visit vivid vocal volt wagon walnut walrus wand water wave wax wheat whale wheel willow wind wing winter wise wolf wood wool world yacht yard yarn yeti yoga zebra zero zinc zone"
).split(" ");

export const generatePassphrase = ({ words = 5, separator = "-", capitalize = true, number = true } = {}) => {
  const list = Array.from({ length: words }, () => {
    const w = WORDS[randInt(WORDS.length)];
    return capitalize ? w[0].toUpperCase() + w.slice(1) : w;
  });
  if (number) list[randInt(list.length)] += String(randInt(10));
  return list.join(separator);
};
export const passphraseBits = (words, number) => Math.round(words * Math.log2(WORDS.length) + (number ? Math.log2(10 * words) : 0));

/* ---------- strength ---------- */

const COMMON = /^(password|passw0rd|qwerty|letmein|welcome|admin|iloveyou|monkey|dragon|abc123|111111|123123|000000)/i;

export const entropyBits = (pw = "") => {
  if (!pw) return 0;
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/\d/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  let bits = pw.length * Math.log2(Math.max(pool, 1));
  if (/(.)\1{2,}/.test(pw)) bits *= 0.75; // aaa
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|asdf)/i.test(pw)) bits *= 0.7;
  if (COMMON.test(pw)) bits = Math.min(bits, 10);
  if (/^[A-Za-z]+\d{1,4}[!@#$]?$/.test(pw)) bits *= 0.7; // Word2024!
  return Math.round(bits);
};

export const strengthOf = (pw) => {
  const bits = entropyBits(pw);
  if (bits < 36) return { level: 0, label: "Weak", bits, color: "bg-red-500", text: "text-red-500" };
  if (bits < 60) return { level: 1, label: "Fair", bits, color: "bg-amber-500", text: "text-amber-600" };
  if (bits < 80) return { level: 2, label: "Good", bits, color: "bg-emerald-500", text: "text-emerald-600" };
  return { level: 3, label: "Strong", bits, color: "bg-emerald-500", text: "text-emerald-600" };
};

export const crackTime = (bits) => {
  // Offline attack at ~10 billion guesses/second (fast hashes, GPU rig).
  const seconds = 2 ** bits / 2 / 1e10;
  if (seconds < 1) return "instantly";
  const units = [
    [60, "seconds"],
    [60, "minutes"],
    [24, "hours"],
    [365, "days"],
    [1000, "years"],
  ];
  if (seconds > 3.15e10) return "thousands of years+";
  let v = seconds;
  for (const [step, unit] of units) {
    if (v < step) return `${Math.round(v)} ${unit}`;
    v /= step;
  }
  return "forever";
};

/* ---------- TOTP (RFC 6238) ---------- */

const base32ToBytes = (s) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out = [];
  for (const c of clean) {
    value = (value << 5) | alphabet.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
};

// Accepts a raw base32 secret or a full otpauth:// URI.
export const parseTotp = (input = "") => {
  const text = input.trim();
  if (!text) return null;
  if (text.startsWith("otpauth://")) {
    try {
      const u = new URL(text);
      return { secret: u.searchParams.get("secret") || "", digits: Number(u.searchParams.get("digits")) || 6, period: Number(u.searchParams.get("period")) || 30, issuer: u.searchParams.get("issuer") || "" };
    } catch {
      return null;
    }
  }
  return { secret: text, digits: 6, period: 30 };
};

export const totpCode = async (input, now = Date.now()) => {
  const cfg = parseTotp(input);
  if (!cfg?.secret) return null;
  const key = base32ToBytes(cfg.secret);
  if (key.length < 10) return null;
  const counter = Math.floor(now / 1000 / cfg.period);
  const msg = new ArrayBuffer(8);
  new DataView(msg).setUint32(4, counter);
  new DataView(msg).setUint32(0, Math.floor(counter / 2 ** 32));
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", k, msg));
  const o = h[h.length - 1] & 15;
  const bin = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return { code: String(bin % 10 ** cfg.digits).padStart(cfg.digits, "0"), remaining: cfg.period - (Math.floor(now / 1000) % cfg.period), period: cfg.period };
};

/* ---------- breach check (k-anonymity) ---------- */

const sha1Hex = async (text) => [...new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();

// Returns how many times the password appears in known breaches (0 = not found).
export const pwnedCount = async (password) => {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { "Add-Padding": "true" }, referrerPolicy: "no-referrer", credentials: "omit" });
  if (!res.ok) throw new Error("Breach check unavailable right now");
  const line = (await res.text()).split("\n").find((l) => l.startsWith(suffix));
  return line ? Number(line.split(":")[1]) || 0 : 0;
};

/* ---------- import / export ---------- */

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
};

// Chrome/Edge: name,url,username,password,note · Bitwarden: …name,notes,…,login_uri,login_username,login_password,login_totp
export const parsePasswordCsv = (text) => {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip a byte-order mark
  const [header, ...rows] = parseCsv(clean);
  if (!header) return [];
  const h = header.map((x) => x.trim().toLowerCase());
  const col = (...names) => names.map((n) => h.indexOf(n)).find((i) => i >= 0);
  const idx = {
    name: col("name", "title", "account"),
    url: col("url", "login_uri", "website", "uri"),
    username: col("username", "login_username", "user", "email", "login"),
    password: col("password", "login_password"),
    notes: col("note", "notes", "extra"),
    totp: col("login_totp", "totp", "otpauth"),
    folder: col("folder", "group", "category"),
  };
  if (idx.password === undefined) throw new Error("Couldn't find a password column in that file");
  const get = (r, k) => (idx[k] === undefined ? "" : (r[idx[k]] || "").trim());
  return rows
    .map((r) => {
      const url = get(r, "url");
      let host = "";
      try {
        host = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        /* not a URL */
      }
      return { title: get(r, "name") || host || get(r, "username") || "Login", url, username: get(r, "username"), password: get(r, "password"), notes: get(r, "notes"), totp: get(r, "totp"), category: get(r, "folder") };
    })
    .filter((e) => e.password);
};

const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
export const toPasswordCsv = (entries) => [["name", "url", "username", "password", "note", "totp"], ...entries.map((e) => [e.title, e.url, e.username, e.password, e.notes, e.totp])].map((r) => r.map(cell).join(",")).join("\n");

export const hostOf = (url) => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};
