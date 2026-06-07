import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDetectionForGalleryItems } from "./runDetectionForGalleryItems";
import { detectImageContent } from "./detectImageContent";
import type { MaskingImageItem } from "../types";

vi.mock("./detectImageContent", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./detectImageContent")>();
  return {
    ...actual,
    detectImageContent: vi.fn().mockResolvedValue({
      detections: [],
      ocrRegions: [],
      naturalWidth: 100,
      naturalHeight: 100,
    }),
  };
});

const createItem = (id: string): MaskingImageItem => ({
  id,
  name: `${id}.png`,
  size: 100,
  imageUrl: `blob:${id}`,
  detections: [],
  ocrRegions: [],
  maskedBlobUrl: null,
  isProcessing: true,
  processingError: false,
});

describe("runDetectionForGalleryItems", () => {
  const detectFaces = vi.fn().mockResolvedValue([]);
  const recognizeText = vi.fn().mockResolvedValue([]);
  const detectionSettings = { autoDetectFace: true, autoDetectOcr: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("concurrency が 0 以下でも最低 1 として全件処理する", async () => {
    const onItemSuccess = vi.fn();
    const items = [createItem("a"), createItem("b")];

    const result = await runDetectionForGalleryItems({
      items,
      isMounted: () => true,
      concurrency: 0,
      detectionSettings,
      detectFaces,
      recognizeText,
      onItemSuccess,
      onItemSkipped: vi.fn(),
      onItemFailure: vi.fn(),
    });

    expect(onItemSuccess).toHaveBeenCalledTimes(2);
    expect(result.detectionSucceededCount).toBe(2);
  });

  it("両方オフのときは detectImageContent を呼ばず onItemSkipped する", async () => {
    const onItemSkipped = vi.fn();
    const items = [createItem("a")];

    await runDetectionForGalleryItems({
      items,
      isMounted: () => true,
      detectionSettings: { autoDetectFace: false, autoDetectOcr: false },
      detectFaces,
      recognizeText,
      onItemSuccess: vi.fn(),
      onItemSkipped,
      onItemFailure: vi.fn(),
    });

    expect(onItemSkipped).toHaveBeenCalledWith(items[0]);
    expect(vi.mocked(detectImageContent)).not.toHaveBeenCalled();
  });
});
