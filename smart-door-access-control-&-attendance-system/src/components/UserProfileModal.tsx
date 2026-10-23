import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Laptop,
  BookOpen,
  Home,
  CheckCircle2,
  XCircle,
  QrCode,
  Printer,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Barcode,
  School,
  Shield,
} from 'lucide-react';
import { CollegeUser, LOCATIONS } from '../types';

interface UserProfileModalProps {
  user: CollegeUser | null;
  onClose: () => void;
  onTogglePermission?: (user: CollegeUser, loc: 'gate' | 'lab' | 'library' | 'hostel') => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  onClose,
  onTogglePermission,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'details'>('front');

  if (!user) return null;

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#DDD5C7] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#58111A] text-[#F5F2EB] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#722F37] flex items-center justify-center border border-[#8C3B45]">
              <CreditCard className="w-5 h-5 text-[#F5F2EB]" />
            </div>
            <div>
              <h2 className="text-base font-bold">Collegiate Smart ID Card & Profile Details</h2>
              <p className="text-xs text-[#E8E2D5]">Biometric Face ID & Multi-Door Access Permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close profile modal"
            className="p-1.5 rounded-lg text-[#E8E2D5] hover:text-white hover:bg-[#722F37] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* THE OFFICIAL SMART ID CARD BADGE (Module 3 requirement) */}
          <div className="relative mx-auto max-w-md rounded-2xl bg-gradient-to-b from-[#FAF8F5] via-white to-[#F5F2EB] border-2 border-[#722F37] shadow-lg overflow-hidden p-5">
            {/* Card Header Strip */}
            <div className="flex items-center justify-between border-b-2 border-[#722F37] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#722F37] flex items-center justify-center border border-[#8C3B45] overflow-hidden p-0.5 shadow-xs">
                  <img src="/pragati_logo.svg" alt="Pragati University" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-wider text-[#58111A] leading-tight">
                    PRAGATI UNIVERSITY
                  </h3>
                  <p className="text-[9px] uppercase tracking-widest text-[#722F37] font-semibold">
                    Campus Access & Attendance System
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#722F37] text-[#F5F2EB]">
                {user.role.toUpperCase()}
              </span>
            </div>

            {/* Photo & Profile Data Side-by-Side */}
            <div className="flex gap-4 items-center">
              {/* Face ID Photo */}
              <div className="relative shrink-0">
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-24 h-32 rounded-xl object-cover border-2 border-[#722F37] shadow-md"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-emerald-400 text-[8px] font-mono rounded font-bold">
                  VERIFIED
                </span>
              </div>

              {/* Identity Details */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider">
                  Full Name
                </div>
                <div className="text-base font-extrabold text-[#2D2A26] leading-tight">
                  {user.name}
                </div>

                <div className="text-[10px] uppercase font-bold text-[#8C8275] tracking-wider pt-1">
                  Roll / Faculty ID
                </div>
                <div className="text-sm font-mono font-black text-[#722F37]">
                  {user.rollNumber}
                </div>

                <div className="text-xs font-semibold text-[#58111A] truncate pt-0.5">
                  {user.department}
                </div>
                <div className="text-[11px] text-[#6B655D]">
                  {user.yearOrDesignation}
                </div>
              </div>
            </div>

            {/* Smart Chip, Barcode & RFID UID */}
            <div className="mt-4 pt-3 border-t border-[#E8E2D5] flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <p className="text-[9px] text-[#8C8275] font-mono uppercase">Smart RFID Chip UID</p>
                <p className="font-mono font-bold text-[#58111A] text-xs">{user.rfidCardId}</p>
                <p className="text-[9px] text-[#8C8275] font-mono">CODE128: {user.barcode}</p>
              </div>

              {/* Decorative QR / Chip icon */}
              <div className="w-12 h-12 rounded-lg bg-[#FAF8F5] border border-[#DDD5C7] flex items-center justify-center text-[#722F37]">
                <QrCode className="w-8 h-8" />
              </div>
            </div>

            {/* Active Door Authorization Matrix */}
            <div className="mt-3 pt-3 border-t border-[#E8E2D5] grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
              <div className={`p-1 rounded ${user.permissions.gate ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                Gate: {user.permissions.gate ? 'YES' : 'NO'}
              </div>
              <div className={`p-1 rounded ${user.permissions.lab ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                Lab: {user.permissions.lab ? 'YES' : 'NO'}
              </div>
              <div className={`p-1 rounded ${user.permissions.library ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                Library: {user.permissions.library ? 'YES' : 'NO'}
              </div>
              <div className={`p-1 rounded ${user.permissions.hostel ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>
                Hostel: {user.permissions.hostel ? 'YES' : 'NO'}
              </div>
            </div>
          </div>

          {/* Contact & Administrative Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-4 rounded-xl border border-[#E8E2D5]">
            <div className="flex items-center gap-2 text-[#6B655D]">
              <Mail className="w-4 h-4 text-[#722F37]" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B655D]">
              <Phone className="w-4 h-4 text-[#722F37]" />
              <span>{user.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B655D]">
              <Calendar className="w-4 h-4 text-[#722F37]" />
              <span>Enrolled: {new Date(user.registeredAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B655D]">
              <Shield className="w-4 h-4 text-[#722F37]" />
              <span>
                Status:{' '}
                <strong className={user.status === 'ACTIVE' ? 'text-emerald-700' : 'text-rose-700'}>
                  {user.status}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Print Card Option */}
        <div className="bg-[#FAF8F5] border-t border-[#E8E2D5] px-6 py-3 flex items-center justify-between">
          <button
            onClick={handlePrintCard}
            className="px-4 py-2 rounded-xl bg-white border border-[#DDD5C7] text-[#58111A] text-xs font-semibold hover:bg-[#F5F2EB] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Print Smart ID Card</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-[#F5F2EB] text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
