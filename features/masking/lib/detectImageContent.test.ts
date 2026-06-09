import { describe, it, expect, vi, beforeEach } from "vitest";
import { detectImageContent } from "./detectImageContent";
import { loadImageElement } from "./loadImageElement";

vi.mock("./loadImageElement", () => ({
  loadImageElement: vi.fn(),
}));

describe("detectImageContent", () => {
  const mockDetectFaces = vi.fn();
  const mockRecognizeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDetectFaces.mockResolvedValue([{ x: 0, y: 0, width: 10, height: 10, score: 0.9 }]);
    mockRecognizeText.mockResolvedValue([]);
    vi.mocked(loadImageElement).mockResolvedValue({
      naturalWidth: 800,
      naturalHeight: 600,
    } as HTMLImageElement);
  });

  it("画像を読み込み顔検出とOCRを並行実行して結果を返す", async () => {
    const result = await detectImageContent("blob:test", {
      detectFaces: mockDetectFaces,
      recognizeText: mockRecognizeText,
    });

    expect(loadImageElement).toHaveBeenCalledWith("blob:test");
    expect(mockDetectFaces).toHaveBeenCalledOnce();
    expect(mockRecognizeText).toHaveBeenCalledOnce();
    expect(result).toEqual({
      detections: [{ x: 0, y: 0, width: 10, height: 10, score: 0.9 }],
      ocrRegions: [],
      naturalWidth: 800,
      naturalHeight: 600,
    });
  });

  it("顔のみオンのときは OCR を呼ばない", async () => {
    const result = await detectImageContent(
      "blob:test",
      {
        detectFaces: mockDetectFaces,
        recognizeText: mockRecognizeText,
      },
      { detectionSettings: { autoDetectFace: true, autoDetectOcr: false } }
    );

    expect(mockDetectFaces).toHaveBeenCalledOnce();
    expect(mockRecognizeText).not.toHaveBeenCalled();
    expect(result.ocrRegions).toEqual([]);
  });

  it("OCR のみオンのときは顔検出を呼ばない", async () => {
    await detectImageContent(
      "blob:test",
      {
        detectFaces: mockDetectFaces,
        recognizeText: mockRecognizeText,
      },
      { detectionSettings: { autoDetectFace: false, autoDetectOcr: true } }
    );

    expect(mockDetectFaces).not.toHaveBeenCalled();
    expect(mockRecognizeText).toHaveBeenCalledOnce();
  });

  it("顔検出が失敗した場合はエラーを伝播する", async () => {
    mockDetectFaces.mockRejectedValue(new Error("検出失敗"));

    await expect(
      detectImageContent("blob:test", {
        detectFaces: mockDetectFaces,
        recognizeText: mockRecognizeText,
      })
    ).rejects.toThrow("検出失敗");
  });
});
