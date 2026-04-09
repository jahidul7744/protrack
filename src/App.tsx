'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import useSWR from 'swr';
import {
  LayoutDashboard, PlusCircle, ClipboardList, BarChart3, LogOut,
  Search, Filter, Trash2, Edit2, Edit3, Calendar as CalendarIcon,
  User as UserIcon, ChevronRight, CheckCircle2, Clock, AlertCircle,
  AlertTriangle, Briefcase, Trophy, Target, Users, ArrowUpRight,
  Settings, Bell, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';
import { ChatBot } from '@/src/components/ChatBot';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  projectId: string;
  description: string;
  clientCompany: string;
  clientName: string;
  category: string;
  kam: string;
  startDate: string;
  endDate: string;
  followUp: string;
  supervisedBy: string;
  createdBy: string;
  createdAt: string;
}

interface TaskSubField {
  what: string;
  when: string;
  who: string;
}

interface Task {
  id: string;
  projectId: string;
  task: TaskSubField;
  output: TaskSubField;
  nextStep: TaskSubField;
  notes: string;
  status: 'To Do' | 'In Progress' | 'Done';
  progress: number;
  attachments: { name: string; url: string }[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

interface AppUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  createdAt: string;
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error('Failed to fetch');
    return r.json();
  });

async function apiCall(url: string, method: string, body?: object) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-destructive/50">
        <CardHeader className="text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred. Please try refreshing the page.</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-40">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={resetErrorBoundary}>Try Again</Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

const LoginScreen = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleGoogleLogin = () => signIn('google');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name: displayName }),
        });
        const data = await res.json();
        if (!res.ok) { toast.error(data.message || 'Registration failed'); return; }
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.error) toast.error('Account created — please sign in.');
        else toast.success('Account created successfully!');
      } else {
        const result = await signIn('credentials', { email, password, redirect: false });
        if (result?.error) toast.error('Invalid email or password.');
        else toast.success('Logged in successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
        <Card className="border-none shadow-xl bg-white overflow-hidden">
          <div className="h-2 w-full bg-primary" />
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-2">
              <LayoutDashboard className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">ProTrack</CardTitle>
            <CardDescription className="text-base">
              {isRegistering ? 'Create your account' : 'Welcome back'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input id="displayName" placeholder="John Doe" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Password</Label>
                  {!isRegistering && (
                    <button type="button" onClick={() => toast.info('Contact your administrator to reset your password.')} className="text-xs text-primary hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full h-11 font-bold">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button onClick={handleGoogleLogin} variant="outline" className="w-full h-11 font-medium gap-2">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
              Google
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">{isRegistering ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-primary font-bold hover:underline">
                {isRegistering ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/20 py-4">
            <p className="text-xs text-muted-foreground">© 2026 ProTrack Systems. All rights reserved.</p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('reporting');

  const user = session?.user as SessionUser | undefined;
  const isAdmin = user?.role === 'admin';

  const { data: projects = [], mutate: mutateProjects } = useSWR<Project[]>(
    session ? '/api/projects' : null, fetcher, { refreshInterval: 5000 }
  );
  const { data: tasks = [], mutate: mutateTasks } = useSWR<Task[]>(
    session ? '/api/tasks' : null, fetcher, { refreshInterval: 5000 }
  );
  const { data: allUsers = [], mutate: mutateUsers } = useSWR<AppUser[]>(
    session ? '/api/users' : null, fetcher, { refreshInterval: 30000 }
  );

  const appContext = useMemo(() => {
    const projectsSummary = projects.map((p) => `- ${p.name} (${p.projectId}): ${p.category}, KAM: ${p.kam}`).join('\n');
    const tasksSummary = tasks.map((t) => {
      const project = projects.find((p) => p.id === t.projectId);
      return `- Task: ${t.task.what} (Project: ${project?.name || 'Unknown'}), Status: ${t.status}, Progress: ${t.progress}%, Assignee: ${t.task.who}, Due: ${t.task.when}`;
    }).join('\n');
    return `PROJECTS:\n${projectsSummary}\n\nTASKS:\n${tasksSummary}`;
  }, [projects, tasks]);

  const handleLogout = () => signOut({ callbackUrl: '/' });

  const seedDemoData = async () => {
    if (!user) { toast.error('You must be logged in to seed data'); return; }
    const loadingToast = toast.loading('Seeding demo data...');
    try {
      const demoProjects = [
        { projectId: 'PRJ-001', name: 'Email Automation', clientCompany: 'Intention Coaching Ltd.', clientName: 'Manoj Chugani', category: 'Marketing', kam: 'Tamim', startDate: '2026-03-01', endDate: '2026-06-30', description: '', followUp: '' },
        { projectId: 'PRJ-008', name: "Int'l Sales Agent", clientCompany: 'SA', clientName: 'SA Admin', category: 'Sales', kam: 'Rifat Mridha', startDate: '2026-03-15', endDate: '2026-05-15', description: '', followUp: '' },
        { projectId: 'PRJ-014', name: 'CRM', clientCompany: 'eGeneration', clientName: 'Sanjida', category: 'Development', kam: 'Sanjida', startDate: '2026-04-01', endDate: '2026-08-31', description: '', followUp: '' },
        { projectId: 'PRJ-017', name: 'eGHR AI + ChatBot', clientCompany: 'Ha-Meem', clientName: 'Abhi', category: 'AI', kam: 'Abhi', startDate: '2026-04-05', endDate: '2026-07-05', description: '', followUp: '' },
      ];
      for (const p of demoProjects) {
        const project = await apiCall('/api/projects', 'POST', p);
        if (p.projectId === 'PRJ-008') {
          await apiCall('/api/tasks', 'POST', { projectId: project.id, task: { what: 'Connected Sharepoint to Cowork via Zapier', when: '2026-03-30', who: 'Rifat' }, output: { what: 'Plugins have been made.', when: '2026-04-06', who: 'Rifat' }, nextStep: { what: 'We will connect Microsoft365 on 08-04-2026.', when: '2026-04-08', who: 'Tamim' }, status: 'Done', notes: 'Zapier dependencies eradicated.', progress: 100 });
        }
        if (p.projectId === 'PRJ-014') {
          await apiCall('/api/tasks', 'POST', { projectId: project.id, task: { what: 'Sanjida will work on new feature', when: '2026-04-01', who: 'Sanjida' }, output: { what: 'Notification is live on CRM', when: '2026-04-06', who: 'Rashed Vi' }, nextStep: { what: "Depends upon Stakeholder's response as it might need fine-tuning.", when: '2026-04-10', who: 'Sanjida' }, status: 'In Progress', notes: 'Deadline will be shared based on REQ analysis.', progress: 50 });
        }
      }
      toast.dismiss(loadingToast);
      toast.success('Demo data seeded successfully!');
      mutateProjects(); mutateTasks();
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || 'Failed to seed demo data');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Clock className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }
  if (!session) return <LoginScreen />;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white hidden lg:flex flex-col sticky top-0 h-screen">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ProTrack</h1>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Enterprise</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1 mt-4">
            {[
              { id: 'reporting', label: 'Reporting', icon: BarChart3 },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'tasks', label: 'Tasks', icon: ClipboardList },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={cn('sidebar-item w-full', activeTab === id ? 'sidebar-item-active' : 'sidebar-item-inactive')}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            {isAdmin && (
              <button onClick={() => setActiveTab('users')} className={cn('sidebar-item w-full', activeTab === 'users' ? 'sidebar-item-active' : 'sidebar-item-inactive')}>
                <Users className="w-4 h-4" /> User Management
              </button>
            )}
            <div className="pt-4 pb-2 px-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Quick Actions</p>
              <Button variant="outline" size="sm" className="w-full justify-start border-dashed border-primary/30 text-primary hover:bg-primary/5 h-9" onClick={seedDemoData}>
                <PlusCircle className="w-4 h-4 mr-2" /> Seed Demo Data
              </Button>
            </div>
          </nav>

          <div className="p-4 border-t space-y-4">
            <div className="flex items-center gap-3 px-2">
              <img src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} alt="" className="w-8 h-8 rounded-full ring-2 ring-muted" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/5" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-white/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="lg:hidden flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <span className="font-bold">ProTrack</span>
            </div>
            <div className="flex-1 hidden md:flex max-w-md ml-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search everything..." className="pl-10 bg-muted/50 border-none h-9 focus-visible:ring-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground"><Bell className="w-5 h-5" /></Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground"><Settings className="w-5 h-5" /></Button>
              <div className="lg:hidden">
                {user?.image ? (
                  <img src={user.image} alt="" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-10 overflow-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-[1600px] mx-auto w-full">
                {activeTab === 'projects' && <ProjectSetupModule projects={projects} users={allUsers} user={user!} isAdmin={isAdmin} onMutate={() => mutateProjects()} />}
                {activeTab === 'tasks' && <TaskManagementModule projects={projects} tasks={tasks} user={user!} isAdmin={isAdmin} onMutate={() => mutateTasks()} />}
                {activeTab === 'reporting' && <ReportingModule projects={projects} tasks={tasks} />}
                {activeTab === 'users' && isAdmin && <UserManagementModule users={allUsers} onMutate={() => mutateUsers()} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <ChatBot appContext={appContext} />
        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}

// ─── Module: Project Setup ────────────────────────────────────────────────────

function ProjectSetupModule({ projects, users, user, isAdmin, onMutate }: { projects: Project[]; users: AppUser[]; user: SessionUser; isAdmin: boolean; onMutate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const nextProjectId = useMemo(() => {
    if (editingProject) return editingProject.projectId;
    if (projects.length === 0) return 'PROJ-001';
    
    let maxNum = 0;
    let prefix = 'PROJ-';
    
    projects.forEach(p => {
      const match = p.projectId.match(/^([A-Z]+-)(\d+)$/i);
      if (match) {
        prefix = match[1];
        const num = parseInt(match[2], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    
    return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [projects, editingProject]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      projectId: formData.get('projectId') as string,
      description: formData.get('description') as string,
      clientCompany: formData.get('clientCompany') as string,
      clientName: formData.get('clientName') as string,
      category: formData.get('category') as string,
      kam: formData.get('kam') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      followUp: formData.get('followUp') as string,
      supervisedBy: formData.get('supervisedBy') as string,
    };
    try {
      if (editingProject) {
        await apiCall(`/api/projects/${editingProject.id}`, 'PUT', data);
        toast.success('Project updated successfully');
      } else {
        await apiCall('/api/projects', 'POST', data);
        toast.success('Project created successfully');
      }
      setIsAdding(false); setEditingProject(null); onMutate();
    } catch (error: any) { toast.error(error.message || 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (!isAdmin && project?.createdBy !== user.id) { toast.error('No permission to delete this project'); return; }
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiCall(`/api/projects/${id}`, 'DELETE');
      toast.success('Project deleted'); onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleExportCSV = () => {
    if (projects.length === 0) { toast.error('No projects to export'); return; }
    const headers = ['Project ID', 'Name', 'Description', 'Client Company', 'Client Name', 'Category', 'KAM', 'Start Date', 'End Date', 'Follow Up'];
    const csvContent = [headers.join(','), ...projects.map((p) => [`"${p.projectId}"`, `"${p.name.replace(/"/g, '""')}"`, `"${(p.description || '').replace(/"/g, '""')}"`, `"${(p.clientCompany || '').replace(/"/g, '""')}"`, `"${(p.clientName || '').replace(/"/g, '""')}"`, `"${(p.category || '').replace(/"/g, '""')}"`, `"${(p.kam || '').replace(/"/g, '""')}"`, `"${p.startDate || ''}"`, `"${p.endDate || ''}"`, `"${p.followUp || ''}"`].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url); link.setAttribute('download', `projects_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success('Projects exported successfully');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground">Manage your enterprise project portfolio.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportCSV} className="border-primary/20 text-primary hover:bg-primary/5">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => { setIsAdding(true); setEditingProject(null); }} className="shadow-lg shadow-primary/20">
            <PlusCircle className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="glass-card border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <div className="h-1.5 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider border-primary/20 text-primary">{project.projectId}</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(isAdmin || project.createdBy === user.id) && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={() => { setEditingProject(project); setIsAdding(true); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(project.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <CardTitle className="text-xl mt-2">{project.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[2.5rem] text-sm">{project.description || 'No description provided.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><UserIcon className="w-4 h-4" /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{project.clientName}</span>
                    <span className="text-[11px]">{project.clientCompany}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><CalendarIcon className="w-4 h-4" /></div>
                  <span className="text-xs">
                    {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'} — {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-medium">{project.category}</Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground border-none font-medium">KAM: {project.kam}</Badge>
                {project.supervisedBy && (
                  <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-medium">Sup: {project.supervisedBy}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-[1000px] w-[90vw] p-0 overflow-hidden border-none shadow-2xl glass-card">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 rounded-lg bg-primary/10 text-primary"><Briefcase className="w-5 h-5" /></div>
                <DialogTitle className="text-2xl font-bold tracking-tight">{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              </div>
              <DialogDescription className="text-muted-foreground">Define the core parameters for your enterprise project.</DialogDescription>
            </DialogHeader>
          </div>
          <form key={editingProject?.id || 'new'} onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project Name *</Label>
                <Input id="name" name="name" defaultValue={editingProject?.name ?? ''} required placeholder="e.g. Q2 Marketing Campaign" className="bg-muted/30 border-none focus-visible:ring-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Project ID *</Label>
                <Input id="projectId" name="projectId" defaultValue={editingProject?.projectId ?? nextProjectId} required placeholder="e.g. PROJ-001" className="bg-muted/30 border-none focus-visible:ring-1 font-mono" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingProject?.description ?? ''} placeholder="Briefly describe the project goals..." className="bg-muted/30 border-none focus-visible:ring-1 min-h-[100px]" />
              </div>
              <div className="p-4 rounded-xl bg-muted/20 border border-muted/30 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCompany" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Company</Label>
                  <Input id="clientCompany" name="clientCompany" defaultValue={editingProject?.clientCompany ?? ''} placeholder="Client Corp" className="bg-white/50 border-none h-9" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client Name</Label>
                  <Input id="clientName" name="clientName" defaultValue={editingProject?.clientName ?? ''} placeholder="John Doe" className="bg-white/50 border-none h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</Label>
                <Select name="category" defaultValue={editingProject?.category ?? 'Marketing'}>
                  <SelectTrigger className="bg-muted/30 border-none"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {['Marketing', 'Development', 'Design', 'Strategy', 'Operations', 'Sales', 'AI'].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kam" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">KAM</Label>
                <Input id="kam" name="kam" defaultValue={editingProject?.kam ?? ''} placeholder="Account Manager" className="bg-muted/30 border-none h-9" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisedBy" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supervised By</Label>
                <Select name="supervisedBy" defaultValue={editingProject?.supervisedBy ?? ''}>
                  <SelectTrigger className="bg-muted/30 border-none"><SelectValue placeholder="Select Supervisor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {users.map((u) => <SelectItem key={u.id} value={u.name || u.email}>{u.name || u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Start Date</Label>
                <div className="relative"><CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="startDate" name="startDate" type="date" defaultValue={editingProject?.startDate ?? ''} className="bg-muted/30 border-none pl-9" /></div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">End Date</Label>
                <div className="relative"><CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="endDate" name="endDate" type="date" defaultValue={editingProject?.endDate ?? ''} className="bg-muted/30 border-none pl-9" /></div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="followUp" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Follow-up Notes</Label>
                <Textarea id="followUp" name="followUp" defaultValue={editingProject?.followUp ?? ''} placeholder="Next follow-up actions..." className="bg-muted/30 border-none focus-visible:ring-1" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted/30">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" className="shadow-lg shadow-primary/20 px-8">{editingProject ? 'Save Changes' : 'Create Project'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-Component: Quick Edit Popover ───────────────────────────────────────

function QuickEditPopover({ task, section, onUpdate, disabled }: { task: Task; section: 'task' | 'output' | 'nextStep'; onUpdate: (taskId: string, section: string, values: TaskSubField) => Promise<void>; disabled?: boolean }) {
  const data = task[section];
  const [values, setValues] = useState(data);
  if (disabled) return null;
  return (
    <Popover>
      <PopoverTrigger className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary inline-flex items-center justify-center rounded-md hover:bg-muted cursor-pointer">
        <Edit2 className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-5 shadow-2xl border-none glass-card" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-muted/20">
            <Edit2 className="w-3 h-3 text-primary" />
            <h4 className="font-bold text-[10px] uppercase tracking-widest">Update {section === 'nextStep' ? 'Next Step' : section}</h4>
          </div>
          <div className="space-y-2">
            <Label className="text-[9px] font-bold uppercase text-muted-foreground">Description</Label>
            <Textarea value={values.what} onChange={(e) => setValues({ ...values, what: e.target.value })} className="min-h-[60px] text-xs bg-muted/30 border-none resize-none" placeholder="What needs to be done?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Person</Label>
              <Input value={values.who} onChange={(e) => setValues({ ...values, who: e.target.value })} className="h-8 text-xs bg-muted/30 border-none" placeholder="Name" />
            </div>
            <div className="space-y-2">
              <Label className="text-[9px] font-bold uppercase text-muted-foreground">Date</Label>
              <Input type="date" value={values.when} onChange={(e) => setValues({ ...values, when: e.target.value })} className="h-8 text-xs bg-muted/30 border-none" />
            </div>
          </div>
          <Button className="w-full h-9 text-xs font-bold shadow-lg shadow-primary/10" onClick={() => onUpdate(task.id, section, values)}>Save Changes</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Module: Task Management ──────────────────────────────────────────────────

function TaskManagementModule({ projects, tasks, user, isAdmin, onMutate }: { projects: Project[]; tasks: Task[]; user: SessionUser; isAdmin: boolean; onMutate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [projectFilter, setProjectFilter] = useState<string>('Mine');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [dateFilterField, setDateFilterField] = useState<'task' | 'nextStep' | 'createdAt' | 'updatedAt'>('task');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [updatingTaskProgress, setUpdatingTaskProgress] = useState<Task | null>(null);

  const assignees = Array.from(new Set(tasks.flatMap((t) => [t.task.who, t.output.who, t.nextStep.who]).filter(Boolean))).sort();

  const filteredTasks = tasks.filter((task) => {
    const project = projects.find((p) => p.id === task.projectId);
    const matchesStatus = statusFilter === 'All' || task.status === statusFilter;
    const matchesProject = 
      projectFilter === 'All' || 
      (projectFilter === 'Mine' 
        ? project?.supervisedBy === (user.name || user.email) 
        : task.projectId === projectFilter);
    const matchesAssignee = assigneeFilter === 'All' || task.task.who === assigneeFilter || task.output.who === assigneeFilter || task.nextStep.who === assigneeFilter;
    let matchesDate = true;
    let dateToCompare = '';
    if (dateFilterField === 'task') dateToCompare = task.task.when;
    else if (dateFilterField === 'nextStep') dateToCompare = task.nextStep.when;
    else if (dateFilterField === 'createdAt' && task.createdAt) { try { dateToCompare = format(new Date(task.createdAt), 'yyyy-MM-dd'); } catch (e) { /* ignore */ } }
    else if (dateFilterField === 'updatedAt' && task.updatedAt) { try { dateToCompare = format(new Date(task.updatedAt), 'yyyy-MM-dd'); } catch (e) { /* ignore */ } }
    if (dateRangeStart && dateToCompare) matchesDate = matchesDate && dateToCompare >= dateRangeStart;
    if (dateRangeEnd && dateToCompare) matchesDate = matchesDate && dateToCompare <= dateRangeEnd;
    if ((dateRangeStart || dateRangeEnd) && !dateToCompare) matchesDate = false;
    return matchesStatus && matchesProject && matchesAssignee && matchesDate;
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      projectId: formData.get('projectId') as string,
      task: { what: formData.get('task_what') as string, when: formData.get('task_when') as string, who: formData.get('task_who') as string },
      output: { what: formData.get('output_what') as string, when: formData.get('output_when') as string, who: formData.get('output_who') as string },
      nextStep: { what: formData.get('next_what') as string, when: formData.get('next_when') as string, who: formData.get('next_who') as string },
      notes: formData.get('notes') as string,
      status: formData.get('status') as string,
      progress: parseInt(formData.get('progress') as string || '0', 10),
    };
    try {
      if (editingTask) {
        await apiCall(`/api/tasks/${editingTask.id}`, 'PUT', data);
        toast.success('Task updated successfully');
      } else {
        await apiCall('/api/tasks', 'POST', data);
        toast.success('Task added successfully');
      }
      setIsAdding(false); setEditingTask(null); onMutate();
    } catch (error: any) { toast.error(error.message || 'Operation failed'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiCall(`/api/tasks/${id}`, 'DELETE');
      toast.success('Task deleted'); setTaskToDelete(null); onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleStatusChange = async (id: string, newStatus: 'To Do' | 'In Progress' | 'Done') => {
    try {
      const updates: any = { status: newStatus };
      if (newStatus === 'Done') updates.progress = 100;
      if (newStatus === 'To Do') updates.progress = 0;
      await apiCall(`/api/tasks/${id}`, 'PUT', updates);
      toast.success(`Status updated to ${newStatus}`); onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleProgressChange = async (id: string, newProgress: number) => {
    try {
      const updates: any = { progress: newProgress };
      if (newProgress === 100) updates.status = 'Done';
      else if (newProgress > 0) updates.status = 'In Progress';
      else updates.status = 'To Do';
      await apiCall(`/api/tasks/${id}`, 'PUT', updates);
      onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleQuickUpdate = async (taskId: string, section: string, values: TaskSubField) => {
    try {
      await apiCall(`/api/tasks/${taskId}`, 'PUT', { [section]: values });
      toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} updated`); onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const handleProgressUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!updatingTaskProgress) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      output: { what: formData.get('output_what') as string, who: formData.get('output_who') as string, when: updatingTaskProgress.output.when || format(new Date(), 'yyyy-MM-dd') },
      nextStep: { what: formData.get('next_what') as string, when: formData.get('next_when') as string, who: updatingTaskProgress.nextStep.who || updatingTaskProgress.task.who },
    };
    try {
      await apiCall(`/api/tasks/${updatingTaskProgress.id}`, 'PUT', data);
      toast.success('Task progress updated successfully');
      setUpdatingTaskProgress(null);
      onMutate();
    } catch (error: any) { toast.error(error.message || 'Failed to update progress'); }
  };

  const handlePromoteTask = async (task: Task) => {
    if (!task.nextStep.what) return;
    try {
      await apiCall(`/api/tasks/${task.id}`, 'PUT', {
        task: { what: task.nextStep.what, when: task.nextStep.when || format(new Date(), 'yyyy-MM-dd'), who: task.nextStep.who || task.task.who },
        output: { what: '', when: '', who: '' },
        nextStep: { what: '', when: '', who: '' },
        status: 'To Do',
        progress: 0,
      });
      toast.success('Next step promoted to current task!'); onMutate();
    } catch (error: any) { toast.error(error.message); }
  };

  const [hasCheckedAutoPromote, setHasCheckedAutoPromote] = useState(false);

  useEffect(() => {
    if (!hasCheckedAutoPromote && tasks.length > 0) {
      const runAutoPromote = async () => {
        try {
          const res = await apiCall('/api/tasks/auto-promote', 'POST', {});
          if (res.count > 0) {
            toast.success(`Today's focus updated: ${res.count} next steps were automatically promoted to current tasks.`);
            onMutate();
          }
          setHasCheckedAutoPromote(true);
        } catch (e) {
          console.error('Auto-promote failed', e);
        }
      };
      runAutoPromote();
    }
  }, [tasks.length, hasCheckedAutoPromote]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Manage and track project deliverables.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border">
            {['All', 'To Do', 'In Progress', 'Done'].map((s) => (
              <Button key={s} variant={statusFilter === s ? 'secondary' : 'ghost'} size="sm" onClick={() => setStatusFilter(s)} className="h-8 text-xs">{s}</Button>
            ))}
          </div>
          <Select value={projectFilter} onValueChange={(v) => setProjectFilter(v ?? 'All')}>
            <SelectTrigger className="w-[180px] bg-white border-gray-200">
              <div className="flex items-center gap-2 overflow-hidden truncate">
                <Briefcase className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {projectFilter === 'All' 
                    ? 'All Projects' 
                    : projectFilter === 'Mine'
                    ? 'My Projects'
                    : projects.find(p => p.id === projectFilter)?.name || projectFilter}
                </span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Projects</SelectItem>
              <SelectItem value="Mine">My Projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-9 border-gray-200 bg-white')}>
              <Filter className="w-4 h-4 mr-2" /> More Filters
              {(assigneeFilter !== 'All' || dateRangeStart || dateRangeEnd) && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px] bg-primary text-primary-foreground">
                  {[assigneeFilter !== 'All', dateRangeStart, dateRangeEnd].filter(Boolean).length}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 space-y-4" align="end">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Assignee</Label>
                <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v ?? 'All')}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Assignees" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Assignees</SelectItem>
                    {assignees.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Date Filter Type</Label>
                <div className="grid grid-cols-2 gap-1 bg-muted p-1 rounded-md">
                  {(['task', 'nextStep', 'createdAt', 'updatedAt'] as const).map((f) => (
                    <button key={f} onClick={() => setDateFilterField(f)} className={cn('py-1 text-[9px] font-bold rounded transition-all', dateFilterField === f ? 'bg-white shadow-sm' : 'text-muted-foreground')}>
                      {f === 'task' ? 'Task Date' : f === 'nextStep' ? 'Next Step' : f === 'createdAt' ? 'Created At' : 'Updated At'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">From</Label><Input type="date" value={dateRangeStart} onChange={(e) => setDateRangeStart(e.target.value)} className="h-8 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">To</Label><Input type="date" value={dateRangeEnd} onChange={(e) => setDateRangeEnd(e.target.value)} className="h-8 text-xs" /></div>
              </div>
              <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-muted-foreground" onClick={() => { setAssigneeFilter('All'); setDateRangeStart(''); setDateRangeEnd(''); }}>Reset Filters</Button>
            </PopoverContent>
          </Popover>
          <Button onClick={() => { setEditingTask(null); setSelectedProjectId(projects[0]?.id || ''); setIsAdding(true); }} disabled={projects.length === 0} className="shadow-md">
            <PlusCircle className="w-4 h-4 mr-2" /> New Task
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-muted-foreground" /></div>
            <h3 className="text-xl font-bold">No Projects Found</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2 mb-8">Create a project first to start adding tasks.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-20 bg-muted/5 rounded-xl border border-dashed"><p className="text-muted-foreground">No tasks found matching your filters.</p></div>
          ) : filteredTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            return (
              <Card key={task.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group bg-white">
                <div className="flex flex-col">
                  <div className="px-6 py-3 border-b flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-[11px] bg-white border-primary/20 text-primary px-2 py-0 h-5">{project?.projectId || '???'}</Badge>
                      <span className="text-sm font-bold text-gray-800 tracking-tight">{project?.name || 'Deleted Project'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                        {(isAdmin || task.createdBy === user.id) && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTask(task); setSelectedProjectId(task.projectId); setIsAdding(true); }}><Edit2 className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setTaskToDelete(task.id)}><Trash2 className="h-3 w-3" /></Button>
                          </>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-[10px] font-bold uppercase tracking-wider border-blue-200 text-blue-700 hover:bg-blue-50 bg-white" onClick={() => setUpdatingTaskProgress(task)}>
                        Update Progress
                      </Button>
                      <Select value={task.status} onValueChange={(val: any) => handleStatusChange(task.id, val)}>
                        <SelectTrigger className={cn('h-7 text-[10px] font-bold uppercase tracking-wider px-3 border-none shadow-none', task.status === 'Done' && 'bg-green-100 text-green-700', task.status === 'In Progress' && 'bg-blue-100 text-blue-700', task.status === 'To Do' && 'bg-slate-100 text-slate-700')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="To Do">To Do</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="group/task-item">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <h3 className="text-base leading-snug">
                              <span className="font-bold text-gray-900 uppercase tracking-tight text-xs mr-2">Task:</span>
                              <span className="font-bold text-gray-800">{task.task.what}</span>
                            </h3>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><UserIcon className="w-3.5 h-3.5" /> {task.task.who}</div>
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarIcon className="w-3.5 h-3.5" /> {task.task.when ? format(parseISO(task.task.when), 'MMM d, yyyy') : 'No date'}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group/task-item p-4 rounded-xl bg-blue-50/20 border border-blue-100/30">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-blue-700 uppercase tracking-tight text-[10px]">Output:</span>
                              {task.output.who && <span className="text-[10px] text-blue-600/60 font-medium">By {task.output.who}</span>}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{task.output.what || 'No output recorded yet.'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="group/task-item p-4 rounded-xl bg-green-50/20 border border-green-100/30">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-bold text-green-700 uppercase tracking-tight text-[10px]">Next Step:</span>
                              {task.nextStep.when && (
                                <span className={cn('text-[10px] font-bold flex items-center gap-1', (isToday(parseISO(task.nextStep.when)) || isPast(parseISO(task.nextStep.when))) ? 'text-orange-600' : 'text-green-600/60')}>
                                  Due {format(parseISO(task.nextStep.when), 'MMM d')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium">{task.nextStep.what || 'No next step defined.'}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {task.nextStep.what && (
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] font-bold text-green-700 hover:bg-green-100 opacity-0 group-hover/task-item:opacity-100 transition-opacity" onClick={() => handlePromoteTask(task)}>Promote</Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {task.notes && (
                        <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-100/40">
                          <span className="font-bold text-amber-700 uppercase tracking-tight text-[10px] block mb-1">Notes:</span>
                          <p className="text-xs text-amber-900/80 italic leading-relaxed">{task.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <div className="px-6 py-3 bg-gray-50/50 border-t flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-3">
                      <input type="range" min="0" max="100" step="5" value={task.progress || 0} onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))} className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary" />
                      <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{task.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${task.progress || 0}%` }} className={cn('h-full', task.status === 'Done' ? 'bg-green-500' : task.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-300')} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Progress Update Dialog */}
      <Dialog open={!!updatingTaskProgress} onOpenChange={(open) => !open && setUpdatingTaskProgress(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl glass-card">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Edit3 className="w-4 h-4" /></div>
                Update Task Progress
              </DialogTitle>
              <DialogDescription className="text-muted-foreground ml-9">Record results and define the next milestone.</DialogDescription>
            </DialogHeader>
          </div>
          <form key={updatingTaskProgress?.id || 'none'} onSubmit={handleProgressUpdateSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-xl bg-blue-50/30 border border-blue-100/50 space-y-4 h-full">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-700 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Output Info</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">What was achieved?</Label>
                    <Textarea name="output_what" defaultValue={updatingTaskProgress?.output.what} placeholder="Summary of results..." className="min-h-[140px] text-sm bg-white border-blue-100/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">By Whom?</Label>
                    <Input name="output_who" defaultValue={updatingTaskProgress?.output.who || user.name || ''} placeholder="Person name" className="h-10 text-sm bg-white border-blue-100/50" />
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-green-50/30 border border-green-100/50 space-y-4 h-full">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-green-700 flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Next Step</h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mission</Label>
                    <Textarea name="next_what" defaultValue={updatingTaskProgress?.nextStep.what} placeholder="What's the next goal?" className="min-h-[140px] text-sm bg-white border-green-100/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">Deadline</Label>
                    <Input name="next_when" type="date" defaultValue={updatingTaskProgress?.nextStep.when} className="h-10 text-sm bg-white border-green-100/50" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted/20">
              <Button type="button" variant="ghost" onClick={() => setUpdatingTaskProgress(null)}>Cancel</Button>
              <Button type="submit" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 px-8">Save Progress</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl bg-white rounded-2xl">
          <div className="bg-gray-50 px-8 py-6 border-b">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">{editingTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
              <DialogDescription>Fill in the details below to track this project deliverable.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Project</Label>
                {projects.length > 0 ? (
                  <Select name="projectId" value={selectedProjectId} onValueChange={(val) => setSelectedProjectId(val ?? '')} required>
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Select project">
                        {projects.find(p => p.id === selectedProjectId)?.name}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <div className="h-10 w-full animate-pulse bg-gray-100 rounded-md" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Status</Label>
                <Select name="status" defaultValue={editingTask?.status || 'To Do'} required>
                  <SelectTrigger className="bg-gray-50 border-gray-200"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Progress</Label>
                  <span className="text-[10px] font-bold text-primary">{editingTask?.progress || 0}%</span>
                </div>
                <Input name="progress" type="range" min="0" max="100" step="5" defaultValue={editingTask?.progress || 0} className="h-8 p-0 border-none bg-transparent accent-primary" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-gray-50/50 space-y-4">
                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Core Task</h4>
                <Input name="task_what" defaultValue={editingTask?.task.what} required placeholder="What needs to be done?" className="bg-white" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><Label className="text-[10px] font-bold text-muted-foreground">Assignee</Label><Input name="task_who" defaultValue={editingTask?.task.who} placeholder="Who is responsible?" className="bg-white h-9" /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-bold text-muted-foreground">Due Date</Label><Input name="task_when" type="date" defaultValue={editingTask?.task.when} className="bg-white h-9" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/20 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Output</h4>
                  <Input name="output_what" defaultValue={editingTask?.output.what} placeholder="Latest result" className="bg-white" />
                  <Input name="output_who" defaultValue={editingTask?.output.who} placeholder="Output by" className="bg-white h-9" />
                </div>
                <div className="p-4 rounded-xl border border-green-100 bg-green-50/20 space-y-4">
                  <h4 className="text-xs font-bold uppercase text-green-600 flex items-center gap-2"><ChevronRight className="w-4 h-4" /> Next Step</h4>
                  <Input name="next_what" defaultValue={editingTask?.nextStep.what} placeholder="What's next?" className="bg-white" />
                  <Input name="next_when" type="date" defaultValue={editingTask?.nextStep.when} className="bg-white h-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Internal Notes</Label>
                <Textarea name="notes" defaultValue={editingTask?.notes} placeholder="Any additional context..." className="bg-gray-50 border-gray-200 min-h-[100px]" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" className="px-8">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>Are you sure you want to delete this task? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setTaskToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => taskToDelete && handleDelete(taskToDelete)}>Delete Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Module: Reporting ────────────────────────────────────────────────────────

function ReportingModule({ projects, tasks }: { projects: Project[]; tasks: Task[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'report'>('dashboard');
  const filteredProjects = projects
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.projectId.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.projectId.localeCompare(b.projectId, undefined, { numeric: true, sensitivity: 'base' }));
  const statusData = [
    { name: 'To Do', value: tasks.filter((t) => t.status === 'To Do').length, color: '#64748b' },
    { name: 'In Progress', value: tasks.filter((t) => t.status === 'In Progress').length, color: '#2563eb' },
    { name: 'Done', value: tasks.filter((t) => t.status === 'Done').length, color: '#16a34a' },
  ].filter((d) => d.value > 0);
  const projectsWithTaskCount = projects.map((p) => ({ name: p.name, tasks: tasks.filter((t) => t.projectId === p.id).length })).slice(0, 5);

  const handleExportExcel = () => {
    const table = document.querySelector('.progress-report-table');
    if (!table) { toast.error('No report content found'); return; }

    // Clone table to modify for export
    const exportTable = table.cloneNode(true) as HTMLTableElement;
    
    // Create a title row
    const titleRow = exportTable.insertRow(0);
    const titleCell = titleRow.insertCell(0);
    titleCell.colSpan = exportTable.rows[1].cells.length;
    titleCell.innerHTML = "AI Project Progress";
    titleCell.className = "bg-header";

    const tableHtml = exportTable.outerHTML;

    const template = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <style>
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #9ca3af; padding: 8px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; }
          .bg-header { background-color: #c5e0b4; font-weight: bold; color: #385723; font-size: 16px; text-align: left; border: 1px solid #9ca3af; height: 40px; }
          .bg-th { background-color: #d9e2f3; font-weight: bold; color: #000000; }
          .bg-pii { background-color: #92d050; text-align: center; font-weight: bold; color: #000000; }
          .bg-yellow { background-color: #fff2cc; color: #000000; }
          .font-bold { font-weight: bold; }
          .text-center { text-align: center; }
          .align-middle { vertical-align: middle; }
          .text-gray-600 { color: #4b5563; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-800 { color: #1f2937; }
          .text-green-700 { color: #15803d; }
          .font-medium { font-weight: 500; }
        </style>
      </head>
      <body>
        ${tableHtml}
      </body>
      </html>
    `;

    const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `progress_report_${format(new Date(), 'yyyy-MM-dd')}.xls`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported to Excel');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reporting</h2>
          <p className="text-muted-foreground">Comprehensive overview and detailed progress reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted p-1 rounded-lg">
            <Button variant={view === 'dashboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('dashboard')} className={cn('h-8', view === 'dashboard' && 'bg-white shadow-sm')}>Dashboard</Button>
            <Button variant={view === 'report' ? 'secondary' : 'ghost'} size="sm" onClick={() => setView('report')} className={cn('h-8', view === 'report' && 'bg-white shadow-sm')}>Progress Report</Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel} disabled={view !== 'report'} className="border-green-600/20 text-green-700 hover:bg-green-50">
              <Download className="w-4 h-4 mr-2" /> Export Excel
            </Button>
            <Button onClick={() => window.print()}><ArrowUpRight className="w-4 h-4 mr-2" /> Export PDF</Button>
          </div>
        </div>
      </div>

      {view === 'dashboard' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Projects', value: projects.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Tasks', value: tasks.filter((t) => t.status !== 'Done').length, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Completed', value: tasks.filter((t) => t.status === 'Done').length, icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Team Members', value: new Set(tasks.map((t) => t.task.who)).size, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((stat, i) => (
              <Card key={i} className="glass-card border-none shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn('p-2 rounded-lg', stat.bg)}><stat.icon className={cn('w-5 h-5', stat.color)} /></div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 glass-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Project Workload</CardTitle>
                <CardDescription>Tasks distributed across top 5 projects</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsWithTaskCount}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="tasks" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="glass-card border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Task Status</CardTitle>
                <CardDescription>Overall progress distribution</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col items-center justify-center">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>No task data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filter projects..." className="pl-9 bg-muted/50 border-none h-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">Tip: Use Ctrl+P to save as PDF</p>
          </div>
          <Card className="border border-gray-300 shadow-none overflow-hidden bg-white print:border-none">
            <div className="bg-[#c5e0b4] p-2 border-b border-gray-300">
              <h1 className="text-lg font-bold text-[#385723] tracking-tight">AI Project Progress</h1>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px] leading-tight progress-report-table">
                <thead>
                  <tr className="bg-[#d9e2f3] text-left font-bold bg-th">
                    <th className="border border-gray-400 p-1.5 w-16 text-center bg-th">PII</th>
                    <th className="border border-gray-400 p-1.5 w-56 bg-th">Project Name</th>
                    <th className="border border-gray-400 p-1.5 w-44 bg-th">Client</th>
                    <th className="border border-gray-400 p-1.5 w-40 bg-th">Supervised By</th>
                    <th className="border border-gray-400 p-1.5 w-56 bg-th">Professional Engagement</th>
                    <th className="border border-gray-400 p-1.5 bg-th">Progress (Till {format(new Date(), 'dd-MM-yyyy')})</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const projectTasks = tasks.filter((t) => t.projectId === project.id);
                    return (
                      <tr key={project.id} className="align-top">
                        <td className="border border-gray-400 p-1.5 bg-[#92d050] font-bold text-center align-middle bg-pii">{project.projectId}</td>
                        <td className="border border-gray-400 p-1.5 bg-[#fff2cc] bg-yellow">
                          <div className="font-bold text-[12px]">{project.name}</div>
                          <div className="text-[10px] text-gray-600 mt-0.5">({project.category})</div>
                        </td>
                        <td className="border border-gray-400 p-1.5 text-center bg-white align-middle">
                          <div className="font-bold">{project.clientCompany}</div>
                          <div className="text-[10px] text-gray-500">{project.clientName}</div>
                        </td>
                        <td className="border border-gray-400 p-1.5 text-center bg-white align-middle">
                          <div className="font-bold">{project.supervisedBy || 'None'}</div>
                        </td>
                        <td className="border border-gray-400 p-1.5 bg-[#fff2cc] bg-yellow">
                          <div className="font-medium">{project.kam} (Follow Up)</div>
                          {Array.from(new Set(projectTasks.map((t) => t.task.who))).filter((who) => who && who !== project.kam).map((who, idx) => (
                            <div key={idx} className="text-[10px]">{who}</div>
                          ))}
                        </td>
                        <td className="border border-gray-400 p-1.5 bg-[#fff2cc] bg-yellow">
                          <div className="space-y-2">
                            {projectTasks.length > 0 ? projectTasks.map((task, idx) => (
                              <div key={task.id} className="space-y-0.5">
                                {(() => {
                                  const isUpdatedToday = task.updatedAt ? isToday(new Date(task.updatedAt)) : false;
                                  const style = isUpdatedToday ? { color: '#15803d', fontWeight: 'bold' } : { color: '#1f2937' };
                                  return (
                                    <>
                                      <div style={style}>{projectTasks.length > 1 ? `${idx + 1}. ` : ''}<span style={{ fontWeight: 'bold' }}>Task:</span> {task.task.what}</div>
                                      {task.output.what && <div style={style}><span style={{ fontWeight: 'bold' }}>Output:</span> {task.output.what}</div>}
                                      {task.nextStep.what && <div style={style}><span style={{ fontWeight: 'bold' }}>Next Step:</span> {task.nextStep.what}</div>}
                                    </>
                                  );
                                })()}
                              </div>
                            )) : <div className="text-gray-400 italic">No progress recorded.</div>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Module: User Management ──────────────────────────────────────────────────

function UserManagementModule({ users, onMutate }: { users: AppUser[]; onMutate: () => void }) {
  const [isAdding, setIsAdding] = useState(false);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    try {
      await apiCall('/api/users', 'POST', data);
      toast.success('User created successfully');
      setIsAdding(false);
      onMutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (id: string, newRole: 'admin' | 'user') => {
    try {
      await apiCall(`/api/users/${id}`, 'PUT', { role: newRole });
      toast.success('User role updated');
      onMutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await apiCall(`/api/users/${id}`, 'DELETE');
      toast.success('User deleted');
      onMutate();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage system users and their access levels.</p>
        </div>
        <Button onClick={() => setIsAdding(true)}>
          <PlusCircle className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl glass-card">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Add New User</DialogTitle>
              <DialogDescription className="text-muted-foreground">Create a fresh account for a team member.</DialogDescription>
            </DialogHeader>
          </div>
          <form onSubmit={handleCreateUser} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Doe" className="bg-muted/30 border-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</Label>
              <Input id="email" name="email" type="email" required placeholder="john@example.com" className="bg-muted/30 border-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Password</Label>
              <Input id="password" name="password" type="password" required placeholder="••••••••" className="bg-muted/30 border-none" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Role</Label>
              <Select name="role" defaultValue="user">
                <SelectTrigger className="bg-muted/30 border-none"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-muted/20">
              <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" className="shadow-lg shadow-primary/20 px-8">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[300px]">User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <img src={u.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} alt="" className="w-8 h-8 rounded-full" />
                    <span>{u.name}</span>
                  </div>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(val: any) => handleRoleChange(u.id, val)}>
                    <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy') : 'N/A'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteUser(u.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
