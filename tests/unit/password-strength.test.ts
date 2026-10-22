import { describe, expect, it } from "vitest";
import { passwordScore } from "@/components/forms/password-strength";

describe("passwordScore", () => {
  it.each([
    ["", 0],
    ["short1A!", 1],
    ["alllowercaseletters", 2],
    ["Lower-and-Upper1", 4],
    ["Mixed12chars", 3],
  ] as const)("%s → %i", (password, expected) => {
    expect(passwordScore(password)).toBe(expected);
  });
});
