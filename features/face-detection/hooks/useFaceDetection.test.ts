import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useFaceDetection } from "./useFaceDetection";

vi.mock("@vladmandic/face-api", () => ({
  nets: {
    tinyFaceDetector: {
      loadFromUri: vi.fn(),
    },
  },
  detectAllFaces: vi.fn(),
  TinyFaceDetectorOptions: vi.fn(),
}));

describe("useFaceDetection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const faceapi = await import("@vladmandic/face-api");
    vi.mocked(faceapi.nets.tinyFaceDetector.loadFromUri).mockResolvedValue(undefined);
  });

  it("モデルのロード成功で isModelLoading が false になる", async () => {
    const { result } = renderHook(() => useFaceDetection());
    expect(result.current.isModelLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });
    expect(result.current.error).toBeNull();
  });

  it("モデルのロード失敗で error が設定され isModelLoading が false になる", async () => {
    const faceapi = await import("@vladmandic/face-api");
    vi.mocked(faceapi.nets.tinyFaceDetector.loadFromUri).mockRejectedValueOnce(
      new Error("モデルの取得に失敗")
    );
    const { result } = renderHook(() => useFaceDetection());
    await waitFor(() => {
      expect(result.current.isModelLoading).toBe(false);
    });
    expect(result.current.error).toBe("モデルの取得に失敗");
  });

  it("detectFaces が face-api の結果を FaceDetectionResult に正しくマップする", async () => {
    const faceapi = await import("@vladmandic/face-api");
    vi.mocked(faceapi.detectAllFaces).mockResolvedValueOnce([
      { box: { x: 10, y: 20, width: 100, height: 80 }, score: 0.95 } as never,
    ]);
    const { result } = renderHook(() => useFaceDetection());
    await waitFor(() => expect(result.current.isModelLoading).toBe(false));

    const mockImage = document.createElement("img");
    let detections: Awaited<ReturnType<typeof result.current.detectFaces>> = [];
    await act(async () => {
      detections = await result.current.detectFaces(mockImage);
    });
    expect(detections).toHaveLength(1);
    expect(detections[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 80, score: 0.95 });
    expect(result.current.detections[0]).toMatchObject({ x: 10, y: 20, width: 100, height: 80 });
  });

  it("detectFaces の連続呼び出しで古い結果が state を上書きしない", async () => {
    const faceapi = await import("@vladmandic/face-api");

    let resolveFirst!: (value: never[]) => void;
    const firstPromise = new Promise<never[]>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(faceapi.detectAllFaces)
      .mockReturnValueOnce(firstPromise as never)
      .mockResolvedValueOnce([
        { box: { x: 50, y: 60, width: 70, height: 80 }, score: 0.8 } as never,
      ]);

    const { result } = renderHook(() => useFaceDetection());
    await waitFor(() => expect(result.current.isModelLoading).toBe(false));

    const mockImage = document.createElement("img");

    /** 1回目の検出を開始（firstPromise が未解決のため pending 状態） */
    void result.current.detectFaces(mockImage);

    /** マイクロタスクを処理して requestId が ++detectRequestRef.current = 1 に設定されるのを待つ */
    await new Promise<void>((r) => setTimeout(r, 0));

    /** 2回目の検出を実行して完了させる */
    await act(async () => {
      await result.current.detectFaces(mockImage);
    });

    /** 2回目の結果が state に反映されているのを待つ */
    await waitFor(() => {
      expect(result.current.detections).toHaveLength(1);
    });
    expect(result.current.detections[0]).toMatchObject({ x: 50, y: 60 });

    /** 1回目を遅れて完了させる（空配列で resolve） */
    await act(async () => {
      resolveFirst([]);
      await new Promise<void>((r) => setTimeout(r, 0));
    });

    /** 古い1回目の結果で state が上書きされていない */
    expect(result.current.detections).toHaveLength(1);
    expect(result.current.detections[0]).toMatchObject({ x: 50, y: 60 });
  });
});
