/**
 * Playwright 登录错误处理模块
 *
 * 提供 Playwright 指纹浏览器登录相关的错误类型定义、
 * 错误消息映射和错误处理工具函数
 *
 * @module lib/errors/playwrightErrors
 * @description 实现 Requirements 5.1, 5.2, 5.3, 5.4
 */

/**
 * Playwright 错误类型枚举
 */
export enum PlaywrightErrorType {
  /** Playwright 未安装 */
  NOT_INSTALLED = "NOT_INSTALLED",
  /** 浏览器启动失败 */
  BROWSER_LAUNCH_FAILED = "BROWSER_LAUNCH_FAILED",
  /** OAuth 流程超时 */
  OAUTH_TIMEOUT = "OAUTH_TIMEOUT",
  /** 用户取消登录 */
  USER_CANCELLED = "USER_CANCELLED",
  /** 用户关闭浏览器窗口 */
  BROWSER_CLOSED = "BROWSER_CLOSED",
  /** 授权码提取失败 */
  CODE_EXTRACTION_FAILED = "CODE_EXTRACTION_FAILED",
  /** Token 交换失败 */
  TOKEN_EXCHANGE_FAILED = "TOKEN_EXCHANGE_FAILED",
  /** 网络错误 */
  NETWORK_ERROR = "NETWORK_ERROR",
  /** 脚本执行错误 */
  SCRIPT_ERROR = "SCRIPT_ERROR",
  /** 未知错误 */
  UNKNOWN = "UNKNOWN",
}

/**
 * Playwright 错误信息接口
 */
export interface PlaywrightErrorInfo {
  /** 错误类型 */
  type: PlaywrightErrorType;
  /** 用户友好的错误标题 */
  title: string;
  /** 用户友好的错误描述 */
  message: string;
  /** 故障排除建议 */
  suggestions: string[];
  /** 是否可重试 */
  retryable: boolean;
  /** 原始错误消息（用于调试） */
  originalError?: string;
}

/**
 * 错误消息模式匹配规则
 */
const ERROR_PATTERNS: Array<{
  pattern: RegExp | string;
  type: PlaywrightErrorType;
}> = [
  { pattern: /playwright.*不可用/i, type: PlaywrightErrorType.NOT_INSTALLED },
  { pattern: /playwright.*未安装/i, type: PlaywrightErrorType.NOT_INSTALLED },
  { pattern: /chromium.*未安装/i, type: PlaywrightErrorType.NOT_INSTALLED },
  {
    pattern: /browser.*not.*installed/i,
    type: PlaywrightErrorType.NOT_INSTALLED,
  },
  {
    pattern: /启动.*浏览器.*失败/i,
    type: PlaywrightErrorType.BROWSER_LAUNCH_FAILED,
  },
  {
    pattern: /browser.*launch.*failed/i,
    type: PlaywrightErrorType.BROWSER_LAUNCH_FAILED,
  },
  {
    pattern: /启动.*playwright.*失败/i,
    type: PlaywrightErrorType.BROWSER_LAUNCH_FAILED,
  },
  { pattern: /超时/i, type: PlaywrightErrorType.OAUTH_TIMEOUT },
  { pattern: /timeout/i, type: PlaywrightErrorType.OAUTH_TIMEOUT },
  { pattern: /用户取消/i, type: PlaywrightErrorType.USER_CANCELLED },
  { pattern: /user.*cancel/i, type: PlaywrightErrorType.USER_CANCELLED },
  { pattern: /登录已取消/i, type: PlaywrightErrorType.USER_CANCELLED },
  { pattern: /关闭.*浏览器/i, type: PlaywrightErrorType.BROWSER_CLOSED },
  { pattern: /browser.*closed/i, type: PlaywrightErrorType.BROWSER_CLOSED },
  { pattern: /授权码/i, type: PlaywrightErrorType.CODE_EXTRACTION_FAILED },
  { pattern: /code.*参数/i, type: PlaywrightErrorType.CODE_EXTRACTION_FAILED },
  { pattern: /token.*交换/i, type: PlaywrightErrorType.TOKEN_EXCHANGE_FAILED },
  {
    pattern: /token.*exchange/i,
    type: PlaywrightErrorType.TOKEN_EXCHANGE_FAILED,
  },
  { pattern: /网络/i, type: PlaywrightErrorType.NETWORK_ERROR },
  { pattern: /network/i, type: PlaywrightErrorType.NETWORK_ERROR },
  { pattern: /connection/i, type: PlaywrightErrorType.NETWORK_ERROR },
];

/**
 * 错误类型对应的详细信息
 */
const ERROR_INFO_MAP: Record<
  PlaywrightErrorType,
  Omit<PlaywrightErrorInfo, "type" | "originalError">
> = {
  [PlaywrightErrorType.NOT_INSTALLED]: {
    title: "Playwright 未安装",
    message: "指纹浏览器功能需要 Playwright Chromium 浏览器支持。",
    suggestions: [
      "在终端中运行: npx playwright install chromium",
      "安装完成后点击「重新检测」按钮",
      "如果安装失败，请检查网络连接或使用代理",
    ],
    retryable: false,
  },
  [PlaywrightErrorType.BROWSER_LAUNCH_FAILED]: {
    title: "浏览器启动失败",
    message: "无法启动 Playwright 浏览器，可能是权限问题或浏览器文件损坏。",
    suggestions: [
      "尝试重新安装 Playwright: npx playwright install chromium --force",
      "检查系统是否有足够的内存和磁盘空间",
      "尝试使用系统浏览器模式登录",
      "如果问题持续，请重启应用后重试",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.OAUTH_TIMEOUT]: {
    title: "登录超时",
    message: "OAuth 授权流程超时，请在 5 分钟内完成登录操作。",
    suggestions: [
      "点击「重试」按钮重新开始登录",
      "确保网络连接稳定",
      "如果页面加载缓慢，请检查网络或使用代理",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.USER_CANCELLED]: {
    title: "登录已取消",
    message: "您已取消登录操作。",
    suggestions: ["如需继续登录，请重新选择登录方式"],
    retryable: true,
  },
  [PlaywrightErrorType.BROWSER_CLOSED]: {
    title: "浏览器窗口已关闭",
    message: "您在完成登录前关闭了浏览器窗口。",
    suggestions: [
      "请重新开始登录，并在浏览器中完成授权",
      "授权完成后浏览器会自动关闭",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.CODE_EXTRACTION_FAILED]: {
    title: "授权码获取失败",
    message: "无法从回调 URL 中提取授权码。",
    suggestions: [
      "请重试登录",
      "如果问题持续，请尝试使用系统浏览器模式",
      "检查是否有浏览器扩展干扰了登录流程",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.TOKEN_EXCHANGE_FAILED]: {
    title: "Token 交换失败",
    message: "授权成功但 Token 交换失败，可能是服务器暂时不可用。",
    suggestions: [
      "请稍后重试",
      "检查网络连接是否正常",
      "如果使用代理，请确保代理配置正确",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.NETWORK_ERROR]: {
    title: "网络错误",
    message: "网络连接出现问题，无法完成登录。",
    suggestions: [
      "检查网络连接是否正常",
      "如果使用代理，请确保代理配置正确",
      "尝试关闭 VPN 或代理后重试",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.SCRIPT_ERROR]: {
    title: "脚本执行错误",
    message: "Playwright 登录脚本执行出错。",
    suggestions: [
      "请重启应用后重试",
      "如果问题持续，请尝试重新安装 Playwright",
      "可以尝试使用系统浏览器模式登录",
    ],
    retryable: true,
  },
  [PlaywrightErrorType.UNKNOWN]: {
    title: "登录失败",
    message: "登录过程中发生未知错误。",
    suggestions: [
      "请重试登录",
      "如果问题持续，请尝试使用系统浏览器模式",
      "重启应用后重试",
    ],
    retryable: true,
  },
};

/**
 * 解析错误消息，返回结构化的错误信息
 *
 * @param error - 原始错误（可以是 Error 对象或字符串）
 * @returns 结构化的错误信息
 */
export function parsePlaywrightError(error: unknown): PlaywrightErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // 尝试匹配已知错误模式
  for (const { pattern, type } of ERROR_PATTERNS) {
    const regex =
      typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;
    if (regex.test(errorMessage)) {
      const info = ERROR_INFO_MAP[type];
      return {
        type,
        ...info,
        originalError: errorMessage,
      };
    }
  }

  // 未匹配到已知模式，返回未知错误
  const unknownInfo = ERROR_INFO_MAP[PlaywrightErrorType.UNKNOWN];
  return {
    type: PlaywrightErrorType.UNKNOWN,
    ...unknownInfo,
    originalError: errorMessage,
  };
}

/**
 * 获取用户友好的错误消息
 *
 * @param error - 原始错误
 * @returns 用户友好的错误消息
 */
export function getPlaywrightErrorMessage(error: unknown): string {
  const errorInfo = parsePlaywrightError(error);
  return errorInfo.message;
}

/**
 * 检查错误是否可重试
 *
 * @param error - 原始错误
 * @returns 是否可重试
 */
export function isPlaywrightErrorRetryable(error: unknown): boolean {
  const errorInfo = parsePlaywrightError(error);
  return errorInfo.retryable;
}

/**
 * 记录 Playwright 错误日志
 *
 * @param context - 错误发生的上下文
 * @param error - 原始错误
 * @param additionalInfo - 附加信息
 */
export function logPlaywrightError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>,
): void {
  const errorInfo = parsePlaywrightError(error);
  const timestamp = new Date().toISOString();

  console.error(`[Playwright Error] ${timestamp}`, {
    context,
    errorType: errorInfo.type,
    title: errorInfo.title,
    message: errorInfo.message,
    originalError: errorInfo.originalError,
    retryable: errorInfo.retryable,
    ...additionalInfo,
  });
}
