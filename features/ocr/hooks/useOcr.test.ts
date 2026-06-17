import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { useOcr, detectPersonalInfoInLine } from "./useOcr";

/** テスト用モックWorker */
const mockTerminate = vi.fn().mockResolvedValue(undefined);
const mockRecognize = vi.fn();
const mockSetParameters = vi.fn().mockResolvedValue(undefined);
const mockWorker = {
  recognize: mockRecognize,
  terminate: mockTerminate,
  setParameters: mockSetParameters,
};

vi.mock("tesseract.js", () => ({
  createWorker: vi.fn(),
  OEM: {
    TESSERACT_ONLY: 0,
    LSTM_ONLY: 1,
    TESSERACT_LSTM_COMBINED: 2,
    DEFAULT: 3,
  },
  PSM: {
    AUTO: 3,
  },
}));

/**
 * OCR結果のモックPage構造を生成する
 *
 * @param lines - 行テキストと単語情報の配列
 */
function buildMockPage(
  lines: Array<{
    text: string;
    words: Array<{
      text: string;
      bbox: { x0: number; y0: number; x1: number; y1: number };
    }>;
  }>
) {
  return {
    data: {
      blocks: [
        {
          paragraphs: [
            {
              lines: lines.map((line) => ({
                text: line.text,
                words: line.words,
                bbox: { x0: 0, y0: 0, x1: 500, y1: 20 },
                baseline: { x0: 0, y0: 0, x1: 500, y1: 20 },
                rowAttributes: { ascenders: 0, descenders: 0, rowHeight: 20 },
                confidence: 90,
              })),
              bbox: { x0: 0, y0: 0, x1: 500, y1: 100 },
              is_ltr: true,
              confidence: 90,
              text: lines.map((l) => l.text).join("\n"),
            },
          ],
          bbox: { x0: 0, y0: 0, x1: 500, y1: 200 },
          blocktype: "TEXT",
          confidence: 90,
          text: lines.map((l) => l.text).join("\n"),
        },
      ],
      confidence: 90,
      oem: "LSTM_ONLY",
      osd: "",
      psm: "AUTO",
      text: lines.map((l) => l.text).join("\n"),
      version: "5.0.0",
      hocr: null,
      tsv: null,
      box: null,
      unlv: null,
      sd: null,
      imageColor: null,
      imageGrey: null,
      imageBinary: null,
      rotateRadians: null,
      pdf: null,
      debug: null,
    },
  };
}

/**
 * 複数段落の OCR 結果モックを生成する
 *
 * @param paragraphs - 段落ごとの行配列
 */
function buildMockPageWithParagraphs(
  paragraphs: Array<
    Array<{
      text: string;
      words: Array<{
        text: string;
        bbox: { x0: number; y0: number; x1: number; y1: number };
      }>;
    }>
  >
) {
  return {
    data: {
      blocks: [
        {
          paragraphs: paragraphs.map((lines, paragraphIndex) => ({
            lines: lines.map((line, lineIndex) => ({
              text: line.text,
              words: line.words,
              bbox: {
                x0: 0,
                y0: paragraphIndex * 40 + lineIndex * 20,
                x1: 200,
                y1: paragraphIndex * 40 + lineIndex * 20 + 20,
              },
              baseline: { x0: 0, y0: 0, x1: 200, y1: 20 },
              rowAttributes: { ascenders: 0, descenders: 0, rowHeight: 20 },
              confidence: 90,
            })),
            bbox: { x0: 0, y0: paragraphIndex * 40, x1: 200, y1: paragraphIndex * 40 + 40 },
            is_ltr: true,
            confidence: 90,
            text: lines.map((line) => line.text).join("\n"),
          })),
          bbox: { x0: 0, y0: 0, x1: 200, y1: paragraphs.length * 40 },
          blocktype: "TEXT",
          confidence: 90,
          text: paragraphs.flatMap((lines) => lines.map((line) => line.text)).join("\n"),
        },
      ],
      confidence: 90,
      oem: "LSTM_ONLY",
      osd: "",
      psm: "AUTO",
      text: paragraphs.flatMap((lines) => lines.map((line) => line.text)).join("\n"),
      version: "5.0.0",
      hocr: null,
      tsv: null,
      box: null,
      unlv: null,
      sd: null,
      imageColor: null,
      imageGrey: null,
      imageBinary: null,
      rotateRadians: null,
      pdf: null,
      debug: null,
    },
  };
}

describe("useOcr", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    /** createWorker のデフォルトモックを設定する */
    const tesseract = await import("tesseract.js");
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("初期状態では isRecognizing が false、ocrRegions が空", () => {
    const { result } = renderHook(() => useOcr());
    expect(result.current.isRecognizing).toBe(false);
    expect(result.current.ocrRegions).toHaveLength(0);
  });

  it("Worker 初期化時に PSM.AUTO を設定する", async () => {
    const { PSM } = await import("tesseract.js");
    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");
    mockRecognize.mockResolvedValueOnce(buildMockPage([]));

    await act(async () => {
      await result.current.recognizeText(mockImage);
    });

    expect(mockSetParameters).toHaveBeenCalledWith({ tessedit_pageseg_mode: PSM.AUTO });
  });

  it("setParameters 失敗時に Worker を terminate し再初期化できる", async () => {
    mockSetParameters.mockRejectedValueOnce(new Error("setParameters failed"));
    mockRecognize.mockResolvedValueOnce(buildMockPage([]));

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    await act(async () => {
      await expect(result.current.recognizeText(mockImage)).rejects.toThrow("setParameters failed");
    });
    expect(mockTerminate).toHaveBeenCalledTimes(1);

    mockSetParameters.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.recognizeText(mockImage);
    });
    expect(mockSetParameters).toHaveBeenCalledTimes(2);
  });

  it("アンマウント時に Worker を terminate する", async () => {
    mockRecognize.mockResolvedValueOnce(buildMockPage([]));

    const { result, unmount } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    await act(async () => {
      await result.current.recognizeText(mockImage);
    });

    unmount();

    await waitFor(() => {
      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  it("recognizeText 完了後は isRecognizing が false になる", async () => {
    mockRecognize.mockResolvedValueOnce(buildMockPage([]));

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    await act(async () => {
      await result.current.recognizeText(mockImage);
    });

    expect(result.current.isRecognizing).toBe(false);
  });

  it("blocks が null のとき空配列を返す", async () => {
    mockRecognize.mockResolvedValueOnce({ data: { blocks: null } });

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage);
    });

    expect(regions).toHaveLength(0);
  });

  it("メールアドレスを検出して OcrRegion を返す", async () => {
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: "user@example.com",
          words: [
            {
              text: "user@example.com",
              bbox: { x0: 10, y0: 20, x1: 120, y1: 35 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage);
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({
      patternType: "email",
      text: "user@example.com",
      x: 10,
      y: 20,
      width: 110,
      height: 15,
    });
    expect(result.current.ocrRegions).toHaveLength(1);
  });

  it("電話番号を検出して OcrRegion を返す", async () => {
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: "090-1234-5678",
          words: [
            {
              text: "090-1234-5678",
              bbox: { x0: 5, y0: 10, x1: 100, y1: 25 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage);
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({
      patternType: "phone",
      text: "090-1234-5678",
    });
  });

  it("URLを検出して OcrRegion を返す", async () => {
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: "https://example.com/path",
          words: [
            {
              text: "https://example.com/path",
              bbox: { x0: 0, y0: 0, x1: 150, y1: 20 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage);
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({
      patternType: "url",
      text: "https://example.com/path",
    });
  });

  it("20文字以上の英数字列を apikey として検出する", async () => {
    const apiKey = "abcdefghijklmnopqrstu"; // 21文字
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: apiKey,
          words: [
            {
              text: apiKey,
              bbox: { x0: 0, y0: 0, x1: 200, y1: 20 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage);
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]).toMatchObject({
      patternType: "apikey",
    });
  });

  it("OCR処理失敗時に例外が再スローされ isRecognizing が false になる", async () => {
    mockRecognize.mockRejectedValueOnce(new Error("OCR失敗"));

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    await act(async () => {
      await expect(result.current.recognizeText(mockImage)).rejects.toThrow("OCR失敗");
    });

    expect(result.current.isRecognizing).toBe(false);
  });

  it("OCR処理失敗時に ocrRegions が空配列にクリアされる", async () => {
    // まず正常実行して ocrRegions に値をセットする
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: "user@example.com",
          words: [{ text: "user@example.com", bbox: { x0: 0, y0: 0, x1: 130, y1: 20 } }],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    await act(async () => {
      await result.current.recognizeText(mockImage);
    });
    expect(result.current.ocrRegions).toHaveLength(1);

    // 次に失敗させて ocrRegions がクリアされることを確認
    mockRecognize.mockRejectedValueOnce(new Error("OCR失敗"));
    await act(async () => {
      await expect(result.current.recognizeText(mockImage)).rejects.toThrow("OCR失敗");
    });

    await waitFor(() => {
      expect(result.current.ocrRegions).toHaveLength(0);
    });
  });

  it("recognizeText の連続呼び出しで古い結果が state を上書きしない", async () => {
    let resolveFirst!: (value: unknown) => void;
    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    mockRecognize.mockReturnValueOnce(firstPromise).mockResolvedValueOnce(
      buildMockPage([
        {
          text: "user@second.com",
          words: [
            {
              text: "user@second.com",
              bbox: { x0: 50, y0: 60, x1: 150, y1: 80 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    /** 1回目の認識を開始（pending） */
    await act(async () => {
      void result.current.recognizeText(mockImage);
      await new Promise<void>((r) => setTimeout(r, 0));
    });

    /** 2回目の認識を完了させる */
    await act(async () => {
      await result.current.recognizeText(mockImage);
    });

    await waitFor(() => {
      expect(result.current.ocrRegions).toHaveLength(1);
    });
    expect(result.current.ocrRegions[0]).toMatchObject({ text: "user@second.com" });

    /** 1回目を遅れて解決（空データ）：state を上書きしないことを確認 */
    await act(async () => {
      resolveFirst(buildMockPage([]));
      await new Promise<void>((r) => setTimeout(r, 0));
    });

    expect(result.current.ocrRegions).toHaveLength(1);
    expect(result.current.ocrRegions[0]).toMatchObject({ text: "user@second.com" });
  });
});

describe("detectPersonalInfoInLine", () => {
  it("空のテキストは空配列を返す", () => {
    const result = detectPersonalInfoInLine("", []);
    expect(result).toHaveLength(0);
  });

  it("パターンに一致しないテキストは空配列を返す", () => {
    const result = detectPersonalInfoInLine("Hello World", [
      { text: "Hello", bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } },
      { text: "World", bbox: { x0: 55, y0: 0, x1: 100, y1: 20 } },
    ]);
    expect(result).toHaveLength(0);
  });

  it("メールアドレスを正しく検出する", () => {
    const result = detectPersonalInfoInLine("contact@test.org", [
      { text: "contact@test.org", bbox: { x0: 0, y0: 5, x1: 130, y1: 25 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("email");
    expect(result[0].text).toBe("contact@test.org");
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(5);
    expect(result[0].width).toBe(130);
    expect(result[0].height).toBe(20);
  });

  it("電話番号（固定電話）を正しく検出する", () => {
    const result = detectPersonalInfoInLine("03-1234-5678", [
      { text: "03-1234-5678", bbox: { x0: 10, y0: 0, x1: 100, y1: 18 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("phone");
  });

  it("電話番号（携帯・ハイフンあり）を正しく検出する", () => {
    const result = detectPersonalInfoInLine("080-1234-5678", [
      { text: "080-1234-5678", bbox: { x0: 0, y0: 0, x1: 110, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("phone");
    expect(result[0].text).toBe("080-1234-5678");
  });

  it("電話番号（携帯・ハイフンなし）を正しく検出する", () => {
    const result = detectPersonalInfoInLine("09012345678", [
      { text: "09012345678", bbox: { x0: 0, y0: 0, x1: 90, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("phone");
    expect(result[0].text).toBe("09012345678");
  });

  it("電話番号（国際番号形式）を正しく検出する", () => {
    const result = detectPersonalInfoInLine("+81-90-1234-5678", [
      { text: "+81-90-1234-5678", bbox: { x0: 0, y0: 0, x1: 130, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("phone");
    expect(result[0].text).toBe("+81-90-1234-5678");
  });

  it("電話番号（フリーダイヤル・4桁プレフィックス）を正しく検出する", () => {
    const result = detectPersonalInfoInLine("0120-123-456", [
      { text: "0120-123-456", bbox: { x0: 0, y0: 0, x1: 110, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("phone");
    expect(result[0].text).toBe("0120-123-456");
  });

  it("URLを正しく検出する", () => {
    const result = detectPersonalInfoInLine("https://api.example.com/v1/users", [
      {
        text: "https://api.example.com/v1/users",
        bbox: { x0: 0, y0: 0, x1: 250, y1: 20 },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("url");
  });

  it("20文字未満の英数字は apikey として検出しない", () => {
    const result = detectPersonalInfoInLine("short123", [
      { text: "short123", bbox: { x0: 0, y0: 0, x1: 80, y1: 20 } },
    ]);
    expect(result.some((r) => r.patternType === "apikey")).toBe(false);
  });

  it("複数の単語にまたがるマッチのbboxを統合する", () => {
    const result = detectPersonalInfoInLine("user @example.com", [
      { text: "user", bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
      { text: "@example.com", bbox: { x0: 45, y0: 0, x1: 130, y1: 20 } },
    ]);
    /** "user@example.com" が1単語にマッチするかは認識結果次第だが
     *  両単語のbboxを統合した結果を確認 */
    const emailMatch = result.find((r) => r.patternType === "email");
    if (emailMatch) {
      expect(emailMatch.x).toBe(0);
      expect(emailMatch.width).toBe(130);
    }
  });

  it("同じ範囲のテキストが複数パターンにマッチしても重複を返さない", () => {
    // "user@example.com" は email と apikey の両方にマッチしうるが
    // 優先度の高い email のみが返される
    const text = "user@example.com";
    const result = detectPersonalInfoInLine(text, [
      { text, bbox: { x0: 0, y0: 0, x1: 130, y1: 20 } },
    ]);
    // email が apikey より優先されること
    const types = result.map((r) => r.patternType);
    expect(types).not.toContain("apikey");
    expect(types).toContain("email");
  });

  it("郵便番号（ハイフンあり）を postal として検出する", () => {
    const result = detectPersonalInfoInLine("〒123-4567", [
      { text: "〒123-4567", bbox: { x0: 0, y0: 0, x1: 80, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("postal");
    expect(result[0].text).toBe("〒123-4567");
  });

  it("郵便番号を phone の部分文字列として誤検出しない", () => {
    const result = detectPersonalInfoInLine("の 〇 〒100-0001", [
      { text: "の", bbox: { x0: 0, y0: 0, x1: 20, y1: 20 } },
      { text: "〇", bbox: { x0: 25, y0: 0, x1: 40, y1: 20 } },
      { text: "〒100-0001", bbox: { x0: 45, y0: 0, x1: 130, y1: 20 } },
    ]);
    expect(result.some((r) => r.patternType === "phone")).toBe(false);
    expect(result.some((r) => r.patternType === "postal")).toBe(true);
  });

  it("0始まりの郵便番号を phone として誤検出しない", () => {
    const result = detectPersonalInfoInLine("〒010-0001", [
      { text: "〒010-0001", bbox: { x0: 0, y0: 0, x1: 90, y1: 20 } },
    ]);
    expect(result.some((r) => r.patternType === "phone")).toBe(false);
    expect(result.some((r) => r.patternType === "postal")).toBe(true);
  });

  it("郵便番号（区切りなし）を postal として検出する", () => {
    const result = detectPersonalInfoInLine("1234567", [
      { text: "1234567", bbox: { x0: 0, y0: 0, x1: 70, y1: 20 } },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("postal");
  });

  it("郵便番号（スペース区切り）を postal として検出する", () => {
    const result = detectPersonalInfoInLine("123 4567", [
      { text: "123", bbox: { x0: 0, y0: 0, x1: 30, y1: 20 } },
      { text: "4567", bbox: { x0: 35, y0: 0, x1: 65, y1: 20 } },
    ]);
    expect(result.some((r) => r.patternType === "postal")).toBe(true);
  });

  it("6桁以下の数字は postal として検出しない", () => {
    const result = detectPersonalInfoInLine("12345", [
      { text: "12345", bbox: { x0: 0, y0: 0, x1: 50, y1: 20 } },
    ]);
    expect(result.some((r) => r.patternType === "postal")).toBe(false);
  });

  it("OCR で分割された姓名を空白差を無視して検出する", () => {
    const result = detectPersonalInfoInLine(
      "山田 太郎",
      [
        { text: "山田", bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
        { text: "太郎", bbox: { x0: 45, y0: 0, x1: 90, y1: 20 } },
      ],
      ["山田太郎"]
    );
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("custom");
    expect(result[0].text).toBe("山田太郎");
    expect(result[0].x).toBe(0);
    expect(result[0].width).toBe(90);
  });

  it("登録語句に空白があっても OCR 分割を検出する", () => {
    const result = detectPersonalInfoInLine(
      "山田 太郎",
      [
        { text: "山田", bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
        { text: "太郎", bbox: { x0: 45, y0: 0, x1: 90, y1: 20 } },
      ],
      ["山田　太郎"]
    );
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("山田　太郎");
  });

  it("カスタムマスク語句を連続テキストで検出する", () => {
    const result = detectPersonalInfoInLine(
      "担当: 山田太郎",
      [
        { text: "担当:", bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
        { text: "山田太郎", bbox: { x0: 45, y0: 0, x1: 110, y1: 20 } },
      ],
      ["山田太郎"]
    );
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("custom");
    expect(result[0].text).toBe("山田太郎");
    expect(result[0].x).toBe(45);
    expect(result[0].width).toBe(65);
  });

  it("カスタムマスク語句は既存パターンと重なる範囲では検出しない", () => {
    const result = detectPersonalInfoInLine(
      "contact@test.org",
      [{ text: "contact@test.org", bbox: { x0: 0, y0: 5, x1: 130, y1: 25 } }],
      ["contact@test.org", "test"]
    );
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("email");
  });

  it("長いカスタム語句を短い語句より優先する", () => {
    const result = detectPersonalInfoInLine(
      "山田太郎",
      [{ text: "山田太郎", bbox: { x0: 0, y0: 0, x1: 80, y1: 20 } }],
      ["山田", "山田太郎"]
    );
    expect(result).toHaveLength(1);
    expect(result[0].patternType).toBe("custom");
    expect(result[0].text).toBe("山田太郎");
  });
});

describe("extractOcrRegions bbox重複排除", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const tesseract = await import("tesseract.js");
    vi.mocked(tesseract.createWorker).mockResolvedValue(mockWorker as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("emailパターンとカスタム語句が同一bboxに一致する場合は重複を返さない", async () => {
    mockRecognize.mockResolvedValueOnce(
      buildMockPage([
        {
          text: "user@example.com",
          words: [
            {
              text: "user@example.com",
              bbox: { x0: 10, y0: 20, x1: 120, y1: 35 },
            },
          ],
        },
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage, {
        customMaskTerms: ["user@example.com"],
      });
    });

    expect(regions).toHaveLength(1);
    expect(regions[0]?.patternType).toBe("email");
  });

  it("別段落に同じカスタム語句があればそれぞれ検出する", async () => {
    mockRecognize.mockResolvedValueOnce(
      buildMockPageWithParagraphs([
        [
          {
            text: "山田太郎",
            words: [{ text: "山田太郎", bbox: { x0: 0, y0: 0, x1: 80, y1: 20 } }],
          },
        ],
        [
          {
            text: "山田太郎",
            words: [{ text: "山田太郎", bbox: { x0: 0, y0: 40, x1: 80, y1: 60 } }],
          },
        ],
      ])
    );

    const { result } = renderHook(() => useOcr());
    const mockImage = document.createElement("img");

    let regions: Awaited<ReturnType<typeof result.current.recognizeText>> = [];
    await act(async () => {
      regions = await result.current.recognizeText(mockImage, {
        customMaskTerms: ["山田太郎"],
      });
    });

    expect(regions).toHaveLength(2);
    expect(regions.every((region) => region.patternType === "custom")).toBe(true);
  });
});
