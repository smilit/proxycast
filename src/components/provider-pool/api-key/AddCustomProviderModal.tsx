/**
 * @file AddCustomProviderModal 组件
 * @description 添加自定义 Provider 的模态框组件
 * @module components/provider-pool/api-key/AddCustomProviderModal
 *
 * **Feature: provider-ui-refactor**
 * **Validates: Requirements 6.1, 6.2**
 */

import React, { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProviderType } from "@/lib/types/provider";
import type { AddCustomProviderRequest } from "@/lib/api/apiKeyProvider";

// ============================================================================
// 常量
// ============================================================================

/** 支持的 Provider 类型列表 */
const PROVIDER_TYPES: { value: ProviderType; label: string }[] = [
  { value: "openai", label: "OpenAI 兼容" },
  { value: "openai-response", label: "OpenAI Responses API" },
  { value: "anthropic", label: "Anthropic" },
  { value: "gemini", label: "Gemini" },
  { value: "azure-openai", label: "Azure OpenAI" },
  { value: "vertexai", label: "VertexAI" },
  { value: "aws-bedrock", label: "AWS Bedrock" },
  { value: "ollama", label: "Ollama" },
  { value: "new-api", label: "New API" },
  { value: "gateway", label: "Vercel AI Gateway" },
];

/** Provider 类型对应的额外字段 */
const PROVIDER_TYPE_EXTRA_FIELDS: Record<ProviderType, string[]> = {
  openai: [],
  "openai-response": [],
  anthropic: [],
  gemini: [],
  "azure-openai": ["apiVersion"],
  vertexai: ["project", "location"],
  "aws-bedrock": ["region"],
  ollama: [],
  "new-api": [],
  gateway: [],
};

// ============================================================================
// 类型定义
// ============================================================================

export interface AddCustomProviderModalProps {
  /** 是否打开 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 添加成功回调 */
  onAdd: (request: AddCustomProviderRequest) => Promise<void>;
  /** 额外的 CSS 类名 */
  className?: string;
}

/** 表单状态 */
interface FormState {
  name: string;
  type: ProviderType;
  apiHost: string;
  apiKey: string;
  apiVersion: string;
  project: string;
  location: string;
  region: string;
}

/** 表单错误 */
interface FormErrors {
  name?: string;
  apiHost?: string;
  apiKey?: string;
  apiVersion?: string;
  project?: string;
  location?: string;
  region?: string;
}

/** 初始表单状态 */
const INITIAL_FORM_STATE: FormState = {
  name: "",
  type: "openai",
  apiHost: "",
  apiKey: "",
  apiVersion: "",
  project: "",
  location: "",
  region: "",
};

// ============================================================================
// 验证函数（导出用于测试）
// ============================================================================

/**
 * 验证自定义 Provider 表单
 * 用于属性测试验证 Requirements 6.2
 *
 * @param formState 表单状态
 * @returns 验证错误对象，如果没有错误则为空对象
 */
export function validateCustomProviderForm(formState: FormState): FormErrors {
  const errors: FormErrors = {};

  // 验证名称（必填）
  if (!formState.name.trim()) {
    errors.name = "Provider 名称不能为空";
  } else if (formState.name.trim().length > 50) {
    errors.name = "Provider 名称不能超过 50 个字符";
  }

  // 验证 API Host（必填）
  if (!formState.apiHost.trim()) {
    errors.apiHost = "API Host 不能为空";
  } else {
    // 验证 URL 格式
    try {
      new URL(formState.apiHost.trim());
    } catch {
      errors.apiHost = "请输入有效的 URL";
    }
  }

  // 验证 API Key（必填）
  if (!formState.apiKey.trim()) {
    errors.apiKey = "API Key 不能为空";
  }

  // 额外字段验证（可选字段，不强制验证格式）
  // Azure OpenAI 的 API Version、VertexAI 的 Project/Location、AWS Bedrock 的 Region
  // 都是可选字段，用户可以自由填写

  return errors;
}

/**
 * 检查表单是否有效
 */
export function isFormValid(formState: FormState): boolean {
  const errors = validateCustomProviderForm(formState);
  return Object.keys(errors).length === 0;
}

/**
 * 检查必填字段是否已填写
 */
export function hasRequiredFields(formState: FormState): boolean {
  return (
    formState.name.trim() !== "" &&
    formState.apiHost.trim() !== "" &&
    formState.apiKey.trim() !== ""
  );
}

// ============================================================================
// 组件实现
// ============================================================================

/**
 * 添加自定义 Provider 模态框组件
 *
 * 允许用户添加自定义 OpenAI 兼容 Provider，包含：
 * - Provider 名称（必填）
 * - API Key（必填）
 * - API Host（必填）
 * - Provider Type（默认 openai）
 * - 根据类型显示额外字段
 *
 * @example
 * ```tsx
 * <AddCustomProviderModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onAdd={handleAddProvider}
 * />
 * ```
 */
export const AddCustomProviderModal: React.FC<AddCustomProviderModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  className,
}) => {
  // 表单状态
  const [formState, setFormState] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 获取当前类型需要的额外字段
  const extraFields = useMemo(
    () => PROVIDER_TYPE_EXTRA_FIELDS[formState.type] || [],
    [formState.type],
  );

  // 重置表单
  const resetForm = useCallback(() => {
    setFormState(INITIAL_FORM_STATE);
    setErrors({});
    setSubmitError(null);
  }, []);

  // 关闭模态框
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // 更新字段
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      // 清除该字段的错误
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field as keyof FormErrors];
          return newErrors;
        });
      }
    },
    [errors],
  );

  // 提交表单
  const handleSubmit = useCallback(async () => {
    // 验证表单
    const validationErrors = validateCustomProviderForm(formState);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const request: AddCustomProviderRequest = {
        name: formState.name.trim(),
        type: formState.type,
        api_host: formState.apiHost.trim(),
      };

      // 添加额外字段
      if (formState.apiVersion.trim()) {
        request.api_version = formState.apiVersion.trim();
      }
      if (formState.project.trim()) {
        request.project = formState.project.trim();
      }
      if (formState.location.trim()) {
        request.location = formState.location.trim();
      }
      if (formState.region.trim()) {
        request.region = formState.region.trim();
      }

      await onAdd(request);
      handleClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setIsSubmitting(false);
    }
  }, [formState, onAdd, handleClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="max-w-md"
      className={className}
    >
      <ModalHeader>添加自定义 Provider</ModalHeader>

      <ModalBody className="space-y-4">
        {/* Provider 名称 */}
        <div className="space-y-1.5">
          <Label htmlFor="provider-name" className="text-sm font-medium">
            Provider 名称 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="provider-name"
            type="text"
            value={formState.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="例如：My Custom API"
            disabled={isSubmitting}
            className={cn(errors.name && "border-red-500")}
            data-testid="provider-name-input"
          />
          {errors.name && (
            <p className="text-xs text-red-500" data-testid="name-error">
              {errors.name}
            </p>
          )}
        </div>

        {/* Provider 类型 */}
        <div className="space-y-1.5">
          <Label htmlFor="provider-type" className="text-sm font-medium">
            Provider 类型
          </Label>
          <Select
            value={formState.type}
            onValueChange={(value) =>
              updateField("type", value as ProviderType)
            }
            disabled={isSubmitting}
          >
            <SelectTrigger data-testid="provider-type-select">
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            大多数第三方 API 服务使用 OpenAI 兼容格式
          </p>
        </div>

        {/* API Host */}
        <div className="space-y-1.5">
          <Label htmlFor="api-host" className="text-sm font-medium">
            API Host <span className="text-red-500">*</span>
          </Label>
          <Input
            id="api-host"
            type="text"
            value={formState.apiHost}
            onChange={(e) => updateField("apiHost", e.target.value)}
            placeholder="https://api.example.com"
            disabled={isSubmitting}
            className={cn(errors.apiHost && "border-red-500")}
            data-testid="api-host-input"
          />
          {errors.apiHost && (
            <p className="text-xs text-red-500" data-testid="api-host-error">
              {errors.apiHost}
            </p>
          )}
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label htmlFor="api-key" className="text-sm font-medium">
            API Key <span className="text-red-500">*</span>
          </Label>
          <Input
            id="api-key"
            type="password"
            value={formState.apiKey}
            onChange={(e) => updateField("apiKey", e.target.value)}
            placeholder="sk-..."
            disabled={isSubmitting}
            className={cn(errors.apiKey && "border-red-500")}
            data-testid="api-key-input"
          />
          {errors.apiKey && (
            <p className="text-xs text-red-500" data-testid="api-key-error">
              {errors.apiKey}
            </p>
          )}
        </div>

        {/* Azure OpenAI: API Version */}
        {extraFields.includes("apiVersion") && (
          <div className="space-y-1.5">
            <Label htmlFor="api-version" className="text-sm font-medium">
              API Version
            </Label>
            <Input
              id="api-version"
              type="text"
              value={formState.apiVersion}
              onChange={(e) => updateField("apiVersion", e.target.value)}
              placeholder="2024-02-15-preview"
              disabled={isSubmitting}
              className={cn(errors.apiVersion && "border-red-500")}
              data-testid="api-version-input"
            />
            {errors.apiVersion && (
              <p
                className="text-xs text-red-500"
                data-testid="api-version-error"
              >
                {errors.apiVersion}
              </p>
            )}
          </div>
        )}

        {/* VertexAI: Project */}
        {extraFields.includes("project") && (
          <div className="space-y-1.5">
            <Label htmlFor="project" className="text-sm font-medium">
              Project ID
            </Label>
            <Input
              id="project"
              type="text"
              value={formState.project}
              onChange={(e) => updateField("project", e.target.value)}
              placeholder="your-project-id"
              disabled={isSubmitting}
              data-testid="project-input"
            />
          </div>
        )}

        {/* VertexAI: Location */}
        {extraFields.includes("location") && (
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-medium">
              Location
            </Label>
            <Input
              id="location"
              type="text"
              value={formState.location}
              onChange={(e) => updateField("location", e.target.value)}
              placeholder="us-central1"
              disabled={isSubmitting}
              data-testid="location-input"
            />
          </div>
        )}

        {/* AWS Bedrock: Region */}
        {extraFields.includes("region") && (
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-sm font-medium">
              Region
            </Label>
            <Input
              id="region"
              type="text"
              value={formState.region}
              onChange={(e) => updateField("region", e.target.value)}
              placeholder="us-east-1"
              disabled={isSubmitting}
              data-testid="region-input"
            />
          </div>
        )}

        {/* 提交错误 */}
        {submitError && (
          <div
            className="p-3 rounded-lg bg-red-50 text-red-600 text-sm"
            data-testid="submit-error"
          >
            {submitError}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
          data-testid="cancel-button"
        >
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasRequiredFields(formState)}
          data-testid="submit-button"
        >
          {isSubmitting ? "添加中..." : "添加"}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddCustomProviderModal;
