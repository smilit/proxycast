#!/usr/bin/env node
/**
 * @file index.js
 * @description Playwright Sidecar 主入口，处理 stdin/stdout JSON 通信
 * @module playwright-login
 * 
 * Requirements: 3.1, 3.4, 3.5, 5.1, 5.2, 5.3, 5.4
 * 
 * 通信协议：
 * - 请求格式: { action: 'login' | 'cancel' | 'check', provider?: string, callbackUrl?: string, authUrl?: string }
 * - 响应格式: { success: boolean, action: string, data?: { code?, state?, error?, available?, browserPath? } }
 * 
 * 错误处理 (Requirements 5.1, 5.2, 5.3, 5.4):
 * - 浏览器启动失败: 返回详细错误信息和故障排除建议
 * - OAuth 超时: 返回超时错误，允许重试
 * - 用户取消: 优雅处理取消操作
 * - 详细日志: 记录所有错误用于调试
 */

import { createInterface } from 'readline';
import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { createBrowserContext, getAvailableBrowserPath, getSystemChromePath, getPlaywrightChromiumPath } from './browser-context.js';
import { createOAuthHandler } from './oauth-handler.js';

/** @type {import('playwright').BrowserContext | null} */
let currentContext = null;

/** @type {ReturnType<typeof createOAuthHandler> | null} */
let currentOAuthHandler = null;

/**
 * 发送响应到 stdout
 * @param {SidecarResponse} response
 */
function sendResponse(response) {
  console.log(JSON.stringify(response));
}

/**
 * 发送进度消息
 * @param {string} message
 */
function sendProgress(message) {
  sendResponse({
    success: true,
    action: 'progress',
    data: { message }
  });
}

/**
 * 检查浏览器是否可用（优先系统 Chrome）
 * @returns {Promise<{ available: boolean, browserPath?: string, browserSource?: string, error?: string }>}
 */
async function checkPlaywrightAvailable() {
  try {
    const browserInfo = getAvailableBrowserPath();
    
    if (browserInfo) {
      return {
        available: true,
        browserPath: browserInfo.path,
        browserSource: browserInfo.source
      };
    }

    return {
      available: false,
      error: '未找到可用的浏览器。请安装 Google Chrome 或运行: npx playwright install chromium'
    };
  } catch (error) {
    return {
      available: false,
      error: `检查浏览器时出错: ${error.message}`
    };
  }
}

/**
 * 处理登录请求
 * @param {SidecarRequest} request
 */
async function handleLogin(request) {
  const { authUrl, callbackUrl } = request;

  if (!authUrl) {
    sendResponse({
      success: false,
      action: 'login',
      data: { error: '缺少 authUrl 参数' }
    });
    return;
  }

  if (!callbackUrl) {
    sendResponse({
      success: false,
      action: 'login',
      data: { error: '缺少 callbackUrl 参数' }
    });
    return;
  }

  try {
    sendProgress('正在启动浏览器...');

    // 创建浏览器上下文
    // Requirements: 5.1 - 处理浏览器启动失败
    let context, config;
    try {
      const result = await createBrowserContext();
      context = result.context;
      config = result.config;
      currentContext = context;
    } catch (browserError) {
      // 浏览器启动失败，返回详细错误信息
      const errorMessage = browserError.message || '未知错误';
      console.error('[Playwright] 浏览器启动失败:', errorMessage);
      
      sendResponse({
        success: false,
        action: 'login',
        data: { 
          error: `启动浏览器失败: ${errorMessage}`,
          errorType: 'BROWSER_LAUNCH_FAILED'
        }
      });
      return;
    }

    sendProgress(`浏览器已启动，用户数据目录: ${config.userDataDir}`);

    // 创建 OAuth 处理器
    // Requirements: 5.2 - 处理 OAuth 超时
    currentOAuthHandler = createOAuthHandler(context, {
      authUrl,
      callbackUrl,
      timeout: 5 * 60 * 1000, // 5 分钟超时
      onProgress: sendProgress
    });

    // 启动 OAuth 流程
    const result = await currentOAuthHandler.start();

    // 关闭浏览器
    await cleanup();

    if (result.success) {
      sendResponse({
        success: true,
        action: 'login',
        data: {
          code: result.code,
          state: result.state
        }
      });
    } else {
      // 根据错误类型返回不同的错误信息
      // Requirements: 5.2, 5.3, 5.4
      let errorType = 'UNKNOWN';
      const errorMessage = result.error || '未知错误';
      
      if (errorMessage.includes('超时') || errorMessage.includes('timeout')) {
        errorType = 'OAUTH_TIMEOUT';
      } else if (errorMessage.includes('取消') || errorMessage.includes('cancel')) {
        errorType = 'USER_CANCELLED';
      } else if (errorMessage.includes('关闭') || errorMessage.includes('closed')) {
        errorType = 'BROWSER_CLOSED';
      } else if (errorMessage.includes('code') || errorMessage.includes('授权码')) {
        errorType = 'CODE_EXTRACTION_FAILED';
      }
      
      console.error('[Playwright] OAuth 流程失败:', errorMessage, 'Type:', errorType);
      
      sendResponse({
        success: false,
        action: 'login',
        data: { 
          error: errorMessage,
          errorType
        }
      });
    }
  } catch (error) {
    await cleanup();
    
    // Requirements: 5.4 - 记录详细错误日志
    const errorMessage = error.message || '未知错误';
    console.error('[Playwright] 登录过程出错:', errorMessage);
    console.error('[Playwright] 错误堆栈:', error.stack);
    
    sendResponse({
      success: false,
      action: 'login',
      data: { 
        error: errorMessage,
        errorType: 'SCRIPT_ERROR'
      }
    });
  }
}

/**
 * 处理取消请求
 * Requirements: 5.3 - 处理用户取消
 */
async function handleCancel() {
  try {
    console.log('[Playwright] 收到取消请求');
    
    if (currentOAuthHandler) {
      await currentOAuthHandler.cancel();
    }
    await cleanup();
    
    sendResponse({
      success: true,
      action: 'cancel',
      data: { message: '登录已取消' }
    });
  } catch (error) {
    console.error('[Playwright] 取消登录时出错:', error.message);
    
    sendResponse({
      success: false,
      action: 'cancel',
      data: { error: error.message || '取消失败' }
    });
  }
}

/**
 * 处理检查请求
 */
async function handleCheck() {
  const status = await checkPlaywrightAvailable();
  
  sendResponse({
    success: status.available,
    action: 'check',
    data: status
  });
}

/**
 * 清理资源
 */
async function cleanup() {
  currentOAuthHandler = null;
  
  if (currentContext) {
    try {
      await currentContext.close();
    } catch {
      // 忽略关闭错误
    }
    currentContext = null;
  }
}

/**
 * 处理请求
 * @param {string} line - JSON 格式的请求
 */
async function handleRequest(line) {
  let request;
  
  try {
    request = JSON.parse(line);
  } catch {
    sendResponse({
      success: false,
      action: 'unknown',
      data: { error: '无效的 JSON 格式' }
    });
    return;
  }

  const { action } = request;

  switch (action) {
    case 'login':
      await handleLogin(request);
      break;
    case 'cancel':
      await handleCancel();
      break;
    case 'check':
      await handleCheck();
      break;
    default:
      sendResponse({
        success: false,
        action: action || 'unknown',
        data: { error: `未知的 action: ${action}` }
      });
  }
}

/**
 * 主函数
 */
async function main() {
  // 设置 stdin 为行模式
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  // 监听输入
  rl.on('line', async (line) => {
    if (line.trim()) {
      await handleRequest(line.trim());
    }
  });

  // 监听关闭
  rl.on('close', async () => {
    await cleanup();
    process.exit(0);
  });

  // 监听错误
  process.on('uncaughtException', async (error) => {
    sendResponse({
      success: false,
      action: 'error',
      data: { error: `未捕获的异常: ${error.message}` }
    });
    await cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    sendResponse({
      success: false,
      action: 'error',
      data: { error: `未处理的 Promise 拒绝: ${reason}` }
    });
  });

  // 发送就绪信号
  sendResponse({
    success: true,
    action: 'ready',
    data: { message: 'Playwright Sidecar 已就绪' }
  });
}

// 启动
main().catch(async (error) => {
  sendResponse({
    success: false,
    action: 'error',
    data: { error: `启动失败: ${error.message}` }
  });
  await cleanup();
  process.exit(1);
});

/**
 * @typedef {Object} SidecarRequest
 * @property {'login' | 'cancel' | 'check'} action - 操作类型
 * @property {string} [provider] - OAuth 提供商
 * @property {string} [authUrl] - OAuth 授权 URL
 * @property {string} [callbackUrl] - 回调 URL
 */

/**
 * @typedef {Object} SidecarResponse
 * @property {boolean} success - 是否成功
 * @property {string} action - 操作类型
 * @property {Object} [data] - 响应数据
 * @property {string} [data.code] - 授权码
 * @property {string} [data.state] - 状态参数
 * @property {string} [data.error] - 错误信息
 * @property {boolean} [data.available] - Playwright 是否可用
 * @property {string} [data.browserPath] - 浏览器路径
 * @property {string} [data.message] - 消息
 */
