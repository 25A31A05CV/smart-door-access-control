import React, { useState } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  Laptop,
  BookOpen,
  Home,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  RefreshCw,
  FileSpreadsheet,
  UserCheck,
} from 'lucide-react';
import { AccessLog, CollegeUser, LocationId, LOCATIONS } from '../types';

interface AttendanceLogsViewProps {
  logs: AccessLog[];
  users: CollegeUser[];
  onSelectUserForModal: (user: CollegeUser) => void;
  onClearLogs?: () => void;
}

export const AttendanceLogsView: React.FC<AttendanceLogsViewProps> = ({
  logs,
  users,
  onSelectUserForModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      log.userName.toLowerCase().includes(query) ||
      log.rollNumber.toLowerCase().includes(query) ||
      log.department.toLowerCase().includes(query);

    const matchesLoc = locationFilter === 'ALL' || log.location === locationFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PRESENT' && log.status === 'GRANTED' && log.direction === 'ENTRY') ||
      (statusFilter === 'DENIED' && log.status === 'DENIED') ||
      (statusFilter === 'EXITED' && log.status === 'GRANTED' && log.direction === 'EXIT');

    const matchesDir = directionFilter === 'ALL' || log.direction === directionFilter;

    return matchesSearch && matchesLoc && matchesStatus && matchesDir;
  });

  const exportToCSV = () => {
    const headers = [
      'Log ID',
      'Name',
      'Roll Number',
      'Role',
      'Department',
      'Location',
      'Direction',
      'Status',
      'Timestamp',
      'Verification Method',
      'Reason',
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      `"${log.userName}"`,
      `"${log.rollNumber}"`,
      log.role,
      `"${log.department}"`,
      `"${log.locationName}"`,
      log.direction,
      log.status === 'GRANTED' && log.direction === 'ENTRY' ? 'Present' : log.status,
      `"${new Date(log.timestamp).toLocaleString()}"`,
      log.verificationMethod,
      `"${log.reason}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `college_attendance_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E2D5] text-[#58111A] text-xs font-bold mb-2">
            <ClipboardList className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Automated Turnstile Attendance Ledger</span>
          </div>
          <h1 className="text-xl font-bold text-[#2D2A26]">
            College Attendance & Access Logs
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Real-time audit log of all physical door unlocks, RFID smart card validations, and automated attendance registers.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-[#F5F2EB] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2DACB] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8275]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, roll no, branch..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] placeholder-[#9E968B] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          />
        </div>

        {/* Location Filter */}
        <div>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          >
            <option value="ALL">All Door Checkpoints</option>
            <option value="gate">Main Gate Entrance</option>
            <option value="lab">Computer Lab Access</option>
            <option value="library">Central Library Access</option>
            <option value="hostel">Hostel Entrance</option>
          </select>
        </div>

        {/* Attendance Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present (Authorized Entry)</option>
            <option value="EXITED">Exited (Checkout)</option>
            <option value="DENIED">Access Denied (Restricted)</option>
          </select>
        </div>

        {/* Direction Filter */}
        <div>
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          >
            <option value="ALL">Both Directions (In & Out)</option>
            <option value="ENTRY">Entry Scans Only</option>
            <option value="EXIT">Exit Scans Only</option>
          </select>
        </div>
      </div>

      {/* COMPREHENSIVE ATTENDANCE LOG TABLE (Module 4 requirement) */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2DACB] overflow-hidden">
        <div className="p-4 border-b border-[#F0EBE1] flex items-center justify-between text-xs text-[#6B655D]">
          <span className="font-semibold text-[#2D2A26]">
            Showing <strong className="text-[#58111A]">{filteredLogs.length}</strong> recorded access transactions
          </span>
          <span className="text-[11px] text-[#8C8275]">Auto-synchronized with hardware door relays</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAF8F5] text-[#58111A] border-b border-[#E8E2D5] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Student / Faculty Name</th>
                <th className="py-3.5 px-3">Roll Number</th>
                <th className="py-3.5 px-3">Department / Branch</th>
                <th className="py-3.5 px-3">Access Time In/Out</th>
                <th className="py-3.5 px-3">Location Granted</th>
                <th className="py-3.5 px-3">Verification Method</th>
                <th className="py-3.5 px-4 text-center">Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#7A7368]">
                    No access transactions found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isGranted = log.status === 'GRANTED';
                  const isEntry = log.direction === 'ENTRY';
                  const userObj = users.find((u) => u.id === log.userId);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FAF8F5]/80 transition-colors group"
                    >
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => userObj && onSelectUserForModal(userObj)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <img
                            src={log.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={log.userName}
                            className="w-9 h-9 rounded-full object-cover border border-[#DDD5C7] shrink-0"
                          />
                          <div>
                            <span className="font-bold text-[#2D2A26] group-hover:text-[#722F37] transition-colors block">
                              {log.userName}
                            </span>
                            <span className="text-[10px] text-[#8C8275]">{log.role}</span>
                          </div>
                        </div>
                      </td>

                      {/* Roll Number */}
                      <td className="py-3 px-3 font-mono font-bold text-[#58111A]">
                        {log.rollNumber}
                      </td>

                      {/* Department / Branch */}
                      <td className="py-3 px-3 text-[#6B655D] font-medium">
                        {log.department}
                      </td>

                      {/* Access Time In/Out */}
                      <td className="py-3 px-3 text-[#2D2A26]">
                        <div className="flex items-center gap-1.5 font-medium">
                          {isEntry ? (
                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                              <LogIn className="w-3 h-3" /> IN
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5">
                              <LogOut className="w-3 h-3" /> OUT
                            </span>
                          )}
                          <span className="font-mono text-xs">
                            {new Date(log.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8C8275] mt-0.5">
                          {new Date(log.timestamp).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      {/* Location Granted */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#2D2A26] block">
                          {log.locationName}
                        </span>
                        <span className="text-[10px] text-[#7A7368] font-mono">
                          {LOCATIONS[log.location]?.code || log.location}
                        </span>
                      </td>

                      {/* Verification Method */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#6B655D] font-mono bg-[#FAF8F5] px-2 py-1 rounded-lg border border-[#E8E2D5]">
                          {log.verificationMethod.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Attendance Status */}
                      <td className="py-3 px-4 text-center">
                        {isGranted ? (
                          isEntry ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Present</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                              <LogOut className="w-3.5 h-3.5 text-amber-600" />
                              <span>Exited</span>
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px]" title={log.reason}>
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Denied</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
