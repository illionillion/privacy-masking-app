import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { useGalleryDetection } from "./useGalleryDetection";
import { clearImageEditorSnapshot } from "../lib/imageEditorCache";
import { detectImageContent } from "../lib/detectImageContent";
import type { MaskingImageItem } from "../types";

vi.mock("../lib/imageEditorCache", () => ({
  clearImageEditorSnapshot: vi.fn(),
}));

vi.mock("../lib/detectImageContent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/detectImageContent")>();
  return {
    ...actual,
    detectImageContent: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const baseImage: MaskingImageItem = {
  id: "img-1",
  name: "test.png",
  size: 100,
  imageUrl: "blob:test",
  detections: [{ x: 0, y: 0, width: 10, height: 10, score: 0.9 }],
  ocrRegions: [
    { x: 1, y: 1, width: 20, height: 10, text: "test@example.com", patternType: "email" },
  ],
  maskedBlobUrl: "blob:masked",
  isProcessing: false,
  processingError: false,
};

describe("useGalleryDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("検出がすべてオフのとき再検出で状態を変更しない", async () => {
    const setImages = vi.fn();
    const setEditingImageId = vi.fn();
    const isMountedRef = { current: true };

    const { result } = renderHook(() =>
      useGalleryDetection({
        images: [baseImage],
        setImages,
        setActiveImageId: vi.fn(),
        setEditingImageId,
        isMountedRef,
        isModelLoading: false,
        isModelError: false,
        detectFaces: vi.fn(),
        recognizeText: vi.fn(),
        getDetectionSettings: () => ({ autoDetectFace: false, autoDetectOcr: false }),
        getCustomMaskTerms: () => [],
      })
    );

    await act(async () => {
      await result.current.handleRedetect("img-1");
    });

    expect(clearImageEditorSnapshot).not.toHaveBeenCalled();
    expect(setImages).not.toHaveBeenCalled();
    expect(setEditingImageId).not.toHaveBeenCalled();
    expect(detectImageContent).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith(
      "顔・テキストの自動検出はオフです。検出設定から有効にできます。"
    );
  });

  it("検出が有効なとき再検出でスナップショットをクリアして検出を実行する", async () => {
    const setImages = vi.fn();
    const isMountedRef = { current: true };

    vi.mocked(detectImageContent).mockResolvedValue({
      detections: [],
      ocrRegions: [],
      naturalWidth: 100,
      naturalHeight: 100,
    });

    const { result } = renderHook(() =>
      useGalleryDetection({
        images: [baseImage],
        setImages,
        setActiveImageId: vi.fn(),
        setEditingImageId: vi.fn(),
        isMountedRef,
        isModelLoading: false,
        isModelError: false,
        detectFaces: vi.fn(),
        recognizeText: vi.fn(),
        getDetectionSettings: () => ({ autoDetectFace: true, autoDetectOcr: true }),
        getCustomMaskTerms: () => [],
      })
    );

    await act(async () => {
      await result.current.handleRedetect("img-1");
    });

    expect(clearImageEditorSnapshot).toHaveBeenCalledWith("img-1");
    expect(detectImageContent).toHaveBeenCalled();
    expect(setImages).toHaveBeenCalled();
  });
});
