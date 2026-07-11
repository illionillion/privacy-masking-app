import { describe, expect, it } from "vitest";
import { decodeLocationHash } from "./decodeLocationHash";

describe("decodeLocationHash", () => {
  it("通常のハッシュをデコードする", () => {
    expect(decodeLocationHash("%E6%8A%95%E7%A8%BF")).toBe("投稿");
  });

  it("不正な % シーケンスのとき raw を返す", () => {
    expect(decodeLocationHash("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("空文字列のときそのまま返す", () => {
    expect(decodeLocationHash("")).toBe("");
  });
});
