'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { motion, useMotionValue, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { MapPin, Shield, Zap, BarChart3, Users, Clock, ChevronRight, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Data ─── */
const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI-Powered Classification',
    description: 'Automatically categorize and prioritize complaints using advanced AI models.',
    color: 'from-[#2EC4B6] to-[#90DBF4]'
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Geo-Tagged Reporting',
    description: 'Pin exact locations on interactive maps with Mapbox integration.',
    color: 'from-[#90DBF4] to-[#5dd5ca]'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Smart Routing',
    description: 'Complaints automatically routed to the right department and zone.',
    color: 'from-[#5dd5ca] to-[#2EC4B6]'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Real-time Analytics',
    description: 'Track city health with heatmaps, charts, and performance dashboards.',
    color: 'from-[#FFBF69] to-[#f5a83a]'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Duplicate Detection',
    description: 'AI merges similar complaints, amplifying citizen voice automatically.',
    color: 'from-[#ffd49a] to-[#FFBF69]'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Auto Escalation',
    description: 'Unresolved issues automatically escalate to higher authorities.',
    color: 'from-[#2EC4B6] to-[#FFBF69]'
  },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Complaints Resolved' },
  { value: 48, prefix: '< ', suffix: 'h', label: 'Avg Resolution Time' },
  { value: 95, suffix: '%', label: 'Citizen Satisfaction' },
  { value: 8, suffix: '', label: 'City Departments' },
];

const quickLogins = [
  { label: 'Citizen', mobile: '9876500000', icon: '👤', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-400' },
  { label: 'Roads Authority', mobile: '8000000000', icon: '🛣️', color: 'from-indigo-500/20 to-cyan-500/20', textColor: 'text-indigo-400' },
  { label: 'Water Authority', mobile: '8000000001', icon: '💧', color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-400' },
  { label: 'Sanitation Authority', mobile: '8000000002', icon: '🗑️', color: 'from-amber-500/20 to-orange-500/20', textColor: 'text-amber-400' },
  { label: 'Lighting Authority', mobile: '8000000003', icon: '💡', color: 'from-yellow-500/20 to-orange-500/20', textColor: 'text-yellow-400' },
  { label: 'Sewage Authority', mobile: '8000000004', icon: '🚰', color: 'from-cyan-500/20 to-blue-500/20', textColor: 'text-cyan-400' },
  { label: 'Traffic Authority', mobile: '8000000005', icon: '🚦', color: 'from-red-500/20 to-rose-500/20', textColor: 'text-red-400' },
];

const steps = [
  { step: '01', title: 'Login', desc: 'Quick OTP-based mobile authentication', icon: '📱' },
  { step: '02', title: 'Report', desc: 'Describe issue, pin location on map', icon: '📝' },
  { step: '03', title: 'AI Routes', desc: 'Smart classification & department routing', icon: '🤖' },
  { step: '04', title: 'Track', desc: 'Real-time status updates & resolution', icon: '📊' },
];

/* ─── Floating Particle Component ─── */
function FloatingParticle({ delay, size, x, y, duration }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, rgba(46,196,182,0.25) 0%, rgba(144,219,244,0.12) 50%, transparent 70%)`,
        filter: 'blur(1px)',
      }}
      animate={{
        y: [0, -20, 0, 15, 0],
        x: [0, 10, -8, 4, 0],
        scale: [1, 1.15, 0.95, 1.08, 1],
        opacity: [0.3, 0.6, 0.4, 0.65, 0.3],
      }}
      transition={{
        duration: duration || 8,
        repeat: Infinity,
        delay: delay || 0,
        ease: [0.45, 0, 0.55, 1],
      }}
    />
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, prefix = '', suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const end = value;
    const stepTime = Math.max(Math.floor((duration * 1000) / end), 10);
    const increment = Math.ceil(end / (duration * 1000 / stepTime));

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── 3D Tilt Card ─── */
function TiltCard({ children, className }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 40 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 40 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Magnetic Button ─── */
function MagneticButton({ children, className, href }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 25 });
  const springY = useSpring(y, { stiffness: 150, damping: 25 });

  const handleMouse = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.12);
    y.set((e.clientY - centerY) * 0.12);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

/* ─── Animated Grid Background ─── */
function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity: 0.08 }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#2EC4B6" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="gridFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="gridMask">
            <rect width="100%" height="100%" fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" mask="url(#gridMask)" />
      </svg>
    </div>
  );
}



/* ─── Main Component ─── */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef(null);

  // Cursor-tracking gradient
  const handleGlobalMouse = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouse);
    return () => window.removeEventListener('mousemove', handleGlobalMouse);
  }, [handleGlobalMouse]);

  // Dynamic gradient based on cursor
  const gradientStyle = {
    background: `
      radial-gradient(ellipse 80% 60% at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(46,196,182,0.10) 0%, transparent 50%),
      radial-gradient(ellipse 60% 80% at ${(1 - mousePos.x) * 100}% ${(1 - mousePos.y) * 100}%, rgba(144,219,244,0.08) 0%, transparent 50%),
      radial-gradient(ellipse 50% 50% at ${mousePos.x * 60 + 20}% ${mousePos.y * 60 + 20}%, rgba(255,191,105,0.05) 0%, transparent 50%),
      var(--bg-darker)
    `,
    transition: 'background 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  const handleAutoLogin = async (roleLabel, demoMobile) => {
    setLoadingRole(roleLabel);
    try {
      await authAPI.sendOTP(demoMobile);
      const verifyRes = await authAPI.verifyOTP(demoMobile, '123456');

      const { token, user } = verifyRes.data.data;
      localStorage.setItem('citysync_token', token);
      localStorage.setItem('citysync_user', JSON.stringify(user));

      const roleNames = { admin: 'Nodal Officer', authority: 'Dept. Officer', citizen: 'Citizen' };
      toast.success(`Logged in as ${roleNames[user.role] || user.role}!`);

      const redirects = { admin: '/dashboard/overview', authority: '/dashboard/work-queue' };
      window.location.href = redirects[user.role] || '/dashboard/map';
    } catch (error) {
      toast.error('Quick login failed. Try the standard login page.');
    } finally {
      setLoadingRole(null);
    }
  };

  /* ─── Text animation variants ─── */
  const letterVariants = {
    hidden: { opacity: 0, y: 40, rotateX: -60 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: i * 0.035,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  const title1 = 'Your City,';
  const title2 = 'Your Voice';

  return (
    <div className="min-h-screen" style={gradientStyle}>
      {/* ─── Navbar ─── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 w-full z-50 glass"
        style={{ boxShadow: '0 4px 30px rgba(46, 196, 182, 0.08)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <motion.img
                src="/logo-full.png"
                alt="CitySync"
                className="h-10 w-auto object-contain"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <MagneticButton
                  href="/dashboard"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-all duration-300 shadow-md shadow-[#2EC4B6]/20 hover:shadow-lg hover:shadow-[#2EC4B6]/30"
                >
                  Dashboard
                </MagneticButton>
              ) : (
                <>
                  <Link href="/auth/login" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                  <MagneticButton
                    href="/auth/login"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-all duration-300 shadow-md shadow-[#2EC4B6]/20 hover:shadow-lg hover:shadow-[#2EC4B6]/30"
                  >
                    Get Started
                  </MagneticButton>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section ref={heroRef} className="relative pt-32 pb-20 overflow-hidden">
        <AnimatedGrid />

        {/* Floating particles */}
        <FloatingParticle delay={0} size={180} x={10} y={20} duration={7} />
        <FloatingParticle delay={1.5} size={120} x={80} y={15} duration={5} />
        <FloatingParticle delay={3} size={200} x={50} y={60} duration={8} />
        <FloatingParticle delay={0.8} size={80} x={25} y={70} duration={6} />
        <FloatingParticle delay={2.2} size={140} x={70} y={50} duration={9} />
        <FloatingParticle delay={4} size={100} x={90} y={80} duration={7.5} />
        <FloatingParticle delay={1} size={60} x={40} y={10} duration={5.5} />

        {/* Cursor-following glow orb */}
        <motion.div
          className="fixed pointer-events-none z-40"
          style={{
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,196,182,0.06) 0%, rgba(144,219,244,0.03) 40%, transparent 70%)',
            left: `calc(${mousePos.x * 100}% - 200px)`,
            top: `calc(${mousePos.y * 100}% - 200px)`,
            transition: 'left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />

        {/* Background blobs - enhanced with animation */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute w-96 h-96 bg-[#2EC4B6]/12 rounded-full blur-3xl"
            animate={{
              x: [0, 40, -20, 0],
              y: [0, -25, 15, 0],
              scale: [1, 1.15, 0.97, 1],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            style={{ top: '20%', left: '20%' }}
          />
          <motion.div
            className="absolute w-96 h-96 bg-[#90DBF4]/15 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 25, 0],
              y: [0, 30, -15, 0],
              scale: [1, 0.93, 1.1, 1],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            style={{ bottom: '20%', right: '20%' }}
          />
          <motion.div
            className="absolute w-[600px] h-[600px] bg-[#FFBF69]/8 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.08, 0.96, 1],
              rotate: [0, 8, -4, 0],
            }}
            transition={{ duration: 24, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            style={{ top: '30%', left: '40%' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2EC4B6]/10 border border-[#2EC4B6]/25 text-[#22a99d] text-sm mb-6 font-medium cursor-default shadow-sm shadow-[#2EC4B6]/10"
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(46,196,182,0.2)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }}
            >
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>Powered by AI • Built for Citizens</span>
            </motion.div>
          </motion.div>

          {/* Animated Title - letter-by-letter */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight cursor-default drop-shadow-sm"
            initial="hidden"
            animate="visible"
          >
            <span className="block" style={{ perspective: '500px' }}>
              {title1.split('').map((char, i) => (
                <motion.span
                  key={`t1-${i}`}
                  custom={i}
                  variants={letterVariants}
                  className="inline-block gradient-text"
                  whileHover={{ scale: 1.2, color: '#2EC4B6', transition: { duration: 0.2 } }}
                  style={{ display: 'inline-block' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
            <span className="block mt-2" style={{ perspective: '500px' }}>
              {title2.split('').map((char, i) => (
                <motion.span
                  key={`t2-${i}`}
                  custom={i + title1.length}
                  variants={letterVariants}
                  className="inline-block gradient-text"
                  whileHover={{ scale: 1.2, transition: { duration: 0.2 } }}
                  style={{ display: 'inline-block' }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          {/* Subtitle with stagger */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Report civic issues, track resolution in real-time, and help build a smarter city.
            AI-powered routing ensures your voice reaches the right authority.
          </motion.p>

          {/* CTA Buttons with magnetic effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <MagneticButton
              href="/auth/login"
              className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold text-base shadow-lg shadow-[#2EC4B6]/25 hover:shadow-xl hover:shadow-[#2EC4B6]/35 transition-all duration-500 flex items-center gap-2 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Report an Issue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </MagneticButton>

            <MagneticButton
              href="/map"
              className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all duration-500 flex items-center gap-2 shadow-sm hover:shadow-md hover:shadow-[#2EC4B6]/10"
            >
              <MapPin className="w-5 h-5 text-[var(--primary)]" />
              View City Map
            </MagneticButton>
          </motion.div>

          {/* Quick Access Roles */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-16 overflow-hidden max-w-5xl mx-auto px-4"
            >
              <motion.p
                className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 text-center"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Demo Quick Access • Experience the Platform
              </motion.p>

              <div className="relative group">
                <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x no-scrollbar mask-fade">
                  {quickLogins.map((role, i) => (
                    <motion.button
                      key={i}
                      disabled={!!loadingRole}
                      onClick={() => handleAutoLogin(role.label, role.mobile)}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.3 + i * 0.08 }}
                      whileHover={{
                        scale: 1.04,
                        y: -4,
                        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                      }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex-none w-56 p-5 rounded-2xl bg-gradient-to-br ${role.color} border border-white/5 hover:border-white/10 transition-all duration-500 text-left snap-start group/card relative overflow-hidden shadow-md shadow-black/5 hover:shadow-lg hover:shadow-black/10`}
                    >
                      <div className="relative z-10">
                        <motion.span
                          className="text-3xl block mb-3"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        >
                          {role.icon}
                        </motion.span>
                        <h3 className={`text-base font-bold ${role.textColor} mb-1 flex items-center gap-2`}>
                          {role.label}
                          {loadingRole === role.label ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover/card:opacity-100 transition-all translate-x-[-10px] group-hover/card:translate-x-0" />
                          )}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">Fast-track to {role.label.split(' ')[0]} panel</p>
                      </div>

                      {/* Hover shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                    </motion.button>
                  ))}
                </div>

                <div className="absolute -left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg-darker)] to-transparent pointer-events-none" />
                <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-darker)] to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* Stats with animated counters */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{
                  scale: 1.06,
                  boxShadow: '0 12px 40px rgba(46,196,182,0.18)',
                  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                }}
                className="glass rounded-2xl py-5 px-4 text-center cursor-default shadow-md shadow-[#2EC4B6]/8"
              >
                <div className="text-3xl font-bold text-[#1a1a2e] drop-shadow-sm">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    duration={2}
                  />
                </div>
                <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Features with 3D Tilt ─── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4 cursor-default drop-shadow-sm">
              <span className="gradient-text">Intelligent</span>{' '}
              <span className="text-[#1a1a2e]">Civic Infrastructure</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              End-to-end complaint management powered by AI, geospatial intelligence, and smart routing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <TiltCard className="group glass rounded-2xl p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-[#2EC4B6]/15 transition-all duration-500 cursor-default h-full">
                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white shadow-md shadow-[#2EC4B6]/20`}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    {feature.icon}
                  </motion.div>
                  <h3 className="text-xl font-black text-[#1a1a2e] mb-2 group-hover:text-[#2EC4B6] transition-colors duration-400">{feature.title}</h3>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.description}</p>

                  {/* Animated border glow on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-transparent"
                    whileHover={{
                      borderColor: 'rgba(46,196,182,0.25)',
                      boxShadow: '0 0 30px rgba(46,196,182,0.12)',
                    }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section className="py-24 relative bg-[#eaf9f5] overflow-hidden" style={{ boxShadow: 'inset 0 2px 20px rgba(46, 196, 182, 0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-3xl sm:text-5xl font-black mb-4 cursor-default drop-shadow-sm">
              <span className="text-[#1a1a2e]">How It </span><span className="gradient-text">Works</span>
            </h2>
            <p className="text-[var(--text-muted)] text-lg">Four simple steps to a better city</p>
          </motion.div>

          {/* Connecting line behind cards (desktop) */}
          <div className="hidden md:block absolute top-[55%] left-[12%] right-[12%] h-[2px] pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-[#2EC4B6]/25 to-transparent rounded-full" />
            {/* Traveling dot */}
            <motion.div
              className="absolute top-[-3px] w-2 h-2 rounded-full bg-[#2EC4B6] shadow-lg shadow-[#2EC4B6]/50"
              animate={{ left: ['0%', '100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            {steps.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, scale: 0.85 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="relative group"
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.03, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                  className="glass rounded-2xl p-6 text-center relative overflow-hidden shadow-lg shadow-[#2EC4B6]/5 hover:shadow-xl hover:shadow-[#2EC4B6]/15 transition-shadow duration-500"
                >
                  {/* Step number circle */}
                  <motion.div
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2EC4B6] to-[#90DBF4] flex items-center justify-center text-white text-sm font-black mx-auto mb-4 shadow-md shadow-[#2EC4B6]/30"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.3, duration: 0.6, type: 'spring', stiffness: 200 }}
                  >
                    {item.step}
                  </motion.div>

                  {/* Animated icon */}
                  <motion.div
                    className="text-5xl mb-4 inline-block relative"
                    animate={{
                      y: [0, -8, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  >
                    {item.icon}
                    {/* Glow ring behind icon */}
                    <motion.div
                      className="absolute inset-[-8px] rounded-full bg-[#2EC4B6]/8 blur-md"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.4, ease: 'easeInOut' }}
                    />
                  </motion.div>

                  <h3 className="text-xl font-black text-[#1a1a2e] mb-2 group-hover:text-[#2EC4B6] transition-colors duration-500 cursor-default">{item.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{item.desc}</p>

                  {/* Bottom accent bar */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4]"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin: 'left' }}
                  />

                  {/* Hover shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.7 }}
                  />
                </motion.div>

                {/* Arrow connector between cards (desktop) */}
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-20">
                    <motion.div
                      animate={{ x: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                    >
                      <ChevronRight className="w-6 h-6 text-[#2EC4B6]" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA with animated border ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative group"
          >
            {/* Ambient pulsing glow behind card */}
            <motion.div
              className="absolute -inset-4 rounded-[2rem] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(46,196,182,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(144,219,244,0.12) 0%, transparent 60%)',
              }}
              animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.98, 1.02, 0.98] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbiting glow dots */}
            {[0, 1, 2].map((dotIdx) => (
              <motion.div
                key={dotIdx}
                className="absolute w-3 h-3 rounded-full pointer-events-none"
                style={{
                  background: dotIdx === 0 ? '#2EC4B6' : dotIdx === 1 ? '#90DBF4' : '#FFBF69',
                  boxShadow: `0 0 12px ${dotIdx === 0 ? 'rgba(46,196,182,0.6)' : dotIdx === 1 ? 'rgba(144,219,244,0.6)' : 'rgba(255,191,105,0.6)'}`,
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: [0, 250, 250, -250, -250, 0],
                  y: [dotIdx === 0 ? -200 : dotIdx === 1 ? 200 : -200, dotIdx === 0 ? -50 : dotIdx === 1 ? 50 : -50, dotIdx === 0 ? 200 : dotIdx === 1 ? -200 : 200, dotIdx === 0 ? 50 : dotIdx === 1 ? -50 : 50, dotIdx === 0 ? -200 : dotIdx === 1 ? 200 : -200, dotIdx === 0 ? -200 : dotIdx === 1 ? 200 : -200],
                  opacity: [0.6, 0.9, 0.6, 0.9, 0.6, 0.6],
                  scale: [1, 1.3, 1, 1.3, 1, 1],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  delay: dotIdx * 3.3,
                  ease: [0.45, 0, 0.55, 1],
                }}
              />
            ))}

            <div className="relative rounded-3xl p-12 bg-gradient-to-br from-[#2EC4B6]/10 via-[#F6FFFB] to-[#90DBF4]/15 border border-[#2EC4B6]/20 shadow-2xl shadow-[#2EC4B6]/10 overflow-hidden">
              {/* Shimmer overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '50%' }}
              />

              <motion.h2
                className="text-3xl sm:text-5xl font-black mb-4 cursor-default relative z-10 drop-shadow-sm"
              >
                <span className="text-[#1a1a2e]">Ready to make your </span><span className="gradient-text">city better?</span>
              </motion.h2>
              <p className="text-[var(--text-muted)] text-lg mb-8 max-w-lg mx-auto relative z-10">
                Join thousands of citizens already using CitySync to report and resolve civic issues.
              </p>
              <motion.div className="relative z-10">
                <MagneticButton
                  href="/auth/login"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold shadow-lg shadow-[#2EC4B6]/25 hover:shadow-xl hover:shadow-[#2EC4B6]/35 transition-all duration-500"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </MagneticButton>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="border-t border-[var(--border)] py-8 bg-white/60 shadow-inner"
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-full.png" alt="CitySync" className="h-8 w-auto object-contain bg-white/50 rounded p-1" />
          </Link>
          <p className="text-sm text-[var(--text-dim)]">
            © 2026 CitySync. Built for Axis Hackathon.
          </p>
        </div>
      </motion.footer>
    </div>
  );
}
