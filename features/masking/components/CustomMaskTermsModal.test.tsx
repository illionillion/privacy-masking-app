import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CustomMaskTermsModal } from "./CustomMaskTermsModal";

const openConfirm = vi.fn();

vi.mock("@/lib/confirmStore", () => ({
  useConfirmStore: {
    getState: () => ({ open: openConfirm }),
  },
}));

describe("CustomMaskTermsModal", () => {
  beforeEach(() => {
    openConfirm.mockReset();
    openConfirm.mockResolvedValue(true);
  });
  it("語句を追加して保存できる", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<CustomMaskTermsModal isOpen terms={[]} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText("語句を入力"), {
      target: { value: "山田太郎" },
    });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(onSave).toHaveBeenCalledWith([
      expect.objectContaining({ text: "山田太郎", enabled: true }),
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  it("追加後は入力欄をクリアする", () => {
    render(<CustomMaskTermsModal isOpen terms={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    const input = screen.getByPlaceholderText("語句を入力");
    fireEvent.change(input, { target: { value: "山田太郎" } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    expect(input).toHaveValue("");
    expect(screen.getByLabelText("山田太郎 を編集")).toBeInTheDocument();
  });

  it("IME 確定の Enter では追加しない", () => {
    render(<CustomMaskTermsModal isOpen terms={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    const input = screen.getByPlaceholderText("語句を入力");
    fireEvent.change(input, { target: { value: "山田太郎" } });
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.compositionEnd(input);

    expect(screen.queryByLabelText("山田太郎 を編集")).not.toBeInTheDocument();
    expect(input).toHaveValue("山田太郎");
  });

  it("変更後のキャンセルで確認に応じたときだけ閉じる", async () => {
    const onClose = vi.fn();
    openConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    render(<CustomMaskTermsModal isOpen terms={[]} onClose={onClose} onSave={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("語句を入力"), {
      target: { value: "山田太郎" },
    });
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    await waitFor(() => {
      expect(openConfirm).toHaveBeenCalledTimes(1);
    });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it("閉じているときは何も表示しない", () => {
    render(<CustomMaskTermsModal isOpen={false} terms={[]} onClose={vi.fn()} onSave={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
