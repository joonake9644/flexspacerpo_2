import React, { useState, useCallback, useContext, createContext } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: NotificationType, duration?: number) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration = 5000) => {
    const now = Date.now()

    // 강화된 중복 방지
    if (!window.lastNotifications) window.lastNotifications = {}
    const lastTime = window.lastNotifications[message] || 0

    if (now - lastTime < 1000) { // 1초 내 동일 메시지 차단
      console.log('중복 알림 차단:', message)
      return
    }

    window.lastNotifications[message] = now

    const id = `notification-${now}-${Math.random()}`;
    const notification: Notification = { id, message, type, duration };

    setNotifications(prev => {
      // 모든 이전 알림 제거하고 새 알림만 표시 (단순화)
      if (type === 'success' || type === 'error') {
        return [notification]
      }
      return [...prev.slice(-2), notification] // 최대 3개만 유지
    });

    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
