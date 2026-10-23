import React, { useState, useEffect } from 'react';
import {
  School,
  LayoutDashboard,
  ScanLine,
  Users,
  ClipboardList,
  Cpu,
  Key,
  LogOut,
  Clock,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { AdminCredential } from '../types';

export type NavTab = 'dashboard' | 'terminal' | 'users' | 'attendance' | 'java_bridge';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentAdmin: AdminCredential | null;
  onOpenAdminSettings: () => void;
  onLogout: () => void;
  activeDoorAlertsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  currentAdmin,
  onOpenAdminSettings,
  onLogout,
  activeDoorAlertsCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'terminal' as NavTab, label: 'Door Terminal & RFID', icon: ScanLine },
    { id: 'users' as NavTab, label: 'Student & Faculty Directory', icon: Users },
    { id: 'attendance' as NavTab, label: 'Attendance Logs', icon: ClipboardList },
    { id: 'java_bridge' as NavTab, label: 'Java IoT Bridge', icon: Cpu },
  ];

  return (
    <header className="bg-[#58111A] text-[#F5F2EB] shadow-lg border-b border-[#722F37] sticky top-0 z-40">
      {/* Top institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 border-b border-[#722F37]/60 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#722F37] flex items-center justify-center border border-[#8C3B45] overflow-hidden p-0.5 shadow-sm">
                <img src="/pragati_logo.svg" alt="Pragati University Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold tracking-wider text-white text-xs sm:text-sm">
                  PRAGATI UNIVERSITY
                </span>
                <span className="hidden md:inline-block ml-2 text-[#E8E2D5]/70 text-[11px]">
                  | Autonomous University & Research Campus
                </span>
              </div>
            </div>
          </div>

          {/* Time & System Status */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-[#E8E2D5] font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-[#E8E2D5]/80" />
              <span>{currentTime}</span>
              <span className="text-[#E8E2D5]/50">|</span>
              <span className="text-[11px] text-[#E8E2D5]/90">{currentDate}</span>
            </div>

            {/* Door Relays Live status badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#722F37] border border-[#8C3B45] text-[11px] font-medium text-[#F5F2EB]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline">Relay Grid:</span>
              <span className="font-semibold text-emerald-300">ONLINE</span>
            </div>
          </div>
        </div>

        {/* Main Navigation & Profile controls */}
        <div className="flex items-center justify-between py-2">
          {/* Tabs for desktop */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#722F37] text-white shadow-inner border border-[#8C3B45]'
                      : 'text-[#E8E2D5] hover:bg-[#722F37]/50 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5F2EB]' : 'text-[#E8E2D5]/80'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#722F37] text-white focus:outline-none cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="ml-2 font-bold text-xs text-[#E8E2D5] capitalize">
              {currentTab.replace('_', ' ')}
            </span>
          </div>

          {/* Admin Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            <button
              onClick={onOpenAdminSettings}
              title="Manage administrator credentials"
              className="px-3 py-1.5 rounded-xl bg-[#722F37]/70 hover:bg-[#722F37] text-xs font-semibold text-[#F5F2EB] border border-[#8C3B45] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Settings</span>
            </button>

            {currentAdmin && (
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#722F37]">
                <div className="w-7 h-7 rounded-full bg-[#E8E2D5] text-[#58111A] font-bold text-xs flex items-center justify-center">
                  {currentAdmin.fullName.slice(0, 1)}
                </div>
                <div className="text-left text-xs leading-tight">
                  <p className="font-bold text-white truncate max-w-[120px]">{currentAdmin.fullName}</p>
                  <p className="text-[10px] text-[#E8E2D5]/70">{currentAdmin.role}</p>
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Sign out of portal"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#4A0E17] hover:bg-[#380A11] text-[#F5F2EB] text-xs font-medium border border-[#6B1C28] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">Portal Exit</span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-[#722F37] space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#722F37] text-white'
                      : 'text-[#E8E2D5] hover:bg-[#722F37]/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
