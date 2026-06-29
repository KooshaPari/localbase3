/**
 * Security regression tests: secrets-at-rest (audit issue #57)
 *
 * 1. Mnemonic MUST NOT appear in log output — it must be redacted.
 * 2. API keys MUST be stored as HMAC-SHA256 hashes, not plaintext.
 */

"use strict";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

const crypto = require("crypto");

/** Collect every message written through the module under test. */
function captureLogMessages(loggerModule) {
  const captured = [];
  const wrap = (level) => {
    const orig = loggerModule[level].bind(loggerModule);
    loggerModule[level] = (...args) => {
      captured.push(args.map(String).join(" "));
      orig(...args);
    };
  };
  ["info", "warn", "error", "debug"].forEach(wrap);
  return captured;
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Mnemonic redaction
// ────────────────────────────────────────────────────────────────────────────

describe("blockchain.py — mnemonic MUST be redacted from logs", () => {
  /**
   * The Python file is the real source of truth for this issue, but we can
   * verify the JS-side analogue to make the test runnable in the Node.js
   * jest suite.  The Python fix is validated here at the pattern level.
   *
   * We read the source file and assert the dangerous log line is gone.
   */
  const fs = require("fs");
  const path = require("path");

  const BLOCKCHAIN_PY = path.resolve(
    __dirname,
    "../../..",
    "localbase-provider/localbase_provider/blockchain.py"
  );

  it("blockchain.py source must not log the raw mnemonic", () => {
    const src = fs.readFileSync(BLOCKCHAIN_PY, "utf8");
    // The old dangerous line: logger.info(f"Generated new mnemonic: {self.wallet_mnemonic}")
    expect(src).not.toMatch(/logger\.(info|debug|warning|error).*wallet_mnemonic/);
  });

  it("blockchain.py source must not log the mnemonic passed into _setup_wallet", () => {
    const src = fs.readFileSync(BLOCKCHAIN_PY, "utf8");
    // Must not interpolate the mnemonic into any f-string log call
    expect(src).not.toMatch(/f".*mnemonic.*\{.*mnemonic.*\}/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 2. API key encryption at rest (JS / database service)
// ────────────────────────────────────────────────────────────────────────────

describe("database.js — API keys MUST be stored as HMAC hashes, not plaintext", () => {
  const fs = require("fs");
  const path = require("path");

  const DATABASE_JS = path.resolve(
    __dirname,
    "../../src/services/database.js"
  );

  it("database.js source must not store the raw key value directly in the DB", () => {
    const src = fs.readFileSync(DATABASE_JS, "utf8");
    // The old dangerous pattern: .insert({ key, ... }) where key is the plaintext secret
    // After the fix, the field stored should be key_hash (HMAC) not the raw key.
    // Assert the plaintext-key insert pattern is gone.
    expect(src).not.toMatch(/insert\s*\(\s*\{[\s\S]*?\bkey\s*,/);
  });

  it("database.js source must use HMAC to look up keys, not eq('key', apiKey)", () => {
    const src = fs.readFileSync(DATABASE_JS, "utf8");
    // Old pattern: .eq("key", apiKey) — looks up raw plaintext
    expect(src).not.toMatch(/\.eq\s*\(\s*["']key["']\s*,\s*apiKey\s*\)/);
  });

  it("database.js must reference hashApiKey (from keyHash utility)", () => {
    const src = fs.readFileSync(DATABASE_JS, "utf8");
    expect(src).toMatch(/hashApiKey/);
  });

  it("keyHash.js utility must use HMAC-SHA256", () => {
    const KEY_HASH_JS = path.resolve(
      __dirname,
      "../../src/utils/keyHash.js"
    );
    const src = fs.readFileSync(KEY_HASH_JS, "utf8");
    expect(src).toMatch(/createHmac/i);
    expect(src).toMatch(/sha256/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 3. hashApiKey unit behaviour
// ────────────────────────────────────────────────────────────────────────────

describe("hashApiKey helper", () => {
  let hashApiKey;

  beforeAll(() => {
    // Import from the standalone utility to avoid ESM-incompatible transitive deps.
    ({ hashApiKey } = require("../../src/utils/keyHash.js"));
  });

  it("must be a function", () => {
    expect(typeof hashApiKey).toBe("function");
  });

  it("returns a hex string of length 64 (SHA-256 output)", () => {
    const h = hashApiKey("lb_sk_test123");
    expect(typeof h).toBe("string");
    expect(h).toHaveLength(64);
    expect(h).toMatch(/^[0-9a-f]+$/);
  });

  it("is deterministic — same key always produces same hash", () => {
    const key = "lb_sk_example";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("is collision-resistant — different keys produce different hashes", () => {
    expect(hashApiKey("lb_sk_a")).not.toBe(hashApiKey("lb_sk_b"));
  });

  it("does NOT return the original key", () => {
    const key = "lb_sk_supersecret";
    expect(hashApiKey(key)).not.toBe(key);
    expect(hashApiKey(key)).not.toContain(key);
  });
});
