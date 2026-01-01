/**
 * 工具调用显示组件
 *
 * 参考 Goose UI 设计，显示工具执行状态、参数、日志和结果
 * Requirements: 9.1, 9.2 - 工具执行指示器和结果折叠面板
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Terminal,
  FileText,
  Edit3,
  FolderOpen,
  ChevronRight,
  Loader2,
  Eye,
  FilePlus,
  Search,
  Globe,
  Code2,
  Settings,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCallState } from "@/lib/api/agent";
import { MarkdownRenderer } from "./MarkdownRenderer";

// ============ 类型定义 ============

export type ToolCallStatus = "pending" | "running" | "completed" | "failed";

type ToolCallArgumentValue =
  | string
  | number
  | boolean
  | null
  | ToolCallArgumentValue[]
  | { [key: string]: ToolCallArgumentValue };

// ============ 工具状态指示器 ============

interface ToolCallStatusIndicatorProps {
  status: ToolCallStatus;
  className?: string;
}

const ToolCallStatusIndicator: React.FC<ToolCallStatusIndicatorProps> = ({
  status,
  className,
}) => {
  const getStatusStyles = () => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "running":
        return "bg-yellow-500 animate-pulse";
      case "pending":
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      className={cn(
        "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background",
        getStatusStyles(),
        className,
      )}
      aria-label={`工具状态: ${status}`}
    />
  );
};

// ============ 工具图标映射 ============

const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();
  if (
    name.includes("bash") ||
    name.includes("shell") ||
    name.includes("exec")
  ) {
    return Terminal;
  }
  if (name.includes("read")) {
    return Eye;
  }
  if (name.includes("write") || name.includes("create")) {
    return FilePlus;
  }
  if (name.includes("edit") || name.includes("replace")) {
    return Edit3;
  }
  if (name.includes("list") || name.includes("dir")) {
    return FolderOpen;
  }
  if (
    name.includes("search") ||
    name.includes("find") ||
    name.includes("grep")
  ) {
    return Search;
  }
  if (name.includes("web") || name.includes("fetch") || name.includes("http")) {
    return Globe;
  }
  if (name.includes("code") || name.includes("eval")) {
    return Code2;
  }
  if (name.includes("config") || name.includes("setting")) {
    return Settings;
  }
  if (name.includes("file")) {
    return FileText;
  }
  return Wrench;
};

// ============ 工具描述生成 ============

const getToolDescription = (
  toolName: string,
  args: Record<string, ToolCallArgumentValue>,
): string => {
  const name = toolName.toLowerCase();
  const getStringValue = (value: ToolCallArgumentValue): string => {
    return typeof value === "string" ? value : JSON.stringify(value);
  };

  // 根据工具类型生成描述
  if (name.includes("bash") || name.includes("shell")) {
    if (args.command) {
      const cmd = getStringValue(args.command);
      return `执行: ${cmd.length > 50 ? cmd.slice(0, 50) + "..." : cmd}`;
    }
    return "执行命令";
  }

  if (name.includes("read_file") || name === "read") {
    if (args.path || args.file_path) {
      return `读取 ${getStringValue(args.path || args.file_path)}`;
    }
    return "读取文件";
  }

  if (name.includes("write_file") || name === "write") {
    if (args.path || args.file_path) {
      return `写入 ${getStringValue(args.path || args.file_path)}`;
    }
    return "写入文件";
  }

  if (name.includes("edit_file") || name === "edit") {
    if (args.path || args.file_path) {
      return `编辑 ${getStringValue(args.path || args.file_path)}`;
    }
    return "编辑文件";
  }

  if (name.includes("list") || name.includes("dir")) {
    if (args.path || args.directory) {
      return `列出 ${getStringValue(args.path || args.directory)}`;
    }
    return "列出目录";
  }

  if (name.includes("search") || name.includes("grep")) {
    if (args.pattern || args.query) {
      return `搜索 "${getStringValue(args.pattern || args.query)}"`;
    }
    return "搜索";
  }

  // 通用回退：工具名 + 参数键
  const entries = Object.entries(args);
  if (entries.length === 0) {
    return snakeToTitleCase(toolName);
  }
  if (entries.length === 1) {
    const [_key, value] = entries[0];
    const strValue = getStringValue(value);
    const truncated =
      strValue.length > 40 ? strValue.slice(0, 40) + "..." : strValue;
    return `${snakeToTitleCase(toolName)}: ${truncated}`;
  }
  return snakeToTitleCase(toolName);
};

const snakeToTitleCase = (str: string): string => {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// ============ 可展开面板组件 ============

interface ExpandablePanelProps {
  label: React.ReactNode;
  isStartExpanded?: boolean;
  isForceExpand?: boolean;
  children: React.ReactNode;
  className?: string;
}

const ExpandablePanel: React.FC<ExpandablePanelProps> = ({
  label,
  isStartExpanded = false,
  isForceExpand,
  children,
  className = "",
}) => {
  const [isExpandedState, setIsExpanded] = useState<boolean | null>(null);
  const isExpanded =
    isExpandedState === null ? isStartExpanded : isExpandedState;
  const toggleExpand = () => setIsExpanded(!isExpanded);

  useEffect(() => {
    if (isForceExpand) setIsExpanded(true);
  }, [isForceExpand]);

  return (
    <div className={className}>
      <button
        onClick={toggleExpand}
        className="group w-full flex justify-between items-center pr-2 py-2 px-3 transition-colors rounded-none hover:bg-muted/50"
      >
        <span className="flex items-center text-sm truncate flex-1 min-w-0">
          {label}
        </span>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted-foreground group-hover:opacity-100 transition-transform opacity-70",
            isExpanded && "rotate-90",
          )}
        />
      </button>
      {isExpanded && <div>{children}</div>}
    </div>
  );
};

// ============ 工具参数显示 ============

interface ToolCallArgumentsProps {
  args: Record<string, ToolCallArgumentValue>;
}

const ToolCallArguments: React.FC<ToolCallArgumentsProps> = ({ args }) => {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (key: string, value: ToolCallArgumentValue) => {
    if (typeof value === "string") {
      const needsExpansion = value.length > 60;
      const isExpanded = expandedKeys[key];

      if (!needsExpansion) {
        return (
          <div className="text-sm mb-2">
            <div className="flex flex-row">
              <span className="text-muted-foreground min-w-[120px] shrink-0">
                {key}
              </span>
              <span className="text-foreground/70 break-all">{value}</span>
            </div>
          </div>
        );
      }

      return (
        <div className={cn("text-sm mb-2", !isExpanded && "truncate min-w-0")}>
          <div
            className={cn(
              "flex flex-row items-start",
              !isExpanded && "truncate min-w-0",
            )}
          >
            <button
              onClick={() => toggleKey(key)}
              className="flex text-left text-muted-foreground min-w-[120px] shrink-0 hover:text-foreground"
            >
              {key}
            </button>
            <div className={cn("flex-1 min-w-0", !isExpanded && "truncate")}>
              {isExpanded ? (
                <MarkdownRenderer content={`\`\`\`\n${value}\n\`\`\``} />
              ) : (
                <button
                  onClick={() => toggleKey(key)}
                  className="text-left text-foreground/70 truncate w-full hover:text-foreground"
                >
                  {value}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 处理非字符串值
    const content = Array.isArray(value)
      ? value
          .map((item, index) => `${index + 1}. ${JSON.stringify(item)}`)
          .join("\n")
      : typeof value === "object" && value !== null
        ? JSON.stringify(value, null, 2)
        : String(value);

    return (
      <div className="mb-2">
        <div className="flex flex-row text-sm">
          <span className="text-muted-foreground min-w-[120px] shrink-0">
            {key}
          </span>
          <pre className="whitespace-pre-wrap text-foreground/70 overflow-x-auto max-w-full font-mono text-xs">
            {content}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="py-2 px-4">
      {Object.entries(args).map(([key, value]) => (
        <div key={key}>{renderValue(key, value)}</div>
      ))}
    </div>
  );
};

// ============ 工具日志显示 ============

interface ToolLogsViewProps {
  logs: string[];
  working: boolean;
  isStartExpanded?: boolean;
}

const ToolLogsView: React.FC<ToolLogsViewProps> = ({
  logs,
  working,
  isStartExpanded = false,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <ExpandablePanel
      label={
        <span className="pl-2 py-1 text-sm flex items-center gap-2">
          <span>日志</span>
          {working && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
        </span>
      }
      isStartExpanded={isStartExpanded}
    >
      <div
        ref={boxRef}
        className={cn(
          "flex flex-col items-start space-y-1 overflow-y-auto p-3 font-mono text-xs",
          working ? "max-h-16" : "max-h-80",
        )}
      >
        {logs.map((log, i) => (
          <span key={i} className="text-muted-foreground">
            {log}
          </span>
        ))}
      </div>
    </ExpandablePanel>
  );
};

// ============ 工具结果显示 ============

interface ToolResultViewProps {
  result: string;
  isError?: boolean;
  isStartExpanded?: boolean;
}

const ToolResultView: React.FC<ToolResultViewProps> = ({
  result,
  isError = false,
  isStartExpanded = false,
}) => {
  return (
    <ExpandablePanel
      label={
        <span
          className={cn("pl-2 py-1 text-sm", isError && "text-destructive")}
        >
          {isError ? "错误" : "输出"}
        </span>
      }
      isStartExpanded={isStartExpanded}
    >
      <div className="p-3 max-h-80 overflow-y-auto">
        <pre
          className={cn(
            "whitespace-pre-wrap font-mono text-xs break-all",
            isError ? "text-destructive" : "text-foreground/80",
          )}
        >
          {result || "(无输出)"}
        </pre>
      </div>
    </ExpandablePanel>
  );
};

// ============ 主组件 ============

interface ToolCallDisplayProps {
  toolCall: ToolCallState;
  defaultExpanded?: boolean;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
  toolCall,
  defaultExpanded = false,
}) => {
  const IconComponent = getToolIcon(toolCall.name);

  // 解析参数
  const parsedArgs = useMemo(() => {
    if (!toolCall.arguments) return {};
    try {
      return JSON.parse(toolCall.arguments);
    } catch {
      return {};
    }
  }, [toolCall.arguments]);

  // 生成工具描述
  const toolDescription = useMemo(
    () => getToolDescription(toolCall.name, parsedArgs),
    [toolCall.name, parsedArgs],
  );

  // 计算执行时间
  const executionTime = useMemo(() => {
    if (toolCall.endTime && toolCall.startTime) {
      const ms = toolCall.endTime.getTime() - toolCall.startTime.getTime();
      return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    }
    return null;
  }, [toolCall.startTime, toolCall.endTime]);

  const hasArguments = Object.keys(parsedArgs).length > 0;
  const hasResult = toolCall.status !== "running" && toolCall.result;
  const hasLogs = toolCall.logs && toolCall.logs.length > 0;
  const isRunning = toolCall.status === "running";

  // 工具标签
  const toolLabel = (
    <span className="flex items-center gap-2 min-w-0">
      <div className="relative inline-block">
        <IconComponent className="w-4 h-4 shrink-0" />
        <ToolCallStatusIndicator status={toolCall.status} />
      </div>
      <span className="truncate flex-1 min-w-0">{toolDescription}</span>
      {executionTime && (
        <span className="text-xs text-muted-foreground shrink-0">
          {executionTime}
        </span>
      )}
    </span>
  );

  return (
    <div className="w-full text-sm rounded-lg overflow-hidden border border-border bg-muted/30">
      <ExpandablePanel
        label={toolLabel}
        isStartExpanded={defaultExpanded || isRunning}
        isForceExpand={isRunning}
      >
        {/* 工具参数 */}
        {hasArguments && (
          <div className="border-t border-border">
            <ExpandablePanel
              label={
                <span className="pl-2 text-sm text-muted-foreground">参数</span>
              }
              isStartExpanded={false}
            >
              <ToolCallArguments args={parsedArgs} />
            </ExpandablePanel>
          </div>
        )}

        {/* 执行日志 */}
        {hasLogs && (
          <div className="border-t border-border">
            <ToolLogsView
              logs={toolCall.logs!}
              working={isRunning}
              isStartExpanded={isRunning}
            />
          </div>
        )}

        {/* 执行结果 */}
        {hasResult && (
          <div className="border-t border-border">
            <ToolResultView
              result={toolCall.result?.error || toolCall.result?.output || ""}
              isError={!!toolCall.result?.error}
              isStartExpanded={!!toolCall.result?.error}
            />
          </div>
        )}
      </ExpandablePanel>
    </div>
  );
};

// ============ 工具调用列表 ============

interface ToolCallListProps {
  toolCalls: ToolCallState[];
}

export const ToolCallList: React.FC<ToolCallListProps> = ({ toolCalls }) => {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {toolCalls.map((tc) => (
        <ToolCallDisplay key={tc.id} toolCall={tc} />
      ))}
    </div>
  );
};

// 导出别名，用于交错显示模式
export const ToolCallItem = ToolCallDisplay;

export default ToolCallDisplay;
