import { describe, expect, it } from "vitest";
import { isHeicFile } from "./isHeicFile";

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
});
