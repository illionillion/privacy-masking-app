import { describe, expect, it } from "vitest";
import { MAX_IMAGE_FILE_SIZE } from "./constants";
import { isHeicFile, willConvertHeicFile } from "./isHeicFile";

describe("isHeicFile", () => {
  it("image/heic を HEIC と判定する", () => {
    const file = new File(["content"], "photo.heic", { type: "image/heic" });
    expect(isHeicFile(file)).toBe(true);
  });

  it("image/heif を HEIC と判定する", () => {
    const file = new File(["content"], "photo.heif", { type: "image/heif" });
    expect(isHeicFile(file)).toBe(true);
  });

  it("拡張子 .heic で type が空でも HEIC と判定する", () => {
    const file = new File(["content"], "IMG_0001.heic", { type: "" });
    expect(isHeicFile(file)).toBe(true);
  });

  it("JPEG は HEIC と判定しない", () => {
    const file = new File(["content"], "photo.jpg", { type: "image/jpeg" });
    expect(isHeicFile(file)).toBe(false);
  });

  it("サイズ超過の HEIC は変換対象と判定しない", () => {
    const file = new File(["content"], "large.heic", { type: "image/heic" });
    Object.defineProperty(file, "size", { value: MAX_IMAGE_FILE_SIZE + 1 });
    expect(isHeicFile(file)).toBe(true);
    expect(willConvertHeicFile(file)).toBe(false);
  });

  it("サイズ以内の HEIC は変換対象と判定する", () => {
    const file = new File(["content"], "photo.heic", { type: "image/heic" });
    expect(willConvertHeicFile(file)).toBe(true);
  });
});
