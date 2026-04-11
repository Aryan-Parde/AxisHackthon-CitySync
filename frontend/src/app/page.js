'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { MapPin, Shield, Zap, BarChart3, Users, Clock, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  { value: '10K+', label: 'Complaints Resolved' },
  { value: '< 48h', label: 'Avg Resolution Time' },
  { value: '95%', label: 'Citizen Satisfaction' },
  { value: '8', label: 'City Departments' },
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

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);

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

      // Role-based redirect
      const redirects = { admin: '/dashboard/overview', authority: '/dashboard/work-queue' };
      window.location.href = redirects[user.role] || '/dashboard/map';
    } catch (error) {
      toast.error('Quick login failed. Try the standard login page.');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-darker)]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/logo-full.png" alt="CitySync" className="h-10 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2EC4B6]/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#90DBF4]/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FFBF69]/8 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2EC4B6]/10 border border-[#2EC4B6]/25 text-[#22a99d] text-sm mb-6 font-medium">
              <Zap className="w-4 h-4" />
              <span>Powered by AI • Built for Citizens</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight hover:scale-105 transition-transform duration-500 cursor-default">
              <span className="text-black hover:text-[#2EC4B6] transition-colors duration-300">Your City,</span>
              <br />
              <span className="text-black hover:text-[#2EC4B6] transition-colors duration-300">Your Voice</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Report civic issues, track resolution in real-time, and help build a smarter city.
              AI-powered routing ensures your voice reaches the right authority.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold text-base hover:shadow-lg hover:shadow-[#2EC4B6]/30 transition-all flex items-center gap-2"
              >
                Report an Issue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/map"
                className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card)] hover:border-[var(--primary)] transition-all flex items-center gap-2"
              >
                <MapPin className="w-5 h-5 text-[var(--primary)]" />
                View City Map
              </Link>
            </div>
          </motion.div>

          {/* Quick Access Roles */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 overflow-hidden max-w-5xl mx-auto px-4"
            >
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6 text-center">
                Demo Quick Access • Experience the Platform
              </p>
              
              <div className="relative group">
                <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x no-scrollbar mask-fade">
                  {quickLogins.map((role, i) => (
                    <button
                      key={i}
                      disabled={!!loadingRole}
                      onClick={() => handleAutoLogin(role.label, role.mobile)}
                      className={`flex-none w-56 p-5 rounded-2xl bg-gradient-to-br ${role.color} border border-white/5 hover:border-white/10 transition-all text-left snap-start group/card relative overflow-hidden`}
                    >
                      <div className="relative z-10">
                        <span className="text-3xl block mb-3">{role.icon}</span>
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
                      
                      {/* Hover effect background */}
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
                
                {/* Scroll indicators */}
                <div className="absolute -left-4 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--bg-darker)] to-transparent pointer-events-none" />
                <div className="absolute -right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--bg-darker)] to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="glass rounded-2xl py-5 px-4 text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-[var(--text-muted)] mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-black mb-4 hover:text-[#2EC4B6] transition-colors duration-300 cursor-default">
              Intelligent Civic Infrastructure
            </h2>
            <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
              End-to-end complaint management powered by AI, geospatial intelligence, and smart routing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group glass rounded-2xl p-6 hover:bg-[var(--bg-card-hover)] hover:shadow-lg hover:shadow-[#2EC4B6]/10 transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black text-black mb-2 group-hover:text-[#2EC4B6] transition-colors">{feature.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 relative bg-[#eaf9f5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-black mb-4 hover:text-[#2EC4B6] transition-colors duration-300 cursor-default">How It Works</h2>
            <p className="text-[var(--text-muted)] text-lg">Four simple steps to a better city</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Login', desc: 'Quick OTP-based mobile authentication', icon: '📱' },
              { step: '02', title: 'Report', desc: 'Describe issue, pin location on map', icon: '📝' },
              { step: '03', title: 'AI Routes', desc: 'Smart classification & department routing', icon: '🤖' },
              { step: '04', title: 'Track', desc: 'Real-time status updates & resolution', icon: '📊' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-[var(--primary)] mb-2 uppercase tracking-wider">{item.step}</div>
                <h3 className="text-xl font-black text-black mb-2 hover:text-[#2EC4B6] transition-colors cursor-default">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute top-10 -right-6 w-5 h-5 text-[var(--border-light)]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl p-12 bg-gradient-to-br from-[#2EC4B6]/10 via-[#F6FFFB] to-[#90DBF4]/15 border border-[#2EC4B6]/20 shadow-xl"
          >
            <h2 className="text-3xl sm:text-5xl font-black text-black mb-4 hover:text-[#2EC4B6] transition-colors duration-300 cursor-default">
              Ready to make your city better?
            </h2>
            <p className="text-[var(--text-muted)] text-lg mb-8 max-w-lg mx-auto">
              Join thousands of citizens already using CitySync to report and resolve civic issues.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold hover:shadow-lg hover:shadow-[#2EC4B6]/30 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 bg-white/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-full.png" alt="CitySync" className="h-8 w-auto object-contain bg-white/50 rounded p-1" />
          </Link>
          <p className="text-sm text-[var(--text-dim)]">
            © 2026 CitySync. Built for Axis Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
