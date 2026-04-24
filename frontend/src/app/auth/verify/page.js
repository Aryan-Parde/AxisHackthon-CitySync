'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { MapPin, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

function VerifyOTPContent() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const mobile = searchParams.get('mobile') || '';

  useEffect(() => {
    if (!mobile) {
      router.push('/auth/login');
      return;
    }
    inputRefs.current[0]?.focus();
  }, [mobile, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields filled
    if (newOtp.every(d => d !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (otpString = null) => {
    const otpCode = otpString || otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.verifyOTP(mobile, otpCode);
      const { token, user } = res.data.data;
      login(user, token);
      toast.success('Welcome to CitySync! 🏙️');

      // Role-based redirect
      const redirects = { admin: '/dashboard/overview', authority: '/dashboard/work-queue' };
      router.push(redirects[user.role] || '/dashboard/map');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await authAPI.sendOTP(mobile);
      toast.success('OTP resent! Check backend console.');
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-darker)] relative overflow-hidden px-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#2EC4B6]/15 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-[#90DBF4]/15 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <button
          onClick={() => router.push('/auth/login')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <img src="/logo-icon.png" alt="CitySync Logo" className="h-[72px] w-auto object-contain mb-4" />
        </div>

        {/* Verify Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-1">Verify OTP</h2>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Enter the 6-digit code for <span className="text-[#2EC4B6] font-medium">{mobile}</span>
          </p>

          {/* Server down notice */}
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-start gap-2">
              <span className="text-lg leading-none mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-600">SMS Service Temporarily Unavailable</p>
                <p className="text-xs text-amber-600/80 mt-1">
                  Free API limited access — enter <span className="font-bold text-amber-700 bg-amber-500/15 px-1.5 py-0.5 rounded text-sm">123456</span> as master OTP to continue.
                </p>
              </div>
            </div>
          </div>

          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="otp-input"
                disabled={loading}
              />
            ))}
          </div>

          {/* Resend timer */}
          <div className="text-center mb-6">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-[#2EC4B6] hover:text-[#22a99d] transition-colors flex items-center gap-1.5 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-[var(--text-dim)]">
                Resend OTP in <span className="text-[#2EC4B6] font-medium">{resendTimer}s</span>
              </p>
            )}
          </div>

          <button
            onClick={() => handleVerify()}
            disabled={loading || otp.some(d => d === '')}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Verify & Login'
            )}
          </button>

          {/* Master OTP hint */}
          <div className="mt-4 p-3 rounded-lg bg-[#2EC4B6]/10 border border-[#2EC4B6]/20">
            <p className="text-xs text-[#2EC4B6] text-center font-medium">
              💡 Enter <span className="font-bold">123456</span> as master OTP (free API limited access)
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-darker)]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2EC4B6]" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
