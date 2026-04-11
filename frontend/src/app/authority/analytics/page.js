'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, MapPin, BarChart3, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function AnalyticsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) fetchData();
  }, [authLoading, isAuthenticated, period]);

  const fetchData = async () => {
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        adminAPI.getAnalytics({ period }),
        adminAPI.getDashboard(),
      ]);
      setAnalytics(analyticsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-darker)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  const categoryData = stats?.categoryBreakdown?.map(c => ({
    name: c._id?.replace('_', ' ') || 'other',
    value: c.count,
    icon: categoryIcons[c._id] || '📋'
  })) || [];

  const priorityData = stats?.priorityBreakdown?.map(p => ({
    name: p._id || 'unknown',
    value: p.count,
  })) || [];

  const timelineData = analytics?.timeline?.map(t => ({
    date: t._id?.slice(5) || '',
    submitted: t.submitted,
    resolved: t.resolved,
  })) || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="glass rounded-lg p-3 text-sm">
        <p className="text-white font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-xs mt-1">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-darker)]">
      {/* Top bar */}
      <div className="border-b border-[var(--border)] glass">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-[var(--text-muted)] hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold gradient-text">Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--text-dim)]" />
            <select
              value={period}
              onChange={(e) => { setPeriod(e.target.value); setLoading(true); }}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] outline-none"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Complaints Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold text-white mb-4">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Complaint Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="submitted" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} name="Submitted" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Category Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {categoryData.map((cat, i) => (
                <span key={i} className="text-xs flex items-center gap-1 text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {cat.icon} {cat.name} ({cat.value})
                </span>
              ))}
            </div>
          </motion.div>

          {/* Priority Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Priority Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                    {priorityData.map((entry, i) => {
                      const colors = { critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#10b981' };
                      return <Cell key={i} fill={colors[entry.name] || '#6366f1'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Hotspots */}
        {analytics?.hotspots?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              <MapPin className="w-5 h-5 inline mr-2 text-red-400" />
              Top Hotspots
            </h2>
            <div className="space-y-3">
              {analytics.hotspots.slice(0, 5).map((spot, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-card-hover)]">
                  <span className="text-2xl font-bold text-[var(--text-dim)] w-8">#{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{spot._id || 'Unknown location'}</p>
                    <p className="text-xs text-[var(--text-dim)]">{spot.zone} zone • {spot.categories?.join(', ')}</p>
                  </div>
                  <span className="text-lg font-bold text-indigo-400">{spot.count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Department Performance */}
        {analytics?.deptPerformance?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-5"
          >
            <h2 className="text-lg font-semibold text-white mb-4">Department Rankings</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.deptPerformance.map(d => ({
                    name: d.code,
                    score: d.performanceScore,
                    avgHours: d.avgResolutionHours
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" fill="#6366f1" radius={[0, 8, 8, 0]} name="Performance Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
