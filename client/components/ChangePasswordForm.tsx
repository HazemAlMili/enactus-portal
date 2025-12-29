"use client";

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const showMessage = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setShowNotification(true);
  };

  const closeNotification = () => {
    setShowNotification(false);
    if (notification?.type === 'success' && onSuccess) {
      setTimeout(onSuccess, 300);
    }
  };

  // Native HTML5 validation + lightweight client checks (0ms TBT impact)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Simple validation (runs in <1ms, negligible TBT)
    if (newPassword.length < 6) {
      showMessage('error', 'New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      showMessage('error', 'New password must be different from current password');
      return;
    }

    // Use transition for non-blocking update
    startTransition(async () => {
      try {
        // Call API directly using the existing api instance (uses fixed auth/CORS)
        const response = await api.post('/auth/change-password', {
          currentPassword,
          newPassword,
        });

        showMessage('success', response.data.message || 'Password changed successfully!');
        
        // Reset form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error('Password change error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
        showMessage('error', errorMessage);
      }
    });
  };

  return (
    <>
      <Card className="bg-card border-2 border-primary/20 pixel-corners shadow-lg">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded pixel-corners">
              <Lock className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="pixel-font text-white">CHANGE PASSWORD</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-xs pixel-font text-gray-400 uppercase">
                Current Password
              </label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-black/40 border border-primary/20 pixel-corners text-white placeholder-gray-500 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-xs pixel-font text-gray-400 uppercase">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-black/40 border border-primary/20 pixel-corners text-white placeholder-gray-500 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  placeholder="Enter new password (min. 6 characters)"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-xs pixel-font text-gray-400 uppercase">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-black/40 border border-primary/20 pixel-corners text-white placeholder-gray-500 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed pr-10"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full pixel-corners bg-secondary hover:bg-secondary/80 text-white px-4 py-3 pixel-font text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
            >
              {/* Button content */}
              <span className={isPending ? 'opacity-0' : 'opacity-100'}>
                UPDATE PASSWORD
              </span>
              
              {/* Loading state */}
              {isPending && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="pixel-font text-xs">PROCESSING...</span>
                  </div>
                </div>
              )}
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-4 pt-4 border-t border-primary/10">
            <p className="text-[10px] text-gray-500 font-mono text-center">
              🔒 Your password is encrypted and stored securely
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Notification Popup Overlay */}
      {showNotification && notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border-4 border-primary pixel-corners shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-4 border-b-2 border-primary/20 ${
              notification.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}>
              <h3 className="text-lg pixel-font text-white tracking-wider">
                {notification.type === 'success' ? 'SUCCESS' : 'ERROR'}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${
                  notification.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  {notification.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`text-base pixel-font ${
                    notification.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {notification.text}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t-2 border-primary/20 flex justify-end">
              <button
                onClick={closeNotification}
                className="pixel-corners bg-secondary hover:bg-secondary/80 text-white px-6 py-2 pixel-font text-sm transition-all hover:scale-105 active:scale-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
