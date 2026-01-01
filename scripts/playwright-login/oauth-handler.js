/**
 * @file oauth-handler.js
 * @description OAuth 流程处理器，处理授权码提取
 * @module playwright-login/oauth-handler
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

/**
 * OAuth 回调 URL 模式
 * @type {RegExp}
 */
const CALLBACK_URL_PATTERN = /^https?:\/\/localhost(:\d+)?\/callback/;

/**
 * 解析 OAuth 回调 URL，提取授权码和状态
 * @param {string} url - 回调 URL
 * @returns {OAuthCallbackResult} 解析结果
 */
export function parseCallbackUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      success: false,
      error: 'URL 不能为空'
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return {
      success: false,
      error: `无效的 URL 格式: ${e.message}`
    };
  }

  const params = parsedUrl.searchParams;

  // 检查是否有错误参数
  const error = params.get('error');
  if (error) {
    const errorDescription = params.get('error_description');
    return {
      success: false,
      error: errorDescription ? `${error}: ${errorDescription}` : error
    };
  }

  // 提取授权码
  const code = params.get('code');
  if (!code) {
    return {
      success: false,
      error: '回调 URL 中缺少 code 参数'
    };
  }

  // 提取状态（可选）
  const state = params.get('state');

  return {
    success: true,
    code,
    state: state || undefined
  };
}

/**
 * 检查 URL 是否为 OAuth 回调 URL
 * @param {string} url - 要检查的 URL
 * @param {string} [expectedCallbackBase] - 期望的回调基础 URL
 * @returns {boolean} 是否为回调 URL
 */
export function isCallbackUrl(url, expectedCallbackBase) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url);
    
    // 如果提供了期望的回调基础 URL，进行精确匹配
    if (expectedCallbackBase) {
      const expectedParsed = new URL(expectedCallbackBase);
      return (
        parsedUrl.hostname === expectedParsed.hostname &&
        parsedUrl.port === expectedParsed.port &&
        parsedUrl.pathname === expectedParsed.pathname
      );
    }

    // 默认匹配 localhost 回调模式
    return CALLBACK_URL_PATTERN.test(url);
  } catch {
    return false;
  }
}

/**
 * 创建 OAuth 流程处理器
 * @param {BrowserContext} context - Playwright 浏览器上下文
 * @param {OAuthHandlerOptions} options - 处理器选项
 * @returns {OAuthHandler} OAuth 处理器实例
 */
export function createOAuthHandler(context, options) {
  const {
    authUrl,
    callbackUrl,
    timeout = 5 * 60 * 1000, // 默认 5 分钟超时
    onProgress
  } = options;

  let page = null;
  let cancelled = false;
  let timeoutId = null;

  /**
   * 启动 OAuth 流程
   * @returns {Promise<OAuthCallbackResult>}
   */
  async function start() {
    if (cancelled) {
      return { success: false, error: '流程已取消' };
    }

    try {
      // 创建新页面
      page = await context.newPage();
      
      onProgress?.('正在打开授权页面...');

      // 设置超时
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('OAuth 流程超时'));
        }, timeout);
      });

      // 导航到授权 URL
      await page.goto(authUrl, { waitUntil: 'domcontentloaded' });
      
      onProgress?.('等待用户授权...');

      // 等待回调 URL
      const resultPromise = waitForCallback(page, callbackUrl);

      // 竞争：回调完成 vs 超时
      const result = await Promise.race([resultPromise, timeoutPromise]);
      
      clearTimeout(timeoutId);
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (cancelled) {
        return { success: false, error: '用户取消了登录' };
      }
      
      return {
        success: false,
        error: error.message || '未知错误'
      };
    }
  }

  /**
   * 等待回调 URL
   * @param {Page} page - Playwright 页面
   * @param {string} callbackUrl - 期望的回调 URL
   * @returns {Promise<OAuthCallbackResult>}
   */
  async function waitForCallback(page, callbackUrl) {
    return new Promise((resolve, reject) => {
      // 监听页面导航
      const handleNavigation = (frame) => {
        if (frame !== page.mainFrame()) return;
        
        const currentUrl = page.url();
        
        if (isCallbackUrl(currentUrl, callbackUrl)) {
          onProgress?.('检测到回调，正在提取授权码...');
          const result = parseCallbackUrl(currentUrl);
          resolve(result);
        }
      };

      page.on('framenavigated', handleNavigation);

      // 监听页面关闭
      page.on('close', () => {
        if (!cancelled) {
          resolve({ success: false, error: '用户关闭了浏览器窗口' });
        }
      });

      // 检查当前 URL（可能已经在回调页面）
      const currentUrl = page.url();
      if (isCallbackUrl(currentUrl, callbackUrl)) {
        const result = parseCallbackUrl(currentUrl);
        resolve(result);
      }
    });
  }

  /**
   * 取消 OAuth 流程
   */
  async function cancel() {
    cancelled = true;
    clearTimeout(timeoutId);
    
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch {
        // 忽略关闭错误
      }
    }
  }

  return {
    start,
    cancel
  };
}

/**
 * @typedef {Object} OAuthCallbackResult
 * @property {boolean} success - 是否成功
 * @property {string} [code] - 授权码
 * @property {string} [state] - 状态参数
 * @property {string} [error] - 错误信息
 */

/**
 * @typedef {Object} OAuthHandlerOptions
 * @property {string} authUrl - OAuth 授权 URL
 * @property {string} callbackUrl - 回调 URL
 * @property {number} [timeout] - 超时时间（毫秒）
 * @property {(message: string) => void} [onProgress] - 进度回调
 */

/**
 * @typedef {Object} OAuthHandler
 * @property {() => Promise<OAuthCallbackResult>} start - 启动 OAuth 流程
 * @property {() => Promise<void>} cancel - 取消 OAuth 流程
 */
