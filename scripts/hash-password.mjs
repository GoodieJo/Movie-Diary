/**
 * Generate a password hash for your diary (PBKDF2-SHA256, Web Crypto API).
 * Usage: node scripts/hash-password.mjs "your-secret-password"
 */
import { webcrypto as crypto } from "crypto";

const ITERATIONS = 100000;

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error("Usage: node scripts/hash-password.mjs <password>");
    process.exit(1);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );

  const saltHex = Buffer.from(salt).toString("hex");
  const hashHex = Buffer.from(derived).toString("hex");
  const stored  = `${ITERATIONS}:${saltHex}:${hashHex}`;

  console.log("\nYour password hash (copy this):\n");
  console.log(stored);
  console.log("\nSet it as a Cloudflare secret with:");
  console.log("  wrangler pages secret put DIARY_PASSWORD_HASH\n");
}

main();