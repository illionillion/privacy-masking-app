import { describe, expect, it } from "vitest";
import { findIpMatches, isValidIpAddress, isValidIpv4, isValidIpv6 } from "./ipAddress";

describe("isValidIpv4", () => {
  it("有効な IPv4 を受け入れる", () => {
    expect(isValidIpv4("192.168.0.1")).toBe(true);
    expect(isValidIpv4("0.0.0.0")).toBe(true);
    expect(isValidIpv4("255.255.255.255")).toBe(true);
  });

  it("不正なオクテットを拒否する", () => {
    expect(isValidIpv4("256.1.1.1")).toBe(false);
    expect(isValidIpv4("192.168.0")).toBe(false);
  });
});

describe("isValidIpv6", () => {
  it("フル形式を受け入れる", () => {
    expect(isValidIpv6("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe(true);
  });

  it("圧縮形式を受け入れる", () => {
    expect(isValidIpv6("2001:db8::1")).toBe(true);
    expect(isValidIpv6("2001:db8::1:2:3")).toBe(true);
    expect(isValidIpv6("::1")).toBe(true);
    expect(isValidIpv6("::")).toBe(true);
    expect(isValidIpv6("fe80::")).toBe(true);
  });

  it("不正な圧縮・グループ数を拒否する", () => {
    expect(isValidIpv6("1:2:3:4:5:6:7:8:9")).toBe(false);
    expect(isValidIpv6(":1:2:3:4:5:6:7:8")).toBe(false);
    expect(isValidIpv6(":::")).toBe(false);
    expect(isValidIpv6("2001::db8::1")).toBe(false);
  });
});

describe("isValidIpAddress", () => {
  it("ポート付き IPv4 を受け入れる", () => {
    expect(isValidIpAddress("10.0.0.1:8080")).toBe(true);
  });

  it("IPv4 埋め込み IPv6 を受け入れる", () => {
    expect(isValidIpAddress("::ffff:192.0.2.128")).toBe(true);
    expect(isValidIpAddress("2001:db8::192.0.2.1")).toBe(true);
  });
});

describe("findIpMatches", () => {
  it("圧縮位置の前後に複数グループがある IPv6 を検出する", () => {
    expect(findIpMatches("2001:db8::1:2:3")).toEqual([
      { start: 0, end: 15, text: "2001:db8::1:2:3" },
    ]);
  });

  it("IPv6: / IPv4: / IP: ラベル付きアドレスを検出する", () => {
    expect(findIpMatches("IPv6:2001:db8::1")).toEqual([{ start: 5, end: 16, text: "2001:db8::1" }]);
    expect(findIpMatches("IPv4:192.168.0.1")).toEqual([{ start: 5, end: 16, text: "192.168.0.1" }]);
    expect(findIpMatches("IP:2001:db8::1")).toEqual([{ start: 3, end: 14, text: "2001:db8::1" }]);
  });

  it("英字グループで始まる IPv6 全体をマスクする", () => {
    expect(findIpMatches("abcd:2001:db8::1")).toEqual([
      { start: 0, end: 16, text: "abcd:2001:db8::1" },
    ]);
  });

  it("IPv4 埋め込み IPv6 を検出する", () => {
    expect(findIpMatches("::ffff:192.0.2.128")).toEqual([
      { start: 0, end: 18, text: "::ffff:192.0.2.128" },
    ]);
  });

  it("一般ラベルや文末句点に隣接する IPv4 を検出する", () => {
    expect(findIpMatches("Address:192.168.0.1")).toEqual([
      { start: 8, end: 19, text: "192.168.0.1" },
    ]);
    expect(findIpMatches("192.168.0.1.")).toEqual([{ start: 0, end: 11, text: "192.168.0.1" }]);
  });

  it("ラベル付きの不正トークンを部分一致で検出しない", () => {
    expect(findIpMatches("IP:1:2:3:4:5:6:7:8:9")).toEqual([]);
    expect(findIpMatches("IP:192.168.0.1x")).toEqual([]);
    expect(findIpMatches("IP:::")).toEqual([]);
  });

  it("先頭の余分なコロン付きトークンを検出しない", () => {
    expect(findIpMatches(":1:2:3:4:5:6:7:8")).toEqual([]);
  });

  it("x::: のような不正トークンを検出しない", () => {
    expect(findIpMatches("x:::")).toEqual([]);
  });

  it("英数字に隣接する部分文字列を検出しない", () => {
    expect(findIpMatches("x2001:db8::1")).toEqual([]);
  });
});
