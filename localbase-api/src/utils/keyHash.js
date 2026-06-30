/**
 * API key hashing utility (audit #57 — secrets at rest)
 *
 * Provides HMAC-SHA256 hashing for API keys so that the raw secret is never
 * stored in the database. The HMAC key is taken from KEY_HASH_SECRET env var.
 * Production deployments MUST set KEY_HASH_SECRET to a random 32-byte value.
 */

"use strict";

const crypto = require("crypto");

/**
 * Hash an API key with HMAC-SHA256.
 *
 * @param {string} apiKey - Plaintext API key (e.g. "lb_sk_…")
 * @returns {string} 64-character hex digest
 */
function hashApiKey(apiKey) {
  const secret =
    process.env.KEY_HASH_SECRET ||
    "localbase-key-hash-secret-change-in-prod";
  return crypto.createHmac("sha256", secret).update(apiKey).digest("hex");
}

module.exports = { hashApiKey };
