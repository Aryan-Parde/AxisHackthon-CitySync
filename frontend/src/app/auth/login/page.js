'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { MapPin, Phone, ArrowRight, ArrowLeft, Loader2, Shield, User, Lock, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [tab, setTab] = useState('citizen'); // 'citizen' | 'authority'
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const getRoleRedirect = (role) => {
    switch(role) {
      case 'admin': return '/dashboard/overview';
      case 'authority': return '/dashboard/work-queue';
      default: return '/dashboard/map';
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleaned = mobile.replace(/\s/g, '');
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.sendOTP(cleaned);
      const smsSent = res.data?.data?.smsSent;
      toast.success(smsSent ? 'OTP sent to your phone! 📲' : 'OTP generated — check backend console or use 123456');
      router.push(`/auth/verify?mobile=${encodeURIComponent('+91' + cleaned)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorityLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.authorityLogin(username.trim(), password);
      const { token, user } = res.data.data;
      
      login(user, token);
      
      const roleNames = { admin: 'Nodal Officer', authority: 'Dept. Officer' };
      toast.success(`Welcome, ${user.name || roleNames[user.role] || 'Officer'}!`);
      window.location.href = getRoleRedirect(user.role);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-darker)] relative overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#2EC4B6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#90DBF4]/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back to Home */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Home</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo-full.png" alt="CitySync Logo" className="h-[72px] w-auto object-contain mb-4" />
          <p className="text-[var(--text-muted)]">Your city, your voice. Report issues that matter.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-1 mb-6">
          <button
            onClick={() => setTab('citizen')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'citizen'
                ? 'bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <User className="w-4 h-4" />
            Citizen
          </button>
          <button
            onClick={() => setTab('authority')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'authority'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Shield className="w-4 h-4" />
            Authority
          </button>
        </div>

        {/* Login Card */}
        <AnimatePresence mode="wait">
          {tab === 'citizen' ? (
            <motion.div
              key="citizen"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Citizen Login</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Enter your mobile number to get started</p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--text-muted)]">
                      <span className="text-sm font-medium">🇮🇳 +91</span>
                      <div className="w-px h-5 bg-[var(--border)]" />
                    </div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit number"
                      className="w-full pl-24 pr-4 py-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-[#2EC4B6] focus:ring-1 focus:ring-[#2EC4B6]/50 outline-none transition-all text-base"
                      maxLength={10}
                      autoFocus
                    />
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || mobile.length !== 10}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-[var(--text-dim)] mt-6">
                By continuing, you agree to CitySync&apos;s Terms of Service and Privacy Policy.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="authority"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="glass rounded-2xl p-8"
            >
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Authority Login</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Login with your department credentials</p>

              <form onSubmit={handleAuthorityLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. roads_officer"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-base"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-dim)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username.trim() || !password.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Login as Authority
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-[var(--text-dim)] mt-6">
                Contact your city admin if you don&apos;t have credentials.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
