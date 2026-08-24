import { describe, expect, it } from "vitest";
import { assertSafePublicUrl } from "../src/index.js";

describe("web access SSRF guard", () => {
  it("rejects non-HTTPS URLs before network lookup", async () => {
    await expect(assertSafePublicUrl("http://127.0.0.1/admin")).rejects.toThrow("HTTPS");
  });

  it("rejects credentialed URLs", async () => {
    await expect(assertSafePublicUrl("https://admin:secret@example.com")).rejects.toThrow(
      "Credentialed",
    );
  });
});
