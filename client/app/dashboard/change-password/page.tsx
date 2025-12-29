"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function ChangePasswordPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // Redirect back to profile after successful password change
    setTimeout(() => {
      router.push('/dashboard/profile');
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors pixel-font text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        BACK TO PROFILE
      </button>

      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-primary/20 pb-4">
        <div className="p-2 bg-primary/10 rounded pixel-corners">
          <svg 
            className="w-6 h-6 text-secondary" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl pixel-font text-white glow-text">SECURITY SETTINGS</h1>
          <p className="text-gray-500 font-mono text-xs">UPDATE YOUR ACCESS CREDENTIALS</p>
        </div>
      </div>

      {/* Security Notice Banner */}
      <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 pixel-corners">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-yellow-400 mt-0.5">⚠️</div>
            <div className="space-y-1">
              <p className="text-sm pixel-font text-yellow-400">SECURITY NOTICE</p>
              <p className="text-xs text-gray-300 font-mono">
                Choose a strong password with at least 6 characters. You'll need to log in again on other devices after changing your password.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Form */}
      <ChangePasswordForm onSuccess={handleSuccess} />
    </div>
  );
}
