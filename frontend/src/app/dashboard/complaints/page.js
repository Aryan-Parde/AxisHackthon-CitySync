'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Filter, Search, ChevronRight, Clock, MapPin
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

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function ComplaintsListPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', category: '' });

  useEffect(() => {
    fetchComplaints();
  }, [filter]);

  const fetchComplaints = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.category) params.category = filter.category;
      const res = await complaintsAPI.getMyComplaints(params);
      setComplaints(res.data.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">My Complaints</h1>
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
      ) : complaints.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <p className="text-lg text-[var(--text-muted)]">No complaints found</p>
          <Link
            href="/dashboard/complaints/new"
            className="text-indigo-400 text-sm mt-2 inline-block hover:underline"
          >
            Submit your first complaint →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c, i) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/dashboard/complaints/${c._id}`}
                className="glass rounded-2xl p-4 flex items-start gap-4 hover:bg-[var(--bg-card-hover)] transition-colors block"
              >
                <span className="text-2xl mt-0.5">{categoryIcons[c.category] || '📋'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">{c.title}</p>
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
          ))}
        </div>
      )}
    </div>
  );
}
