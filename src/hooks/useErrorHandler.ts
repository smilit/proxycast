import { useState, useCallback } from "react";

interface AppError {
  message: string;
  context?: string;
  timestamp: Date;
}

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((e: unknown, context?: string) => {
    console.error(`[${context || "Error"}]`, e);
    setError({
      message: e instanceof Error ? e.message : String(e),
      context,
      timestamp: new Date(),
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { error, handleError, clearError };
}
