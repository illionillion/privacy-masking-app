import { describe, expect, it, vi, beforeEach } from "vitest";
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
    });
  }),
}));

import { convertHeicToJpeg } from "./convertHeicToJpeg";

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
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.files[0]?.type).toBe("image/jpeg");
      expect(result.files[0]?.name).toBe("photo.jpg");
    }
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
});
