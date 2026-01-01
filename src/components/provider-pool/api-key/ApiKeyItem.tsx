/**
 * @file ApiKeyItem 组件
 * @description API Key 列表项组件，显示 API Key（掩码）、别名、使用统计，支持启用/禁用、删除操作
 * @module components/provider-pool/api-key/ApiKeyItem
 *
 * **Feature: provider-ui-refactor**
 * **Validates: Requirements 7.5**
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ApiKeyDisplay } from "@/lib/api/apiKeyProvider";

// ============================================================================
// 图标组件
// ============================================================================

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn("w-4 h-4", className)}
  >
    <path
      fillRule="evenodd"
      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
      clipRule="evenodd"
    />
  </svg>
);

const KeyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={cn("w-4 h-4", className)}
  >
    <path
      fillRule="evenodd"
      d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z"
      clipRule="evenodd"
    />
  </svg>
);

// ============================================================================
// 类型定义
// ============================================================================

export interface ApiKeyItemProps {
  /** API Key 数据 */
  apiKey: ApiKeyDisplay;
  /** 切换启用状态回调 */
  onToggle?: (keyId: string, enabled: boolean) => void;
  /** 删除回调 */
  onDelete?: (keyId: string) => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 额外的 CSS 类名 */
  className?: string;
}

// ============================================================================
// 组件实现
// ============================================================================

/**
 * API Key 列表项组件
 *
 * 显示单个 API Key 的信息，包括：
 * - 掩码后的 API Key
 * - 别名（如果有）
 * - 使用统计（使用次数、错误次数）
 * - 启用/禁用开关
 * - 删除按钮
 *
 * @example
 * ```tsx
 * <ApiKeyItem
 *   apiKey={apiKey}
 *   onToggle={(id, enabled) => toggleApiKey(id, enabled)}
 *   onDelete={(id) => deleteApiKey(id)}
 * />
 * ```
 */
export const ApiKeyItem: React.FC<ApiKeyItemProps> = ({
  apiKey,
  onToggle,
  onDelete,
  loading = false,
  className,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = (checked: boolean) => {
    if (!loading) {
      onToggle?.(apiKey.id, checked);
    }
  };

  const handleDelete = () => {
    if (!loading && !isDeleting) {
      setIsDeleting(true);
      onDelete?.(apiKey.id);
    }
  };

  // 格式化最后使用时间
  const formatLastUsed = (dateStr?: string): string => {
    if (!dateStr) return "从未使用";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 30) return `${diffDays} 天前`;
    return date.toLocaleDateString("zh-CN");
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "bg-muted/30 hover:bg-muted/50 transition-colors",
        !apiKey.enabled && "opacity-60",
        className,
      )}
      data-testid="api-key-item"
      data-key-id={apiKey.id}
      data-enabled={apiKey.enabled}
    >
      {/* Key 图标 */}
      <KeyIcon className="flex-shrink-0 text-muted-foreground" />

      {/* API Key 信息 */}
      <div className="flex-1 min-w-0">
        {/* 别名或掩码 Key */}
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-medium truncate"
            data-testid="api-key-display"
          >
            {apiKey.alias || apiKey.api_key_masked}
          </span>
          {apiKey.alias && (
            <span
              className="text-xs text-muted-foreground truncate"
              data-testid="api-key-masked"
            >
              ({apiKey.api_key_masked})
            </span>
          )}
        </div>

        {/* 使用统计 */}
        <div
          className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground"
          data-testid="api-key-stats"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span data-testid="usage-count">
                  使用: {apiKey.usage_count}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>总使用次数</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {apiKey.error_count > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-red-500" data-testid="error-count">
                    错误: {apiKey.error_count}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>API 调用错误次数</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span data-testid="last-used">
                  {formatLastUsed(apiKey.last_used_at)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>最后使用时间</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 启用/禁用开关 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Switch
                checked={apiKey.enabled}
                onCheckedChange={handleToggle}
                disabled={loading}
                data-testid="api-key-toggle"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{apiKey.enabled ? "点击禁用" : "点击启用"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 删除按钮 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-red-500"
              onClick={handleDelete}
              disabled={loading || isDeleting}
              data-testid="api-key-delete"
            >
              <TrashIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>删除此 API Key</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// ============================================================================
// 辅助函数（用于测试）
// ============================================================================

/**
 * 从 API Key 数据中提取显示所需的信息
 * 用于属性测试验证显示完整性
 */
export function extractApiKeyDisplayInfo(apiKey: ApiKeyDisplay): {
  hasMaskedKey: boolean;
  hasAlias: boolean;
  hasUsageCount: boolean;
  hasErrorCount: boolean;
  hasEnabled: boolean;
} {
  return {
    hasMaskedKey:
      typeof apiKey.api_key_masked === "string" &&
      apiKey.api_key_masked.length > 0,
    hasAlias: apiKey.alias !== undefined && apiKey.alias !== null,
    hasUsageCount: typeof apiKey.usage_count === "number",
    hasErrorCount: typeof apiKey.error_count === "number",
    hasEnabled: typeof apiKey.enabled === "boolean",
  };
}

export default ApiKeyItem;
