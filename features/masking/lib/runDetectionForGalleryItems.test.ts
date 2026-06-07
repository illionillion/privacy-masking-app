import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDetectionForGalleryItems } from "./runDetectionForGalleryItems";
import type { MaskingImageItem } from "../types";

vi.mock("./detectImageContent", () => ({
  detectImageContent: vi.fn().mockResolvedValue({
    detections: [],
    ocrRegions: [],
    naturalWidth: 100,
    naturalHeight: 100,
  }),
}));

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
      detectFaces,
      recognizeText,
      onItemSuccess,
      onItemFailure: vi.fn(),
    });

    expect(onItemSuccess).toHaveBeenCalledTimes(2);
    expect(result.detectionSucceededCount).toBe(2);
  });
});
