import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { StampCatalogEntry } from "../constants";
import { StampFacePicker } from "./StampFacePicker";

const CATALOG: readonly StampCatalogEntry[] = [
  { fileName: "a.png", emoji: "😀", label: "笑顔" },
  { fileName: "b.png", emoji: "😂", label: "爆笑" },
];

/** スタンプピッカーのトリガー（combobox） */
function getTrigger(label: string) {
  return screen.getByRole("combobox", { name: `スタンプ: ${label}` });
}

describe("StampFacePicker", () => {
  it("catalog が空のときは何も表示しない", () => {
    const { container } = render(<StampFacePicker catalog={[]} value="" onChange={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("選択中スタンプの絵文字をトリガーに表示する", () => {
    render(<StampFacePicker catalog={CATALOG} value="b.png" onChange={vi.fn()} />);
    expect(getTrigger("爆笑")).toHaveTextContent("😂");
  });

  it("トリガーをクリックするとラベル付き一覧を表示する", async () => {
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={vi.fn()} />);
    await userEvent.click(getTrigger("笑顔"));
    expect(screen.getByRole("listbox", { name: "スタンプ画像" })).toBeInTheDocument();
    expect(screen.getByText("笑顔")).toBeInTheDocument();
    expect(screen.getByText("爆笑")).toBeInTheDocument();
  });

  it("一覧から選択すると onChange が呼ばれ一覧が閉じる", async () => {
    const onChange = vi.fn();
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={onChange} />);
    await userEvent.click(getTrigger("笑顔"));
    await userEvent.click(screen.getByText("爆笑"));
    expect(onChange).toHaveBeenCalledWith("b.png");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape で一覧を閉じる", async () => {
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={vi.fn()} />);
    await userEvent.click(getTrigger("笑顔"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("開いているとき aria-activedescendant が active option を指す", async () => {
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={vi.fn()} />);
    const trigger = getTrigger("笑顔");
    await userEvent.click(trigger);
    const firstOption = screen.getByRole("option", { name: /笑顔/ });
    expect(trigger).toHaveAttribute("aria-activedescendant", firstOption.id);
    await userEvent.keyboard("{ArrowDown}");
    const secondOption = screen.getByRole("option", { name: /爆笑/ });
    expect(trigger).toHaveAttribute("aria-activedescendant", secondOption.id);
  });

  it("ArrowDown と Enter で次の項目を選択する", async () => {
    const onChange = vi.fn();
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={onChange} />);
    await userEvent.click(getTrigger("笑顔"));
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("b.png");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Space で active 項目を確定する", async () => {
    const onChange = vi.fn();
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={onChange} />);
    await userEvent.click(getTrigger("笑顔"));
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith("a.png");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("外側クリックで一覧を閉じる", async () => {
    render(<StampFacePicker catalog={CATALOG} value="a.png" onChange={vi.fn()} />);
    await userEvent.click(getTrigger("笑顔"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
