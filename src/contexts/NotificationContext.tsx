"use client";

import { NotificationContextType } from "@/types/NotificationContext/notification";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface CursorToast {
  id: number;
  message: string;
  x: number;
  y: number;
}

let toastIdCounter = 0;

function CursorSnackbar({ message, x, y, onDone }: { message: string; x: number; y: number; onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onDone, 300);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  // Keep the snackbar within viewport bounds
  const style: React.CSSProperties = {
    position: "fixed",
    left: Math.min(x, window.innerWidth - 220),
    top: Math.max(y - 50, 10),
    zIndex: 9999,
    pointerEvents: "none",
    transform: visible && !exiting ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)",
    opacity: visible && !exiting ? 1 : 0,
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  return (
    <div style={style}>
      <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-lg shadow-xl text-sm font-medium whitespace-nowrap">
        <svg className="w-4.5 h-4.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {message}
      </div>
    </div>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cursorToasts, setCursorToasts] = useState<CursorToast[]>([]);

  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: "#10b981",
        color: "#fff",
        padding: "14px 20px",
        fontSize: "15px",
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 5000,
      style: {
        background: "#ef4444",
        color: "#fff",
        padding: "14px 20px",
        fontSize: "15px",
      },
    });
  };

  const showInfo = (message: string) => {
    toast(message, {
      duration: 4000,
      style: {
        background: "#3b82f6",
        color: "#fff",
        padding: "14px 20px",
        fontSize: "15px",
      },
    });
  };

  const showWarning = (message: string) => {
    toast(message, {
      duration: 4000,
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
        padding: "14px 20px",
        fontSize: "15px",
      },
    });
  };

  const showSuccessAt = useCallback((message: string, x: number, y: number) => {
    const id = ++toastIdCounter;
    setCursorToasts((prev) => [...prev, { id, message, x, y }]);
  }, []);

  const removeCursorToast = useCallback((id: number) => {
    setCursorToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showInfo, showWarning, showSuccessAt }}
    >
      {children}
      <Toaster
        position="top-right"
        containerStyle={{
          top: 80, // Below the navbar
        }}
        toastOptions={{
          style: {
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "500",
            padding: "14px 20px",
          },
        }}
      />
      {cursorToasts.map((ct) => (
        <CursorSnackbar
          key={ct.id}
          message={ct.message}
          x={ct.x}
          y={ct.y}
          onDone={() => removeCursorToast(ct.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}
