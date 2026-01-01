/**
 * 浏览器模式选择器组件
 *
 * 允许用户在系统浏览器和 Playwright 指纹浏览器之间切换
 * 用于 Kiro OAuth 登录流程
 *
 * @module components/provider-pool/credential-forms/BrowserModeSelector
 * @description 实现 Requirements 1.1, 1.2, 1.3
 */

import { Globe, Fingerprint, Loader2, AlertCircle } from "lucide-react";

export type BrowserMode = "system" | "playwright";

interface BrowserModeSelectorProps {
  /** 当前选中的浏览器模式 */
  mode: BrowserMode;
  /** 模式变更回调 */
  onModeChange: (mode: BrowserMode) => void;
  /** Playwright 是否可用 */
  playwrightAvailable: boolean;
  /** 是否正在检查 Playwright 可用性 */
  playwrightChecking: boolean;
  /** 重新检查 Playwright 可用性回调 */
  onCheckPlaywright: () => void;
  /** 是否禁用（登录中） */
  disabled?: boolean;
}

/**
 * 浏览器模式选择器
 *
 * 显示两个选项：系统浏览器和指纹浏览器
 * 当 Playwright 不可用时，指纹浏览器选项会显示警告状态
 */
export function BrowserModeSelector({
  mode,
  onModeChange,
  playwrightAvailable,
  playwrightChecking,
  onCheckPlaywright,
  disabled = false,
}: BrowserModeSelectorProps) {
  const handlePlaywrightSelect = () => {
    if (disabled) return;

    if (!playwrightAvailable && !playwrightChecking) {
      // 如果 Playwright 不可用，先检查一次
      onCheckPlaywright();
    }
    onModeChange("playwright");
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        浏览器模式
      </label>
      <div className="grid grid-cols-2 gap-2">
        {/* 系统浏览器选项 */}
        <button
          type="button"
          onClick={() => !disabled && onModeChange("system")}
          disabled={disabled}
          className={`relative flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border text-xs transition-all duration-200 ${
            mode === "system"
              ? "border-primary bg-primary/5 text-primary font-medium"
              : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <Globe className="h-3 w-3 flex-shrink-0" />
          <span>系统浏览器</span>
        </button>

        {/* 指纹浏览器选项 */}
        <button
          type="button"
          onClick={handlePlaywrightSelect}
          disabled={disabled}
          className={`relative flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border text-xs transition-all duration-200 ${
            mode === "playwright"
              ? playwrightAvailable
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-medium"
              : "border-muted hover:border-muted-foreground/30 hover:bg-muted/50"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {playwrightChecking ? (
            <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" />
          ) : (
            <Fingerprint className="h-3 w-3 flex-shrink-0" />
          )}
          <span>
            {playwrightChecking
              ? "检测中"
              : playwrightAvailable
                ? "指纹浏览器"
                : "指纹(需安装)"}
          </span>

          {/* 不可用警告图标 */}
          {mode === "playwright" &&
            !playwrightAvailable &&
            !playwrightChecking && (
              <AlertCircle className="h-2.5 w-2.5 text-amber-500 absolute -top-0.5 -right-0.5" />
            )}
        </button>
      </div>
    </div>
  );
}
