/**
 * @file DeleteProviderDialog 组件
 * @description 删除自定义 Provider 确认对话框
 * @module components/provider-pool/api-key/DeleteProviderDialog
 *
 * **Feature: provider-ui-refactor**
 * **Validates: Requirements 6.3, 6.4**
 */

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import type { ProviderWithKeysDisplay } from "@/lib/api/apiKeyProvider";

// ============================================================================
// 类型定义
// ============================================================================

export interface DeleteProviderDialogProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 要删除的 Provider */
  provider: ProviderWithKeysDisplay | null;
  /** 删除确认回调 */
  onConfirm: (providerId: string) => Promise<void>;
  /** 额外的 CSS 类名 */
  className?: string;
}

// ============================================================================
// 辅助函数（导出用于测试）
// ============================================================================

/**
 * 检查 Provider 是否可以被删除
 * System Provider 不能被删除
 *
 * @param provider Provider 数据
 * @returns 是否可以删除
 */
export function canDeleteProvider(
  provider: ProviderWithKeysDisplay | null,
): boolean {
  if (!provider) return false;
  return !provider.is_system;
}

/**
 * 检查是否为 System Provider
 * 用于属性测试验证 System Provider 删除保护
 *
 * @param provider Provider 数据
 * @returns 是否为 System Provider
 */
export function isSystemProvider(
  provider: ProviderWithKeysDisplay | null,
): boolean {
  if (!provider) return false;
  return provider.is_system === true;
}

// ============================================================================
// 组件实现
// ============================================================================

/**
 * 删除 Provider 确认对话框组件
 *
 * 显示删除确认对话框，包含：
 * - 警告图标和提示信息
 * - Provider 名称
 * - API Key 数量警告
 * - 取消和确认按钮
 *
 * 注意：System Provider 不能被删除，此组件应仅用于自定义 Provider。
 *
 * @example
 * ```tsx
 * <DeleteProviderDialog
 *   isOpen={showDeleteDialog}
 *   onClose={() => setShowDeleteDialog(false)}
 *   provider={providerToDelete}
 *   onConfirm={handleDeleteProvider}
 * />
 * ```
 */
export const DeleteProviderDialog: React.FC<DeleteProviderDialogProps> = ({
  isOpen,
  onClose,
  provider,
  onConfirm,
  className,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理删除确认
  const handleConfirm = useCallback(async () => {
    if (!provider || !canDeleteProvider(provider)) {
      setError("无法删除系统预设 Provider");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(provider.id);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  }, [provider, onConfirm, onClose]);

  // 关闭时重置状态
  const handleClose = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  // 如果没有 Provider 或是 System Provider，不显示对话框
  if (!provider || !canDeleteProvider(provider)) {
    return null;
  }

  const apiKeyCount = provider.api_keys?.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-sm"
      className={className}
    >
      <ModalHeader>删除 Provider</ModalHeader>

      <ModalBody className="space-y-4">
        {/* 警告图标和提示 */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              确定要删除 <span className="font-semibold">{provider.name}</span>{" "}
              吗？
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              此操作无法撤销。
            </p>
          </div>
        </div>

        {/* API Key 数量警告 */}
        {apiKeyCount > 0 && (
          <div
            className={cn(
              "p-3 rounded-lg text-sm",
              "bg-amber-50 text-amber-800 border border-amber-200",
            )}
            data-testid="api-key-warning"
          >
            该 Provider 包含 {apiKeyCount} 个 API Key，删除后将一并移除。
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div
            className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
            data-testid="delete-error"
          >
            {error}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isDeleting}
          data-testid="cancel-button"
        >
          取消
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={isDeleting}
          data-testid="confirm-delete-button"
        >
          {isDeleting ? "删除中..." : "删除"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteProviderDialog;
