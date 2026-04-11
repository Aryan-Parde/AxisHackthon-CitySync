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
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const statusColors = {
  submitted: 'bg-amber-500/15 text-amber-400',
  under_review: 'bg-cyan-500/15 text-cyan-400',
  in_progress: 'bg-indigo-500/15 text-indigo-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
  escalated: 'bg-red-500/15 text-red-400',
  closed: 'bg-gray-500/15 text-gray-400',
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
      gradient: 'from-indigo-500 to-purple-500',
      change: '+12%'
    },
    {
      label: 'Resolved',
      value: overview.resolved || 0,
      icon: CheckCircle,
      gradient: 'from-emerald-500 to-teal-500',
      change: `${overview.resolutionRate || 0}%`
    },
    {
      label: 'Pending',
      value: (overview.pending || 0) + (overview.inProgress || 0),
      icon: Clock,
      gradient: 'from-amber-500 to-orange-500',
      change: null
    },
    {
      label: 'Escalated',
      value: overview.escalated || 0,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-pink-500',
      change: null
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name || 'Citizen'}</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Here&apos;s what&apos;s happening in your city today
          </p>
        </div>
        <Link
          href="/dashboard/complaints/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="w-4 h-4" />
          New Complaint
        </Link>
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
                <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
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
            <h2 className="text-lg font-semibold text-white">Recent Complaints</h2>
            <Link
              href="/dashboard/complaints"
              className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
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
                className="text-sm text-indigo-400 hover:text-indigo-300 mt-2 inline-block"
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
                    <p className="text-sm font-medium text-white truncate">{c.title}</p>
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
          <h2 className="text-lg font-semibold text-white mb-4">Category Breakdown</h2>
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
                        <span className="text-sm font-medium text-white">{cat.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--bg-card-hover)]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
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
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center">
              <Map className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">City Complaint Map</h3>
              <p className="text-sm text-[var(--text-muted)]">View complaints on an interactive map with heatmap</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-dim)] group-hover:text-white ml-auto transition-colors" />
          </div>
        </Link>
        <Link href="/admin" className="glass rounded-2xl p-5 hover:bg-[var(--bg-card-hover)] transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Admin Analytics</h3>
              <p className="text-sm text-[var(--text-muted)]">Department performance & city insights</p>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--text-dim)] group-hover:text-white ml-auto transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
