"use client";

import { NotificationContextType } from "@/types/NotificationContext/notification";
import { createContext, useContext } from "react";
import toast, { Toaster } from "react-hot-toast";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 4000,
      style: {
        background: "#10b981",
        color: "#fff",
      },
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 5000,
      style: {
        background: "#ef4444",
        color: "#fff",
      },
    });
  };

  const showInfo = (message: string) => {
    toast(message, {
      duration: 4000,
      style: {
        background: "#3b82f6",
        color: "#fff",
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
      },
    });
  };

  return (
    <NotificationContext.Provider
      value={{ showSuccess, showError, showInfo, showWarning }}
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
            fontSize: "14px",
            fontWeight: "500",
          },
        }}
      />
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
