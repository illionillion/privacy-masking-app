import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportEditorCanvas } from "@/features/editor/utils/exportCanvas";
import { resetImageEditorCacheForTests } from "../lib/imageEditorCache";
import { GalleryItem } from "./GalleryItem";
import type { MaskingImageItem } from "../types";

vi.mock("@/features/editor/utils/exportCanvas", () => ({
  exportEditorCanvas: vi.fn().mockResolvedValue("blob:export-result"),
}));

/** 1×1 PNG（data URL）— jsdom で naturalWidth が取れるようにする */
const TINY_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function createImage(overrides: Partial<MaskingImageItem> = {}): MaskingImageItem {
  return {
    id: "img-1",
    name: "test.png",
    size: 1024,
    imageUrl: TINY_DATA_URL,
    detections: [],
    ocrRegions: [],
    maskedBlobUrl: "blob:masked-preview",
    isProcessing: false,
    processingError: false,
    ...overrides,
  };
}

describe("GalleryItem", () => {
  const handlers = {
    onSelect: vi.fn(),
    onOpenEdit: vi.fn(),
    onRedetect: vi.fn(),
    onRendered: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetImageEditorCacheForTests();
    vi.stubGlobal(
      "Image",
      class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        naturalWidth = 800;
        naturalHeight = 600;
        private _src = "";
        set src(value: string) {
          this._src = value;
          queueMicrotask(() => {
            this.onload?.();
          });
        }
        get src(): string {
          return this._src;
        }
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("プレビュー img のみ表示し Konva はマウントしない", async () => {
    render(
      <GalleryItem image={createImage()} isActive={false} isModelLoading={false} {...handlers} />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "test.png を編集" })).toBeInTheDocument();
    });
    expect(screen.queryByTestId("mock-editor-canvas")).not.toBeInTheDocument();

    const previewImg = screen.getByRole("img", { name: "test.png" });
    expect(previewImg).toHaveAttribute("src", "blob:masked-preview");
  });

  it("編集ボタンで onOpenEdit が呼ばれる", async () => {
    render(
      <GalleryItem image={createImage()} isActive={false} isModelLoading={false} {...handlers} />
    );

    fireEvent.click(await screen.findByRole("button", { name: "test.png を編集" }));
    expect(handlers.onOpenEdit).toHaveBeenCalledWith("img-1");
  });

  it("検出失敗時は exportEditorCanvas を呼ばない", async () => {
    render(
      <GalleryItem
        image={createImage({ processingError: true })}
        isActive={false}
        isModelLoading={false}
        {...handlers}
      />
    );

    expect(await screen.findByText("検出に失敗しました。再検出してください。")).toBeInTheDocument();
    expect(vi.mocked(exportEditorCanvas)).not.toHaveBeenCalled();
  });
});
