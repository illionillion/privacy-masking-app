import { describe, it, expect } from "vitest";
import {
  formatCustomMaskTermsSummary,
  formatDetectionSettingsSummary,
  getDetectionBatchCompleteMessage,
  getDetectionCompleteMessage,
} from "./detectionMessages";
import { DEFAULT_FUSELY_PREFS } from "@/lib/preferences";

describe("detectionMessages", () => {
  it("サマリ文字列を返す", () => {
    expect(formatDetectionSettingsSummary(DEFAULT_FUSELY_PREFS.detection)).toBe(
      "顔: 自動 · OCR: 自動"
    );
    expect(formatDetectionSettingsSummary({ autoDetectFace: false, autoDetectOcr: true })).toBe(
      "顔: 手動 · OCR: 自動"
    );
  });

  it("マスク語句サマリ文字列を返す", () => {
    expect(formatCustomMaskTermsSummary([])).toBe("未登録");
    expect(
      formatCustomMaskTermsSummary([
        { id: "1", text: "山田太郎", enabled: true },
        { id: "2", text: "田中", enabled: false },
      ])
    ).toBe("2件（有効 1件）");
  });

  it("両方オフのアップロード時メッセージを返す", () => {
    expect(
      getDetectionCompleteMessage(
        { autoDetectFace: false, autoDetectOcr: false },
        "a.png",
        "upload"
      )
    ).toBe("a.png を追加しました（自動検出なし）");
  });

  it("再検出で両方オフのときは null を返す", () => {
    expect(
      getDetectionCompleteMessage(
        { autoDetectFace: false, autoDetectOcr: false },
        "a.png",
        "redetect"
      )
    ).toBeNull();
  });

  it("バッチメッセージは 2 件以上のときだけ返す", () => {
    expect(getDetectionBatchCompleteMessage(DEFAULT_FUSELY_PREFS.detection, 1)).toBeNull();
    expect(getDetectionBatchCompleteMessage(DEFAULT_FUSELY_PREFS.detection, 2)).toBe(
      "2 件の検出が完了しました"
    );
  });
});
