import { useState } from "react";
import { Monitor, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientsPage } from "../clients/ClientsPage";
import { ConfigPage } from "./ConfigPage";

type Tab = "switch" | "config";

const tabs = [
  {
    id: "switch" as Tab,
    label: "配置切换",
    icon: Monitor,
    experimental: false,
  },
  {
    id: "config" as Tab,
    label: "配置文件",
    icon: FileCode,
    experimental: true,
  },
];

export function ConfigManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("switch");

  // 根据当前 tab 显示不同的描述
  const getDescription = () => {
    if (activeTab === "switch") {
      return (
        <>
          一键切换 API 配置，可独立使用。添加 "ProxyCast" 可将凭证池转为标准
          API（
          <code className="px-1 py-0.5 rounded bg-muted text-xs">
            localhost:8999
          </code>
          ）
        </>
      );
    }
    return (
      <>
        编辑 YAML 配置文件。实验功能，不影响核心使用，
        <a
          href="https://github.com/aiclientproxy/proxycast/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          问题反馈
        </a>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">配置管理</h2>
        <p className="text-muted-foreground text-sm">{getDescription()}</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.experimental && (
              <span className="text-[8px] text-red-500">(实验)</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      <div className="pt-2">
        {activeTab === "switch" && <ClientsPage hideHeader />}
        {activeTab === "config" && <ConfigPage hideHeader />}
      </div>
    </div>
  );
}
