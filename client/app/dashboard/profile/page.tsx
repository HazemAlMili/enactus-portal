"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Mail, Star, Clock, Trophy, Hash, Lock, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  points: number;
  level: number;
  tasksCompleted: number;
  hoursApproved: number;
  avatar?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setShowNotification(true);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Check sessionStorage first
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        
        console.log('🔍 Profile page - Checking auth...');
        console.log('Token exists:', !!token);
        console.log('User in storage:', !!userStr);
        
        if (!token) {
          console.error('❌ No token found - redirecting to login');
          setError('Not authenticated. Please log in.');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
          setLoading(false);
          return;
        }

        // Fetch fresh user data from /api/auth/me with cache-busting timestamp
        console.log('🔄 Fetching fresh profile data...');
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        console.log('✅ Profile data loaded successfully:', {
          name: res.data.name,
          role: res.data.role,
          department: res.data.department
        });
        setProfile(res.data);
        setError(null);
      } catch (err: any) {
        console.error("❌ Failed to fetch profile:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load profile';
        setError(errorMessage);
        
        // If 401 or 403, redirect to login
        if (err.response?.status === 401 || err.response?.status === 403) {
          console.error('🚨 Auth error - clearing session and redirecting');
          sessionStorage.clear();
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit to 4MB to reflect reasonable Base64 payload for MongoDB (16MB doc limit)
    if (file.size > 4 * 1024 * 1024) { 
        showMessage('error', 'Image too large. Max 4MB.');
        return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        console.log('📤 Uploading avatar, size:', base64.length, 'chars');
        
        const res = await api.put('/users/avatar', { avatar: base64 });
        console.log('✅ Avatar uploaded successfully');
        
        setProfile(res.data);
        
        // Update sessionStorage with new avatar
        const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        storedUser.avatar = res.data.avatar;
        sessionStorage.setItem('user', JSON.stringify(storedUser));
        
        showMessage('success', 'Avatar updated successfully!');
      } catch (err: any) {
        console.error("❌ Upload failed:", err);
        console.error("Error response:", err.response?.data);
        
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
        showMessage('error', `Upload failed: ${errorMsg}`);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      console.error('❌ Failed to read file');
      showMessage('error', 'Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = async () => {
    setShowDeleteConfirm(false); // Close confirmation dialog
    
    setUploading(true);
    try {
      // Send null avatar to delete it
      const res = await api.put('/users/avatar', { avatar: null });
      console.log('✅ Avatar deleted successfully');
      
      setProfile(res.data);
      
      // Update sessionStorage
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      storedUser.avatar = null;
     sessionStorage.setItem('user', JSON.stringify(storedUser));
      
      showMessage('success', 'Avatar deleted successfully!');
    } catch (err: any) {
      console.error("❌ Delete failed:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Delete failed';
      showMessage('error', `Delete failed: ${errorMsg}`);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
      return (
          <div className="flex h-[80vh] items-center justify-center">
              <div className="text-secondary pixel-font animate-pulse">LOADING IDENTITY RECORD...</div>
          </div>
      );
  }

  // Show error state instead of blank screen!
  if (error || !profile) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="bg-card border-2 border-destructive pixel-corners max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive pixel-font">ERROR: ACCESS DENIED</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-white/80 pixel-font text-sm">
              {error || 'Profile data not available'}
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/30 pixel-corners">
              <p className="text-xs font-mono text-white/60">
                Debug Info:
              </p>
              <p className="text-xs font-mono text-white/80">
                • Token: {sessionStorage.getItem('token') ? 'Present' : 'Missing'}
              </p>
              <p className="text-xs font-mono text-white/80">
                • User Storage: {sessionStorage.getItem('user') ? 'Present' : 'Missing'}
              </p>
              <p className="text-xs font-mono text-white/80">
                • Profile Data: {profile ? 'Loaded' : 'Not Loaded'}
              </p>
            </div>
            <p className="text-xs text-white/60 pixel-font">
              Redirecting to login in 2 seconds...
            </p>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full pixel-corners bg-primary hover:bg-primary/80 text-white px-4 py-2 pixel-font text-xs"
            >
              GO TO LOGIN NOW
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine Role Type
  const isBoss = ['Head', 'Vice Head', 'General President', 'Vice President', 'Operation Director', 'Creative Director', 'HR'].includes(profile.role);

  // Calculate Level Progress
  // Members: Fast leveling (100 XP per level). Bosses: Maxed out.
  const xpForNextLevel = 100;
  const rawLevel = Math.floor(profile.points / xpForNextLevel) + 1;
  
  const displayLevel = isBoss ? "99+" : rawLevel;
  const levelTitle = isBoss ? "BOSS LEVEL" : `CLEARANCE LEVEL ${displayLevel}`;
  
  // Progress Bar: Bosses always 100%, Members calculated based on 100XP cycle
  const currentLevelProgress = isBoss ? 100 : (profile.points % xpForNextLevel) / xpForNextLevel * 100;
  
  // XP Display: Bosses show 100, Members show actual
  const displayXP = isBoss ? +100 : profile.points;
  
  // Dynamic Role Colors
  const roleColor = ['Head', 'Vice Head', 'General President', 'Vice President'].includes(profile.role) ? 'text-yellow-500 border-yellow-500' : 
                    ['Operation Director', 'Creative Director'].includes(profile.role) ? 'text-purple-500 border-purple-500' :
                    profile.role === 'HR' ? 'text-pink-500 border-pink-500' : 'text-blue-400 border-blue-400';

  return (
    <>
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      
      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-primary/20 pb-4">
        <div className="p-2 bg-primary/10 rounded pixel-corners shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
        </div>
        <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl pixel-font text-white glow-text truncate">OPERATIVE PROFILE</h1>
            <p className="text-gray-500 font-mono text-[10px] sm:text-xs truncate">PERSONNEL FILE #{profile._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* MAIN IDENTITY BANNER */}
      <Card className="bg-card border-l-4 border-l-secondary border-y border-r border-primary/20 pixel-corners overflow-hidden relative shadow-lg shadow-black/50">
           {/* Background Deco */}
           <div className="absolute top-0 right-0 p-32 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           
           <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left z-10 relative">
                
                             {/* Avatar Section with Actions */}
                 <div className="shrink-0 relative flex flex-col items-center gap-3">
                     <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                     
                     <div className={`w-32 h-32 bg-black/50 pixel-corners flex items-center justify-center border-2 ${roleColor} relative overflow-hidden`}>
                          {profile.avatar ? (
                              <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                              <User className={`w-16 h-16 ${roleColor.split(' ')[0]}`} />
                          )}
                          {!uploading && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none" />}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span className="text-xs pixel-font text-white">UPLOADING...</span>
                              </div>
                            </div>
                          )}
                     </div>
                     
                     <Badge className={`pixel-corners pixel-font text-[10px] px-3 py-1 bg-black border ${roleColor}`}>{profile.role}</Badge>

                     <div className="flex gap-2">
                        <button onClick={() => document.getElementById('avatar-upload')?.click()} disabled={uploading} className="group pixel-corners bg-secondary/10 hover:bg-secondary/20 border border-secondary/30 hover:border-secondary/50 p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="Change avatar">
                          <svg className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </button>
                        {profile.avatar && (
                          <button onClick={() => setShowDeleteConfirm(true)} disabled={uploading} className="group pixel-corners bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed" title="Delete avatar">
                            <svg className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                     </div>
                 </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4 w-full min-w-0">
                     <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl pixel-font text-white tracking-wide uppercase break-words">{profile.name}</h2>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start text-xs font-mono text-gray-400">
                             <div className="flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3 text-secondary" /> 
                                {profile.department} DEPT
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Mail className="w-3 h-3 text-secondary" /> 
                                {profile.email}
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-green-400" /> 
                                ACTIVE STATUS
                             </div>
                        </div>

                        {/* Department Quote */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                           <p className="text-secondary/80 font-mono text-xs italic">
                              "{
                                 {
                                    'IT': "Building the future, pixel by pixel.",
                                    'HR': "Human potential, unlocked.",
                                    'PM': "Vision needs execution.",
                                    'PR': "Stories that shape the world.",
                                    'FR': "Fueling the impossible.",
                                    'Logistics': "The backbone of operations.",
                                    'Organization': "Order creates opportunity.",
                                    'Marketing': "Ideas that spread, win.",
                                    'Multi-Media': "Reality, reimagined.",
                                    'Presentation': "Impact through expression."
                                 }[profile.department] || "We make change happen."
                              }"
                           </p>
                        </div>
                     </div>

                     {/* XP Progress Section */}
                     <div className="bg-black/20 p-4 pixel-corners border border-white/5 space-y-2">
                         <div className="flex justify-between items-end">
                              <span className="text-xs font-bold text-secondary pixel-font">{levelTitle}</span>
                              <span className="text-[10px] font-mono text-gray-400">
                                {isBoss ? "MAX LEVEL ACQUIRED" : `${displayXP} / ${Math.ceil((displayXP + 1)/xpForNextLevel) * xpForNextLevel} XP`}
                              </span>
                         </div>
                         <div className="h-3 w-full bg-gray-900 border border-primary/20 rounded-full overflow-hidden relative">
                              <div 
                                 className="h-full bg-gradient-to-r from-secondary to-blue-500 relative"
                                 style={{ width: `${currentLevelProgress}%` }}
                              >
                                  <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                              </div>
                         </div>
                         <p className="text-[10px] text-gray-500 font-mono text-right">
                            {isBoss ? "BOSS STATUS ACTIVE" : `${xpForNextLevel - (profile.points % xpForNextLevel)} XP UNTIL PROMOTION`}
                         </p>
                     </div>
                </div>
           </CardContent>
      </Card>


      {/* SECURITY ACTIONS */}
      <Card className="bg-card border-2 border-primary/20 pixel-corners shadow-lg hover:border-secondary/40 transition-colors">
        <CardHeader className="border-b border-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded pixel-corners">
              <Shield className="w-5 h-5 text-secondary" />
            </div>
            <CardTitle className="pixel-font text-white">SECURITY</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-black/20 pixel-corners border border-primary/10 hover:border-secondary/30 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded pixel-corners group-hover:bg-secondary/20 transition-colors">
                  <KeyRound className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm pixel-font text-white">PASSWORD</p>
                  <p className="text-xs text-gray-400 font-mono">Last changed: Never</p>
                </div>
              </div>
              <button
                onClick={() => router.push('/dashboard/change-password')}
                className="pixel-corners bg-secondary hover:bg-secondary/80 text-white px-4 py-2 pixel-font text-xs transition-all hover:scale-105 active:scale-95"
              >
                CHANGE
              </button>
            </div>
            <div className="p-3 bg-green-500/5 border border-green-500/20 pixel-corners">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-green-400 mt-0.5" />
                <div>
                  <p className="text-xs pixel-font text-green-400">ACCOUNT SECURED</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">Your account is protected with encrypted credentials</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS HUD - MEMBERS ONLY */}
      {profile.role === 'Member' && (
          <div className="grid grid-cols-1 gap-4">
              <StatCard icon={Trophy} label="MISSIONS COMPLETED" value={profile.tasksCompleted} color="text-yellow-400" bg="bg-yellow-400/5" border="border-yellow-400/20" />
          </div>
      )}

    </div>

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
              onClick={() => setShowNotification(false)}
              className="pixel-corners bg-secondary hover:bg-secondary/80 text-white px-6 py-2 pixel-font text-sm transition-all hover:scale-105 active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Dialog */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card border-4 border-red-500 pixel-corners shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="p-4 border-b-2 border-red-500/20 bg-red-500/10">
            <h3 className="text-lg pixel-font text-white tracking-wider">⚠️  CONFIRM DELETE</h3>
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1 pt-2">
                <p className="text-base pixel-font text-red-400">
                  Are you sure you want to delete your avatar?
                </p>
                <p className="text-sm text-gray-400 mt-2 font-mono">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t-2 border-red-500/20 flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="pixel-corners bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/30 hover:border-gray-500/50 text-white px-6 py-2 pixel-font text-sm transition-all hover:scale-105 active:scale-95"
            >
              CANCEL
            </button>
            <button
              onClick={handleDeleteAvatar}
              className="pixel-corners bg-red-500 hover:bg-red-600 text-white px-6 py-2 pixel-font text-sm transition-all hover:scale-105 active:scale-95"
            >
              DELETE
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, border }: { icon: any, label: string, value: string | number, color: string, bg: string, border: string }) {
    return (
        <Card className={`border ${border} ${bg} pixel-corners transition-all hover:scale-[1.02] cursor-default`}>
            <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`p-2 rounded-full bg-black/20 ${color}`}>
                   <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-2xl pixel-font text-white">{value}</div>
                    <div className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">{label}</div>
                </div>
            </CardContent>
        </Card>
    );
}
