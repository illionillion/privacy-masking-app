import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { MaskingGallery } from "./MaskingGallery";

vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

vi.mock("fflate", () => ({
  zip: vi.fn(),
}));

vi.mock("@/features/face-detection", () => ({
  useFaceDetection: () => ({
    isModelLoading: false,
    isModelError: false,
    isDetecting: false,
    detectFaces: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("@/features/ocr", () => ({
  useOcr: () => ({
    isRecognizing: false,
    recognizeText: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("@/lib/confirmStore", () => ({
  useConfirmStore: {
    getState: () => ({ open: vi.fn().mockResolvedValue(true) }),
  },
}));

vi.mock("@/components/ImageUpload", () => ({
  ImageUpload: ({ onUpload }: { onUpload: (files: File[]) => void }) => (
    <div data-testid="image-upload" onClick={() => onUpload([])} />
  ),
}));

/**
 * jsdom では ClipboardEvent が未定義のため、
 * paste イベントを Event として生成し clipboardData を Object.defineProperty で設定するヘルパー
 */
const createPasteEvent = (items: Array<{ type: string; getAsFile: () => File | null }> | null) => {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: items !== null ? { items } : null,
    writable: false,
  });
  return event;
};

describe("MaskingGallery - クリップボード貼り付け", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("画像をペーストすると toast.info が呼ばれる", async () => {
    render(<MaskingGallery />);

    const imageFile = new File(["data"], "screenshot.png", { type: "image/png" });
    const items = [{ type: "image/png", getAsFile: () => imageFile }];

    fireEvent(window, createPasteEvent(items));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("画像を貼り付けました");
    });
  });

  it("クリップボードに画像がない場合は何もしない", () => {
    render(<MaskingGallery />);

    const items = [{ type: "text/plain", getAsFile: () => null }];

    fireEvent(window, createPasteEvent(items));

    expect(toast.info).not.toHaveBeenCalled();
  });

  it("clipboardData が null の場合は何もしない", () => {
    render(<MaskingGallery />);

    fireEvent(window, createPasteEvent(null));

    expect(toast.info).not.toHaveBeenCalled();
  });

  it("コンポーネントのアンマウント後は paste イベントを処理しない", () => {
    const { unmount } = render(<MaskingGallery />);
    unmount();

    const imageFile = new File(["data"], "screenshot.png", { type: "image/png" });
    const items = [{ type: "image/png", getAsFile: () => imageFile }];

    fireEvent(window, createPasteEvent(items));

    expect(toast.info).not.toHaveBeenCalled();
  });
});
