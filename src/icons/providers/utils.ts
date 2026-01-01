/**
 * @file Provider 图标辅助函数
 * @description Provider 图标映射和工具函数
 * @module icons/providers/utils
 *
 * **Feature: provider-ui-refactor**
 * **Validates: Requirements 10.1, 10.2**
 */

import type { SystemProviderId } from "@/lib/types/provider";

// ============================================================================
// 可用图标列表
// ============================================================================

/**
 * 可用的图标名称列表
 * 这些图标在 providers 目录下有对应的 SVG 文件
 */
export const availableIcons = [
  // 现有图标
  "aws",
  "gemini",
  "anthropic",
  "claude",
  "qwen",
  "google",
  "openai",
  "alibaba",
  "copilot",
  "amp",
  "kiro",
  "deepseek",
  "zhipu",
  "kimi",
  "minimax",
  "doubao",
  "azure",
  "antigravity",
  "proxycast",
  // 新增图标
  "perplexity",
  "moonshot",
  "grok",
  "groq",
  "mistral",
  "cohere",
  "baidu",
  "yi",
  "baichuan",
  "hunyuan",
  "stepfun",
  "tencent",
  "infini",
  "xirang",
  "mimo",
  "modelscope",
  "zhinao",
  "vertexai",
  "silicon",
  "openrouter",
  "302ai",
  "github",
  "bedrock",
  "aihubmix",
  "together",
  "ppio",
  "hyperbolic",
  "cerebras",
  "nvidia",
  "fireworks",
  "tokenflux",
  "cephalon",
  "ph8",
  "qiniu",
  "lanyun",
  "sophnet",
  "burncloud",
  "dmxapi",
  "longcat",
  "alayanew",
  "aionly",
  "ocoolai",
  "vercel",
  "poe",
  "newapi",
  "huggingface",
  "lmstudio",
  "ollama",
  "dashscope",
  "jina",
  "gpustack",
  "voyageai",
  "cherryin",
  "ovms",
  "custom",
] as const;

export type AvailableIcon = (typeof availableIcons)[number];

// ============================================================================
// Provider 类型到图标名称的映射
// ============================================================================

/**
 * Provider 类型/ID 到图标名称的映射
 * 支持 OAuth Provider 类型和 API Key Provider ID
 */
export const providerTypeToIcon: Record<string, string> = {
  // ===== OAuth Provider 类型映射 =====
  kiro: "kiro",
  gemini: "gemini",
  qwen: "qwen",
  antigravity: "antigravity",
  openai: "openai",
  claude: "claude",
  anthropic: "anthropic",
  codex: "openai",
  claude_oauth: "claude",
  iflow: "alibaba",
  amp: "amp",
  google: "google",
  alibaba: "alibaba",
  copilot: "copilot",
  aws: "aws",
  proxycast: "proxycast",

  // ===== 主流 AI Provider =====
  deepseek: "deepseek",
  moonshot: "moonshot",
  groq: "groq",
  grok: "grok",
  mistral: "mistral",
  perplexity: "perplexity",
  cohere: "cohere",

  // ===== 国内 AI Provider =====
  zhipu: "zhipu",
  baichuan: "baichuan",
  dashscope: "dashscope",
  stepfun: "stepfun",
  doubao: "doubao",
  minimax: "minimax",
  yi: "yi",
  hunyuan: "hunyuan",
  "tencent-cloud-ti": "tencent",
  "baidu-cloud": "baidu",
  infini: "infini",
  modelscope: "modelscope",
  xirang: "xirang",
  mimo: "mimo",
  zhinao: "zhinao",

  // ===== 云服务 Provider =====
  "azure-openai": "azure",
  vertexai: "vertexai",
  "aws-bedrock": "bedrock",
  github: "github",

  // ===== API 聚合服务 =====
  silicon: "silicon",
  openrouter: "openrouter",
  aihubmix: "aihubmix",
  "302ai": "302ai",
  together: "together",
  fireworks: "fireworks",
  nvidia: "nvidia",
  hyperbolic: "hyperbolic",
  cerebras: "cerebras",
  ppio: "ppio",
  qiniu: "qiniu",
  tokenflux: "tokenflux",
  cephalon: "cephalon",
  lanyun: "lanyun",
  ph8: "ph8",
  sophnet: "sophnet",
  ocoolai: "ocoolai",
  dmxapi: "dmxapi",
  aionly: "aionly",
  burncloud: "burncloud",
  alayanew: "alayanew",
  longcat: "longcat",
  poe: "poe",
  huggingface: "huggingface",
  "vercel-gateway": "vercel",

  // ===== 本地服务 Provider =====
  ollama: "ollama",
  lmstudio: "lmstudio",
  "new-api": "newapi",
  gpustack: "gpustack",
  ovms: "ovms",

  // ===== 专用服务 Provider =====
  jina: "jina",
  voyageai: "voyageai",
  cherryin: "cherryin",

  // ===== 自定义 Provider =====
  custom: "custom",
};

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 获取规范化的图标名称
 * @param providerType Provider 类型或 ID
 * @returns 图标名称
 */
export const getIconName = (providerType: string): string => {
  return providerTypeToIcon[providerType] || providerType;
};

/**
 * 检查是否有对应的图标
 * @param providerType Provider 类型或 ID
 * @returns 是否有对应图标
 */
export const hasProviderIcon = (providerType: string): boolean => {
  const iconName = getIconName(providerType);
  return (availableIcons as readonly string[]).includes(iconName);
};

/**
 * 获取 System Provider 的图标名称
 * @param providerId System Provider ID
 * @returns 图标名称
 */
export const getSystemProviderIcon = (providerId: SystemProviderId): string => {
  return providerTypeToIcon[providerId] || "custom";
};

/**
 * 获取所有 System Provider ID 到图标的映射
 * @returns Provider ID 到图标名称的映射
 */
export const getAllProviderIconMappings = (): Record<string, string> => {
  return { ...providerTypeToIcon };
};
