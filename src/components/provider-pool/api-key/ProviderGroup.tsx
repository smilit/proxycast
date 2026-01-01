/**
 * @file ProviderGroup 组件
 * @description Provider 分组组件，支持折叠/展开和显示分组标题
 * @module components/provider-pool/api-key/ProviderGroup
 *
 * **Feature: provider-ui-refactor**
 * **Validates: Requirements 8.1, 8.3**
 */

import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDER_GROUPS } from "@/lib/config/providers";
import type { ProviderGroup as ProviderGroupType } from "@/lib/types/provider";
import type { ProviderWithKeysDisplay } from "@/lib/api/apiKeyProvider";
import { ProviderListItem } from "./ProviderListItem";

// ============================================================================
// 类型定义
// ============================================================================

export interface ProviderGroupProps {
  /** 分组类型 */
  group: ProviderGroupType;
  /** 该分组下的 Provider 列表 */
  providers: ProviderWithKeysDisplay[];
  /** 是否折叠 */
  collapsed?: boolean;
  /** 折叠/展开回调 */
  onToggle?: () => void;
  /** 当前选中的 Provider ID */
  selectedProviderId?: string | null;
  /** Provider 点击回调 */
  onProviderSelect?: (id: string) => void;
  /** 额外的 CSS 类名 */
  className?: string;
}

// ============================================================================
// 组件实现
// ============================================================================

/**
 * Provider 分组组件
 *
 * 显示一个可折叠的 Provider 分组，包含分组标题和 Provider 列表。
 *
 * @example
 * ```tsx
 * <ProviderGroup
 *   group="mainstream"
 *   providers={mainstreamProviders}
 *   collapsed={collapsedGroups.has("mainstream")}
 *   onToggle={() => toggleGroup("mainstream")}
 *   selectedProviderId={selectedId}
 *   onProviderSelect={setSelectedId}
 * />
 * ```
 */
export const ProviderGroup: React.FC<ProviderGroupProps> = ({
  group,
  providers,
  collapsed = false,
  onToggle,
  selectedProviderId,
  onProviderSelect,
  className,
}) => {
  // 获取分组配置
  const groupConfig = PROVIDER_GROUPS[group];
  const groupLabel = groupConfig?.label ?? group;
  const providerCount = providers.length;

  // 如果分组为空，不渲染
  if (providerCount === 0) {
    return null;
  }

  return (
    <div
      className={cn("mb-2", className)}
      data-testid="provider-group"
      data-group={group}
      data-collapsed={collapsed}
    >
      {/* 分组标题 */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg",
          "text-sm font-medium text-muted-foreground",
          "hover:bg-muted/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
        )}
        aria-expanded={!collapsed}
        aria-controls={`provider-group-${group}-content`}
        data-testid="provider-group-header"
      >
        {/* 折叠图标 */}
        {collapsed ? (
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        )}

        {/* 分组标题 */}
        <span className="flex-1 text-left" data-testid="provider-group-label">
          {groupLabel}
        </span>

        {/* Provider 数量 */}
        <span
          className="text-xs text-muted-foreground/70"
          data-testid="provider-group-count"
        >
          {providerCount}
        </span>
      </button>

      {/* Provider 列表 */}
      {!collapsed && (
        <div
          id={`provider-group-${group}-content`}
          className="mt-1 space-y-0.5 pl-2"
          data-testid="provider-group-content"
        >
          {providers.map((provider) => (
            <ProviderListItem
              key={provider.id}
              provider={provider}
              selected={selectedProviderId === provider.id}
              onClick={() => onProviderSelect?.(provider.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 辅助函数（用于测试）
// ============================================================================

/**
 * 获取分组的显示标签
 * 用于属性测试验证分组正确性
 */
export function getGroupLabel(group: ProviderGroupType): string {
  return PROVIDER_GROUPS[group]?.label ?? group;
}

/**
 * 检查 Provider 是否属于指定分组
 * 用于属性测试验证分组正确性
 */
export function isProviderInGroup(
  provider: ProviderWithKeysDisplay,
  group: ProviderGroupType,
): boolean {
  return provider.group === group;
}

/**
 * 获取分组的排序顺序
 * 用于属性测试验证分组排序
 */
export function getGroupOrder(group: ProviderGroupType): number {
  return PROVIDER_GROUPS[group]?.order ?? 999;
}

export default ProviderGroup;
