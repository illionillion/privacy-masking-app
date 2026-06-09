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

  it("base 側の __proto__ / constructor / prototype キーは結果に含めない", () => {
    const result = deepMergeRecords(
      {
        version: 1,
        __proto__: { polluted: true },
        detection: { autoDetectFace: true, __proto__: { polluted: true } },
      },
      {}
    );

    expect(result).toEqual({ version: 1, detection: { autoDetectFace: true } });
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("override 側の __proto__ / constructor / prototype キーはマージしない", () => {
    const result = deepMergeRecords(
      { version: 1, detection: { autoDetectFace: true } },
      {
        __proto__: { polluted: true },
        constructor: { polluted: true },
        prototype: { polluted: true },
        version: 2,
      }
    );

    expect(result).toEqual({ version: 2, detection: { autoDetectFace: true } });
    expect(Object.prototype).not.toHaveProperty("polluted");
  });

  it("未知のトップレベルキーを維持する", () => {
    const result = deepMergeRecords({ legacy: "keep", version: 1 }, { version: 2 });

    expect(result).toEqual({ legacy: "keep", version: 2 });
  });
});
