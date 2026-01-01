import { useState, useRef, useCallback } from "react";

export interface EnvVariable {
  key: string;
  value: string;
  masked: string;
}

export interface CheckResult {
  changed: boolean;
  new_hash: string;
  reloaded: boolean;
}

interface ProviderStateConfig<T> {
  getCredentials: () => Promise<T>;
  getEnvVars: () => Promise<EnvVariable[]>;
  getHash: () => Promise<string>;
  checkAndReload: (hash: string) => Promise<CheckResult>;
  reloadCredentials: () => Promise<unknown>;
  refreshToken?: () => Promise<unknown>;
}

export function useProviderState<T>(
  providerId: string,
  config: ProviderStateConfig<T>,
) {
  const [status, setStatus] = useState<T | null>(null);
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hashRef = useRef<string>("");

  const load = useCallback(async () => {
    try {
      const [creds, vars, hash] = await Promise.all([
        config.getCredentials(),
        config.getEnvVars(),
        config.getHash(),
      ]);
      setStatus(creds);
      setEnvVars(vars);
      hashRef.current = hash;
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [config]);

  const reload = useCallback(async () => {
    setLoading("reload");
    try {
      await config.reloadCredentials();
      await load();
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(null);
  }, [config, load]);

  const refresh = useCallback(async () => {
    if (!config.refreshToken) return;
    setLoading("refresh");
    try {
      await config.refreshToken();
      await load();
      setLastSync(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setLoading(null);
  }, [config, load]);

  const checkForChanges = useCallback(async () => {
    try {
      const result = await config.checkAndReload(hashRef.current);
      if (result.changed) {
        hashRef.current = result.new_hash;
        await load();
        setLastSync(new Date());
      }
    } catch (e) {
      console.error(`[${providerId}] Check failed:`, e);
    }
  }, [config, load, providerId]);

  return {
    status,
    envVars,
    lastSync,
    loading,
    error,
    load,
    reload,
    refresh,
    checkForChanges,
    clearError: () => setError(null),
  };
}
