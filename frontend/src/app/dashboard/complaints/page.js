'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { complaintsAPI, adminAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { Filter, Search, ChevronRight, Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  medium: 'bg-amber-500/15 text-amber-400',
  low: 'bg-emerald-500/15 text-emerald-400',
};

const statusColors = {
  submitted: 'bg-amber-100 text-amber-600',
  under_review: 'bg-sky-100 text-sky-600',
  in_progress: 'bg-[#2EC4B6]/10 text-[#22a99d]',
  resolved: 'bg-emerald-100 text-emerald-600',
  escalated: 'bg-red-100 text-red-600',
  closed: 'bg-gray-100 text-gray-500',
  fake: 'bg-red-100 text-red-500',
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function ComplaintsListPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const params = { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' };
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;

      // Officers & admins see all complaints; citizens see only theirs
      const res = (user?.role === 'authority' || user?.role === 'admin')
        ? await adminAPI.getComplaints(params)
        : await complaintsAPI.getMyComplaints(params);
      setComplaints(res.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate pending approval complaints for admin
  const pendingApprovals = (user?.role === 'admin')
    ? complaints.filter(c => c.status === 'in_progress' && c.resolution?.actionTaken)
    : [];
  const regularComplaints = (user?.role === 'admin')
    ? complaints.filter(c => !(c.status === 'in_progress' && c.resolution?.actionTaken))
    : complaints;

  const ComplaintCard = ({ c, i, highlight }) => (
    <motion.div
      key={c._id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
    >
      <Link
        href={`/dashboard/complaints/${c._id}`}
        className={`glass rounded-2xl p-4 flex items-start gap-4 hover:bg-[var(--bg-card-hover)] transition-colors block ${
          highlight ? 'border-2 border-amber-500/20' : ''
        }`}
      >
        <span className="text-2xl mt-0.5">{categoryIcons[c.category] || '📋'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{c.title}</p>
              <p className="text-xs text-[var(--text-dim)] mt-0.5">{c.ticketId}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-dim)] shrink-0" />
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-1">{c.description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status]}`}>
              {c.status?.replace('_', ' ')}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[c.priority?.level]}`}>
              {c.priority?.level}
            </span>
            {highlight && c.resolution?.aiVerification?.score > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                c.resolution.aiVerification.score >= 70 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                AI: {c.resolution.aiVerification.score}%
              </span>
            )}
            {c.location?.address && (
              <span className="text-xs text-[var(--text-dim)] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {c.location.address.split(',')[0]}
              </span>
            )}
            <span className="text-xs text-[var(--text-dim)] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(c.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {user?.role === 'citizen' ? 'My Complaints' : user?.role === 'admin' ? 'Review Tickets' : 'All Tickets'}
        </h1>
        <div className="flex gap-2">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] outline-none"
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
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] outline-none"
          >
            <option value="">All Categories</option>
            <option value="pothole">Pothole</option>
            <option value="garbage">Garbage</option>
            <option value="streetlight">Streetlight</option>
            <option value="water_supply">Water Supply</option>
            <option value="sewage">Sewage</option>
            <option value="road_damage">Road Damage</option>
            <option value="traffic">Traffic</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Approvals Section — only for Nodal Officer */}
          {pendingApprovals.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  Pending Your Approval
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
                  {pendingApprovals.length}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-3">Officers have submitted resolution evidence — click to review and approve</p>
              <div className="space-y-3">
                {pendingApprovals.map((c, i) => (
                  <ComplaintCard key={c._id} c={c} i={i} highlight={true} />
                ))}
              </div>
            </div>
          )}

          {/* Divider if both sections exist */}
          {pendingApprovals.length > 0 && regularComplaints.length > 0 && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs text-[var(--text-dim)] uppercase tracking-wider">All Tickets</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>
          )}

          {/* Regular complaints */}
          {regularComplaints.length === 0 && pendingApprovals.length === 0 ? (
            <div className="text-center py-20 glass rounded-2xl">
              <p className="text-lg text-[var(--text-muted)]">No complaints found</p>
              {user?.role === 'citizen' && (
                <Link
                  href="/dashboard/complaints/new"
                  className="text-[#2EC4B6] font-medium text-sm mt-2 inline-block hover:underline"
                >
                  Submit your first complaint →
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {regularComplaints.map((c, i) => (
                <ComplaintCard key={c._id} c={c} i={i} highlight={false} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
