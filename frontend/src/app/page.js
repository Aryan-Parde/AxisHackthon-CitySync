'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { MapPin, Shield, Zap, BarChart3, Users, Clock, ChevronRight, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'AI-Powered Classification',
    description: 'Automatically categorize and prioritize complaints using advanced AI models.',
    color: 'from-indigo-500 to-purple-500'
  },
  {
    icon: <MapPin className="w-6 h-6" />,
    title: 'Geo-Tagged Reporting',
    description: 'Pin exact locations on interactive maps with Mapbox integration.',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Smart Routing',
    description: 'Complaints automatically routed to the right department and zone.',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Real-time Analytics',
    description: 'Track city health with heatmaps, charts, and performance dashboards.',
    color: 'from-amber-500 to-orange-500'
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Duplicate Detection',
    description: 'AI merges similar complaints, amplifying citizen voice automatically.',
    color: 'from-pink-500 to-rose-500'
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Auto Escalation',
    description: 'Unresolved issues automatically escalate to higher authorities.',
    color: 'from-violet-500 to-indigo-500'
  },
];

const stats = [
  { value: '10K+', label: 'Complaints Resolved' },
  { value: '< 48h', label: 'Avg Resolution Time' },
  { value: '95%', label: 'Citizen Satisfaction' },
  { value: '8', label: 'City Departments' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-darker)]">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">CitySync</span>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-[var(--text-muted)] hover:text-white transition-colors text-sm">
                    Sign In
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
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
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
              <Zap className="w-4 h-4" />
              <span>Powered by AI • Built for Citizens</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-white">Your City,</span>
              <br />
              <span className="gradient-text">Your Voice</span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              Report civic issues, track resolution in real-time, and help build a smarter city.
              AI-powered routing ensures your voice reaches the right authority.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="group px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-base hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                Report an Issue
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/dashboard/map"
                className="px-8 py-3.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-card)] transition-all flex items-center gap-2"
              >
                <MapPin className="w-5 h-5" />
                View City Map
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
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
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
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
                className="group glass rounded-2xl p-6 hover:bg-[var(--bg-card-hover)] transition-all duration-300 cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[var(--text-muted)] text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 relative bg-[var(--bg-dark)]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
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
                <div className="text-xs font-bold text-indigo-400 mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute top-10 -right-6 w-5 h-5 text-[var(--border)]" />
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
            className="glass rounded-3xl p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to make your city better?
            </h2>
            <p className="text-[var(--text-muted)] text-lg mb-8 max-w-lg mx-auto">
              Join thousands of citizens already using CitySync to report and resolve civic issues.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold gradient-text">CitySync</span>
          </div>
          <p className="text-sm text-[var(--text-dim)]">
            © 2026 CitySync. Built for Axis Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}
