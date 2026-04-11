'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';
import { MapPin, Phone, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleaned = mobile.replace(/\s/g, '');
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendOTP(cleaned);
      toast.success('OTP sent! Check your console (backend logs)');
      router.push(`/auth/verify?mobile=${encodeURIComponent('+91' + cleaned)}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const getRoleRedirect = (role) => {
    switch(role) {
      case 'admin': return '/dashboard/overview';
      case 'authority': return '/dashboard/work-queue';
      default: return '/dashboard/map';
    }
  };

  const handleAutoLogin = async (demoMobile) => {
    setLoading(true);
    try {
      await authAPI.sendOTP(demoMobile);
      const verifyRes = await authAPI.verifyOTP(demoMobile, '123456');
      
      const { token, user } = verifyRes.data.data;
      localStorage.setItem('citysync_token', token);
      localStorage.setItem('citysync_user', JSON.stringify(user));
      
      const roleNames = { admin: 'Nodal Officer', authority: 'Dept. Officer', citizen: 'Citizen' };
      toast.success(`Logged in as ${roleNames[user.role] || user.role}!`);
      window.location.href = getRoleRedirect(user.role);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Auto login failed');
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

        {/* Login Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Welcome</h2>
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
        </div>

        {/* Role Selection - Scrollable List */}
        <div className="mt-6">
          <p className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-widest mb-3 text-center">
            Quick Login As
          </p>
          <div className="glass rounded-2xl p-3 max-h-64 overflow-y-auto space-y-1.5">
            {/* Citizen */}
            <button
              onClick={() => handleAutoLogin('9876500000')}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/10 transition-all text-left group"
            >
              <span className="text-xl">👤</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-400">Citizen</p>
                <p className="text-xs text-[var(--text-dim)]">Report & track issues</p>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            {/* Divider */}
            <div className="flex items-center gap-2 py-1 px-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Department Officers</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Department Officers */}
            {[
              { label: 'Roads & Infrastructure', icon: '🛣️', mobile: '8000000000', color: 'indigo' },
              { label: 'Water Supply', icon: '💧', mobile: '8000000001', color: 'blue' },
              { label: 'Sanitation & Waste', icon: '🗑️', mobile: '8000000002', color: 'amber' },
              { label: 'Street Lighting', icon: '💡', mobile: '8000000003', color: 'yellow' },
              { label: 'Sewage & Drainage', icon: '🚰', mobile: '8000000004', color: 'cyan' },
              { label: 'Traffic & Transport', icon: '🚦', mobile: '8000000005', color: 'red' },
            ].map((dept) => (
              <button
                key={dept.mobile}
                onClick={() => handleAutoLogin(dept.mobile)}
                disabled={loading}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-${dept.color}-500/8 hover:bg-${dept.color}-500/15 border border-${dept.color}-500/10 transition-all text-left group`}
              >
                <span className="text-xl">{dept.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold text-${dept.color}-400`}>{dept.label}</p>
                  <p className="text-xs text-[var(--text-dim)]">Dept. Officer</p>
                </div>
                <ArrowRight className={`w-4 h-4 text-${dept.color}-400 opacity-0 group-hover:opacity-100 transition-opacity`} />
              </button>
            ))}

            {/* Divider */}
            <div className="flex items-center gap-2 py-1 px-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-[10px] text-[var(--text-dim)] uppercase tracking-wider">Admin</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Nodal Officer */}
            <button
              onClick={() => handleAutoLogin('9999999999')}
              disabled={loading}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-purple-500/8 hover:bg-purple-500/15 border border-purple-500/10 transition-all text-left group"
            >
              <span className="text-xl">🏛️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-purple-400">Nodal Officer</p>
                <p className="text-xs text-[var(--text-dim)]">City-wide oversight & reassign</p>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
