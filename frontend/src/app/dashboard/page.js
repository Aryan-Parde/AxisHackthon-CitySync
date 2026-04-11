'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, Clock, AlertTriangle, TrendingUp,
  PlusCircle, Map, ArrowRight, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

const priorityColors = {
  critical: 'bg-red-100 text-red-600 border-red-200',
  high: 'bg-orange-100 text-orange-600 border-orange-200',
  medium: 'bg-amber-100 text-amber-600 border-amber-200',
  low: 'bg-emerald-100 text-emerald-600 border-emerald-200',
};

const statusColors = {
  submitted: 'bg-amber-100 text-amber-600',
  under_review: 'bg-sky-100 text-sky-600',
  in_progress: 'bg-[#2EC4B6]/10 text-[#22a99d]',
  resolved: 'bg-emerald-100 text-emerald-600',
  escalated: 'bg-red-100 text-red-600',
  closed: 'bg-gray-100 text-gray-500',
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        adminAPI.getDashboard(),
        complaintsAPI.getMyComplaints({ limit: 5 })
      ]);
      setStats(statsRes.data.data);
      setComplaints(complaintsRes.data.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl shimmer" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl shimmer" />
          <div className="h-80 rounded-2xl shimmer" />
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};

  const statCards = [
    {
      label: 'Total Complaints',
      value: overview.total || 0,
      icon: FileText,
      gradient: 'from-[#2EC4B6] to-[#90DBF4]',
      change: '+12%'
    },
    {
      label: 'Resolved',
      value: overview.resolved || 0,
      icon: CheckCircle,
      gradient: 'from-[#60c6ed] to-[#2EC4B6]',
      change: `${overview.resolutionRate || 0}%`
    },
    {
      label: 'Pending',
      value: (overview.pending || 0) + (overview.inProgress || 0),
      icon: Clock,
      gradient: 'from-[#FFBF69] to-[#f5a83a]',
      change: null
    },
    {
      label: 'Escalated',
      value: overview.escalated || 0,
      icon: AlertTriangle,
      gradient: 'from-[#e84855] to-[#FFBF69]',
      change: null
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome back, <span className="gradient-text">{user?.name || 'Citizen'}</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Here&apos;s what&apos;s happening in your city today
          </p>
        </div>
        {user?.role === 'citizen' && (
          <Link
            href="/dashboard/complaints/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            New Complaint
          </Link>
        )}
      </div>

      {/* Stats Grid */}
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
                <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            {stat.change && (
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                <span className="text-xs text-[var(--text-dim)]">rate</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Complaints</h2>
            <Link
              href="/dashboard/complaints"
              className="text-sm text-[#2EC4B6] hover:text-[#22a99d] flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No complaints yet</p>
              <Link
                href="/dashboard/complaints/new"
                className="text-sm text-[#2EC4B6] hover:text-[#22a99d] mt-2 inline-block"
              >
                Submit your first complaint →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c, i) => (
                <Link
                  key={c._id}
                  href={`/dashboard/complaints/${c._id}`}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <span className="text-xl">{categoryIcons[c.category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.title}</p>
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">{c.ticketId} • {new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColors[c.priority?.level] || ''}`}>
                    {c.priority?.level}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Category Breakdown</h2>
          {stats?.categoryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryBreakdown.map((cat, i) => {
                const total = stats.categoryBreakdown.reduce((s, c) => s + c.count, 0);
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg w-8">{categoryIcons[cat._id] || '📋'}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--text-secondary)] capitalize">
                          {cat._id?.replace('_', ' ') || 'Unknown'}
                        </span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{cat.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-card-hover)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-3" />
              <p className="text-[var(--text-muted)]">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard/map" className="glass rounded-2xl p-5 hover:bg-[var(--bg-card-hover)] transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#90DBF4]/15 flex items-center justify-center">
              <Map className="w-6 h-6 text-[#90DBF4]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">City Complaint Map</h3>
              <p className="text-sm text-[var(--text-muted)]">View complaints on an interactive map with heatmap</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-dim)] group-hover:text-[var(--text-primary)] ml-auto transition-colors" />
          </div>
        </Link>
        <Link href="/admin" className="glass rounded-2xl p-5 hover:bg-[var(--bg-card-hover)] transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#2EC4B6]/15 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#2EC4B6]" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Admin Analytics</h3>
              <p className="text-sm text-[var(--text-muted)]">Department performance & city insights</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-dim)] group-hover:text-[var(--text-primary)] ml-auto transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
