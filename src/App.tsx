import React, { useState, useEffect } from 'react';
import { UserAccount, Transaction } from './types';
import { INITIAL_USERS } from './data';
import { FinanceProvider } from './data/financeData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TablePage from './components/TablePage';
import YearlyPage from './components/YearlyPage';
import AdminPage from './components/AdminPage';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import { 
  Settings, 
  Menu,
  LogOut,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { apiFetch } from './api/client';

export default function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('fp_token');
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const data = await apiFetch('/auth/me');
        setCurrentUser(data.user);
      } catch (err) {
        localStorage.removeItem('fp_token');
      } finally {
        setIsLoadingAuth(false);
      }
    };
    verifyAuth();

    const handleAuthExpired = () => setCurrentUser(null);
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Set default tabs based on user role upon login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        setActiveTab('users');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserAccount, token: string) => {
    localStorage.setItem('fp_token', token);
    setCurrentUser(user);
    setIsMobileSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('fp_token');
    setCurrentUser(null);
    setIsProfileMenuOpen(false);
    setIsMobileSidebarOpen(false);
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    // If we updated ourselves, reflect immediately in session
    if (currentUser && currentUser.id === updatedUser.id) {
      setCurrentUser(updatedUser);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-[#4edea3] font-mono animate-pulse">Loading...</div>
      </div>
    );
  }

  // Unauthenticated viewport
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  // Header display name computation
  const getHeaderTitle = () => {
    if (currentUser.role === 'admin') {
      return 'ADMINISTRATION / USER MANAGEMENT';
    }
    switch (activeTab) {
      case 'dashboard': return 'FINPRECISION DASHBOARD';
      case 'table': return 'MONTHLY TRANSACTIONS';
      case 'yearly': return 'YEARLY ANALYTICS';
      default: return 'FINPRECISION';
    }
  };

  return (
    <FinanceProvider userId={currentUser?.id}>
      <div className="min-h-screen bg-[#131313] text-[#e5e2e1] flex relative overflow-x-hidden font-sans select-none antialiased selection:bg-[#4edea3]/20 select-none">
        
        {/* SIDEBAR NAVIGATION CONTROLS */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleLogout={handleLogout}
          isMobileSidebarOpen={isMobileSidebarOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          onOpenChat={() => setIsChatOpen(true)}
        />

        {/* 2. MAIN CORE LAYOUT FRAME */}
        <main className="flex-1 flex flex-col md:ml-64 w-full relative min-h-screen pb-12">
          
          {/* Sticky Top Bar matching layouts exactly */}
          <header className="w-full sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 shadow-sm flex items-center justify-between h-16 px-6 md:px-10">
            
            {/* Mobile responsive toggle header */}
            <div className="md:hidden flex items-center gap-3">
              <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="text-[#9ea3a0] hover:text-white transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <span className="font-extrabold text-sm text-[#4edea3] tracking-tight">FinPrecision</span>
            </div>

            {/* Desktop display labels */}
            <div className="hidden md:block">
              <h2 className="text-[11px] font-mono tracking-widest text-[#bbcabf] font-semibold uppercase">
                {getHeaderTitle()}
              </h2>
            </div>

            {/* Top layout action widgets */}
            <div className="flex items-center gap-4 relative">
              
              {/* Account visual avatar profile section with floating dropdown menu */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-white/10 flex items-center justify-center text-[#4edea3] overflow-hidden hover:border-[#4edea3]/50 transition-colors cursor-pointer font-bold font-mono text-xs"
                >
                  {currentUser.username.slice(0, 1).toUpperCase()}
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl py-1 transform origin-top-right transition-all z-50 text-xs">
                    <div className="px-4 py-2 bg-white/[0.02]/50 border-b border-white/5 mb-1 text-zinc-400">
                      <p className="font-mono text-[10px] uppercase text-[#4edea3] tracking-wider font-semibold">Active Profile</p>
                      <p className="font-bold text-white tracking-tight truncate mt-0.5">{currentUser.fullName}</p>
                      <p className="font-mono text-[9px] truncate opacity-70">{currentUser.email}</p>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-[#ffb4ab] flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </header>

          {/* Dynamic active visual view partition container with light fluid animations padding */}
          <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
            {currentUser.role === 'user' && activeTab === 'dashboard' && (
              <Dashboard currentUser={currentUser} />
            )}

            {currentUser.role === 'user' && activeTab === 'table' && (
              <TablePage />
            )}

            {currentUser.role === 'user' && activeTab === 'yearly' && (
              <YearlyPage />
            )}

            {currentUser.role === 'admin' && activeTab === 'users' && (
              <AdminPage 
                onUpdateUser={handleUpdateUser} 
              />
            )}
          </div>

        </main>

        {/* Floating AI Assistant Button */}
        {currentUser.role === 'user' && (
          <button
            onClick={() => setIsChatOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4edea3] to-[#2ebd82] flex items-center justify-center shadow-lg shadow-[#4edea3]/30 hover:shadow-[#4edea3]/50 hover:scale-105 transition-all z-50 cursor-pointer ${isChatOpen ? 'hidden' : ''}`}
            title="Open AI Assistant"
          >
            <Sparkles className="w-6 h-6 text-[#003824]" />
          </button>
        )}

        {/* AI Chat Panel */}
        {currentUser.role === 'user' && (
          <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        )}
      </div>
    </FinanceProvider>
  );
}
