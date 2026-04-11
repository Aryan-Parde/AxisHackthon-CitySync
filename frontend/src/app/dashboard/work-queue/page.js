'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  FileText, CheckCircle, Clock, AlertTriangle, Loader2,
  MapPin, ChevronRight, Shield, Filter
} from 'lucide-react';

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/20',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const statusColors = {
  submitted: 'bg-amber-500/15 text-amber-400',
  under_review: 'bg-cyan-500/15 text-cyan-400',
  in_progress: 'bg-indigo-500/15 text-indigo-400',
  resolved: 'bg-emerald-500/15 text-emerald-400',
  escalated: 'bg-red-500/15 text-red-400',
  fake: 'bg-red-500/15 text-red-500',
  closed: 'bg-gray-500/15 text-gray-400',
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function WorkQueuePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated && user) fetchData();
  }, [authLoading, isAuthenticated, user, statusFilter]);

  const fetchData = async () => {
    try {
      const deptId = user?.department?._id || user?.department;
      const params = {
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(deptId ? { department: deptId } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      };

      const [complaintsRes, statsRes] = await Promise.all([
        adminAPI.getComplaints(params),
        adminAPI.getDashboard(deptId ? { department: deptId } : {})
      ]);

      setComplaints(complaintsRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('Work queue fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
      </div>
    );
  }

  const overview = stats?.overview || {};
  const pending = (overview.pending || 0) + (overview.inProgress || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            <Shield className="w-6 h-6 inline mr-2 text-[#2EC4B6]" />
            Work Queue
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {user?.department?.name || 'Department'} — {pending} pending issue{pending !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: overview.total || 0, icon: FileText, color: 'text-indigo-400' },
          { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-400' },
          { label: 'Resolved', value: overview.resolved || 0, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Escalated', value: overview.escalated || 0, icon: AlertTriangle, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4 flex items-center gap-3"
          >
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-[var(--text-muted)]" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none"
        >
          <option value="">All Status</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="escalated">Escalated</option>
        </select>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {complaints.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <p className="text-[var(--text-muted)]">No complaints in your queue. Great work!</p>
          </div>
        ) : (
          complaints.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={`/dashboard/complaints/${c._id}`}
                className="group block glass rounded-xl p-4 hover:bg-[var(--bg-card-hover)] transition-all border border-transparent hover:border-[var(--border)]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{categoryIcons[c.category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{c.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityColors[c.priority?.level]}`}>
                        {c.priority?.level}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-dim)]">
                      <span className="font-mono">{c.ticketId}</span>
                      {c.location?.address && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3" /> {c.location.address}
                        </span>
                      )}
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
                      {c.status?.replace('_', ' ')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-dim)] group-hover:text-[var(--text-primary)] transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
