"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Briefcase, Mail, Star, Clock, Trophy, Hash } from 'lucide-react';
import api from '@/lib/api';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('⚠️ No token found in localStorage');
          setLoading(false);
          return;
        }

        // Fetch fresh user data from /api/auth/me with cache-busting timestamp
        console.log('🔄 Fetching fresh profile data...');
        const res = await api.get(`/auth/me?_t=${Date.now()}`);
        console.log('✅ Profile data loaded:', res.data.name);
        setProfile(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch profile:", err);
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
        alert("Image too large. Max 4MB.");
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
        
        // Update localStorage with new avatar
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.avatar = res.data.avatar;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        alert('Avatar updated successfully!');
      } catch (err: any) {
        console.error("❌ Upload failed:", err);
        console.error("Error response:", err.response?.data);
        
        const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
        alert(`Upload failed: ${errorMsg}`);
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      console.error('❌ Failed to read file');
      alert('Failed to read image file');
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
      return (
          <div className="flex h-[80vh] items-center justify-center">
              <div className="text-secondary pixel-font animate-pulse">LOADING IDENTITY RECORD...</div>
          </div>
      );
  }

  if (!profile) return null;

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
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8">
      
      {/* Page Title */}
      <div className="flex items-center gap-3 border-b border-primary/20 pb-4">
        <div className="p-2 bg-primary/10 rounded pixel-corners">
            <User className="w-6 h-6 text-secondary" />
        </div>
        <div>
            <h1 className="text-2xl pixel-font text-white glow-text">OPERATIVE PROFILE</h1>
            <p className="text-gray-500 font-mono text-xs">PERSONNEL FILE #{profile._id.slice(-6).toUpperCase()}</p>
        </div>
      </div>

      {/* MAIN IDENTITY BANNER */}
      <Card className="bg-card border-l-4 border-l-secondary border-y border-r border-primary/20 pixel-corners overflow-hidden relative shadow-lg shadow-black/50">
           {/* Background Deco */}
           <div className="absolute top-0 right-0 p-32 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
           
           <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left z-10 relative">
                
                {/* Avatar Section (Clickable for Upload) */}
                <div className="shrink-0 relative group">
                    <label 
                        className={`w-32 h-32 bg-black/50 pixel-corners flex items-center justify-center border-2 ${roleColor} relative overflow-hidden cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                         {/* File Input */}
                         <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                            disabled={uploading}
                         />

                         {/* Image or Icon */}
                         {profile.avatar ? (
                             <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                         ) : (
                             <User className={`w-16 h-16 ${roleColor.split(' ')[0]}`} />
                         )}

                         {/* Upload Overlay */}
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             {/* Note: Icons from Lucide need to be imported or they default to User if missing */}
                             <span className="text-xs text-white pixel-font">UPLOAD</span>
                         </div>

                         {/* Scanline Animation (only if not uploading) */}
                         {!uploading && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none" />}
                    </label>
                     <Badge className={`absolute -bottom-3 left-1/2 -translate-x-1/2 pixel-corners pixel-font text-[10px] px-3 py-1 bg-black border ${roleColor}`}>
                        {profile.role}
                    </Badge>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-4 w-full">
                     <div className="space-y-1">
                        <h2 className="text-3xl pixel-font text-white tracking-wide uppercase">{profile.name}</h2>
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


      {/* STATS HUD - MEMBERS ONLY */}
      {profile.role === 'Member' && (
          <div className="grid grid-cols-1 gap-4">
              <StatCard icon={Trophy} label="MISSIONS COMPLETED" value={profile.tasksCompleted} color="text-yellow-400" bg="bg-yellow-400/5" border="border-yellow-400/20" />
          </div>
      )}

    </div>
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
