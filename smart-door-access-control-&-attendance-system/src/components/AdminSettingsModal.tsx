import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  UserPlus,
  Trash2,
  Check,
  Lock,
  Shield,
  Edit3,
  Eye,
  EyeOff,
  Database,
  CloudCheck,
  RefreshCw,
} from 'lucide-react';
import { AdminCredential, CollegeUser, AccessLog } from '../types';
import {
  saveAdminToFirestore,
  deleteAdminFromFirestore,
  syncAllDataToFirestore,
} from '../firebase/firestoreService';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  admins: AdminCredential[];
  currentAdmin: AdminCredential | null;
  onSaveAdmins: (updated: AdminCredential[]) => void;
  onUpdateCurrentAdmin?: (admin: AdminCredential) => void;
  users?: CollegeUser[];
  logs?: AccessLog[];
}

interface EditFormState {
  originalUsername: string;
  fullName: string;
  username: string;
  password: string;
  designation: string;
  role: 'Super Administrator' | 'Chief Warden' | 'Security Officer';
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  admins,
  currentAdmin,
  onSaveAdmins,
  onUpdateCurrentAdmin,
  users = [],
  logs = [],
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'add' | 'database'>('manage');

  // Add form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newRole, setNewRole] = useState<'Super Administrator' | 'Chief Warden' | 'Security Officer'>('Security Officer');

  // Edit existing admin state (Full Name, Username, Password, Role, Designation)
  const [editingAdmin, setEditingAdmin] = useState<EditFormState | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Database sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddNewAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const trimmedUser = newUsername.trim().toLowerCase();
    if (!trimmedUser || !newPassword.trim() || !newFullName.trim()) {
      setFeedback({ type: 'error', message: 'All fields are mandatory.' });
      return;
    }

    if (admins.some((a) => a.username.toLowerCase() === trimmedUser)) {
      setFeedback({ type: 'error', message: `Username "${newUsername}" already exists.` });
      return;
    }

    const newAdmin: AdminCredential = {
      username: trimmedUser,
      passwordHash: newPassword.trim(),
      fullName: newFullName.trim(),
      designation: newDesignation.trim() || 'System Administrator',
      role: newRole,
      lastLogin: 'Never',
    };

    const updated = [...admins, newAdmin];
    onSaveAdmins(updated);

    // Save to Firestore database
    try {
      await saveAdminToFirestore(newAdmin);
      setFeedback({
        type: 'success',
        message: `Admin "${newFullName}" (@${trimmedUser}) created and saved to Firestore database successfully!`,
      });
    } catch {
      setFeedback({
        type: 'success',
        message: `Admin account "${newFullName}" (@${trimmedUser}) created locally and queued for database sync.`,
      });
    }

    // Reset fields
    setNewUsername('');
    setNewPassword('');
    setNewFullName('');
    setNewDesignation('');
    setActiveTab('manage');
  };

  const startEditing = (admin: AdminCredential) => {
    setEditingAdmin({
      originalUsername: admin.username,
      fullName: admin.fullName,
      username: admin.username,
      password: admin.passwordHash,
      designation: admin.designation,
      role: admin.role,
    });
    setShowEditPassword(false);
    setFeedback(null);
  };

  const handleSaveEditedAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingAdmin) return;

    const trimmedUser = editingAdmin.username.trim().toLowerCase();
    const trimmedName = editingAdmin.fullName.trim();
    const trimmedPass = editingAdmin.password.trim();

    if (!trimmedUser || !trimmedName || !trimmedPass) {
      setFeedback({ type: 'error', message: 'Name, Username, and Password cannot be blank.' });
      return;
    }

    // Check if new username collides with another admin
    const usernameTaken = admins.some(
      (a) =>
        a.username.toLowerCase() === trimmedUser &&
        a.username.toLowerCase() !== editingAdmin.originalUsername.toLowerCase()
    );

    if (usernameTaken) {
      setFeedback({ type: 'error', message: `Username "${trimmedUser}" is already taken by another administrator.` });
      return;
    }

    let updatedCurrentAdminObj: AdminCredential | null = null;
    let savedAdminObject: AdminCredential | null = null;

    const updated = admins.map((a) => {
      if (a.username.toLowerCase() === editingAdmin.originalUsername.toLowerCase()) {
        const modified: AdminCredential = {
          ...a,
          username: trimmedUser,
          fullName: trimmedName,
          passwordHash: trimmedPass,
          designation: editingAdmin.designation.trim() || 'System Administrator',
          role: editingAdmin.role,
        };

        savedAdminObject = modified;

        if (currentAdmin && currentAdmin.username.toLowerCase() === editingAdmin.originalUsername.toLowerCase()) {
          updatedCurrentAdminObj = modified;
        }

        return modified;
      }
      return a;
    });

    onSaveAdmins(updated);

    if (updatedCurrentAdminObj && onUpdateCurrentAdmin) {
      onUpdateCurrentAdmin(updatedCurrentAdminObj);
    }

    // If username changed, delete old username doc in Firestore
    if (editingAdmin.originalUsername.toLowerCase() !== trimmedUser) {
      deleteAdminFromFirestore(editingAdmin.originalUsername.toLowerCase()).catch(() => {});
    }

    // Save modified admin directly to Firestore database
    if (savedAdminObject) {
      try {
        await saveAdminToFirestore(savedAdminObject);
        setFeedback({
          type: 'success',
          message: `Saved changes for "${trimmedName}" (@${trimmedUser}) directly into Firestore database!`,
        });
      } catch {
        setFeedback({
          type: 'success',
          message: `Updated account details for "${trimmedName}" (@${trimmedUser}) locally.`,
        });
      }
    }

    setEditingAdmin(null);
  };

  const handleDeleteAdmin = async (targetUsername: string) => {
    if (admins.length <= 1) {
      setFeedback({ type: 'error', message: 'Cannot delete the only administrative account.' });
      return;
    }
    if (currentAdmin && currentAdmin.username.toLowerCase() === targetUsername.toLowerCase()) {
      setFeedback({ type: 'error', message: 'Cannot delete the currently logged in administrator.' });
      return;
    }

    const updated = admins.filter((a) => a.username.toLowerCase() !== targetUsername.toLowerCase());
    onSaveAdmins(updated);

    // Delete from Firestore database
    try {
      await deleteAdminFromFirestore(targetUsername);
      setFeedback({
        type: 'success',
        message: `Administrator "${targetUsername}" removed from database and local storage.`,
      });
    } catch {
      setFeedback({ type: 'success', message: `Administrator "${targetUsername}" removed.` });
    }
  };

  const handleSyncAllToFirestore = async () => {
    setIsSyncing(true);
    setSyncStatusMessage(null);
    try {
      const res = await syncAllDataToFirestore(admins, users, logs);
      if (res.success) {
        setSyncStatusMessage(
          `Successfully saved to database: ${res.syncedAdmins} Admins, ${res.syncedUsers} Students/Faculty, and ${res.syncedLogs} Attendance Logs.`
        );
      } else {
        setSyncStatusMessage(`Database sync encountered an issue: ${res.error || 'Unknown error'}`);
      }
    } catch (err) {
      setSyncStatusMessage(`Database error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DDD5C7] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#58111A] text-[#F5F2EB] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#722F37] flex items-center justify-center border border-[#8C3B45]">
              <Shield className="w-5 h-5 text-[#F5F2EB]" />
            </div>
            <div>
              <h2 className="text-base font-bold">Administrator & Faculty Credentials</h2>
              <p className="text-xs text-[#E8E2D5]">Edit authorized names, usernames, passwords, and security roles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close credentials manager"
            className="p-1.5 rounded-lg text-[#E8E2D5] hover:text-white hover:bg-[#722F37] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E8E2D5] bg-[#FAF8F5] px-6">
          <button
            onClick={() => { setActiveTab('manage'); setFeedback(null); setEditingAdmin(null); }}
            className={`py-3 px-4 font-semibold text-xs tracking-wider uppercase border-b-2 transition-colors cursor-pointer ${
              activeTab === 'manage'
                ? 'border-[#722F37] text-[#58111A]'
                : 'border-transparent text-[#7A7368] hover:text-[#2D2A26]'
            }`}
          >
            Active Administrators ({admins.length})
          </button>
          <button
            onClick={() => { setActiveTab('add'); setFeedback(null); setEditingAdmin(null); }}
            className={`py-3 px-4 font-semibold text-xs tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'add'
                ? 'border-[#722F37] text-[#58111A]'
                : 'border-transparent text-[#7A7368] hover:text-[#2D2A26]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Admin</span>
          </button>
          <button
            onClick={() => { setActiveTab('database'); setFeedback(null); setEditingAdmin(null); }}
            className={`py-3 px-4 font-semibold text-xs tracking-wider uppercase border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-[#722F37] text-[#58111A]'
                : 'border-transparent text-[#7A7368] hover:text-[#2D2A26]'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Sync</span>
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600 shrink-0" /> : <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B655D] mb-2">
                <span>
                  Click <strong>"Edit Details"</strong> on any administrator to change their full name, login username, password, or role.
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Database Connected
                </span>
              </div>

              {admins.map((admin) => {
                const isCurrentlyEditing = editingAdmin?.originalUsername.toLowerCase() === admin.username.toLowerCase();

                return (
                  <div
                    key={admin.username}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentlyEditing
                        ? 'border-[#722F37] bg-white ring-2 ring-[#722F37]/20 shadow-md'
                        : 'border-[#E8E2D5] bg-[#FAF8F5] hover:border-[#DDD5C7]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#E8E2D5] flex items-center justify-center text-[#58111A] shrink-0 font-bold text-xs mt-0.5 border border-[#DDD5C7]">
                          {admin.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-[#2D2A26]">{admin.fullName}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#722F37] text-[#F5F2EB] font-medium">
                              {admin.role}
                            </span>
                            {currentAdmin?.username.toLowerCase() === admin.username.toLowerCase() && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                                Logged In Now
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#7A7368] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                              Username: <strong className="font-mono text-[#58111A]">@{admin.username}</strong>
                            </span>
                            <span>•</span>
                            <span>{admin.designation}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => {
                            if (isCurrentlyEditing) {
                              setEditingAdmin(null);
                            } else {
                              startEditing(admin);
                            }
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isCurrentlyEditing
                              ? 'bg-[#58111A] text-white border-[#58111A]'
                              : 'bg-white border-[#DDD5C7] text-[#58111A] hover:bg-[#F5F2EB]'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isCurrentlyEditing ? 'Close Editor' : 'Edit Details'}</span>
                        </button>

                        {admins.length > 1 && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.username)}
                            disabled={currentAdmin?.username.toLowerCase() === admin.username.toLowerCase()}
                            title={currentAdmin?.username.toLowerCase() === admin.username.toLowerCase() ? 'Cannot delete active session' : 'Delete admin'}
                            aria-label={`Delete admin ${admin.username}`}
                            className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* COMPREHENSIVE INLINE EDIT FORM FOR NAME, USERNAME, PASSWORD & DESIGNATION */}
                    {isCurrentlyEditing && editingAdmin && (
                      <form onSubmit={handleSaveEditedAdmin} className="mt-4 pt-4 border-t border-[#E8E2D5] space-y-3 bg-[#FAF8F5] p-3.5 rounded-xl border">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#58111A] mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Administrator Profile & Login Info</span>
                          </span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Syncs to Cloud Database
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Full Name */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#58111A] mb-1">
                              Person's Full Name *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={editingAdmin.fullName}
                                onChange={(e) => setEditingAdmin({ ...editingAdmin, fullName: e.target.value })}
                                placeholder="e.g. Dr. Christopher Vance"
                                className="w-full pl-3 pr-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                              />
                            </div>
                          </div>

                          {/* Username */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#58111A] mb-1">
                              Login Username / Admin ID *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                value={editingAdmin.username}
                                onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                                placeholder="e.g. admin"
                                className="w-full pl-3 pr-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs font-mono text-[#58111A] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                              />
                            </div>
                          </div>

                          {/* Password */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#58111A] mb-1">
                              Security Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showEditPassword ? 'text' : 'password'}
                                required
                                value={editingAdmin.password}
                                onChange={(e) => setEditingAdmin({ ...editingAdmin, password: e.target.value })}
                                placeholder="••••••••"
                                className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                              />
                              <button
                                type="button"
                                onClick={() => setShowEditPassword(!showEditPassword)}
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#8C8275] hover:text-[#58111A]"
                              >
                                {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Designation */}
                          <div>
                            <label className="block text-[11px] font-bold text-[#58111A] mb-1">
                              Department / Designation
                            </label>
                            <input
                              type="text"
                              value={editingAdmin.designation}
                              onChange={(e) => setEditingAdmin({ ...editingAdmin, designation: e.target.value })}
                              placeholder="e.g. Dean of Academics"
                              className="w-full pl-3 pr-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                            />
                          </div>
                        </div>

                        {/* Role */}
                        <div>
                          <label className="block text-[11px] font-bold text-[#58111A] mb-1">
                            System Clearance Role
                          </label>
                          <select
                            value={editingAdmin.role}
                            onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value as unknown as typeof editingAdmin.role })}
                            className="w-full px-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#722F37]"
                          >
                            <option value="Super Administrator">Super Administrator (Full System & Door Relays)</option>
                            <option value="Chief Warden">Chief Warden (Hostel & Campus Access)</option>
                            <option value="Security Officer">Security Officer (Gate & Verification Terminal)</option>
                          </select>
                        </div>

                        {/* Save & Cancel buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                          <button
                            type="button"
                            onClick={() => setEditingAdmin(null)}
                            className="px-3 py-1.5 rounded-lg border border-[#DDD5C7] bg-white text-xs font-semibold text-[#58111A] hover:bg-[#F5F2EB] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-[#722F37] hover:bg-[#58111A] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save to Database & Local</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'add' && (
            <form onSubmit={handleAddNewAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Username / Administrator ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. security_gate_2"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Initial Security Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs font-mono focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Full Name & Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Dr. Anita Roy"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#58111A] mb-1">
                    Department / Designation
                  </label>
                  <input
                    type="text"
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    placeholder="e.g. Computer Science Faculty Advisor"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#58111A] mb-1">
                  System Clearance Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as unknown as typeof newRole)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-xs focus:ring-2 focus:ring-[#722F37] focus:outline-none"
                >
                  <option value="Super Administrator">Super Administrator (Full System & Door Relays)</option>
                  <option value="Chief Warden">Chief Warden (Hostel & Campus Access)</option>
                  <option value="Security Officer">Security Officer (Gate & Verification Terminal)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('manage')}
                  className="px-4 py-2 rounded-xl border border-[#DDD5C7] text-xs font-semibold text-[#58111A] hover:bg-[#F5F2EB] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-[#F5F2EB] text-xs font-bold shadow cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create & Save to Database</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
                    <CloudCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#58111A]">Firebase Firestore Database</h3>
                    <p className="text-xs text-[#7A7368]">
                      Database ID: <code className="font-mono text-[#58111A] bg-white px-1.5 py-0.5 rounded border border-[#DDD5C7]">ai-studio-smartdooraccessc-955da0fc-13a0-47f1-8f2a-67e6936ac55c</code>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 my-4">
                  <div className="bg-white p-3 rounded-lg border border-[#E8E2D5] text-center">
                    <div className="text-lg font-bold text-[#58111A]">{admins.length}</div>
                    <div className="text-[11px] text-[#7A7368]">Admins</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E8E2D5] text-center">
                    <div className="text-lg font-bold text-[#58111A]">{users.length}</div>
                    <div className="text-[11px] text-[#7A7368]">Students & Faculty</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E8E2D5] text-center">
                    <div className="text-lg font-bold text-[#58111A]">{logs.length}</div>
                    <div className="text-[11px] text-[#7A7368]">Access Logs</div>
                  </div>
                </div>

                <p className="text-xs text-[#6B655D] mb-4">
                  All updates to Administrator names, usernames, and passwords, as well as students and door access logs, automatically sync in real-time to the cloud Firestore database. Click below to trigger an immediate full snapshot sync of all records.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D5]">
                  <span className="text-[11px] text-[#7A7368]">
                    Real-time bidirectional synchronization active
                  </span>
                  <button
                    onClick={handleSyncAllToFirestore}
                    disabled={isSyncing}
                    className="px-4 py-2 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Writing to Firestore...' : 'Sync All to Database'}</span>
                  </button>
                </div>
              </div>

              {syncStatusMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{syncStatusMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] px-6 py-3 flex items-center justify-between text-xs text-[#7A7368]">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Encrypted cloud database & local mirror</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-[#DDD5C7] text-[#2D2A26] font-medium hover:bg-[#E8E2D5] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
