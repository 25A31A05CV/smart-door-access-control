/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CollegeUser, AccessLog, AdminCredential, LocationId } from './types';
import {
  getStoredAdmins,
  saveStoredAdmins,
  getCurrentAdmin,
  setCurrentAdmin,
  getStoredUsers,
  saveStoredUsers,
  getStoredLogs,
  saveStoredLogs,
} from './utils/storage';
import { LoginView } from './components/LoginView';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { DoorScannerTerminal } from './components/DoorScannerTerminal';
import { UserManagementView } from './components/UserManagementView';
import { AttendanceLogsView } from './components/AttendanceLogsView';
import { JavaHardwareBridgeView } from './components/JavaHardwareBridgeView';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import {
  subscribeToCollegeUsers,
  subscribeToAccessLogs,
  subscribeToAdmins,
  saveCollegeUserToFirestore,
  deleteCollegeUserFromFirestore,
  saveAccessLogToFirestore,
  saveAllAdminsToFirestore,
  seedInitialDataIfEmpty,
} from './firebase/firestoreService';
import { testFirestoreConnection } from './firebase/config';

export default function App() {
  const [admins, setAdmins] = useState<AdminCredential[]>(getStoredAdmins);
  const [currentAdmin, setCurrentAdminState] = useState<AdminCredential | null>(getCurrentAdmin);
  const [users, setUsers] = useState<CollegeUser[]>(getStoredUsers);
  const [logs, setLogs] = useState<AccessLog[]>(getStoredLogs);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Modals
  const [selectedUserForModal, setSelectedUserForModal] = useState<CollegeUser | null>(null);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  // Door relay status (Hardware simulation)
  const [doorRelays, setDoorRelays] = useState<Record<LocationId, { isUnlocked: boolean; lastTriggered: string | null }>>({
    gate: { isUnlocked: false, lastTriggered: null },
    lab: { isUnlocked: false, lastTriggered: null },
    library: { isUnlocked: false, lastTriggered: null },
    hostel: { isUnlocked: false, lastTriggered: null },
  });

  // Support ?autostart=1 for headless testing & verification
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' && !currentAdmin) {
        const defaultAdmin = admins[0];
        setCurrentAdminState(defaultAdmin);
        setCurrentAdmin(defaultAdmin);
      }
    }
  }, [admins, currentAdmin]);

  // Real-time synchronization with Firebase Cloud Firestore
  useEffect(() => {
    testFirestoreConnection().catch(() => {});
    seedInitialDataIfEmpty(getStoredUsers(), getStoredLogs(), getStoredAdmins()).catch(() => {});

    // Real-time listener for Administrator credentials
    const unsubAdmins = subscribeToAdmins((cloudAdmins) => {
      if (cloudAdmins && cloudAdmins.length > 0) {
        setAdmins(cloudAdmins);
        saveStoredAdmins(cloudAdmins);

        // Keep current session credentials in sync if changed
        const active = getCurrentAdmin();
        if (active) {
          const matched = cloudAdmins.find(
            (a) => a.username.toLowerCase() === active.username.toLowerCase()
          );
          if (matched) {
            setCurrentAdminState(matched);
            setCurrentAdmin(matched);
          }
        }
      }
    });

    // Real-time listener for College Users (Students & Faculty)
    const unsubUsers = subscribeToCollegeUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        saveStoredUsers(cloudUsers);
      }
    });

    // Real-time listener for Access & Attendance Logs
    const unsubLogs = subscribeToAccessLogs((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setLogs(cloudLogs);
        saveStoredLogs(cloudLogs);
      }
    });

    return () => {
      if (unsubAdmins) unsubAdmins();
      if (unsubUsers) unsubUsers();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // Handle Admin Login
  const handleLoginSuccess = (admin: AdminCredential) => {
    setCurrentAdminState(admin);
    setCurrentAdmin(admin);
    // Update admin list with new lastLogin
    const updated = admins.map((a) => (a.username === admin.username ? admin : a));
    setAdmins(updated);
    saveStoredAdmins(updated);
    saveAllAdminsToFirestore(updated).catch(() => {});
  };

  // Handle Admin Logout
  const handleLogout = () => {
    setCurrentAdminState(null);
    setCurrentAdmin(null);
  };

  // Update Admins Credentials (Local + Cloud Firestore)
  const handleSaveAdmins = (updated: AdminCredential[]) => {
    setAdmins(updated);
    saveStoredAdmins(updated);
    saveAllAdminsToFirestore(updated).catch((err) => {
      console.warn('Could not sync admins to Firestore:', err);
    });
  };

  // Save / Update User Profile (Local + Cloud Firestore)
  const handleSaveUser = (updatedUser: CollegeUser) => {
    const exists = users.some((u) => u.id === updatedUser.id);
    const updatedList = exists
      ? users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      : [updatedUser, ...users];

    setUsers(updatedList);
    saveStoredUsers(updatedList);

    // Persist to Firebase Firestore
    saveCollegeUserToFirestore(updatedUser).catch((err) => {
      console.warn('Could not sync user to Firestore:', err);
    });

    // If modal is open for this user, refresh it
    if (selectedUserForModal && selectedUserForModal.id === updatedUser.id) {
      setSelectedUserForModal(updatedUser);
    }
  };

  // Delete User Profile (Local + Cloud Firestore)
  const handleDeleteUser = (userId: string) => {
    const updatedList = users.filter((u) => u.id !== userId);
    setUsers(updatedList);
    saveStoredUsers(updatedList);

    // Delete from Firebase Firestore
    deleteCollegeUserFromFirestore(userId).catch((err) => {
      console.warn('Could not delete user from Firestore:', err);
    });
  };

  // Handle Door Access Event from Scanner Terminal (Local + Cloud Firestore)
  const handleAccessEvent = (newLog: AccessLog, updatedUser: CollegeUser) => {
    // Prepend log
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    saveStoredLogs(updatedLogs);

    // Update user status
    handleSaveUser(updatedUser);

    // Persist log transaction to Firebase Firestore
    saveAccessLogToFirestore(newLog).catch((err) => {
      console.warn('Could not save access log to Firestore:', err);
    });

    // If granted, trigger physical relay unlock
    if (newLog.status === 'GRANTED') {
      triggerRelayUnlock(newLog.location);
    }
  };

  // Trigger hardware door relay pulse
  const triggerRelayUnlock = (locId: LocationId) => {
    setDoorRelays((prev) => ({
      ...prev,
      [locId]: { isUnlocked: true, lastTriggered: new Date().toISOString() },
    }));

    setTimeout(() => {
      setDoorRelays((prev) => ({
        ...prev,
        [locId]: { ...prev[locId], isUnlocked: false },
      }));
    }, 3500);
  };

  // If not authenticated, display clean Login Screen
  if (!currentAdmin) {
    return <LoginView admins={admins} onLoginSuccess={handleLoginSuccess} />;
  }

  const handleUpdateCurrentAdmin = (admin: AdminCredential) => {
    setCurrentAdminState(admin);
    setCurrentAdmin(admin);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] text-[#2D2A26] flex flex-col">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentAdmin={currentAdmin}
        onOpenAdminSettings={() => setIsAdminSettingsOpen(true)}
        onLogout={handleLogout}
        activeDoorAlertsCount={0}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            users={users}
            logs={logs}
            onNavigate={setCurrentTab}
            onSelectUserForModal={setSelectedUserForModal}
            doorRelays={doorRelays}
          />
        )}

        {currentTab === 'terminal' && (
          <DoorScannerTerminal
            users={users}
            onAccessEvent={handleAccessEvent}
            onSelectUserForModal={setSelectedUserForModal}
          />
        )}

        {currentTab === 'users' && (
          <UserManagementView
            users={users}
            onSaveUser={handleSaveUser}
            onDeleteUser={handleDeleteUser}
            onSelectUserForModal={setSelectedUserForModal}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceLogsView
            logs={logs}
            users={users}
            onSelectUserForModal={setSelectedUserForModal}
          />
        )}

        {currentTab === 'java_bridge' && (
          <JavaHardwareBridgeView
            onManualTriggerRelay={triggerRelayUnlock}
            doorRelays={doorRelays}
          />
        )}
      </main>

      {/* Modals */}
      <UserProfileModal
        user={selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
      />

      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        admins={admins}
        currentAdmin={currentAdmin}
        onSaveAdmins={handleSaveAdmins}
        onUpdateCurrentAdmin={handleUpdateCurrentAdmin}
        users={users}
        logs={logs}
      />
    </div>
  );
}
