'use client';
// client/app/reset-password/page.tsx
// Handles Supabase password reset links sent to migrated users.

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setStatus('loading');
    const supabase = createClient();

    // Supabase automatically reads the recovery token from the URL hash
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStatus('error');
    } else {
      setStatus('success');
      setTimeout(() => router.push('/dashboard'), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border-2 border-primary pixel-corners p-8 shadow-2xl"
      >
        <h1 className="text-2xl pixel-font bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
          SET NEW PASSWORD
        </h1>
        <p className="text-sm text-muted-foreground font-mono mb-6">
          Your account was migrated. Set a new password to continue.
        </p>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="pixel-font text-xs text-primary block mb-1">NEW PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Min. 8 characters"
              className="w-full bg-background border-2 border-primary/50 focus:border-primary text-foreground rounded px-3 py-2 outline-none"
            />
          </div>
          <div>
            <label className="pixel-font text-xs text-primary block mb-1">CONFIRM PASSWORD</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              placeholder="Repeat password"
              className="w-full bg-background border-2 border-primary/50 focus:border-primary text-foreground rounded px-3 py-2 outline-none"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs pixel-font">{error}</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-12 bg-gradient-to-r from-secondary to-accent text-secondary-foreground font-bold pixel-font text-sm tracking-widest pixel-corners disabled:opacity-50"
          >
            {status === 'loading' ? 'SAVING...' : 'SET PASSWORD'}
          </button>

          {status === 'success' && (
            <p className="text-green-400 text-sm pixel-font text-center">
              ✅ Password updated! Redirecting...
            </p>
          )}
        </form>
      </motion.div>
    </div>
  );
}
