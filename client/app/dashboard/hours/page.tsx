"use client";

// Import hooks and API
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/ui/notification';
// Import UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, RefreshCcw, AlertTriangle } from 'lucide-react';

// Force dynamic rendering - disable Next.js caching
export const dynamic = 'force-dynamic';

// Define HoursPage Component
export default function HoursPage() {
  const router = useRouter();
  const { showNotification, showConfirm } = useNotification();
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
  
  // State for deduct mode (HR only)
  const [isDeduct, setIsDeduct] = useState(false);
  // State for recalculation loading
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Filter users based on search query
  const filteredUsers = assignableUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (u: any) => {
    setTargetUserId(u.id);
    setSearchQuery(u.name);
    setShowResults(false);
  };

  // Effect on mount: load user and fetch hours
  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('user') || '{}');
    setUser(u);
    
    // Restrict Access: Only Leaders can access Hours Page
    // Also ALLOW HR Coordinators (Member, HR, Title check), Directors, and GUESTS
    const isHRCoordinator = u.role === 'Member' && u.department === 'HR' && u.title?.startsWith('HR Coordinator');
    const isTeamLeader = u.department === 'HR' && u.position === 'Team Leader';
    const isDirector = u.role === 'Operation Director' || u.role === 'Creative Director';
    const isGuest = u.role === 'guest';

    if (!['Head', 'Vice Head', 'HR', 'General President', 'Vice President'].includes(u.role) && !isHRCoordinator && !isTeamLeader && !isDirector && !isGuest) {
       router.push('/dashboard');
       return;
    }

    // Set default department for Directors
    if (u.role === 'Operation Director') {
      setSelectedDept('PR'); // Default to first assigned department
    } else if (u.role === 'Creative Director') {
      setSelectedDept('Marketing'); // Default to first assigned department
    }

    fetchHours(); // initial fetch without filter
    
    // If Leader, fetch users for assignment
    if (['Head', 'Vice Head', 'HR', 'General President'].includes(u.role) || isHRCoordinator || isTeamLeader) {
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
      // Construct URL with query param if dept is provided
      const url = dept && dept !== 'All' ? `/hours?department=${dept}` : '/hours';
      const { data } = await api.get(url);
      
      console.log('📊 Raw hours data from backend:', data);
      console.log('📊 Total hours received:', data.length);
      
      // Filter list to only show Members and Guests
      const filtered = data.filter((log: any) => log.user?.role === 'Member' || log.user?.role === 'guest');
      console.log('📊 Filtered hours (Members/Guests):', filtered);
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

  // Handler to submit new hours (or deduct if isDeduct)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side guards before hitting the server
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showNotification('Please enter a valid hours amount (greater than 0).', 'error');
      return;
    }
    if (!description || description.trim().length < 3) {
      showNotification('Please enter a description (at least 3 characters).', 'error');
      return;
    }
    if (canGrant && !targetUserId) {
      showNotification('Please select a member first.', 'error');
      return;
    }

    try {
      // POST to /hours — send negative amount for deductions
      const finalAmount = isDeduct ? -numAmount : numAmount;
      await api.post('/hours', 
        { amount: finalAmount, description: description.trim(), targetUserId: targetUserId || undefined }
      );
      // Reset form fields
      setAmount('');
      setDescription('');
      setTargetUserId(''); // Reset selection
      setSearchQuery(''); // Reset search query
      setIsDeduct(false); // Reset deduct mode
      // Refresh list
      fetchHours(selectedDept);
    } catch (error: any) {
      // Log the full server response to see exactly which field failed
      console.error('Hours submit error:', error);
      console.error('Server response:', JSON.stringify(error.response?.data, null, 2));
      const respData = error.response?.data;
      if (respData?.errors && Array.isArray(respData.errors)) {
        const msg = respData.errors.map((e: any) => `${e.field ? e.field + ': ' : ''}${e.message}`).join(' | ');
        showNotification(`Error: ${msg}`, 'error');
      } else {
        showNotification(`Error: ${respData?.message || 'Failed to submit hours.'}`, 'error');
      }
    }
  };

  // 🗑️ DELETE LOG
  const handleDelete = async (id: string) => {
    showConfirm({
      title: 'DELETE LOG',
      message: 'Are you sure you want to delete this log? This will update the player\'s total hours permanently.',
      confirmText: 'YES, DELETE',
      cancelText: 'ABORT',
      onConfirm: async () => {
        try {
          await api.delete(`/hours/${id}`);
          fetchHours(selectedDept);
          showNotification('Log deleted successfully', 'success');
        } catch (error) {
           console.error(error);
           showNotification('Failed to delete log', 'error');
        }
      }
    });
  };

  // 🔄 RECALCULATE TOTALS
  const handleRecalculate = async () => {
    if (!targetUserId) {
      showNotification('Please select a player to recalculate first.', 'error');
      return;
    }
    
    setIsRecalculating(true);
    try {
      const { data } = await api.post('/hours/recalculate/sync', { userId: targetUserId });
      showNotification(`Recalculation complete! Total: ${data.totalHours} hrs | ${data.tasksCompleted} missions`, 'success');
      
      // 🧬 If we recalculated OURSELVES, update local session storage immediately
      if (user && targetUserId === user.id) {
          const updatedUser = { 
            ...user, 
            hoursApproved: data.totalHours, 
            tasksCompleted: data.tasksCompleted, 
            points: data.totalPoints 
          };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
          // We can't easily force-refresh the Navbar/Sidebar from here, 
          // but clicking back to Dashboard will fetch fresh anyway.
      }

      fetchHours(selectedDept);
    } catch (error) {
       console.error(error);
       showNotification('Recalculation failed', 'error');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
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
  const isMember = user && (user.role === 'Member' || user.role === 'guest');
  
  // Show form if canGrant (HR) OR isMember (Self-Log)
  // Heads/GP/VP/Directors (who are not HR) will NOT see the form.
  const shouldShowForm = canGrant || isMember;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 border-b-4 border-b-secondary pixel-corners">
        <h2 className="text-xl text-white pixel-font text-glow">TIME LOG (SAVE STATION)</h2>
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
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row flex-wrap gap-4 lg:items-end">
            

            {/* User Search for HR (Autocomplete Input) */}
            {canGrant && (
              <div className="w-full lg:w-64 space-y-2 relative">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-primary pixel-font">PLAYER SEARCH</label>
                  {/* Recalculate Button for HR/Board */}
                  {canGrant && targetUserId && (
                    <Button 
                      onClick={handleRecalculate}
                      disabled={isRecalculating}
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-[10px] pixel-font text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 gap-1.5"
                      title="Fix total hours by re-summing all approved logs"
                    >
                      <RefreshCcw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
                      {isRecalculating ? 'SYNCING...' : 'RECALC TOTAL'}
                    </Button>
                  )}
                </div>
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
                             key={u.id} 
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
            <div className="w-full sm:w-32 space-y-2">
              <label className="text-xs text-primary pixel-font">HOURS</label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                placeholder="0" 
                min="0"
                step="0.5"
                className="pixel-corners bg-background/50 border-primary font-mono text-sm"
              />
            </div>
            {/* Deduct toggle and submit — side by side */}
            <div className="flex gap-2 items-end">
              {canGrant && (
                <div className="flex flex-col gap-2 items-center justify-center shrink-0">
                  <label className="text-xs text-primary pixel-font">{isDeduct ? 'DEDUCT' : 'ADD'}</label>
                  <button
                    type="button"
                    onClick={() => setIsDeduct(!isDeduct)}
                    className="relative w-16 h-8 bg-black/40 border-2 border-primary pixel-corners cursor-pointer outline-none transition-colors"
                    title={isDeduct ? 'Switch to Add mode' : 'Switch to Deduct mode'}
                  >
                    <div className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-300 pixel-corners ${
                      isDeduct ? 'left-9 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'left-1 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]'
                    }`}></div>
                  </button>
                </div>
              )}
              <Button 
                type="submit" 
                disabled={canGrant && !targetUserId}
                className={`flex-1 sm:flex-none h-[42px] px-6 pixel-corners pixel-font disabled:opacity-50 disabled:cursor-not-allowed ${
                  canGrant && isDeduct
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-accent hover:bg-accent/80'
                }`}
              >
                {canGrant ? (isDeduct ? 'DEDUCT HOURS' : 'GRANT REWARDS') : 'SAVE PROGRESS'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}

      {/* List of Hours Logs */}
      <Card className="bg-card border-2 border-secondary pixel-corners relative z-10">
        <CardHeader className="border-b border-secondary/20 pb-2 flex flex-row justify-between items-center">
          <CardTitle className="text-white pixel-font text-sm">SESSION HISTORY</CardTitle>
          
          {/* Department Filter for HR / GP / VP / Directors */}
          {/* Department Filter for HR / GP / VP / Directors / Team Leaders */}
          {(() => {
            const isDirector = user?.role === 'Operation Director' || user?.role === 'Creative Director';
            const isTeamLeader = user?.role === 'Member' && user?.department === 'HR' && user?.position === 'Team Leader';
            const canFilter = user?.role === 'HR' || user?.role === 'General President' || user?.role === 'Vice President' || isDirector || isTeamLeader;
            
            if (!canFilter) return null;
            
            // Filter departments based on role
            let departments = ['IT','HR','PM','PR','FR','Logistics','Organization','Marketing','Multi-Media','Presentation'];
            
            if (user?.role === 'Operation Director') {
              departments = ['PR', 'FR', 'Logistics', 'PM'];
            } else if (user?.role === 'Creative Director') {
              departments = ['Marketing', 'Multi-Media', 'Presentation', 'Organization'];
            } else if (isTeamLeader && user?.responsibleDepartments) {
              departments = user.responsibleDepartments;
            }
            
            return (
              <div className="w-48">
                <Select value={selectedDept} onValueChange={handleFilterChange}>
                  <SelectTrigger className="pixel-corners border-secondary bg-background/50 text-xs pixel-font h-8">
                    <SelectValue placeholder="FILTER GUILD" />
                  </SelectTrigger>
                  <SelectContent className="pixel-corners bg-card border-secondary">
                    {/* Only show "ALL GUILDS" for users who can see all responsible departments */}
                    {(user?.role === 'HR' || user?.role === 'General President' || user?.role === 'Vice President' || isTeamLeader) && (
                      <SelectItem value="All">ALL GUILDS</SelectItem>
                    )}
                    {departments.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
          
          {/* Static Badge for Heads indicating they are viewing their Guild */}
          {(user?.role === 'Head' || user?.role === 'Vice Head') && (
            <Badge variant="outline" className="pixel-corners border-secondary text-secondary text-xs pixel-font">
              GUILD: {user.department || 'MULTIPLE'}
            </Badge>
          )}

        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-secondary/20">
                <TableHead className="text-secondary pixel-font text-xs">DATE</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">PLAYER</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">ACTIVITY</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">TIME</TableHead>
                <TableHead className="text-secondary pixel-font text-xs">STATUS</TableHead>
                {/* Show Action column for HR (Validate / Delete) */}
                {canGrant && (
                  <TableHead className="text-secondary pixel-font text-xs text-right">ACTIONS</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.map((log) => (
                <TableRow key={log.id} className="hover:bg-secondary/10 border-b border-secondary/10 font-mono text-xs">
                  <TableCell className="text-white">{new Date(log.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-white">{log.user?.name}</TableCell>
                  <TableCell className="text-white">{log.description}</TableCell>
                  <TableCell className={log.amount < 0 ? 'text-red-500 font-bold' : 'text-white'}>
                    {log.amount < 0 ? '' : '+'}{log.amount} HRS
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'Approved' ? 'default' : 'secondary'} className="pixel-corners text-[10px]">
                      {log.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  {/* Action Buttons for HR only */}
                  {canGrant && (
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {log.status === 'Pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleApprove(log.id)} 
                            className="bg-green-600 hover:bg-green-500 pixel-corners h-7 px-3 text-[10px] pixel-font"
                          >
                            VALIDATE
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(log.id)}
                          className="h-7 w-7 p-0 pixel-corners text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          title="Delete log and update player total"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
