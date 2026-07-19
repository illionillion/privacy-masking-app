import { describe, expect, it, vi, beforeEach } from "vitest";
import { convertHeicToJpeg } from "./convertHeicToJpeg";
import {
  ACCEPTED_IMAGE_TYPES_ERROR,
  FILE_SIZE_EXCEEDED_ERROR,
  HEIC_CONVERSION_ERROR,
} from "./constants";
import { normalizeUploadFiles } from "./normalizeUploadFiles";

vi.mock("./convertHeicToJpeg", () => ({
  convertHeicToJpeg: vi.fn(async (file: File) => {
    return new File(["converted"], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  }),
}));

describe("normalizeUploadFiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("JPEG ファイルをそのまま返す", async () => {
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const result = await normalizeUploadFiles([file]);
    expect(result).toEqual({ ok: true, files: [file] });
  });

  it("HEIC ファイルを JPEG に変換して返す", async () => {
    const file = new File(["content"], "photo.heic", { type: "image/heic" });
    const result = await normalizeUploadFiles([file]);
    expect(convertHeicToJpeg).toHaveBeenCalledWith(file);
    expect(result).toEqual({
      ok: true,
      files: [expect.objectContaining({ type: "image/jpeg", name: "photo.jpg" })],
    });
  });

  it("iOS で type が空の .heic も変換対象にする", async () => {
    const file = new File(["content"], "IMG_0001.heic", { type: "" });
    const result = await normalizeUploadFiles([file]);
    expect(convertHeicToJpeg).toHaveBeenCalledWith(file);
    expect(result.ok).toBe(true);
  });

  it("未対応形式のときエラーを返す", async () => {
    const file = new File(["content"], "test.txt", { type: "text/plain" });
    const result = await normalizeUploadFiles([file]);
    expect(result).toEqual({ ok: false, error: ACCEPTED_IMAGE_TYPES_ERROR });
  });

  it("サイズ超過のときエラーを返す", async () => {
    const file = new File(["content"], "large.jpg", { type: "image/jpeg" });
    Object.defineProperty(file, "size", { value: 21 * 1024 * 1024 });
    const result = await normalizeUploadFiles([file]);
    expect(result).toEqual({ ok: false, error: FILE_SIZE_EXCEEDED_ERROR });
  });

  it("HEIC 変換失敗時にエラーを返す", async () => {
    vi.mocked(convertHeicToJpeg).mockRejectedValueOnce(new Error("failed"));
    const file = new File(["content"], "broken.heic", { type: "image/heic" });
    const result = await normalizeUploadFiles([file]);
    expect(result).toEqual({ ok: false, error: HEIC_CONVERSION_ERROR });
  });

  it("有効ファイルと無効ファイルが混在するとき有効ファイルのみ返す", async () => {
    const valid = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    const invalid = new File(["content"], "test.txt", { type: "text/plain" });
    const result = await normalizeUploadFiles([valid, invalid]);
    expect(result).toEqual({ ok: true, files: [valid] });
  });

  it("有効な HEIC と無効ファイルが混在するとき変換済みファイルのみ返す", async () => {
    const heic = new File(["content"], "photo.heic", { type: "image/heic" });
    const invalid = new File(["content"], "test.txt", { type: "text/plain" });
    const result = await normalizeUploadFiles([heic, invalid]);
    expect(convertHeicToJpeg).toHaveBeenCalledWith(heic);
    expect(result).toEqual({
      ok: true,
      files: [expect.objectContaining({ type: "image/jpeg" })],
    });
  });
});
