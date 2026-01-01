/**
 * @file DirectorySettings.tsx
 * @description 配置目录设置 - 自定义各应用配置文件目录
 */
import { useState } from "react";
import { Folder, RotateCcw } from "lucide-react";

interface DirectoryConfig {
  claudeConfigDir: string;
  codexConfigDir: string;
  geminiConfigDir: string;
}

const defaultDirs: DirectoryConfig = {
  claudeConfigDir: "~/.claude",
  codexConfigDir: "~/.codex",
  geminiConfigDir: "~/.gemini",
};

export function DirectorySettings() {
  const [dirs, setDirs] = useState<DirectoryConfig>(defaultDirs);
  const [saving, setSaving] = useState(false);

  const handleReset = (key: keyof DirectoryConfig) => {
    setDirs((prev) => ({ ...prev, [key]: defaultDirs[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
  };

  const directoryItems = [
    { key: "claudeConfigDir" as const, label: "Claude" },
    { key: "codexConfigDir" as const, label: "Codex" },
    { key: "geminiConfigDir" as const, label: "Gemini" },
  ];

  return (
    <div className="space-y-3 max-w-2xl">
      {/* 配置目录 */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">配置目录</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "..." : "保存"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          自定义各应用配置文件目录，修改后需重启生效
        </p>

        <div className="space-y-2">
          {directoryItems.map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-14 shrink-0">
                {item.label}
              </span>
              <div className="relative flex-1">
                <Folder className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={dirs[item.key]}
                  onChange={(e) =>
                    setDirs((prev) => ({ ...prev, [item.key]: e.target.value }))
                  }
                  className="w-full pl-8 pr-8 py-1.5 rounded border bg-background text-sm font-mono focus:ring-1 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder={defaultDirs[item.key]}
                />
                <button
                  onClick={() => handleReset(item.key)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
                  title="重置"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 数据管理 */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">数据管理</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border text-xs hover:bg-muted">
              导出配置
            </button>
            <button className="px-3 py-1 rounded border text-xs hover:bg-muted">
              导入配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
