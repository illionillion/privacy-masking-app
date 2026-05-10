import { describe, expect, it } from "vitest";
import { ADSENSE_CLIENT_ID } from "./adsenseClientId";

describe("ADSENSE_CLIENT_ID", () => {
  it("ca-pub- 形式の公開 ID である", () => {
    expect(ADSENSE_CLIENT_ID).toMatch(/^ca-pub-\d+$/);
  });
});
