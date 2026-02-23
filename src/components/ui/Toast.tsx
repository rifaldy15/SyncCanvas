"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  icon?: string;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    icon?: string,
  ) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "info" = "success",
      icon?: string,
    ) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type, icon }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const colors = {
    success: "from-green-500/20 to-green-500/5 border-green-500/30",
    error: "from-red-500/20 to-red-500/5 border-red-500/30",
    info: "from-brand-500/20 to-brand-500/5 border-brand-500/30",
  };

  const icons = {
    success: "✓",
    error: "✕",
    info: "ℹ",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border bg-linear-to-r ${colors[toast.type]} bg-surface-900/90 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/20`}>
      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          toast.type === "success"
            ? "bg-green-500/20 text-green-400"
            : toast.type === "error"
              ? "bg-red-500/20 text-red-400"
              : "bg-brand-500/20 text-brand-400"
        }`}>
        {toast.icon || icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-text-primary">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 rounded-lg p-1 text-text-muted hover:text-text-primary transition-colors">
        <svg
          className="h-3 w-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  );
}
