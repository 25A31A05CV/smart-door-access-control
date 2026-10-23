import React, { useState, useEffect } from 'react';
import {
  ScanLine,
  CreditCard,
  Camera,
  Barcode,
  CheckCircle2,
  XCircle,
  Building2,
  Laptop,
  BookOpen,
  Home,
  Unlock,
  Lock,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { CollegeUser, LocationId, LOCATIONS, AccessLog } from '../types';
import { validateAccess } from '../utils/accessControl';
import { playAccessGrantedSound, playAccessDeniedSound, playRelayClickSound } from '../utils/audio';
import { createJavaTelemetryPacket } from '../utils/storage';
import { useFirebaseAuth } from '../firebase/AuthContext';

interface DoorScannerTerminalProps {
  users: CollegeUser[];
  onAccessEvent: (log: AccessLog, updatedUser: CollegeUser) => void;
  onSelectUserForModal: (user: CollegeUser) => void;
}

export const DoorScannerTerminal: React.FC<DoorScannerTerminalProps> = ({
  users,
  onAccessEvent,
  onSelectUserForModal,
}) => {
  const { firebaseUser, signInWithGoogle, logOutFirebase } = useFirebaseAuth();
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('gate');
  const [direction, setDirection] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [scanMethod, setScanMethod] = useState<'FACE_RECOGNITION' | 'RFID_CARD' | 'BARCODE'>('FACE_RECOGNITION');
  const [rollInput, setRollInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{
    user: CollegeUser | null;
    log: AccessLog | null;
    status: 'GRANTED' | 'DENIED' | null;
    reason: string;
    faceConfidence: number;
  } | null>(null);

  // Door relay lock timer
  const [relayRemainingSeconds, setRelayRemainingSeconds] = useState(0);

  useEffect(() => {
    if (relayRemainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRelayRemainingSeconds((prev) => {
        if (prev <= 1) {
          playRelayClickSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [relayRemainingSeconds]);

  const executeVerification = (targetUser: CollegeUser | null, identifierText: string) => {
    if (!firebaseUser) {
      setLastScanResult({
        user: null,
        log: null,
        status: 'DENIED',
        reason: 'Access Restricted: Please sign in with your Google account above before operating the scanner.',
        faceConfidence: 0,
      });
      playAccessDeniedSound();
      return;
    }

    setIsScanning(true);
    setLastScanResult(null);

    setTimeout(() => {
      setIsScanning(false);
      const validation = validateAccess(targetUser, selectedLocation, direction);
      const isGranted = validation.allowed;

      // Random high biometric confidence if face scan
      const faceConfidence = isGranted ? (98.2 + Math.random() * 1.6) : (42.5 + Math.random() * 20);

      if (isGranted) {
        playAccessGrantedSound();
        playRelayClickSound();
        setRelayRemainingSeconds(4); // 4 seconds door release
      } else {
        playAccessDeniedSound();
      }

      const logId = `log-${Date.now()}`;
      const nowIso = new Date().toISOString();

      if (targetUser) {
        const updatedUser: CollegeUser = {
          ...targetUser,
          isInsideCampus: direction === 'ENTRY' ? true : false,
          currentLocation: direction === 'ENTRY' ? selectedLocation : null,
        };

        const newLog: AccessLog = {
          id: logId,
          userId: targetUser.id,
          userName: targetUser.name,
          rollNumber: targetUser.rollNumber,
          role: targetUser.role,
          department: targetUser.department,
          photoUrl: targetUser.photoUrl,
          location: selectedLocation,
          locationName: LOCATIONS[selectedLocation].name,
          direction: direction,
          status: isGranted ? 'GRANTED' : 'DENIED',
          reason: validation.reason,
          timestamp: nowIso,
          verificationMethod: scanMethod,
          doorRelayTriggered: isGranted,
        };

        setLastScanResult({
          user: targetUser,
          log: newLog,
          status: isGranted ? 'GRANTED' : 'DENIED',
          reason: validation.reason,
          faceConfidence: Number(faceConfidence.toFixed(1)),
        });

        onAccessEvent(newLog, updatedUser);
      } else {
        // Unknown card or unrecognized
        const unknownLog: AccessLog = {
          id: logId,
          userId: 'unknown',
          userName: 'Unregistered Subject',
          rollNumber: identifierText || 'UNKNOWN-ID',
          role: 'Student',
          department: 'Unregistered',
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          location: selectedLocation,
          locationName: LOCATIONS[selectedLocation].name,
          direction: direction,
          status: 'DENIED',
          reason: 'Unregistered ID Card or Unrecognized Face Scan',
          timestamp: nowIso,
          verificationMethod: scanMethod,
          doorRelayTriggered: false,
        };

        setLastScanResult({
          user: null,
          log: unknownLog,
          status: 'DENIED',
          reason: 'Unregistered ID Card or Unrecognized Face Scan',
          faceConfidence: Number(faceConfidence.toFixed(1)),
        });
      }
    }, 650);
  };

  const handleManualSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rollInput.trim()) return;

    const query = rollInput.trim().toLowerCase();
    const matched = users.find(
      (u) =>
        u.rollNumber.toLowerCase() === query ||
        u.name.toLowerCase().includes(query) ||
        u.rfidCardId.toLowerCase() === query ||
        u.barcode === query
    ) || null;

    executeVerification(matched, rollInput.trim());
  };

  const currentLocationMeta = LOCATIONS[selectedLocation];
  const isDoorUnlocked = relayRemainingSeconds > 0;

  return (
    <div className="space-y-6">
      {/* Terminal Title Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E2D5] text-[#58111A] text-xs font-bold mb-2">
            <ScanLine className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Interactive Verification & Physical Relay Terminal</span>
          </div>
          <h1 className="text-xl font-bold text-[#2D2A26]">
            Smart Door Access & Automated Attendance Checkpoint
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Simulate biometric facial recognition, RFID smart cards, or barcode badge scans to unlock campus doors and log attendance.
          </p>
        </div>

        {/* Direction Switcher (Entry vs Exit) */}
        <div className="flex items-center p-1 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7]">
          <button
            onClick={() => setDirection('ENTRY')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              direction === 'ENTRY'
                ? 'bg-[#722F37] text-white shadow-sm'
                : 'text-[#6B655D] hover:text-[#2D2A26]'
            }`}
          >
            ENTRY CHECKPOINT (Mark In)
          </button>
          <button
            onClick={() => setDirection('EXIT')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              direction === 'EXIT'
                ? 'bg-[#58111A] text-white shadow-sm'
                : 'text-[#6B655D] hover:text-[#2D2A26]'
            }`}
          >
            EXIT CHECKPOINT (Checkout)
          </button>
        </div>
      </div>

      {/* LOCATION SELECTOR CARDS */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#58111A] mb-2.5">
          Step 1: Select Door Access Point to Test
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(LOCATIONS) as LocationId[]).map((locId) => {
            const loc = LOCATIONS[locId];
            const isSelected = selectedLocation === locId;
            const Icon = locId === 'gate' ? Building2 : locId === 'lab' ? Laptop : locId === 'library' ? BookOpen : Home;

            return (
              <button
                key={locId}
                onClick={() => setSelectedLocation(locId)}
                className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#722F37] text-white border-[#58111A] shadow-md ring-2 ring-[#722F37]/30'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#2D2A26] border-[#E2DACB]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF8F5] text-[#722F37]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#E8E2D5] text-[#58111A]'
                    }`}
                  >
                    {loc.code}
                  </span>
                </div>
                <h3 className="font-bold text-xs">{loc.name}</h3>
                <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? 'text-[#E8E2D5]' : 'text-[#7A7368]'}`}>
                  {loc.building}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCANNING & VERIFICATION INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Verification Scanner Controls */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
            <div>
              <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider">
                Step 2: Choose Verification Method & Scan
              </h2>
              <p className="text-xs text-[#7A7368]">
                Testing point: <strong className="text-[#58111A]">{currentLocationMeta.name}</strong>
              </p>
            </div>

            {/* Hardware Solenoid Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                isDoorUnlocked
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                  : 'bg-[#FAF8F5] text-[#6B655D] border-[#DDD5C7]'
              }`}
            >
              {isDoorUnlocked ? <Unlock className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-[#722F37]" />}
              <span>{isDoorUnlocked ? `SOLENOID UNLOCKED (${relayRemainingSeconds}s)` : 'DOOR LOCKED'}</span>
            </div>
          </div>

          {/* USER SIGN-IN REQUIREMENT BEFORE SCANNING (User request) */}
          {!firebaseUser ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    User Authentication Required Before Scanning
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Please sign in with your Firebase Google account to authorize turnstile operations and persist attendance records to your Firestore cloud database.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => signInWithGoogle().catch(() => {})}
                  className="px-4 py-2 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign In with Google Account</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                {firebaseUser.photoURL ? (
                  <img src={firebaseUser.photoURL} alt="User" className="w-7 h-7 rounded-full border border-emerald-400" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                    {(firebaseUser.displayName || firebaseUser.email || 'U').slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#2D2A26] leading-tight">
                    Signed in as <span className="text-emerald-700">{firebaseUser.displayName || firebaseUser.email}</span>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    Cloud Firestore: smart-door-access-control [SYNCED]
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={logOutFirebase}
                className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold text-xs cursor-pointer transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {/* Scan Method Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'FACE_RECOGNITION' as const, label: 'Biometric Face Scan', icon: Camera },
              { id: 'RFID_CARD' as const, label: 'Smart RFID Card Tap', icon: CreditCard },
              { id: 'BARCODE' as const, label: 'Barcode / Roll Number', icon: Barcode },
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = scanMethod === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setScanMethod(method.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#722F37] text-white shadow-sm'
                      : 'bg-[#FAF8F5] text-[#58111A] hover:bg-[#E8E2D5] border border-[#DDD5C7]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{method.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Roll / Name Search Form */}
          <form onSubmit={handleManualSearchSubmit} className="space-y-3">
            <label className="block text-xs font-bold text-[#58111A]">
              Search or Scan by Roll Number, RFID UID, or Student Name:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rollInput}
                onChange={(e) => setRollInput(e.target.value)}
                placeholder="e.g. 2024CS101, FAC-CS-001, RFID-A19F-3801"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-sm font-mono text-[#2D2A26] placeholder-[#9E968B] focus:outline-none focus:ring-2 focus:ring-[#722F37]"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="px-5 py-2.5 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ScanLine className="w-4 h-4" />
                    <span>Scan & Verify</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Rapid Tap Preset Directory Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#58111A]">
                Quick Simulation Roster (Click to simulate badge tap):
              </label>
              <span className="text-[11px] text-[#7A7368]">{users.length} enrolled profiles</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {users.map((u) => {
                const hasPermission = Boolean(u.permissions[selectedLocation]);
                const isSuspended = u.status === 'SUSPENDED';

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      setRollInput(u.rollNumber);
                      executeVerification(u, u.rollNumber);
                    }}
                    className="p-2 rounded-xl border border-[#E8E2D5] bg-[#FAF8F5] hover:bg-[#F5F2EB] hover:border-[#722F37] transition-all text-left flex items-center gap-2 cursor-pointer group"
                  >
                    <img
                      src={u.photoUrl}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#DDD5C7] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#2D2A26] truncate group-hover:text-[#722F37]">
                        {u.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#7A7368] truncate">
                        {u.rollNumber}
                      </p>
                    </div>
                    <span
                      title={isSuspended ? 'Suspended' : hasPermission ? 'Authorized' : 'Unauthorized for this door'}
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSuspended
                          ? 'bg-rose-500'
                          : hasPermission
                          ? 'bg-emerald-500'
                          : 'bg-amber-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Face Verification Display & Official ID Card (Module 3 requirement) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB]">
          <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider pb-3 border-b border-[#F0EBE1] flex items-center justify-between">
            <span>Face ID & Profile Scan Display</span>
            {lastScanResult && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  lastScanResult.status === 'GRANTED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {lastScanResult.status}
              </span>
            )}
          </h2>

          {isScanning ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative mx-auto w-24 h-24 rounded-2xl bg-[#58111A] flex items-center justify-center text-white overflow-hidden shadow-lg">
                <Camera className="w-10 h-10 animate-pulse text-[#E8E2D5]" />
                <div className="absolute inset-0 border-2 border-emerald-400 rounded-2xl animate-ping opacity-75"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-[#58111A]">Processing Biometric Face & RFID Credentials...</p>
                <p className="text-xs text-[#7A7368] font-mono mt-1">Interfacing with Java Relay Hardware</p>
              </div>
            </div>
          ) : lastScanResult ? (
            <div className="mt-4 space-y-4">
              {/* Status Alert Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  lastScanResult.status === 'GRANTED'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {lastScanResult.status === 'GRANTED' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs">
                  <div className="font-bold text-sm">
                    {lastScanResult.status === 'GRANTED' ? 'Door Access Granted' : 'Door Access Denied'}
                  </div>
                  <div className="mt-0.5">{lastScanResult.reason}</div>
                  {lastScanResult.status === 'GRANTED' && direction === 'ENTRY' && (
                    <div className="mt-1 font-semibold text-emerald-700">
                      ✓ Attendance marked automatically as Present for today.
                    </div>
                  )}
                </div>
              </div>

              {lastScanResult.user ? (
                /* OFFICIAL PRINTED ID CARD BADGE PREVIEW (Module 3 requirement) */
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#FAF8F5] to-[#F5F2EB] border-2 border-[#DDD5C7] shadow-sm">
                  {/* Top card banner */}
                  <div className="bg-[#58111A] text-[#F5F2EB] -mx-4 -mt-4 px-4 py-2 rounded-t-lg flex items-center justify-between text-xs mb-3">
                    <span className="font-bold tracking-wider text-[11px]">PRAGATI UNIVERSITY</span>
                    <span className="text-[10px] font-mono bg-[#722F37] px-2 py-0.5 rounded">
                      {lastScanResult.user.role.toUpperCase()} ID CARD
                    </span>
                  </div>

                  <div className="flex gap-3.5">
                    {/* Face Photo with Biometric scanner HUD */}
                    <div className="relative shrink-0">
                      <img
                        src={lastScanResult.user.photoUrl}
                        alt={lastScanResult.user.name}
                        className="w-24 h-28 object-cover rounded-xl border-2 border-[#722F37] shadow-sm"
                      />
                      {scanMethod === 'FACE_RECOGNITION' && (
                        <div className="absolute bottom-1 inset-x-1 bg-black/75 text-emerald-400 text-[9px] font-mono text-center py-0.5 rounded font-bold">
                          {lastScanResult.faceConfidence}% Match
                        </div>
                      )}
                    </div>

                    {/* Profile text */}
                    <div className="flex-1 min-w-0 space-y-1 text-xs">
                      <h3 className="font-bold text-sm text-[#2D2A26] leading-tight">
                        {lastScanResult.user.name}
                      </h3>
                      <p className="font-mono text-xs font-bold text-[#722F37]">
                        {lastScanResult.user.rollNumber}
                      </p>
                      <p className="text-[#6B655D] text-[11px] font-medium">
                        {lastScanResult.user.department}
                      </p>
                      <p className="text-[#7A7368] text-[11px]">
                        {lastScanResult.user.yearOrDesignation}
                      </p>

                      <div className="pt-2 text-[10px] font-mono text-[#6B655D]">
                        RFID: {lastScanResult.user.rfidCardId}
                      </div>

                      <button
                        onClick={() => onSelectUserForModal(lastScanResult.user!)}
                        className="mt-2 text-[11px] text-[#722F37] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>View Full Profile & Permissions</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Location Permissions Badges on Card */}
                  <div className="mt-3 pt-3 border-t border-[#DDD5C7] grid grid-cols-2 gap-1.5 text-[10px]">
                    <span className={`px-2 py-1 rounded font-semibold flex items-center justify-between ${lastScanResult.user.permissions.gate ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                      <span>Main Gate:</span>
                      <span>{lastScanResult.user.permissions.gate ? 'YES' : 'NO'}</span>
                    </span>
                    <span className={`px-2 py-1 rounded font-semibold flex items-center justify-between ${lastScanResult.user.permissions.lab ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                      <span>Comp Lab:</span>
                      <span>{lastScanResult.user.permissions.lab ? 'YES' : 'NO'}</span>
                    </span>
                    <span className={`px-2 py-1 rounded font-semibold flex items-center justify-between ${lastScanResult.user.permissions.library ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                      <span>Library:</span>
                      <span>{lastScanResult.user.permissions.library ? 'YES' : 'NO'}</span>
                    </span>
                    <span className={`px-2 py-1 rounded font-semibold flex items-center justify-between ${lastScanResult.user.permissions.hostel ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}>
                      <span>Hostel:</span>
                      <span>{lastScanResult.user.permissions.hostel ? 'YES' : 'NO'}</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-600">
                  Unrecognized identity badge. Please verify registration in Student & Faculty Management.
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-[#7A7368] space-y-2">
              <Camera className="w-8 h-8 mx-auto text-[#DDD5C7]" />
              <p className="font-semibold text-[#58111A]">Scanner in Standby Mode</p>
              <p>Type a roll number or click any card from the roster on the left to verify credentials.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
