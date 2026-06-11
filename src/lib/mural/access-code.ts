import { createHash, randomInt } from "node:crypto";

export function generateAccessCode() {
  return String(randomInt(100000, 999999));
}

export function hashAccessCode(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyAccessCode(code: string, hash: string) {
  return hashAccessCode(code) === hash;
}
