"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

export interface Notification {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  createdAt: number;
}

interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (message: string, type?: Notification["type"]) => void;
  dismissNotification: (id: string) => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const AUTO_DISMISS_MS = 30 * 60 * 1000;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const addNotification = useCallback(
    (message: string, type: Notification["type"] = "info") => {
      const id = crypto.randomUUID();
      const notification: Notification = {
        id,
        message,
        type,
        createdAt: Date.now(),
      };

      setNotifications((prev) => [notification, ...prev]);

      const timer = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        timersRef.current.delete(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);
    },
    [],
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const unreadCount = notifications.length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        dismissNotification,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
