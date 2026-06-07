import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DetectionSettingsModal } from "./DetectionSettingsModal";
import { DEFAULT_FUSELY_PREFS } from "@/lib/preferences";

describe("DetectionSettingsModal", () => {
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
