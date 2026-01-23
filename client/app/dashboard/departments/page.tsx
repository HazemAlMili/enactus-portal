"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import LoadingSpinner from '@/components/ui/loading-spinner';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

interface User {
  _id: string;
  name: string;
  department: string;
  role: string;
  position?: string;
  hoursApproved: number;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);

  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser(u);
        
        const isHRCoordinator = u.role === 'Member' && u.department === 'HR' && u.title?.startsWith('HR Coordinator');
        const isTeamLeader = u.department === 'HR' && u.position === 'Team Leader';
        const isDirector = u.role === 'Operation Director' || u.role === 'Creative Director';
        const isGuest = u.role === 'guest';
        
        if (!['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(u.role) && !isHRCoordinator && !isTeamLeader && !isDirector && !isGuest) {
            router.push('/dashboard');
            return;
        }

        // If Head/Vice Head, force selection to their department
        if (['Head', 'Vice Head'].includes(u.role) && u.department) {
            setSelectedDept(u.department);
        }
        // If HR Coordinator, lock to their assigned department
        else if (isHRCoordinator) {
            const coordDept = u.title?.split(' - ')[1]; // e.g., "HR Coordinator - IT" => "IT"
            if (coordDept) {
                setSelectedDept(coordDept);
            }
        }
        // If Director, default to first assigned department
        else if (u.role === 'Operation Director') {
            setSelectedDept('PR'); // Default to first dept: PR, FR, Logistics, PM
        }
        else if (u.role === 'Creative Director') {
            setSelectedDept('Marketing'); // Default to first dept: Marketing, Multi-Media, Presentation, Organization
        }
    } else {
        router.push('/');
        return;
    }
    fetchUsers();
  }, [router]);

  // Check if user should be locked to a specific department
  const isHRCoordinator = user?.role === 'Member' && user?.department === 'HR' && user?.title?.startsWith('HR Coordinator');
  const isHead = user && ['Head', 'Vice Head'].includes(user.role);
  const isLocked = isHead || isHRCoordinator; 

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch guild data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ⚡ PERFORMANCE: Memoize grouping logic to avoid heavy calculations on every re-render
  const groupedUsers = useMemo(() => {
    return users
      .filter((u: User) => u.role === 'Member')
      .reduce((acc: Record<string, User[]>, u: User) => {
        const dept = u.department || 'Unassigned';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(u);
        return acc;
      }, {});
  }, [users]);

  // Filter groups based on selection
  const displayedGroups = selectedDept === 'All' 
    ? groupedUsers 
    : { [selectedDept]: groupedUsers[selectedDept] || [] };

  // Generate department list for dropdown based on user role
  let allDepartments = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
  
  // Filter departments for Directors
  if (user?.role === 'Operation Director') {
    allDepartments = ['PR', 'FR', 'Logistics', 'PM'];
  } else if (user?.role === 'Creative Director') {
    allDepartments = ['Marketing', 'Multi-Media', 'Presentation', 'Organization'];
  } 
  // Filter for Team Leaders (only show responsible departments)
  else if (user?.department === 'HR' && user?.position === 'Team Leader' && user?.responsibleDepartments) {
    allDepartments = user.responsibleDepartments;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 border-b-4 border-b-primary pixel-corners">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl text-white pixel-font text-glow truncate">GUILD HALL</h2>
          <p className="text-gray-400 font-mono text-xs mt-2">VIEW ACTIVE AGENTS AND STATS</p>
        </div>
        
        {/* Department Filter - Only for users NOT locked to a department (e.g., GP, HR Head with all access) */}
        {!isLocked && (
            <div className="w-full md:w-48 shrink-0">
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="pixel-corners border-secondary bg-background/50 text-xs pixel-font h-10 w-full">
                    <SelectValue placeholder="FILTER GUILD" />
                </SelectTrigger>
                    <SelectContent className="pixel-corners bg-card border-secondary">
                    {/* Only show "ALL GUILDS" for users who can see all departments */}
                    {(user?.role === 'HR' || user?.role === 'General President' || user?.role === 'Vice President' || (user?.department === 'HR' && user?.position === 'Team Leader')) && (
                      <SelectItem value="All">ALL GUILDS</SelectItem>
                    )}
                    {allDepartments.map(dept => {
                        const shortName = {
                        'Organization': 'ORG',
                        'Marketing': 'MKT',
                        'Multi-Media': 'MM',
                        'Presentation': 'PRES',
                        'Logistics': 'LOG'
                        }[dept] || dept;

                        return (
                        <SelectItem key={dept} value={dept}>{shortName} GUILD</SelectItem>
                        );
                    })}
                    </SelectContent>
                </Select>
            </div>
        )}
      </div>

      <div className="space-y-8 pb-8">
        {Object.keys(groupedUsers).length === 0 && (
           <p className="text-white font-mono text-center opacity-50">NO GUILD DATA ACCESSIBLE...</p>
        )}

        {Object.entries(displayedGroups).map(([dept, members]) => {
           if(!members) return null; // Safety check
           return (
            <div key={dept} className="space-y-4">
              {/* Department Header */}
              <div className="flex flex-wrap items-center gap-4">
                 <Badge className="bg-accent text-white pixel-font pixel-corners text-lg px-4 py-1 whitespace-nowrap">{dept} GUILD</Badge>
                 <div className="h-1 bg-white/20 flex-1 pixel-corners min-w-[50px]"></div>
              </div>

              {/* Department Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map(member => (
                  <Card key={member._id} className="bg-card border-2 border-white/10 pixel-corners hover:border-primary transition-colors min-w-0">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-bold text-white pixel-font truncate pr-2 w-full">{member.name}</CardTitle>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono">{member.role}</span>
                          {member.department === 'HR' && (
                            member.position === 'Team Leader' ? (
                              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/50 pixel-corners font-mono text-[8px] h-4 py-0 uppercase">
                                TL
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-blue-500/50 text-blue-400 pixel-corners font-mono text-[8px] h-4 py-0 uppercase bg-blue-500/5">
                                MB
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-end border-t border-white/5 pt-2 mt-1">
                        <span className="text-xs text-secondary font-mono">HOURS:</span>
                        <span className="text-xl text-primary pixel-font">{member.hoursApproved || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
