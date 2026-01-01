/**
 * @file oauth-url.property.test.js
 * @description OAuth URL 解析属性测试
 * 
 * **Property 3: OAuth 回调 URL 解析正确性**
 * **Validates: Requirements 4.1, 4.2**
 * 
 * *For any* 有效的 OAuth 回调 URL，URL 解析函数应该：
 * - 正确提取 `code` 参数
 * - 正确提取 `state` 参数
 * - 对于缺少必要参数的 URL 返回错误
 * - 正确处理 URL 编码的参数值
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import fc from 'fast-check';
import { parseCallbackUrl, isCallbackUrl } from '../oauth-handler.js';

describe('Property 3: OAuth 回调 URL 解析正确性', () => {

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 包含有效 code 参数的回调 URL，应正确提取 code
   */
  test('应正确提取 code 参数', () => {
    fc.assert(
      fc.property(
        // 生成随机的授权码（字母数字组合）
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,100}$/),
        fc.integer({ min: 3000, max: 65535 }),
        (code, port) => {
          const url = `http://localhost:${port}/callback?code=${code}`;
          const result = parseCallbackUrl(url);
          
          assert.ok(result.success, `解析应成功: ${result.error}`);
          assert.strictEqual(result.code, code, 'code 应正确提取');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 包含 code 和 state 参数的回调 URL，应正确提取两者
   */
  test('应正确提取 code 和 state 参数', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,100}$/),
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/),
        fc.integer({ min: 3000, max: 65535 }),
        (code, state, port) => {
          const url = `http://localhost:${port}/callback?code=${code}&state=${state}`;
          const result = parseCallbackUrl(url);
          
          assert.ok(result.success, `解析应成功: ${result.error}`);
          assert.strictEqual(result.code, code, 'code 应正确提取');
          assert.strictEqual(result.state, state, 'state 应正确提取');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 缺少 code 参数的 URL，应返回错误
   */
  test('缺少 code 参数应返回错误', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 65535 }),
        fc.option(fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/), { nil: undefined }),
        (port, state) => {
          let url = `http://localhost:${port}/callback`;
          if (state) {
            url += `?state=${state}`;
          }
          
          const result = parseCallbackUrl(url);
          
          assert.ok(!result.success, '缺少 code 应返回失败');
          assert.ok(result.error, '应有错误信息');
          assert.ok(result.error.includes('code'), '错误信息应提及 code');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* URL 编码的参数值，应正确解码
   */
  test('应正确处理 URL 编码的参数值', () => {
    fc.assert(
      fc.property(
        // 生成包含特殊字符的字符串
        fc.stringMatching(/^[a-zA-Z0-9]{5,20}$/),
        fc.constantFrom('+', '/', '=', '%', '&'),
        fc.stringMatching(/^[a-zA-Z0-9]{5,20}$/),
        fc.integer({ min: 3000, max: 65535 }),
        (prefix, special, suffix, port) => {
          const originalCode = `${prefix}${special}${suffix}`;
          const encodedCode = encodeURIComponent(originalCode);
          const url = `http://localhost:${port}/callback?code=${encodedCode}`;
          
          const result = parseCallbackUrl(url);
          
          assert.ok(result.success, `解析应成功: ${result.error}`);
          assert.strictEqual(result.code, originalCode, 'URL 编码的 code 应正确解码');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 包含 error 参数的 URL，应返回错误
   */
  test('包含 error 参数应返回错误', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('access_denied', 'invalid_request', 'unauthorized_client', 'server_error'),
        fc.option(fc.string({ minLength: 5, maxLength: 50 }), { nil: undefined }),
        fc.integer({ min: 3000, max: 65535 }),
        (error, errorDescription, port) => {
          let url = `http://localhost:${port}/callback?error=${error}`;
          if (errorDescription) {
            url += `&error_description=${encodeURIComponent(errorDescription)}`;
          }
          
          const result = parseCallbackUrl(url);
          
          assert.ok(!result.success, '包含 error 应返回失败');
          assert.ok(result.error, '应有错误信息');
          assert.ok(result.error.includes(error), '错误信息应包含 error 值');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 无效的 URL 格式，应返回错误
   */
  test('无效的 URL 格式应返回错误', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.constant('not-a-url'),
          fc.constant('://missing-protocol'),
          fc.constant('http://'),
          fc.constant(null),
          fc.constant(undefined)
        ),
        (invalidUrl) => {
          const result = parseCallbackUrl(invalidUrl);
          
          assert.ok(!result.success, '无效 URL 应返回失败');
          assert.ok(result.error, '应有错误信息');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* localhost 回调 URL，isCallbackUrl 应返回 true
   */
  test('localhost 回调 URL 应被正确识别', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 65535 }),
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/),
        (port, code) => {
          const url = `http://localhost:${port}/callback?code=${code}`;
          
          assert.ok(isCallbackUrl(url), 'localhost 回调 URL 应被识别');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 非回调 URL，isCallbackUrl 应返回 false
   */
  test('非回调 URL 应返回 false', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'https://accounts.google.com/oauth',
          'https://github.com/login/oauth/authorize',
          'http://localhost:3000/home',
          'http://localhost:3000/api/auth',
          'https://example.com/callback'
        ),
        (url) => {
          assert.ok(!isCallbackUrl(url), '非回调 URL 应返回 false');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: playwright-fingerprint-login, Property 3: OAuth 回调 URL 解析正确性
   * 
   * *For any* 指定的期望回调 URL，应精确匹配
   */
  test('应精确匹配期望的回调 URL', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 65535 }),
        fc.stringMatching(/^[a-zA-Z0-9_-]{10,50}$/),
        (port, code) => {
          const expectedCallback = `http://localhost:${port}/callback`;
          const actualUrl = `http://localhost:${port}/callback?code=${code}`;
          const wrongPortUrl = `http://localhost:${port + 1}/callback?code=${code}`;
          
          assert.ok(
            isCallbackUrl(actualUrl, expectedCallback),
            '匹配的回调 URL 应返回 true'
          );
          assert.ok(
            !isCallbackUrl(wrongPortUrl, expectedCallback),
            '端口不匹配应返回 false'
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
