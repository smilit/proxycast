import { describe, expect } from "vitest";
import { test, fc } from "@fast-check/vitest";
import { validateProxyUrl } from "@/lib/utils";

/**
 * Property-Based Tests for validateProxyUrl
 *
 * **Feature: network-proxy-settings, Property 2: 无效 URL 格式拒绝**
 * **Validates: Requirements 1.5**
 */
describe("validateProxyUrl", () => {
  // Property 2: 无效 URL 格式拒绝
  // *For any* 不符合代理 URL 格式的字符串（如缺少协议、包含空格等），验证函数应该返回 false

  test.prop([fc.constant("")])(
    "empty string should be valid (no proxy)",
    (url) => {
      expect(validateProxyUrl(url)).toBe(true);
    },
  );

  test.prop([fc.constant("   ")])(
    "whitespace-only string should be valid (no proxy)",
    (url) => {
      expect(validateProxyUrl(url)).toBe(true);
    },
  );

  // Valid proxy URLs should pass
  test.prop([
    fc.oneof(fc.constant("http"), fc.constant("https"), fc.constant("socks5")),
    fc.ipV4(),
    fc.integer({ min: 1, max: 65535 }),
  ])("valid proxy URL format should pass", (protocol, host, port) => {
    const url = `${protocol}://${host}:${port}`;
    expect(validateProxyUrl(url)).toBe(true);
  });

  // URLs without valid protocol should fail
  test.prop([
    fc.constantFrom("ftp", "file", "tcp", "udp", "ws", "wss", "mailto", "tel"),
    fc.ipV4(),
    fc.integer({ min: 1, max: 65535 }),
  ])("invalid protocol should fail", (protocol, host, port) => {
    const url = `${protocol}://${host}:${port}`;
    expect(validateProxyUrl(url)).toBe(false);
  });

  // URLs with spaces should fail
  test.prop([
    fc.oneof(fc.constant("http"), fc.constant("https"), fc.constant("socks5")),
    fc.ipV4(),
    fc.integer({ min: 1, max: 65535 }),
  ])("URL with embedded spaces should fail", (protocol, host, port) => {
    const url = `${protocol}:// ${host}:${port}`;
    expect(validateProxyUrl(url)).toBe(false);
  });

  // URLs missing protocol separator should fail
  test.prop([fc.ipV4(), fc.integer({ min: 1, max: 65535 })])(
    "URL without protocol should fail",
    (host, port) => {
      const url = `${host}:${port}`;
      expect(validateProxyUrl(url)).toBe(false);
    },
  );

  // Random strings without protocol pattern should fail
  test.prop([
    fc
      .string({ minLength: 1, maxLength: 50 })
      .filter(
        (s) => !s.match(/^(https?|socks5?):\/\//i) && s.trim().length > 0,
      ),
  ])("random non-URL strings should fail", (str) => {
    expect(validateProxyUrl(str)).toBe(false);
  });
});
