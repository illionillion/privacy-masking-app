import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useFaceDetection } from "./useFaceDetection";

vi.mock("@vladmandic/face-api", () => ({
  nets: {
    ssdMobilenetv1: {
      loadFromUri: vi.fn(),
    },
  },
  detectAllFaces: vi.fn(),
  SsdMobilenetv1Options: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe("useFaceDetection", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const faceapi = await import("@vladmandic/face-api");
    vi.mocked(faceapi.nets.ssdMobilenetv1.loadFromUri).mockResolvedValue(undefined);
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
    vi.mocked(faceapi.nets.ssdMobilenetv1.loadFromUri).mockRejectedValueOnce(
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
  });

  it("detectFaces の連続呼び出しで古い結果が戻り値に影響しない", async () => {
    const faceapi = await import("@vladmandic/face-api");

    vi.mocked(faceapi.detectAllFaces)
      .mockResolvedValueOnce([
        { box: { x: 10, y: 20, width: 30, height: 40 }, score: 0.9 } as never,
      ])
      .mockResolvedValueOnce([
        { box: { x: 50, y: 60, width: 70, height: 80 }, score: 0.8 } as never,
      ]);

    const { result } = renderHook(() => useFaceDetection());
    await waitFor(() => expect(result.current.isModelLoading).toBe(false));

    const mockImage = document.createElement("img");

    let first: Awaited<ReturnType<typeof result.current.detectFaces>> = [];
    let second: Awaited<ReturnType<typeof result.current.detectFaces>> = [];

    await act(async () => {
      first = await result.current.detectFaces(mockImage);
      second = await result.current.detectFaces(mockImage);
    });

    expect(first[0]).toMatchObject({ x: 10, y: 20 });
    expect(second[0]).toMatchObject({ x: 50, y: 60 });
  });

  it("face-api が reject した場合 detectFaces は空配列を返し error state と toast が設定される", async () => {
    const faceapi = await import("@vladmandic/face-api");
    const { toast } = await import("sonner");

    vi.mocked(faceapi.detectAllFaces).mockRejectedValueOnce(new Error("検出エラー"));

    const { result } = renderHook(() => useFaceDetection());
    await waitFor(() => expect(result.current.isModelLoading).toBe(false));

    const mockImage = document.createElement("img");
    let detections: Awaited<ReturnType<typeof result.current.detectFaces>> = [];
    await act(async () => {
      detections = await result.current.detectFaces(mockImage);
    });

    expect(detections).toHaveLength(0);
    expect(result.current.error).toBe("検出エラー");
    expect(toast.error).toHaveBeenCalledWith("顔検出エラー: 検出エラー");
  });
});
