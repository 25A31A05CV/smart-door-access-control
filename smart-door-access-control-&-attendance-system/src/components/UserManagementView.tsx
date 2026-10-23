import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Check,
  X,
  CreditCard,
  Building2,
  Laptop,
  BookOpen,
  Home,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  Eye,
  Camera,
  QrCode,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';
import { CollegeUser, LocationId, LOCATIONS, UserRole } from '../types';
import { filterUsers } from '../utils/accessControl';

interface UserManagementViewProps {
  users: CollegeUser[];
  onSaveUser: (user: CollegeUser) => void;
  onDeleteUser: (userId: string) => void;
  onSelectUserForModal: (user: CollegeUser) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  onSaveUser,
  onDeleteUser,
  onSelectUserForModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add / Edit Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CollegeUser | null>(null);

  // Form fields
  const [formData, setFormData] = useState<{
    name: string;
    rollNumber: string;
    role: UserRole;
    department: string;
    yearOrDesignation: string;
    email: string;
    phone: string;
    photoUrl: string;
    rfidCardId: string;
    barcode: string;
    status: 'ACTIVE' | 'SUSPENDED';
    permissions: {
      gate: boolean;
      lab: boolean;
      library: boolean;
      hostel: boolean;
    };
  }>({
    name: '',
    rollNumber: '',
    role: 'Student',
    department: 'Computer Science',
    yearOrDesignation: '1st Year B.Tech',
    email: '',
    phone: '',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    rfidCardId: '',
    barcode: '',
    status: 'ACTIVE',
    permissions: {
      gate: true,
      lab: true,
      library: true,
      hostel: false,
    },
  });

  const [formError, setFormError] = useState('');

  const filtered = filterUsers(users, searchQuery, departmentFilter, roleFilter);

  const departmentsList = [
    'Computer Science',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Information Technology',
    'Biotechnology',
    'Civil Engineering',
  ];

  const handleOpenAddModal = () => {
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const autoRoll = `2024CS${Math.floor(100 + Math.random() * 900)}`;
    setEditingUser(null);
    setFormData({
      name: '',
      rollNumber: autoRoll,
      role: 'Student',
      department: 'Computer Science',
      yearOrDesignation: '2nd Year B.Tech',
      email: '',
      phone: '',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400',
      rfidCardId: `RFID-${randomHex}-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: `890100${Math.floor(1000000 + Math.random() * 9000000)}`,
      status: 'ACTIVE',
      permissions: {
        gate: true,
        lab: true,
        library: true,
        hostel: false,
      },
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (user: CollegeUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      rollNumber: user.rollNumber,
      role: user.role,
      department: user.department,
      yearOrDesignation: user.yearOrDesignation,
      email: user.email,
      phone: user.phone,
      photoUrl: user.photoUrl,
      rfidCardId: user.rfidCardId,
      barcode: user.barcode,
      status: user.status,
      permissions: { ...user.permissions },
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.rollNumber.trim()) {
      setFormError('Name and Roll Number / ID are required.');
      return;
    }

    // Check duplicate roll number
    const duplicate = users.find(
      (u) =>
        u.rollNumber.toLowerCase() === formData.rollNumber.trim().toLowerCase() &&
        u.id !== editingUser?.id
    );

    if (duplicate) {
      setFormError(`Roll Number "${formData.rollNumber}" is already assigned to ${duplicate.name}.`);
      return;
    }

    const updatedUser: CollegeUser = {
      id: editingUser ? editingUser.id : `user-${Date.now()}`,
      name: formData.name.trim(),
      rollNumber: formData.rollNumber.trim(),
      role: formData.role,
      department: formData.department,
      yearOrDesignation: formData.yearOrDesignation.trim() || 'Student',
      email: formData.email.trim() || `${formData.rollNumber.toLowerCase()}@college.edu`,
      phone: formData.phone.trim() || '+91 98000 00000',
      photoUrl: formData.photoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      rfidCardId: formData.rfidCardId.trim() || `RFID-GEN-${Date.now().toString().slice(-4)}`,
      barcode: formData.barcode.trim() || `890100${Date.now().toString().slice(-7)}`,
      permissions: formData.permissions,
      status: formData.status,
      isInsideCampus: editingUser ? editingUser.isInsideCampus : false,
      currentLocation: editingUser ? editingUser.currentLocation : null,
      registeredAt: editingUser ? editingUser.registeredAt : new Date().toISOString(),
    };

    onSaveUser(updatedUser);
    setIsFormModalOpen(false);
  };

  // Toggle quick permission on the fly from the card
  const handleTogglePermission = (user: CollegeUser, locId: LocationId) => {
    const updated: CollegeUser = {
      ...user,
      permissions: {
        ...user.permissions,
        [locId]: !user.permissions[locId],
      },
    };
    onSaveUser(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E2D5] text-[#58111A] text-xs font-bold mb-2">
            <Users className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Collegiate Identity & Access Permission Registry</span>
          </div>
          <h1 className="text-xl font-bold text-[#2D2A26]">
            Student & Faculty Access Management
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Configure specific location permissions (Computer Lab, Library, Main Gate, Hostel) and manage Face ID profiles persistently.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Student / Faculty</span>
        </button>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2DACB] grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8275]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Roll No, Name, RFID UID, Department..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] placeholder-[#9E968B] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          >
            <option value="ALL">All Departments ({users.length})</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Role Filter */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
          >
            <option value="ALL">All Roles</option>
            <option value="Student">Students Only</option>
            <option value="Faculty">Faculty Only</option>
            <option value="Staff">Staff Only</option>
          </select>
        </div>
      </div>

      {/* PROFILES GRID WITH QUICK PERMISSION TOGGLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-[#E2DACB] p-6">
            <Users className="w-12 h-12 mx-auto text-[#DDD5C7] mb-3" />
            <p className="text-sm font-bold text-[#58111A]">No profiles match your filter</p>
            <p className="text-xs text-[#7A7368] mt-1">Try clearing your search query or department filters</p>
          </div>
        ) : (
          filtered.map((user) => {
            const isSuspended = user.status === 'SUSPENDED';

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with Photo & Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        className="w-16 h-20 rounded-xl object-cover border-2 border-[#722F37] shadow-sm"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          user.isInsideCampus
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-400 text-white'
                        }`}
                        title={user.isInsideCampus ? 'Currently Inside' : 'Outside Campus'}
                      >
                        {user.isInsideCampus ? 'IN' : 'OUT'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-sm text-[#2D2A26] truncate" title={user.name}>
                          {user.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </div>

                      <p className="text-xs font-mono font-bold text-[#722F37] mt-0.5">
                        {user.rollNumber}
                      </p>

                      <p className="text-xs text-[#6B655D] truncate">{user.department}</p>
                      <p className="text-[11px] text-[#7A7368]">{user.yearOrDesignation}</p>

                      <div className="mt-2 text-[10px] font-mono text-[#8C8275] flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-[#722F37]" />
                        <span>{user.rfidCardId}</span>
                      </div>
                    </div>
                  </div>

                  {/* SPECIFIC LOCATION-BASED ACCESS PERMISSION CHECKBOXES (Requirement) */}
                  <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#58111A]">
                        Door Access Permissions:
                      </span>
                      <span className="text-[10px] text-[#7A7368]">Click to toggle</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Main Gate */}
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(user, 'gate')}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors cursor-pointer ${
                          user.permissions.gate
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#8C8275] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Main Gate</span>
                        </div>
                        <span className="font-bold text-[10px]">
                          {user.permissions.gate ? '✓' : '✗'}
                        </span>
                      </button>

                      {/* Computer Lab */}
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(user, 'lab')}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors cursor-pointer ${
                          user.permissions.lab
                            ? 'bg-purple-50 border-purple-200 text-purple-900 font-semibold'
                            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#8C8275] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Laptop className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Comp Lab</span>
                        </div>
                        <span className="font-bold text-[10px]">
                          {user.permissions.lab ? '✓' : '✗'}
                        </span>
                      </button>

                      {/* Central Library */}
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(user, 'library')}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors cursor-pointer ${
                          user.permissions.library
                            ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#8C8275] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Library</span>
                        </div>
                        <span className="font-bold text-[10px]">
                          {user.permissions.library ? '✓' : '✗'}
                        </span>
                      </button>

                      {/* Hostel Entrance */}
                      <button
                        type="button"
                        onClick={() => handleTogglePermission(user, 'hostel')}
                        className={`p-2 rounded-xl text-left border flex items-center justify-between transition-colors cursor-pointer ${
                          user.permissions.hostel
                            ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                            : 'bg-[#FAF8F5] border-[#E8E2D5] text-[#8C8275] hover:bg-[#F5F2EB]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Home className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Hostel</span>
                        </div>
                        <span className="font-bold text-[10px]">
                          {user.permissions.hostel ? '✓' : '✗'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectUserForModal(user)}
                    className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#E8E2D5] text-[#58111A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#DDD5C7]"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#722F37]" />
                    <span>View ID Card</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-1.5 rounded-lg border border-[#DDD5C7] text-[#58111A] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                      title="Edit Profile"
                      aria-label={`Edit ${user.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove profile for ${user.name} (${user.rollNumber})?`)) {
                          onDeleteUser(user.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Profile"
                      aria-label={`Delete ${user.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT USER MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#DDD5C7] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#58111A] text-[#F5F2EB] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#722F37] flex items-center justify-center border border-[#8C3B45]">
                  <UserPlus className="w-5 h-5 text-[#F5F2EB]" />
                </div>
                <div>
                  <h2 className="text-base font-bold">
                    {editingUser ? 'Edit Student / Faculty Profile' : 'Enroll New Student / Faculty Member'}
                  </h2>
                  <p className="text-xs text-[#E8E2D5]">Stored persistently in collegiate database</p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-[#E8E2D5] hover:text-white hover:bg-[#722F37] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Roll Number / Faculty ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="e.g. 2024CS101"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Role Category
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Department / Academic Branch
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  >
                    {departmentsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Class Year / Academic Title
                  </label>
                  <input
                    type="text"
                    value={formData.yearOrDesignation}
                    onChange={(e) => setFormData({ ...formData, yearOrDesignation: e.target.value })}
                    placeholder="e.g. 3rd Year B.Tech or Associate Professor"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Account Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'SUSPENDED' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Authorized)</option>
                    <option value="SUSPENDED">SUSPENDED (Turnstile Blocked)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Smart RFID Card UID
                  </label>
                  <input
                    type="text"
                    value={formData.rfidCardId}
                    onChange={(e) => setFormData({ ...formData, rfidCardId: e.target.value })}
                    placeholder="e.g. RFID-A19F-3801"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Face ID Photo URL
                  </label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>
              </div>

              {/* SPECIFIC LOCATION-BASED ACCESS PERMISSION CHECKBOXES */}
              <div className="pt-2 border-t border-[#F0EBE1]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#58111A] mb-2">
                  Door Access Permissions Configuration:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <label className="p-3 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.gate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, gate: e.target.checked },
                        })
                      }
                      className="accent-[#722F37] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#2D2A26]">Main Gate</span>
                  </label>

                  <label className="p-3 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.lab}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, lab: e.target.checked },
                        })
                      }
                      className="accent-[#722F37] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#2D2A26]">Computer Lab</span>
                  </label>

                  <label className="p-3 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.library}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, library: e.target.checked },
                        })
                      }
                      className="accent-[#722F37] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#2D2A26]">Library</span>
                  </label>

                  <label className="p-3 rounded-xl border border-[#DDD5C7] bg-[#FAF8F5] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.hostel}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          permissions: { ...formData.permissions, hostel: e.target.checked },
                        })
                      }
                      className="accent-[#722F37] w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-[#2D2A26]">Hostel</span>
                  </label>
                </div>
              </div>

              {/* Form buttons */}
              <div className="pt-3 border-t border-[#F0EBE1] flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-semibold text-[#58111A] hover:bg-[#F5F2EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-white font-bold text-xs shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
