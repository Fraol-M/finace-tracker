import React from 'react';
import { UserAccount } from '../types';
import { 
  LayoutDashboard, 
  Table, 
  Calendar, 
  Wallet,
  Users, 
  LogOut, 
  Fingerprint, 
  X,
  Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentUser: UserAccount;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  onOpenChat?: () => void;
}

export default function Sidebar({
  currentUser,
  activeTab,
  setActiveTab,
  handleLogout,
  isMobileSidebarOpen,
  setIsMobileSidebarOpen,
  onOpenChat
}: SidebarProps) {
  
  // Render active class names dynamically to avoid inline duplications
  const getButtonClass = (tabName: string) => {
    const isSelected = activeTab === tabName;
    return `w-full flex items-center gap-3 px-4 py-3 rounded text-xs uppercase font-mono tracking-wider transition-all cursor-pointer ${
      isSelected
        ? 'text-[#4edea3] font-bold border-r-4 border-[#4edea3] bg-[#4edea3]/5'
        : 'text-[#bbcabf] hover:text-white hover:bg-white/5'
    }`;
  };

  const handleTabClick = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileSidebarOpen(false);
  };

  const renderNavContent = () => {
    if (currentUser.role === 'user') {
      return (
        <>
          <button 
            id="linkDashboard"
            onClick={() => handleTabClick('dashboard')}
            className={getButtonClass('dashboard')}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button 
            id="linkTable"
            onClick={() => handleTabClick('table')}
            className={getButtonClass('table')}
          >
            <Table className="w-4 h-4" />
            <span>Table</span>
          </button>

          <button 
            id="linkYearly"
            onClick={() => handleTabClick('yearly')}
            className={getButtonClass('yearly')}
          >
            <Calendar className="w-4 h-4" />
            <span>Yearly</span>
          </button>

          <button 
            id="linkBudget"
            onClick={() => handleTabClick('budget')}
            className={getButtonClass('budget')}
          >
            <Wallet className="w-4 h-4" />
            <span>Budget</span>
          </button>

          {/* AI Assistant divider + button */}
          <div className="my-3 border-t border-white/5" />
          <button 
            id="linkAI"
            onClick={() => { onOpenChat?.(); setIsMobileSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-xs uppercase font-mono tracking-wider transition-all cursor-pointer text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#4edea3]/5 group"
          >
            <Sparkles className="w-4 h-4 group-hover:text-[#4edea3]" />
            <span>AI Assistant</span>
          </button>
        </>
      );
    } else {
      return (
        <button 
          id="linkUsers"
          onClick={() => handleTabClick('users')}
          className={getButtonClass('users')}
        >
          <Users className="w-4 h-4" />
          <span>User List</span>
        </button>
      );
    }
  };

  return (
    <>
      {/* 1. SIDEBAR NAVIGATION - DESKTOP VIEW */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-[#201f1f] border-r border-white/5 shadow-lg flex flex-col py-6 px-4 z-40 hidden md:flex" id="sidebar-desktop">
        {/* Brand/Logo header */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded bg-[#4edea3]/20 flex items-center justify-center border border-[#4edea3]/30">
            <Fingerprint className="text-[#4edea3] w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-md tracking-tight text-[#4edea3]">FinPrecision</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#bbcabf] opacity-70">
              {currentUser.role === 'admin' ? 'Luminous Ledger' : 'Wealth Management'}
            </p>
          </div>
        </div>

        {/* Dynamic Nav link selections based on authentication role */}
        <nav className="flex-1 space-y-1.5">
          {renderNavContent()}
        </nav>

        {/* Logout bottom component */}
        <div className="border-t border-white/5 pt-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs uppercase font-mono text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TRIGGER DRAWER SIDEBAR CONTAINER */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" id="sidebar-mobile-container">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsMobileSidebarOpen(false)}
          ></div>
          
          <aside className="relative w-64 bg-[#201f1f] h-full flex flex-col p-6 border-r border-[#ffffff]/5">
            <div 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white" 
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="w-5 h-5 cursor-pointer" />
            </div>

            <div className="mb-8 flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded bg-[#4edea3]/20 flex items-center justify-center border border-[#4edea3]/30">
                <Fingerprint className="text-[#4edea3] w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-[#4edea3]">FinPrecision</h1>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#bbcabf] opacity-70">
                  {currentUser.role === 'admin' ? 'Luminous Ledger' : 'Wealth Management'}
                </p>
              </div>
            </div>

            <nav className="flex-1 space-y-1.5">
              {renderNavContent()}
            </nav>

            <div className="border-t border-[#ffffff]/5 pt-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs uppercase font-mono text-zinc-400 hover:text-rose-400 hover:bg-rose-500/5 transition-all text-left cursor-pointer font-sans"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
