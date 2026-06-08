import { describe, it, expect } from "vitest";
import { deepMergeRecords } from "./deepMerge";

describe("deepMergeRecords", () => {
  it("ネストしたオブジェクトをマージする", () => {
    const result = deepMergeRecords(
      { version: 1, detection: { autoDetectFace: true, autoDetectOcr: true } },
      { detection: { autoDetectFace: false } }
    );

    expect(result).toEqual({
      version: 1,
      detection: { autoDetectFace: false, autoDetectOcr: true },
    });
  });

  it("null の override はスキップしてベース値を維持する", () => {
    const result = deepMergeRecords(
      { version: 1, detection: { autoDetectFace: true } },
      { detection: { autoDetectFace: null } }
    );

    expect(result).toEqual({ version: 1, detection: { autoDetectFace: true } });
  });

  it("未知のトップレベルキーを維持する", () => {
    const result = deepMergeRecords({ legacy: "keep", version: 1 }, { version: 2 });

    expect(result).toEqual({ legacy: "keep", version: 2 });
  });
});
