import { describe, expect, it, vi } from "vitest";
import heic2any from "heic2any";
import { convertHeicToJpeg } from "./convertHeicToJpeg";

vi.mock("heic2any", () => ({
  default: vi.fn(async () => new Blob(["jpeg"], { type: "image/jpeg" })),
}));

describe("convertHeicToJpeg", () => {
  it("JPEG File を返し、元ファイルの lastModified を引き継ぐ", async () => {
    const source = new File(["heic"], "photo.heic", {
      type: "image/heic",
      lastModified: 1_700_000_000_000,
    });

    const result = await convertHeicToJpeg(source);

    expect(heic2any).toHaveBeenCalledWith({
      blob: source,
      toType: "image/jpeg",
      quality: 0.92,
    });
    expect(result.name).toBe("photo.jpg");
    expect(result.type).toBe("image/jpeg");
    expect(result.lastModified).toBe(source.lastModified);
  });
});
