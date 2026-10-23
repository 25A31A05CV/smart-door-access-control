import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertCircle, KeyRound, School } from 'lucide-react';
import { AdminCredential } from '../types';

interface LoginViewProps {
  admins: AdminCredential[];
  onLoginSuccess: (admin: AdminCredential) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ admins, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const trimmedUser = username.trim().toLowerCase();
      // Look for matching credentials in admins list
      const matched = admins.find(
        (a) => a.username.toLowerCase() === trimmedUser && a.passwordHash === password
      );

      if (matched) {
        // Update last login
        const updated = { ...matched, lastLogin: new Date().toISOString() };
        onLoginSuccess(updated);
      } else {
        setErrorMessage('Invalid administrative credentials. Access Denied.');
        setIsLoading(false);
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Background subtle watermark & decorative pattern */}
      <div className="w-full max-w-md">
        {/* College Crest & Header Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#722F37] shadow-xl border-4 border-[#E8E2D5] mb-4 overflow-hidden p-1.5">
            <img
              src="/pragati_logo.svg"
              alt="Pragati University Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#58111A]">
            PRAGATI UNIVERSITY
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#722F37] font-semibold mt-0.5">
            Smart Door Access & Attendance Portal
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E2D5] text-[#58111A] text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Authorized Security Personnel & Faculty Gateway</span>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-2xl shadow-xl border border-[#E2DACB] p-8">
          <div className="border-b border-[#F0EBE1] pb-4 mb-6">
            <h2 className="text-lg font-bold text-[#2D2A26]">Administrative Sign In</h2>
          </div>

          {errorMessage && (
            <div 
              role="alert" 
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-semibold">Authentication Error:</span> {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label 
                htmlFor="admin-username" 
                className="block text-xs font-bold uppercase tracking-wider text-[#58111A] mb-1.5"
              >
                Administrator Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8275]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator ID"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-sm text-[#2D2A26] placeholder-[#9E968B] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="admin-password" 
                className="block text-xs font-bold uppercase tracking-wider text-[#58111A] mb-1.5"
              >
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C8275]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#DDD5C7] text-sm text-[#2D2A26] placeholder-[#9E968B] focus:outline-none focus:ring-2 focus:ring-[#722F37] focus:border-transparent transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C8275] hover:text-[#58111A] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-[#722F37] hover:bg-[#58111A] text-[#F5F2EB] font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#F5F2EB] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authorize & Access System</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-[#F0EBE1] text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#7A7368]">
              <Lock className="w-3 h-3 text-[#722F37]" />
              <span>TLS 1.3 256-Bit Cryptographic Hardware Bridge Protected</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-[#8C8275] mt-6">
          Smart Door Access Control & Attendance System &copy; {new Date().getFullYear()} Pragati University
        </p>
      </div>
    </div>
  );
};
