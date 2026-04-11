'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-darker)] relative overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">CitySync</h1>
          <p className="text-[var(--text-muted)]">Your city, your voice. Report issues that matter.</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome</h2>
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
                  className="w-full pl-24 pr-4 py-3.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-white placeholder-[var(--text-dim)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-base"
                  maxLength={10}
                  autoFocus
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || mobile.length !== 10}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Demo hint */}
        <div className="mt-4 text-center">
          <p className="text-xs text-[var(--text-dim)]">
            💡 Demo: Use any mobile number. OTP appears in backend console.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
