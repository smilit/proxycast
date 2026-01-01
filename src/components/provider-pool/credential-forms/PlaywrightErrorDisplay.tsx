/**
 * Playwright 错误显示组件
 *
 * 显示 Playwright 登录过程中的错误信息，
 * 包括错误标题、描述和故障排除建议
 *
 * @module components/provider-pool/credential-forms/PlaywrightErrorDisplay
 * @description 实现 Requirements 5.1, 5.2, 5.4
 */

import { AlertCircle, RefreshCw, XCircle, Clock, Globe } from "lucide-react";
import {
  parsePlaywrightError,
  PlaywrightErrorType,
  type PlaywrightErrorInfo,
} from "@/lib/errors/playwrightErrors";

interface PlaywrightErrorDisplayProps {
  /** 错误信息（可以是 Error 对象、字符串或 null） */
  error: unknown;
  /** 重试回调 */
  onRetry?: () => void;
  /** 切换到系统浏览器回调 */
  onSwitchToSystemBrowser?: () => void;
  /** 关闭/清除错误回调 */
  onDismiss?: () => void;
  /** 是否正在重试 */
  retrying?: boolean;
}

/**
 * 根据错误类型获取图标
 */
function getErrorIcon(type: PlaywrightErrorType) {
  switch (type) {
    case PlaywrightErrorType.OAUTH_TIMEOUT:
      return <Clock className="h-5 w-5" />;
    case PlaywrightErrorType.USER_CANCELLED:
    case PlaywrightErrorType.BROWSER_CLOSED:
      return <XCircle className="h-5 w-5" />;
    default:
      return <AlertCircle className="h-5 w-5" />;
  }
}

/**
 * 根据错误类型获取样式
 */
function getErrorStyles(type: PlaywrightErrorType) {
  switch (type) {
    case PlaywrightErrorType.USER_CANCELLED:
    case PlaywrightErrorType.BROWSER_CLOSED:
      // 用户主动操作，使用较温和的样式
      return {
        container:
          "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50",
        icon: "text-slate-500",
        title: "text-slate-800 dark:text-slate-200",
        message: "text-slate-600 dark:text-slate-400",
      };
    case PlaywrightErrorType.OAUTH_TIMEOUT:
      // 超时，使用警告样式
      return {
        container:
          "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
        icon: "text-amber-500",
        title: "text-amber-800 dark:text-amber-300",
        message: "text-amber-700 dark:text-amber-400",
      };
    default:
      // 其他错误，使用错误样式
      return {
        container:
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
        icon: "text-red-500",
        title: "text-red-800 dark:text-red-300",
        message: "text-red-700 dark:text-red-400",
      };
  }
}

/**
 * Playwright 错误显示组件
 *
 * 根据错误类型显示不同样式的错误信息，
 * 并提供重试和切换浏览器模式的操作按钮
 */
export function PlaywrightErrorDisplay({
  error,
  onRetry,
  onSwitchToSystemBrowser,
  onDismiss,
  retrying = false,
}: PlaywrightErrorDisplayProps) {
  if (!error) return null;

  const errorInfo: PlaywrightErrorInfo = parsePlaywrightError(error);
  const styles = getErrorStyles(errorInfo.type);

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${styles.container}`}>
      {/* 错误标题和关闭按钮 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 mt-0.5 ${styles.icon}`}>
            {getErrorIcon(errorInfo.type)}
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${styles.title}`}>
              {errorInfo.title}
            </h4>
            <p className={`text-sm mt-1 ${styles.message}`}>
              {errorInfo.message}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="关闭"
          >
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* 故障排除建议 */}
      {errorInfo.suggestions.length > 0 && (
        <div className="pl-8">
          <p className={`text-xs font-medium mb-1.5 ${styles.message}`}>
            建议操作：
          </p>
          <ul className={`text-xs space-y-1 ${styles.message}`}>
            {errorInfo.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="flex-shrink-0">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 操作按钮 */}
      {(errorInfo.retryable || onSwitchToSystemBrowser) && (
        <div className="flex items-center gap-2 pl-8 pt-1">
          {errorInfo.retryable && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                retrying
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`}
              />
              {retrying ? "重试中..." : "重试"}
            </button>
          )}
          {onSwitchToSystemBrowser && (
            <button
              type="button"
              onClick={onSwitchToSystemBrowser}
              disabled={retrying}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border hover:bg-muted transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              使用系统浏览器
            </button>
          )}
        </div>
      )}

      {/* 调试信息（开发模式下显示） */}
      {import.meta.env.DEV && errorInfo.originalError && (
        <details className="pl-8 pt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            调试信息
          </summary>
          <pre className="mt-2 p-2 text-xs bg-slate-100 dark:bg-slate-800 rounded overflow-x-auto">
            {errorInfo.originalError}
          </pre>
        </details>
      )}
    </div>
  );
}
