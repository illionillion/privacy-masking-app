import { describe, expect, it } from "vitest";
import { isEditableKeyboardTarget } from "./isEditableKeyboardTarget";

describe("isEditableKeyboardTarget", () => {
  it("INPUT にフォーカス中は true", () => {
    const input = document.createElement("input");
    expect(isEditableKeyboardTarget(input)).toBe(true);
  });

  it("button にフォーカス中は true", () => {
    const button = document.createElement("button");
    expect(isEditableKeyboardTarget(button)).toBe(true);
  });

  it("button 内の子要素も true", () => {
    const button = document.createElement("button");
    const span = document.createElement("span");
    button.appendChild(span);
    expect(isEditableKeyboardTarget(span)).toBe(true);
  });

  it("div のみは false", () => {
    expect(isEditableKeyboardTarget(document.createElement("div"))).toBe(false);
  });
});
