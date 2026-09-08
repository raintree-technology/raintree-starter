import { describe, expect, it } from "vitest";
import { cn, initials, slugify } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("strips symbols and collapses separators", () => {
    expect(slugify("My App! 2026")).toBe("my-app-2026");
  });
  it("falls back to 'untitled' when empty", () => {
    expect(slugify("!!!")).toBe("untitled");
  });
});

describe("initials", () => {
  it("uses first two words", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
  });
  it("handles a single word", () => {
    expect(initials("Ada")).toBe("A");
  });
  it("returns ? for empty input", () => {
    expect(initials(null)).toBe("?");
  });
});

describe("cn", () => {
  it("merges conflicting tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
