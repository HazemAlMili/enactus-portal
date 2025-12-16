"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define HoursPage Component
export default function HoursPage() {
  const router = useRouter();
  // State for hours list
  const [hours, setHours] = useState<any[]>([]);
  // State for form inputs
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  // State for user info (to determine roles)
  const [user, setUser] = useState<any>(null);
  // State for department filter (History)
  const [selectedDept, setSelectedDept] = useState<string>('All');
  
  // State for assigning hours (Leaders)
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  
  // State for search (Autocomplete)
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Filter users based on search query
  const filteredUsers = assignableUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (u: any) => {
    setTargetUserId(u._id);
    setSearchQuery(u.name);
    setShowResults(false);
  };

  // Effect on mount: load user and fetch hours
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(u);
    
    // Restrict Access: Only Leaders can access Hours Page
    // Also ALLOW HR Coordinators (Member, HR, Title check)
    const isHRCoordinator = u.role === 'Member' && u.department === 'HR' && u.title?.startsWith('HR Coordinator');

    if (!['Head', 'Vice Head', 'HR', 'General President'].includes(u.role) && !isHRCoordinator) {
       router.push('/dashboard');
       return;
    }

    fetchHours(); // initial fetch without filter
    
    // If Leader, fetch users for assignment
    if (['Head', 'Vice Head', 'HR', 'General President'].includes(u.role) || isHRCoordinator) {
       fetchAssignableUsers();
    }
  }, [router]);

  const fetchAssignableUsers = async () => {
    try {
      const { data } = await api.get('/users');
      // Filter strictly for Members
      setAssignableUsers(data.filter((u: any) => u.role === 'Member'));
    } catch (error) {
       console.error(error);
    }
  };

  // Fetch hours logs from backend
  const fetchHours = async (dept?: string) => {
    try {
      const token = localStorage.getItem('token');
      // Construct URL with query param if dept is provided
      const url = dept && dept !== 'All' ? `/hours?department=${dept}` : '/hours';
      const { data } = await api.get(url);
      
      console.log('📊 Raw hours data from backend:', data);
      console.log('📊 Total hours received:', data.length);
      
      // Filter list to only show Members
      const filtered = data.filter((log: any) => log.user?.role === 'Member');
      console.log('📊 Filtered hours (Members only):', filtered);
      console.log('📊 Filtered count:', filtered.length);
      
      setHours(filtered);
    } catch (error) {
      console.error('❌ Error fetching hours:', error);
    }
  };

  // Handle Filter Change
  const handleFilterChange = (value: string) => {
    setSelectedDept(value);
    fetchHours(value);
  };

  // Handler to submit new hours
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      // POST to /hours
      await api.post('/hours', 
        { amount: Number(amount), description, targetUserId: targetUserId || undefined }
      );
      // Reset form fields
      setAmount('');
      setDescription('');
      setTargetUserId(''); // Reset selection
      setSearchQuery(''); // Reset search query
      // Refresh list
      fetchHours(selectedDept);
    } catch (error) {
      console.error(error);
    }
  };

  // Handler for Heads/HR to approve hours
  const handleApprove = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      // PUT request to update status to 'Approved'
      await api.put(`/hours/${id}`, 
        { status: 'Approved' }
      );
      fetchHours(selectedDept);
    } catch (error) {
      console.error(error);
    }
  };

  const canGrant = user && (user.role === 'HR' || user.department === 'HR' || (user.role === 'Member' && user.department === 'HR' && user.title?.startsWith('HR Coordinator'))); // HR check includes Coord
  const isMember = user && user.role === 'Member';
  
  // Show form if canGrant (HR) OR isMember (Self-Log)
  // Heads/GP/VP/Directors (who are not HR) will NOT see the form.
  const shouldShowForm = canGrant || isMember;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 border-b-4 border-b-secondary pixel-corners">
        <h2 className="text-3xl text-white pixel-font text-glow">TIME LOG (SAVE STATION)</h2>
      </div>
      
      {/* Submission Form Card */}
      {shouldShowForm && (
      <Card className="bg-card border-2 border-primary relative z-20">
        <CardHeader className="border-b border-primary/20 pb-2">
          <CardTitle className="text-secondary pixel-font text-sm">
             {canGrant ? 'ASSIGN REWARDS (HOURS)' : 'LOG NEW SESSION'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            

            {/* User Search for HR (Autocomplete Input) */}
            {canGrant && (
              <div className="w-full md:w-64 space-y-2 relative">
                <label className="text-xs text-primary pixel-font">PLAYER SEARCH</label>
                <div className="relative">
                  <Input 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowResults(true);
                      setTargetUserId(''); // Clear selection if typing new search
                    }}
                    onFocus={() => setShowResults(true)}
                    placeholder="TYPE NAME..."
                    className="pixel-corners bg-background/50 border-primary font-mono text-sm h-10 w-full"
                  />
                  {/* Results List */}
                  {showResults && searchQuery && (
                    <div className="absolute top-full left-0 z-50 w-full max-h-48 overflow-y-auto bg-card border-2 border-primary pixel-corners mt-1 shadow-lg">
                       {filteredUsers.length > 0 ? (
                         filteredUsers.map(u => (
                           <div 
                             key={u._id} 
                             className="p-2 hover:bg-primary/20 cursor-pointer text-sm font-mono text-white border-b border-primary/10 last:border-0"
                             onClick={() => handleUserSelect(u)}
                           >
                             {u.name} <span className="text-xs text-gray-400">({u.role})</span>
                           </div>
                         ))
                       ) : (
                         <div className="p-2 text-xs text-gray-500 font-mono">NO AGENTS FOUND</div>
                       )}
                    </div>
                  )}
                  {/* Overlay to close results when clicking outside (simple version) */}
                  {showResults && <div className="fixed inset-0 z-40" onClick={() => setShowResults(false)}></div>}
                </div>
              </div>
            )}

            <div className="flex-1 w-full space-y-2">
              <label className="text-xs text-primary pixel-font">MISSION DESCRIPTION</label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="WHAT WAS ACCOMPLISHED?" 
                className="pixel-corners bg-background/50 border-primary font-mono text-sm"
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <label className="text-xs text-primary pixel-font">HOURS</label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0" 
                className="pixel-corners bg-background/50 border-primary font-mono text-sm"
              />
            </div>
            <Button 
              type="submit" 
              disabled={canGrant && !targetUserId}
              className="w-full md:w-auto bg-accent hover:bg-accent/80 pixel-corners pixel-font disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canGrant ? 'GRANT REWARDS' : 'SAVE PROGRESS'}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* List of Hours Logs */}
      <Card className="bg-card border-2 border-secondary pixel-corners relative z-10">
        <CardHeader className="border-b border-secondary/20 pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-white pixel-font text-sm">SESSION HISTORY</CardTitle>
          
          {/* Department Filter for HR / GP / VP */}
          {(user?.role === 'HR' || user?.role === 'General President' || user?.role === 'Vice President') && (
            <div className="w-48">
              <Select value={selectedDept} onValueChange={handleFilterChange}>
                <SelectTrigger className="pixel-corners border-secondary bg-background/50 text-xs pixel-font h-8">
                  <SelectValue placeholder="FILTER GUILD" />
                </SelectTrigger>
                <SelectContent className="pixel-corners bg-card border-secondary">
                  <SelectItem value="All">ALL GUILDS</SelectItem>
                  {['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'].map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Static Badge for Heads indicating they are viewing their Guild */}
          {(user?.role === 'Head' || user?.role === 'Vice Head' || user?.role === 'Operation Director' || user?.role === 'Creative Director') && (
            <Badge variant="outline" className="pixel-corners border-secondary text-secondary text-xs pixel-font">
              GUILD: {user.department || 'MULTIPLE'}
            </Badge>
          )}

        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-secondary/20">
                <TableHead className="text-secondary pixel-font text-xs">DATE</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">PLAYER</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">ACTIVITY</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">TIME</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">STATUS</TableHead>
                {/* Show Action column only for HR */}
                {canGrant && (
                  <TableHead className="text-secondary pixel-font text-xs">ACTION</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.map((log) => (
                <TableRow key={log._id} className="hover:bg-secondary/10 border-b border-secondary/10 font-mono text-xs">
                  <TableCell className="text-white">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white">{log.user?.name}</TableCell>
                  <TableCell className="text-white">{log.description}</TableCell>
                  <TableCell className="text-white">{log.amount} HRS</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Approved' ? 'default' : 'secondary'} className="pixel-corners text-[10px]">
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  {/* Approve Button for HR only */}
                  {canGrant && log.status === 'Pending' && (
                    <TableCell>
                      <Button size="sm" onClick={() => handleApprove(log._id)} className="bg-green-600 hover:bg-green-500 pixel-corners h-6 text-[10px] pixel-font">
                        VALIDATE
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
