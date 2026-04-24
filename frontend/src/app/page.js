'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { motion, useInView } from 'framer-motion';
import { MapPin, Shield, Zap, BarChart3, Users, Clock, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
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



const steps = [
  { step: '01', title: 'Login', desc: 'Quick OTP-based mobile authentication', icon: '📱' },
  { step: '02', title: 'Report', desc: 'Describe issue, pin location on map', icon: '📝' },
  { step: '03', title: 'AI Routes', desc: 'Smart classification & department routing', icon: '🤖' },
  { step: '04', title: 'Track', desc: 'Real-time status updates & resolution', icon: '📊' },
];

/* ─── Floating Particle Component (lightweight) ─── */
function FloatingParticle({ delay, size, x, y }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        top: `${y}%`,
        background: `radial-gradient(circle, rgba(46,196,182,0.18) 0%, rgba(144,219,244,0.08) 50%, transparent 70%)`,
        filter: 'blur(1px)',
        animation: `float ${8 + delay}s ease-in-out infinite ${delay}s`,
        opacity: 0.4,
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

/* ─── Tilt Card (simplified — no spring physics) ─── */
function TiltCard({ children, className }) {
  return (
    <div className={className} style={{ transition: 'transform 0.3s ease' }}>
      {children}
    </div>
  );
}

/* ─── Magnetic Button (simplified) ─── */
function MagneticButton({ children, className, href }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
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
  const { isAuthenticated, user, loading: authLoading, logout } = useAuth();

  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [selectedCity, setSelectedCity] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const heroRef = useRef(null);

  const indianCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune',
    'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
    'Visakhapatnam', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik',
    'Faridabad', 'Meerut', 'Rajkot', 'Varanasi', 'Srinagar', 'Aurangabad', 'Dhanbad',
    'Amritsar', 'Navi Mumbai', 'Allahabad', 'Howrah', 'Ranchi', 'Gwalior', 'Jabalpur',
    'Coimbatore', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh',
    'Guwahati', 'Solapur', 'Hubli', 'Mysore', 'Tiruchirappalli', 'Bareilly', 'Aligarh',
    'Tiruppur', 'Moradabad', 'Jalandhar', 'Bhubaneswar', 'Salem', 'Warangal', 'Guntur',
    'Bhiwandi', 'Saharanpur', 'Gorakhpur', 'Bikaner', 'Amravati', 'Noida', 'Jamshedpur',
    'Bhilai', 'Cuttack', 'Firozabad', 'Kochi', 'Nellore', 'Bhavnagar', 'Dehradun',
    'Durgapur', 'Asansol', 'Kolhapur', 'Ajmer', 'Akola', 'Gulbarga', 'Jamnagar',
    'Ujjain', 'Loni', 'Siliguri', 'Jhansi', 'Ulhasnagar', 'Sangli', 'Mangalore',
  ];

  const filteredCities = citySearch
    ? indianCities.filter(c => c.toLowerCase().startsWith(citySearch.toLowerCase())).slice(0, 6)
    : [];

  // Cursor-tracking gradient — throttled for performance
  const lastMouseUpdate = useRef(0);
  const handleGlobalMouse = useCallback((e) => {
    const now = Date.now();
    if (now - lastMouseUpdate.current < 50) return; // throttle to 20fps
    lastMouseUpdate.current = now;
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMousePos({ x, y });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleGlobalMouse, { passive: true });
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
              {authLoading ? (
                <div className="w-24 h-9 rounded-lg shimmer" />
              ) : isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      logout();
                      window.location.href = '/';
                    }}
                    className="text-[var(--text-muted)] hover:text-red-500 transition-colors text-sm font-medium"
                  >
                    Sign Out
                  </button>
                  <MagneticButton
                    href={user?.role === 'admin' ? '/dashboard/overview' : user?.role === 'authority' ? '/dashboard/work-queue' : '/dashboard/map'}
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-all duration-300 shadow-md shadow-[#2EC4B6]/20 hover:shadow-lg hover:shadow-[#2EC4B6]/30"
                  >
                    My Dashboard
                  </MagneticButton>
                </>
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
        <FloatingParticle delay={0} size={180} x={10} y={20} />
        <FloatingParticle delay={2} size={140} x={75} y={50} />
        <FloatingParticle delay={4} size={100} x={50} y={70} />

        {/* Cursor-following glow orb (CSS transition only — no JS animation) */}
        <div
          className="fixed pointer-events-none z-40"
          style={{
            width: 350,
            height: 350,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(46,196,182,0.05) 0%, rgba(144,219,244,0.02) 40%, transparent 70%)',
            left: `calc(${mousePos.x * 100}% - 175px)`,
            top: `calc(${mousePos.y * 100}% - 175px)`,
            transition: 'left 0.5s ease-out, top 0.5s ease-out',
            willChange: 'left, top',
          }}
        />

        {/* Background blobs — CSS-only for performance */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute w-96 h-96 bg-[#2EC4B6]/10 rounded-full blur-3xl"
            style={{ top: '20%', left: '20%', animation: 'pulse 16s ease-in-out infinite' }}
          />
          <div
            className="absolute w-96 h-96 bg-[#90DBF4]/12 rounded-full blur-3xl"
            style={{ bottom: '20%', right: '20%', animation: 'pulse 20s ease-in-out infinite 3s' }}
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

          {/* Animated Title — word-level animation (faster than letter-by-letter) */}
          <motion.h1
            className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight cursor-default drop-shadow-sm"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block gradient-text">Your City,</span>
            <span className="block gradient-text mt-2">Your Voice</span>
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

          {/* City Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 max-w-md mx-auto relative"
          >
            <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-3">Select Your City</p>
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/90 border border-[var(--border)] shadow-sm focus-within:border-[#2EC4B6] focus-within:shadow-md focus-within:shadow-[#2EC4B6]/10 transition-all">
                <MapPin className="w-4 h-4 text-[#2EC4B6] flex-shrink-0" />
                <input
                  type="text"
                  value={selectedCity || citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setSelectedCity('');
                    setShowCitySuggestions(true);
                  }}
                  onFocus={() => setShowCitySuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                  placeholder="Type your city name..."
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
                />
                {selectedCity && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#2EC4B6]/10 text-[#2EC4B6] font-medium">✓</span>
                )}
              </div>
              {showCitySuggestions && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[var(--border)] shadow-lg overflow-hidden z-20">
                  {filteredCities.map((city) => (
                    <button
                      key={city}
                      onMouseDown={() => {
                        setSelectedCity(city);
                        setCitySearch('');
                        setShowCitySuggestions(false);
                        localStorage.setItem('citysync_city', city);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-[#2EC4B6]/5 text-[var(--text-primary)] transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[var(--text-dim)]" />
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

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
            {/* Ambient glow behind card — CSS only */}
            <div
              className="absolute -inset-4 rounded-[2rem] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(46,196,182,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(144,219,244,0.10) 0%, transparent 60%)',
                animation: 'pulse 4s ease-in-out infinite',
              }}
            />

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
