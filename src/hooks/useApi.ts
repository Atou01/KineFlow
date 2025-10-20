import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import type { ApiResponse } from "@/lib/api/apiHandler";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string, code: string) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (url: string, init?: RequestInit) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init?.headers,
          },
        });

        const result: ApiResponse<T> = await response.json();

        if (result.ok) {
          setData(result.data);
          
          if (options.showSuccessToast && options.successMessage) {
            toast.success(options.successMessage);
          }
          
          options.onSuccess?.(result.data);
          return result.data;
        } else {
          const errorMessage = result.error || "Une erreur est survenue";
          setError(errorMessage);
          
          if (options.showErrorToast !== false) {
            toast.error(errorMessage);
          }
          
          options.onError?.(result.error, result.code);
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        const errorMessage = err.message || "Erreur réseau";
        setError(errorMessage);
        
        if (options.showErrorToast !== false) {
          toast.error(errorMessage);
        }
        
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Helper hooks pour les méthodes HTTP courantes
export function useGet<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const get = useCallback(() => {
    return api.execute(url, { method: "GET" });
  }, [api, url]);

  return { ...api, get };
}

export function usePost<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const post = useCallback((body: any) => {
    return api.execute(url, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }, [api, url]);

  return { ...api, post };
}

export function usePatch<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const patch = useCallback((body: any) => {
    return api.execute(url, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }, [api, url]);

  return { ...api, patch };
}

export function useDelete<T = any>(url: string, options: UseApiOptions = {}) {
  const api = useApi<T>(options);
  
  const del = useCallback(() => {
    return api.execute(url, { method: "DELETE" });
  }, [api, url]);

  return { ...api, delete: del };
}
