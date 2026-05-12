import "@testing-library/jest-dom/vitest";

// jsdom が matchMedia を未実装のときのみスタブし、将来の jsdom 実装やテスト個別のモックを上書きしない
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
