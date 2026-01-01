import { useEffect, useRef, useCallback } from "react";

interface MonitorConfig {
  checkFn: () => Promise<void>;
  interval?: number;
  enabled?: boolean;
}

export function useFileMonitoring(configs: Record<string, MonitorConfig>) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAll = useCallback(async () => {
    for (const [key, config] of Object.entries(configs)) {
      if (config.enabled !== false) {
        try {
          await config.checkFn();
        } catch (e) {
          console.error(`[FileMonitoring:${key}]`, e);
        }
      }
    }
  }, [configs]);

  useEffect(() => {
    // 获取最小间隔
    const intervals = Object.values(configs).map((c) => c.interval || 10000);
    const minInterval = Math.min(...intervals);

    intervalRef.current = setInterval(checkAll, minInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAll, configs]);

  return { checkAll };
}
