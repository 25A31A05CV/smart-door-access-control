import React from 'react';
import {
  Users,
  LogIn,
  LogOut,
  UserCheck,
  Building2,
  BookOpen,
  Laptop,
  Home,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ScanLine,
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CollegeUser, AccessLog, LocationId, LOCATIONS } from '../types';
import { calculateAttendanceStats } from '../utils/accessControl';
import { NavTab } from './Navbar';

interface DashboardViewProps {
  users: CollegeUser[];
  logs: AccessLog[];
  onNavigate: (tab: NavTab) => void;
  onSelectUserForModal: (user: CollegeUser) => void;
  doorRelays: Record<LocationId, { isUnlocked: boolean; lastTriggered: string | null }>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  logs,
  onNavigate,
  onSelectUserForModal,
  doorRelays,
}) => {
  const stats = calculateAttendanceStats(users, logs);
  const recentLogs = logs.slice(0, 7);

  // Department breakdown
  const departments = ['Computer Science', 'Electronics & Communication', 'Mechanical Engineering', 'Information Technology', 'Biotechnology'];
  const deptStats = departments.map((dept) => {
    const deptUsers = users.filter((u) => u.department === dept);
    const presentCount = deptUsers.filter((u) => {
      // Check if user has granted entry today
      const today = new Date().toISOString().slice(0, 10);
      return logs.some((l) => l.userId === u.id && l.status === 'GRANTED' && l.direction === 'ENTRY' && l.timestamp.startsWith(today));
    }).length;
    const rate = deptUsers.length > 0 ? Math.round((presentCount / deptUsers.length) * 100) : 0;
    return { name: dept, total: deptUsers.length, present: presentCount, rate };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#58111A] via-[#722F37] to-[#4A0E17] rounded-2xl p-6 text-[#F5F2EB] shadow-lg border border-[#8C3B45] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8E2D5]/20 text-[#E8E2D5] text-xs font-semibold mb-2 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Automated Door Access Control & RFID Turnstile System
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Campus Access & Real-Time Attendance Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#E8E2D5]/90 mt-1 max-w-2xl leading-relaxed">
            Centralized monitoring for smart door solenoids, biometric face checkpoints, and automated collegiate attendance logs across all university academic blocks.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigate('terminal')}
            className="px-4 py-2.5 rounded-xl bg-[#F5F2EB] hover:bg-white text-[#58111A] font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <ScanLine className="w-4 h-4 text-[#722F37]" />
            <span>Open Door Scanner</span>
          </button>
          <button
            onClick={() => onNavigate('users')}
            className="px-4 py-2.5 rounded-xl bg-[#722F37]/80 hover:bg-[#722F37] text-white font-semibold text-xs border border-[#8C3B45] flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#E8E2D5]" />
            <span>Register Profile</span>
          </button>
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 rounded-xl bg-[#722F37]/80 hover:bg-[#722F37] text-white font-semibold text-xs border border-[#8C3B45] flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E8E2D5]" />
            <span>Attendance Table</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY LIVE COUNTERS - STRICT USER REQUIREMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Counter 1: Current Entry Count (Students/Teachers currently inside) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#722F37]">Currently Inside</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <LogIn className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#2D2A26] font-mono">
              {stats.currentInsideCount}
            </div>
            <p className="text-xs text-[#6B655D] mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Active individuals on campus premises</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#7A7368]">
            <span>Inside Capacity</span>
            <span className="font-semibold text-[#58111A]">
              {Math.round((stats.currentInsideCount / (stats.totalEnrolledStudents + stats.totalFacultyAndStaff)) * 100)}% occupied
            </span>
          </div>
        </div>

        {/* Counter 2: Current Exit Count */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#722F37]">Current Exit Count</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <LogOut className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#2D2A26] font-mono">
              {stats.currentExitCount}
            </div>
            <p className="text-xs text-[#6B655D] mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Total checkout scans recorded today</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#7A7368]">
            <span>Turnstile Checkouts</span>
            <span className="font-semibold text-[#58111A]">Regular clearance</span>
          </div>
        </div>

        {/* Counter 3: Total Enrolled Students */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#722F37]">Total Enrolled Students</span>
            <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#58111A] flex items-center justify-center border border-[#E2DACB]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#2D2A26] font-mono">
              {stats.totalEnrolledStudents}
            </div>
            <p className="text-xs text-[#6B655D] mt-1 flex items-center gap-1">
              <span>+ {stats.totalFacultyAndStaff} Faculty & Staff registered</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#7A7368]">
            <span>Active Database</span>
            <span className="font-semibold text-[#58111A]">Biometric Enrolled</span>
          </div>
        </div>

        {/* Counter 4: Total Students & Teachers Present Today */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#722F37]">Present Today</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-[#58111A] font-mono">
              {stats.totalPresentToday}
            </div>
            <p className="text-xs text-[#6B655D] mt-1 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{stats.attendanceRate}%</span>
              <span>of college community present</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#7A7368]">
            <span>Absent Count</span>
            <span className="font-semibold text-rose-600">{stats.totalAbsentToday} Students Absent</span>
          </div>
        </div>
      </div>

      {/* DOOR RELAYS LIVE CONTROLLER STATUS BAR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#722F37]" />
              <span>Door Access Checkpoints & Solenoid Status</span>
            </h2>
            <p className="text-xs text-[#6B655D]">Location-based hardware relays connected via college Java IoT controller</p>
          </div>
          <span className="text-xs text-[#7A7368] font-mono">Poll Cycle: 100ms</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(Object.keys(LOCATIONS) as LocationId[]).map((locId) => {
            const loc = LOCATIONS[locId];
            const relay = doorRelays[locId] || { isUnlocked: false, lastTriggered: null };
            const locIcon = locId === 'gate' ? Building2 : locId === 'lab' ? Laptop : locId === 'library' ? BookOpen : Home;
            const Icon = locIcon;

            return (
              <div
                key={locId}
                className={`p-4 rounded-xl border transition-all ${
                  relay.isUnlocked
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400'
                    : 'bg-[#FAF8F5] border-[#E2DACB]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${relay.isUnlocked ? 'bg-emerald-600 text-white' : 'bg-[#E8E2D5] text-[#58111A]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[#2D2A26] line-clamp-1">{loc.name}</h3>
                      <p className="text-[10px] text-[#7A7368] font-mono">{loc.code}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      relay.isUnlocked
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-[#E8E2D5] text-[#58111A]'
                    }`}
                  >
                    {relay.isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E8E2D5] flex items-center justify-between text-[11px] text-[#6B655D]">
                  <span className="text-[10px] font-mono">{loc.doorRelayChannel.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#7A7368]">
                    {relay.lastTriggered ? `Last: ${new Date(relay.lastTriggered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Standby'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DASHBOARD CHARTS & ACTIVITY FEED GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Attendance Visualizations & Department Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visual Attendance Summary Widget */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#722F37]" />
                  <span>Daily Attendance Summary & Attendance Rate</span>
                </h2>
                <p className="text-xs text-[#6B655D] mt-0.5">Automated verification statistics for today</p>
              </div>
              <div className="px-3 py-1 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-bold text-[#58111A]">
                Target: 85% Minimum
              </div>
            </div>

            {/* Attendance Progress Meter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] mb-5">
              <div className="text-center">
                <p className="text-xs text-[#7A7368] font-medium">Overall Attendance</p>
                <div className="text-2xl font-extrabold text-[#722F37] mt-1 font-mono">{stats.attendanceRate}%</div>
                <div className="w-full bg-[#E2DACB] rounded-full h-2 mt-2">
                  <div
                    className="bg-[#722F37] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, stats.attendanceRate)}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-center border-t sm:border-t-0 sm:border-l border-[#E2DACB] pt-2 sm:pt-0 sm:pl-3">
                <p className="text-xs text-[#7A7368] font-medium">Students Verified</p>
                <div className="text-2xl font-extrabold text-[#2D2A26] mt-1 font-mono">
                  {stats.totalPresentToday} / {stats.totalEnrolledStudents}
                </div>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                  Active at turnstiles
                </p>
              </div>

              <div className="text-center border-t sm:border-t-0 sm:border-l border-[#E2DACB] pt-2 sm:pt-0 sm:pl-3">
                <p className="text-xs text-[#7A7368] font-medium">Location Hits</p>
                <div className="text-2xl font-extrabold text-[#58111A] mt-1 font-mono">
                  {stats.todayLogsCount}
                </div>
                <p className="text-[11px] text-[#7A7368] mt-1">Total door cycles today</p>
              </div>
            </div>

            {/* Department Breakdown Bars */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#58111A] mb-3">
                Department-Wise Attendance Performance
              </h3>
              <div className="space-y-3">
                {deptStats.map((dept) => (
                  <div key={dept.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2D2A26]">{dept.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#6B655D] text-[11px]">
                          {dept.present} of {dept.total} present
                        </span>
                        <span className="font-mono font-bold text-[#722F37] w-10 text-right">{dept.rate}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#EFEBE3] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#722F37] to-[#8C3B45] transition-all duration-300"
                        style={{ width: `${Math.max(5, dept.rate)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location Entry Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB]">
            <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider mb-3">
              Door Location Traffic Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                <p className="text-[11px] font-semibold text-[#7A7368]">Main Gate</p>
                <p className="text-xl font-bold font-mono text-[#58111A] mt-1">{stats.gateEntriesToday}</p>
                <span className="text-[10px] text-emerald-600">Turnstiles</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                <p className="text-[11px] font-semibold text-[#7A7368]">Computer Lab</p>
                <p className="text-xl font-bold font-mono text-[#58111A] mt-1">{stats.labEntriesToday}</p>
                <span className="text-[10px] text-purple-600">Restricted Lab</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                <p className="text-[11px] font-semibold text-[#7A7368]">Central Library</p>
                <p className="text-xl font-bold font-mono text-[#58111A] mt-1">{stats.libraryEntriesToday}</p>
                <span className="text-[10px] text-blue-600">Study Halls</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] text-center">
                <p className="text-[11px] font-semibold text-[#7A7368]">Hostel Block</p>
                <p className="text-xl font-bold font-mono text-[#58111A] mt-1">{stats.hostelEntriesToday}</p>
                <span className="text-[10px] text-amber-600">Residency Gate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Activity Feed (Module 2 requirement) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1] mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#722F37]" />
                  <span>Quick Activity Feed</span>
                </h2>
                <p className="text-[11px] text-[#6B655D]">Live entries & exits log stream</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                LIVE
              </span>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#7A7368]">
                  No access events registered today yet.
                </div>
              ) : (
                recentLogs.map((log) => {
                  const isGranted = log.status === 'GRANTED';
                  const isEntry = log.direction === 'ENTRY';
                  const userObj = users.find((u) => u.id === log.userId);

                  return (
                    <div
                      key={log.id}
                      onClick={() => userObj && onSelectUserForModal(userObj)}
                      className="p-3 rounded-xl border border-[#E8E2D5] hover:border-[#722F37] bg-[#FAF8F5] transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={log.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={log.userName}
                          className="w-9 h-9 rounded-full object-cover border border-[#DDD5C7] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-[#2D2A26] truncate group-hover:text-[#722F37]">
                              {log.userName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                isGranted
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isGranted ? 'GRANTED' : 'DENIED'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#6B655D] mt-0.5">
                            <span className="font-mono font-medium text-[#58111A]">{log.rollNumber}</span>
                            <span>•</span>
                            <span className="truncate">{log.locationName}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#8C8275] mt-1.5">
                            <span className="flex items-center gap-1">
                              {isEntry ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                  <LogIn className="w-3 h-3" /> Entry
                                </span>
                              ) : (
                                <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                                  <LogOut className="w-3 h-3" /> Exit
                                </span>
                              )}
                              <span className="text-[#DDD5C7]">|</span>
                              <span>{log.verificationMethod.replace('_', ' ')}</span>
                            </span>
                            <span>
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0EBE1] mt-4">
            <button
              onClick={() => onNavigate('attendance')}
              className="w-full py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#E8E2D5] text-[#58111A] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-[#DDD5C7]"
            >
              <span>View Full Access Log Records</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
