"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import LoadingSpinner from '@/components/ui/loading-spinner';

interface User {
  _id: string;
  name: string;
  department: string;
  role: string;
  hoursApproved: number;
}

export default function DepartmentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<Record<string, User[]>>({});
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const u = JSON.parse(storedUser);
        setUser(u);
        // If Head/Vice Head, force selection to their department
        if (['Head', 'Vice Head'].includes(u.role) && u.department) {
            setSelectedDept(u.department);
        }
    }
    fetchUsers();
  }, []);

  const isHead = user && ['Head', 'Vice Head'].includes(user.role);

  // ... (keep fetchUsers logic)

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
      
      // Group users by department (Members Only)
      const groups = data
        .filter((user: User) => user.role === 'Member')
        .reduce((acc: any, user: User) => {
          const dept = user.department || 'Unassigned';
          if (!acc[dept]) acc[dept] = [];
          acc[dept].push(user);
          return acc;
        }, {});
      setGroupedUsers(groups);
    } catch (error) {
      console.error("Failed to fetch guild data", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter groups based on selection
  const displayedGroups = selectedDept === 'All' 
    ? groupedUsers 
    : { [selectedDept]: groupedUsers[selectedDept] || [] };

  // Generate department list for dropdown (Static List to ensure all are visible)
  const allDepartments = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];

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
        
        {/* Department Filter - Only for Non-Heads (e.g. GP, HR) */}
        {!isHead && (
            <div className="w-full md:w-48 shrink-0">
                <Select value={selectedDept} onValueChange={setSelectedDept}>
                <SelectTrigger className="pixel-corners border-secondary bg-background/50 text-xs pixel-font h-10 w-full">
                    <SelectValue placeholder="FILTER GUILD" />
                </SelectTrigger>
                    <SelectContent className="pixel-corners bg-card border-secondary">
                    <SelectItem value="All">ALL GUILDS</SelectItem>
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
                        <span className="text-[10px] bg-white/10 px-1 py-0.5 rounded text-gray-300 font-mono shrink-0">{member.role}</span>
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
