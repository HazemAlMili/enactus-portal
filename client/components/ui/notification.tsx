"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Button } from './button';

// Notification Types
type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType, duration?: number) => void;
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ message: string; type: NotificationType } | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = { id, type, message, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }
  };

  const showConfirm = (options: ConfirmOptions) => {
    setConfirmDialog(options);
  };

  const showAlert = (message: string, type: NotificationType = 'info') => {
    setAlertDialog({ message, type });
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  };

  const handleCancel = () => {
    if (confirmDialog) {
      confirmDialog.onCancel?.();
      setConfirmDialog(null);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'border-green-500 bg-green-500/10';
      case 'error':
        return 'border-red-500 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'info':
        return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm, showAlert }}>
      {children}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto pixel-corners border-2 ${getColor(notification.type)} backdrop-blur-sm p-4 min-w-[300px] max-w-md animate-in slide-in-from-right-full duration-300`}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1">
                <p className="text-white font-mono text-sm leading-relaxed">{notification.message}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border-4 border-primary pixel-corners p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-primary/30">
              <AlertTriangle className="w-6 h-6 text-yellow-400 animate-pulse" />
              <h3 className="pixel-font text-lg text-secondary">{confirmDialog.title}</h3>
            </div>

            {/* Message */}
            <p className="text-white/80 font-mono text-sm mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>

            {/* CRT Scanline Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-scanline pointer-events-none" />

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 pixel-corners border-2 hover:bg-white/10"
                onClick={handleCancel}
              >
                <span className="pixel-font">
                  {confirmDialog.cancelText || 'ABORT'}
                </span>
              </Button>
              <Button
                variant="destructive"
                className="flex-1 pixel-corners border-2 border-red-500 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300"
                onClick={handleConfirm}
              >
                <span className="pixel-font">
                  {confirmDialog.confirmText || 'CONFIRM'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog */}
      {alertDialog && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-card border-4 ${getColor(alertDialog.type).replace('bg-', 'border-').split(' ')[0]} pixel-corners p-6 max-w-md w-full animate-in zoom-in-95 duration-200`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {getIcon(alertDialog.type)}
              <h3 className="pixel-font text-lg text-white">
                {alertDialog.type === 'success' && 'SUCCESS'}
                {alertDialog.type === 'error' && 'ERROR'}
                {alertDialog.type === 'warning' && 'WARNING'}
                {alertDialog.type === 'info' && 'NOTICE'}
              </h3>
            </div>

            {/* Message */}
            <p className="text-white/80 font-mono text-sm mb-6 leading-relaxed">
              {alertDialog.message}
            </p>

            {/* CRT Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-full w-full animate-scanline pointer-events-none" />

            {/* Close Button */}
            <Button
              className="w-full pixel-corners border-2 border-primary bg-primary/20 hover:bg-primary/40"
              onClick={() => setAlertDialog(null)}
            >
              <span className="pixel-font text-primary">OK</span>
            </Button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
