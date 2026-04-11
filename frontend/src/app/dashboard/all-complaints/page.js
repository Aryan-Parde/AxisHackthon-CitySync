'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  List, MapPin, Clock, ChevronRight, Filter, Search, Loader2, CheckCircle
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
  fake: 'bg-red-500/15 text-red-500',
  closed: 'bg-gray-500/15 text-gray-400',
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function AllComplaintsPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (isAuthenticated) fetchComplaints();
  }, [authLoading, isAuthenticated, statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
      };
      const res = await adminAPI.getComplaints(params);
      setComplaints(res.data.data);
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = complaints.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.ticketId?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.location?.address?.toLowerCase().includes(q)
    );
  });

  if (authLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#2EC4B6]" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <List className="w-6 h-6 text-[#2EC4B6]" />
          All Complaints
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {filtered.length} complaint{filtered.length !== 1 ? 's' : ''} across all departments
        </p>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[var(--text-dim)]" />
          <input
            type="text"
            placeholder="Search by title, ticket ID, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-dim)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--text-dim)]" />
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
            <option value="fake">Fake</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="">All Categories</option>
            <option value="pothole">Pothole</option>
            <option value="garbage">Garbage</option>
            <option value="streetlight">Streetlight</option>
            <option value="water_supply">Water Supply</option>
            <option value="sewage">Sewage</option>
            <option value="road_damage">Road Damage</option>
            <option value="traffic">Traffic</option>
            <option value="drainage">Drainage</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 shimmer rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No complaints found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                href={`/dashboard/complaints/${c._id}`}
                className="group block glass rounded-xl p-4 hover:bg-[var(--bg-card-hover)] transition-all border border-transparent hover:border-[var(--border)]"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{categoryIcons[c.category] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{c.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityColors[c.priority?.level]}`}>
                        {c.priority?.level}
                      </span>
                      {c.resolution?.photo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-500/15 text-indigo-400 flex-shrink-0">
                          📸 Photo submitted
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-muted)] line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-dim)] flex-wrap">
                      <span className="font-mono">{c.ticketId}</span>
                      <span className="capitalize">{c.category?.replace('_', ' ')}</span>
                      {c.department?.name && (
                        <span>🏢 {c.department.name}</span>
                      )}
                      {c.location?.address && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3" /> {c.location.address}
                        </span>
                      )}
                      <span>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
