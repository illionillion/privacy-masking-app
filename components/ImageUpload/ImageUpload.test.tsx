import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ImageUpload } from "./index";

describe("ImageUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ドロップゾーンが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getByRole("button", { name: /画像をアップロード/ })).toBeInTheDocument();
  });

  it("ガイドテキストが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getByText("画像をドラッグ＆ドロップ")).toBeInTheDocument();
    expect(screen.getByText("または クリックしてファイルを選択")).toBeInTheDocument();
  });

  it("許可形式テキストが表示される", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    expect(screen.getByText(/JPEG \/ PNG \/ WebP \/ GIF/)).toBeInTheDocument();
  });

  it("disabled時は操作不可になる", () => {
    render(<ImageUpload onUpload={vi.fn()} disabled />);
    const button = screen.getByRole("button", { name: /画像をアップロード/ });
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("不正なファイル形式のときエラーを表示する", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "JPEG / PNG / WebP / GIF 形式の画像を選択してください"
    );
  });

  it("サイズ超過ファイルのときエラーを表示する", () => {
    render(<ImageUpload onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(["x".repeat(1)], "large.jpg", {
      type: "image/jpeg",
    });
    Object.defineProperty(largeFile, "size", { value: 21 * 1024 * 1024 });
    Object.defineProperty(input, "files", { value: [largeFile] });
    fireEvent.change(input);
    expect(screen.getByRole("alert")).toHaveTextContent("ファイルサイズは20MB以下にしてください");
  });

  it("有効な画像ファイルを選択するとonUploadが呼ばれる", () => {
    const onUpload = vi.fn();
    render(<ImageUpload onUpload={onUpload} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(input, "files", { value: [file] });
    fireEvent.change(input);
    expect(onUpload).toHaveBeenCalledWith(file);
  });
});
