'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, Clock, AlertTriangle, TrendingUp,
  Building2, BarChart3, ArrowRight, ArrowLeft, MapPin
} from 'lucide-react';

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-emerald-500/15 text-emerald-400',
};

const statusColors = {
  submitted: 'bg-amber-500/15 text-amber-400',
  under_review: 'bg-cyan-500/15 text-cyan-400',
  in_progress: 'bg-indigo-500/15 text-indigo-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
  escalated: 'bg-red-500/15 text-red-400',
  closed: 'bg-gray-500/15 text-gray-400',
};

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) fetchData();
  }, [authLoading, isAuthenticated]);

  const fetchData = async () => {
    try {
      const [statsRes, complaintsRes, deptsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getComplaints({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
        adminAPI.getDepartments(),
      ]);
      setStats(statsRes.data.data);
      setComplaints(complaintsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (error) {
      console.error('Admin fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-darker)] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
          </div>
          <div className="h-96 shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};

  const statCards = [
    { label: 'Total', value: overview.total || 0, icon: FileText, gradient: 'from-indigo-500 to-purple-500' },
    { label: 'Resolved', value: overview.resolved || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', sub: `${overview.resolutionRate || 0}% rate` },
    { label: 'Pending', value: (overview.pending || 0) + (overview.inProgress || 0), icon: Clock, gradient: 'from-amber-500 to-orange-500' },
    { label: 'Escalated', value: overview.escalated || 0, icon: AlertTriangle, gradient: 'from-red-500 to-pink-500' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-darker)]">
      {/* Top bar */}
      <div className="border-b border-[var(--border)] glass">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-[var(--text-muted)] hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold gradient-text">Admin Dashboard</h1>
          </div>
          <Link
            href="/admin/analytics"
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  {stat.sub && <p className="text-xs text-emerald-400 mt-1">{stat.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Avg resolution + zone breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resolution Time */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Avg Resolution Time</h2>
            <div className="text-center py-8">
              <p className="text-5xl font-bold gradient-text">{overview.avgResolutionHours || 0}</p>
              <p className="text-sm text-[var(--text-muted)] mt-2">hours</p>
            </div>
          </div>

          {/* Zone Breakdown */}
          <div className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Zone Breakdown</h2>
            {stats?.zoneBreakdown?.length > 0 ? (
              <div className="space-y-3">
                {stats.zoneBreakdown.map((zone, i) => {
                  const total = stats.zoneBreakdown.reduce((s, z) => s + z.count, 0);
                  const pct = total > 0 ? Math.round((zone.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-[var(--text-secondary)] w-20">{zone._id || 'Unknown'}</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--bg-card-hover)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-white w-10 text-right">{zone.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-dim)] text-center py-8">No data</p>
            )}
          </div>
        </div>

        {/* Department Performance */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            <Building2 className="w-5 h-5 inline mr-2" />
            Department Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-3 text-[var(--text-dim)] font-medium">Department</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Total</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Pending</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Resolved</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Rate</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)]">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span>{dept.icon || '🏢'}</span>
                        <span className="text-white font-medium">{dept.name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-3 text-white">{dept.liveStats?.total || 0}</td>
                    <td className="text-center py-3 px-3 text-amber-400">{dept.liveStats?.pending || 0}</td>
                    <td className="text-center py-3 px-3 text-emerald-400">{dept.liveStats?.resolved || 0}</td>
                    <td className="text-center py-3 px-3">
                      <span className="text-emerald-400">{dept.liveStats?.resolutionRate || 0}%</span>
                    </td>
                    <td className="text-center py-3 px-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-card-hover)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                            style={{ width: `${dept.performanceScore || 0}%` }}
                          />
                        </div>
                        <span className="text-white text-xs">{dept.performanceScore || 0}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Complaints Table */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Complaints</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-3 text-[var(--text-dim)] font-medium">Ticket</th>
                  <th className="text-left py-3 px-3 text-[var(--text-dim)] font-medium">Title</th>
                  <th className="text-left py-3 px-3 text-[var(--text-dim)] font-medium">Category</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Priority</th>
                  <th className="text-center py-3 px-3 text-[var(--text-dim)] font-medium">Status</th>
                  <th className="text-left py-3 px-3 text-[var(--text-dim)] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c, i) => (
                  <tr key={i} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-card-hover)]">
                    <td className="py-3 px-3 text-indigo-400 font-mono text-xs">{c.ticketId}</td>
                    <td className="py-3 px-3 text-white max-w-[200px] truncate">{c.title}</td>
                    <td className="py-3 px-3 text-[var(--text-secondary)] capitalize">{c.category?.replace('_', ' ')}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[c.priority?.level]}`}>
                        {c.priority?.level}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-dim)] text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
