import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("有効な画像をペーストすると toast.info が呼ばれアップロード処理が開始される", async () => {
    render(<MaskingGallery />);

    const imageFile = new File(["data"], "screenshot.png", { type: "image/png" });
    const items = [{ type: "image/png", getAsFile: () => imageFile }];

    fireEvent(window, createPasteEvent(items));

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith("画像を貼り付けました");
      /** handleUpload → arrayBuffer → createObjectURL まで到達したことを確認 */
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  it("許可外の MIME 形式をペーストすると toast.error が呼ばれアップロードしない", async () => {
    render(<MaskingGallery />);

    const bmpFile = new File(["data"], "image.bmp", { type: "image/bmp" });
    const items = [{ type: "image/bmp", getAsFile: () => bmpFile }];

    fireEvent(window, createPasteEvent(items));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "JPEG / PNG / WebP / GIF 形式の画像を選択してください"
      );
    });
    expect(toast.info).not.toHaveBeenCalled();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
  });

  it("20MB 超のファイルをペーストすると toast.error が呼ばれアップロードしない", async () => {
    render(<MaskingGallery />);

    const largeFile = new File(["data"], "large.png", { type: "image/png" });
    Object.defineProperty(largeFile, "size", { value: 21 * 1024 * 1024 });
    const items = [{ type: "image/png", getAsFile: () => largeFile }];

    fireEvent(window, createPasteEvent(items));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("ファイルサイズは20MB以下にしてください");
    });
    expect(toast.info).not.toHaveBeenCalled();
    expect(createObjectURLSpy).not.toHaveBeenCalled();
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
