import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { toast } from "sonner";
import { ImageUpload } from "./index";
import { UPLOAD_IMAGE_FORMATS_LABEL, URL_DROP_UNSUPPORTED_IMAGE_TYPES_ERROR } from "./constants";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn() } }));

describe("ImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ドロップゾーンが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: "画像をアップロード。クリックしてファイルを選択" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "画像をアップロード。クリックまたはドラッグ＆ドロップ" })
    ).toBeInTheDocument();
  });

  it("ガイドテキストが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getByText("画像をドラッグ＆ドロップ")).toBeInTheDocument();
    expect(screen.getByText("または クリックしてファイルを複数選択")).toBeInTheDocument();
  });

  it("許可形式テキストが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getAllByText(new RegExp(UPLOAD_IMAGE_FORMATS_LABEL))).toHaveLength(2);
  });

  it("loadingMessage 表示中もドロップゾーンのガイド文言で高さを確保する", () => {
    render(<ImageUpload onUpload={vi.fn()} loadingMessage="顔検出モデルをロード中…" />);
    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });
    expect(dropZone).toHaveTextContent("顔検出モデルをロード中…");
    const guideHeading = screen.getByText("画像をドラッグ＆ドロップ");
    expect(dropZone).toContainElement(guideHeading);
    expect(guideHeading.closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
  });

  it("disabled時は操作不可になる", () => {
    render(<ImageUpload onUpload={vi.fn()} disabled />);
    const mobileButton = screen.getByRole("button", {
      name: "画像をアップロード。クリックしてファイルを選択",
    });
    const desktopDropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    expect(mobileButton).toBeDisabled();
    expect(desktopDropZone).toHaveAttribute("aria-disabled", "true");
  });

  it("不正なファイル形式のときエラーを表示する", async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<ImageUpload onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    await user.upload(input, file);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "JPEG / PNG / WebP / GIF / HEIC 形式の画像を選択してください"
      );
    });
  });

  it("サイズ超過ファイルのときエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<ImageUpload onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(["x".repeat(1)], "large.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(largeFile, "size", { value: 21 * 1024 * 1024 });
    await user.upload(input, largeFile);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("ファイルサイズは20MB以下にしてください");
    });
  });

  it("有効な画像ファイルを選択するとonUploadが呼ばれる", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    await user.upload(input, file);
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith([file]);
    });
  });

  it("複数の有効ファイルを選択すると配列でonUploadが呼ばれる", async () => {
    const user = userEvent.setup();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file1 = new File(["content1"], "photo1.jpg", { type: "image/jpeg" });
    const file2 = new File(["content2"], "photo2.png", { type: "image/png" });
    await user.upload(input, [file1, file2]);
    await waitFor(() => {
      expect(onUpload).toHaveBeenCalledWith([file1, file2]);
    });
  });
});

describe("ImageUpload - 別タブ・外部アプリからのD&D", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  /**
   * Canvas プロトタイプと Image グローバルをモックして urlToFile が File を返すよう設定する
   *
   * document.createElement を差し替えると React 内部のレンダリングが壊れるため、
   * HTMLCanvasElement.prototype の getContext/toBlob をスパイする。
   * vi.fn().mockImplementation はアロー関数で class として使えないため class 構文を使う。
   */
  const setupSuccessMock = () => {
    const mockBlob = new Blob(["fake-image"], { type: "image/png" });
    const mockContext = { drawImage: vi.fn() };

    (
      vi.spyOn(HTMLCanvasElement.prototype, "getContext") as ReturnType<typeof vi.spyOn>
    ).mockReturnValue(mockContext);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb: BlobCallback) =>
      cb(mockBlob)
    );

    class MockImageSuccess {
      crossOrigin = "";
      naturalWidth = 100;
      naturalHeight = 100;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_url: string) {
        window.setTimeout(() => this.onload?.(), 0);
      }
    }

    vi.stubGlobal("Image", MockImageSuccess);
  };

  /**
   * Image の src セット時に onerror を呼ぶようにモックする
   */
  const setupErrorMock = () => {
    class MockImageError {
      crossOrigin = "";
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_url: string) {
        window.setTimeout(() => this.onerror?.(), 0);
      }
    }

    vi.stubGlobal("Image", MockImageError);
  };

  it("text/uri-list に data:image/png URI を渡すと onUpload が呼ばれる", async () => {
    setupSuccessMock();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    /** 最小限の 1x1 PNG data: URI */
    const pngDataUri =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? pngDataUri : ""),
      },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });
  });

  it("text/uri-list に許可外 MIME の data: URI を渡すとエラーを表示して onUpload は呼ばれない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? "data:image/bmp;base64,AAAA" : ""),
      },
    });

    expect(toast.error).toHaveBeenCalledWith(URL_DROP_UNSUPPORTED_IMAGE_TYPES_ERROR);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("text/uri-list の URL から画像ファイルが生成され onUpload が呼ばれる", async () => {
    setupSuccessMock();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) =>
          type === "text/uri-list" ? "https://example.com/photo.jpg" : "",
      },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });
  });

  it("text/html の <img src> から画像ファイルが生成され onUpload が呼ばれる", async () => {
    setupSuccessMock();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) =>
          type === "text/html" ? '<img src="https://example.com/photo.png" />' : "",
      },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });
  });

  it("画像 URL の読み込みに失敗した場合はエラーメッセージを表示する", async () => {
    setupErrorMock();
    render(<ImageUpload onUpload={vi.fn()} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) =>
          type === "text/uri-list" ? "https://example.com/cors-blocked.jpg" : "",
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "この画像は読み込めませんでした（CORS・ネットワーク・URLの問題の可能性があります）"
      );
    });
  });

  it("text/uri-list がコメント行・空行を含む複数行でも先頭 URL から onUpload が呼ばれる", async () => {
    setupSuccessMock();
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    const multiLineUriList = [
      "# comment line",
      "",
      "https://example.com/photo.jpg",
      "https://example.com/other.jpg",
    ].join("\n");

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? multiLineUriList : ""),
      },
    });

    await waitFor(() => {
      expect(onUpload).toHaveBeenCalled();
    });
  });

  it("javascript: スキームの URL はエラーを表示して onUpload は呼ばれない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? "javascript:alert(1)" : ""),
      },
    });

    expect(toast.error).toHaveBeenCalledWith("この画像は読み込めませんでした");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("file: スキームの URL はエラーを表示して onUpload は呼ばれない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? "file:///etc/passwd" : ""),
      },
    });

    expect(toast.error).toHaveBeenCalledWith("この画像は読み込めませんでした");
    expect(onUpload).not.toHaveBeenCalled();
  });

  it(".bmp など許可外形式の URL はエラーを表示して onUpload は呼ばれない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) =>
          type === "text/uri-list" ? "https://example.com/photo.bmp" : "",
      },
    });

    expect(toast.error).toHaveBeenCalledWith(URL_DROP_UNSUPPORTED_IMAGE_TYPES_ERROR);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it(".svg など許可外形式の URL はエラーを表示して onUpload は呼ばれない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? "https://example.com/icon.svg" : ""),
      },
    });

    expect(toast.error).toHaveBeenCalledWith(URL_DROP_UNSUPPORTED_IMAGE_TYPES_ERROR);
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("解像度が MAX_CANVAS_DIMENSION を超える画像はエラーを表示して onUpload は呼ばれない", async () => {
    class MockImageOversized {
      crossOrigin = "";
      referrerPolicy = "";
      naturalWidth = 9000;
      naturalHeight = 9000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_url: string) {
        window.setTimeout(() => this.onload?.(), 0);
      }
    }

    vi.stubGlobal("Image", MockImageOversized);

    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: (type: string) => (type === "text/uri-list" ? "https://example.com/huge.jpg" : ""),
      },
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("解像度が大きすぎます"));
    });
    expect(onUpload).not.toHaveBeenCalled();
  });

  it("files が空で URL もない場合は何もしない", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);

    const dropZone = screen.getByRole("button", {
      name: "画像をアップロード。クリックまたはドラッグ＆ドロップ",
    });

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [],
        getData: () => "",
      },
    });

    expect(onUpload).not.toHaveBeenCalled();
  });
});
