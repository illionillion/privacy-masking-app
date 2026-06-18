import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DetectionSettingsModal } from "./DetectionSettingsModal";
import { DEFAULT_FUSELY_PREFS } from "@/lib/preferences";

const openConfirm = vi.fn();

vi.mock("@/lib/confirmStore", () => ({
  useConfirmStore: {
    getState: () => ({ open: openConfirm }),
  },
}));

describe("DetectionSettingsModal", () => {
  beforeEach(() => {
    openConfirm.mockReset();
    openConfirm.mockResolvedValue(true);
  });
  it("保存時に編集内容を onSave へ渡す", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={onClose}
        onSave={onSave}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /顔を自動検出/ }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    expect(onSave).toHaveBeenCalledWith({
      autoDetectFace: false,
      autoDetectOcr: true,
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("未変更のキャンセルでは確認ダイアログを出さない", () => {
    const onClose = vi.fn();

    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(openConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("変更後のキャンセルで確認に応じたときだけ閉じる", async () => {
    const onClose = vi.fn();
    openConfirm.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("checkbox", { name: /顔を自動検出/ }));
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

  it("開いたときは最初のチェックボックスにフォーカスする", async () => {
    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: /顔を自動検出/ })).toHaveFocus();
    });
  });

  it("ダイアログコンテナにフォーカスがあるとき Tab で最初の要素へ循環する", () => {
    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog");
    dialog.focus();

    fireEvent.keyDown(dialog, { key: "Tab" });

    expect(screen.getByRole("checkbox", { name: /顔を自動検出/ })).toHaveFocus();
  });

  it("ダイアログコンテナにフォーカスがあるとき Shift+Tab で最後の要素へ循環する", () => {
    render(
      <DetectionSettingsModal
        isOpen
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const dialog = screen.getByRole("dialog");
    dialog.focus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });

    expect(screen.getByRole("button", { name: "保存" })).toHaveFocus();
  });

  it("閉じているときは何も表示しない", () => {
    render(
      <DetectionSettingsModal
        isOpen={false}
        settings={DEFAULT_FUSELY_PREFS.detection}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
