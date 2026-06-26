import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfflineManualEditBanner } from "./OfflineManualEditBanner";
import { OFFLINE_MANUAL_EDIT_BANNER_MESSAGE } from "../lib/offlineManualEdit";

describe("OfflineManualEditBanner", () => {
  it("visible=false のときは何も表示しない", () => {
    const { container } = render(<OfflineManualEditBanner visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("visible=true のときオフライン手動編集の説明を表示する", () => {
    render(<OfflineManualEditBanner visible={true} />);
    expect(screen.getByRole("status")).toHaveTextContent(OFFLINE_MANUAL_EDIT_BANNER_MESSAGE);
  });
});
