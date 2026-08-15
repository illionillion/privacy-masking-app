import { describe, expect, it } from "vitest";
import { isEditableKeyboardTarget, isTextInputKeyboardTarget } from "./isEditableKeyboardTarget";

describe("isTextInputKeyboardTarget", () => {
  it("INPUT / TEXTAREA / SELECT にフォーカス中は true", () => {
    expect(isTextInputKeyboardTarget(document.createElement("input"))).toBe(true);
    expect(isTextInputKeyboardTarget(document.createElement("textarea"))).toBe(true);
    expect(isTextInputKeyboardTarget(document.createElement("select"))).toBe(true);
  });

  it("contentEditable にフォーカス中は true", () => {
    const div = document.createElement("div");
    div.contentEditable = "true";
    /* jsdom は contentEditable 属性から isContentEditable を導出しないため明示する */
    Object.defineProperty(div, "isContentEditable", { value: true });
    expect(isTextInputKeyboardTarget(div)).toBe(true);
  });

  it("button にフォーカス中は false（Escape を効かせるため）", () => {
    expect(isTextInputKeyboardTarget(document.createElement("button"))).toBe(false);
  });

  it("button 内の子要素も false", () => {
    const button = document.createElement("button");
    const span = document.createElement("span");
    button.appendChild(span);
    expect(isTextInputKeyboardTarget(span)).toBe(false);
  });

  it("div のみは false", () => {
    expect(isTextInputKeyboardTarget(document.createElement("div"))).toBe(false);
  });
});

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
