/**
 * @file QuotaSettings.tsx
 * @description 配额超限策略设置
 */
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import {
  getConfig,
  saveConfig,
  Config,
  QuotaExceededConfig,
} from "@/hooks/useTauri";
import { cn } from "@/lib/utils";

export function QuotaSettings() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const c = await getConfig();
      setConfig(c);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      await saveConfig(config);
      setMessage({ type: "success", text: "已保存" });
      setTimeout(() => setMessage(null), 2000);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setMessage({ type: "error", text: `失败: ${errorMessage}` });
    }
    setSaving(false);
  };

  const updateQuota = (updates: Partial<QuotaExceededConfig>) => {
    if (!config) return;
    setConfig({
      ...config,
      quota_exceeded: { ...config.quota_exceeded, ...updates },
    });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-20">
        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const quota = config.quota_exceeded;

  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">配额超限策略</h3>
        <div className="flex items-center gap-2">
          {message && (
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded",
                message.type === "error"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              )}
            >
              {message.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "..." : "保存"}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between py-1.5 cursor-pointer">
          <span className="text-sm">自动切换凭证</span>
          <input
            type="checkbox"
            checked={quota.switch_project}
            onChange={(e) => updateQuota({ switch_project: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300"
          />
        </label>

        <label className="flex items-center justify-between py-1.5 cursor-pointer border-t pt-2">
          <span className="text-sm">尝试预览模型</span>
          <input
            type="checkbox"
            checked={quota.switch_preview_model}
            onChange={(e) =>
              updateQuota({ switch_preview_model: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-300"
          />
        </label>

        <div className="flex items-center justify-between py-1.5 border-t pt-2">
          <span className="text-sm">冷却时间</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0}
              value={quota.cooldown_seconds}
              onChange={(e) =>
                updateQuota({
                  cooldown_seconds: parseInt(e.target.value) || 300,
                })
              }
              className="w-20 px-2 py-1 rounded border bg-background text-sm text-right focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
            />
            <span className="text-xs text-muted-foreground">秒</span>
          </div>
        </div>
      </div>
    </div>
  );
}
