import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prepareGalleryItemsFromFiles } from "./prepareGalleryItemsFromFiles";

describe("prepareGalleryItemsFromFiles", () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURLSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("全ファイルを MaskingImageItem に変換して succeededItems を返す", async () => {
    const file = new File(["data"], "photo.png", { type: "image/png" });
    const { succeededItems, blobResults } = await prepareGalleryItemsFromFiles(
      [file],
      12345,
      () => true
    );

    expect(succeededItems).toHaveLength(1);
    expect(succeededItems[0].name).toBe("photo.png");
    expect(succeededItems[0].imageUrl).toBe("blob:mock-url");
    expect(succeededItems[0].isProcessing).toBe(true);
    expect(blobResults).toHaveLength(1);
    expect(blobResults[0].status).toBe("fulfilled");
  });

  it("アンマウント後は URL を生成せず rejected になる", async () => {
    const file = new File(["data"], "photo.png", { type: "image/png" });
    let mounted = true;
    const arrayBufferSpy = vi.spyOn(file, "arrayBuffer").mockImplementation(async () => {
      mounted = false;
      return new ArrayBuffer(4);
    });

    const { succeededItems, blobResults } = await prepareGalleryItemsFromFiles(
      [file],
      12345,
      () => mounted
    );

    expect(succeededItems).toHaveLength(0);
    expect(blobResults[0].status).toBe("rejected");
    arrayBufferSpy.mockRestore();
  });
});
