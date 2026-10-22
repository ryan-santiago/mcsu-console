import { describe, expect, it } from "vitest";
import { totp } from "../e2e/totp";

// RFC 6238 Appendix B, SHA-1 seed "12345678901234567890" (base32 below), truncated to 6 digits.
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("totp (e2e helper)", () => {
  it.each([
    [59, "287082"],
    [1111111109, "081804"],
    [1234567890, "005924"],
    [2000000000, "279037"],
  ])("t=%i → %s", (seconds, expected) => {
    expect(totp(SECRET, seconds * 1000)).toBe(expected);
  });
});
