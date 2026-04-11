'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, ThumbsUp, Users, AlertTriangle,
  CheckCircle, Loader2, ChevronRight, AlertOctagon
} from 'lucide-react';
import toast from 'react-hot-toast';

const priorityConfig = {
  critical: { color: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-500' },
  high: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', dot: 'bg-orange-500' },
  medium: { color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  low: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
};

const statusConfig = {
  submitted: { color: 'text-amber-400', icon: Clock, label: 'Submitted' },
  under_review: { color: 'text-cyan-400', icon: Clock, label: 'Under Review' },
  in_progress: { color: 'text-indigo-400', icon: Loader2, label: 'In Progress' },
  resolved: { color: 'text-emerald-400', icon: CheckCircle, label: 'Resolved' },
  escalated: { color: 'text-red-400', icon: AlertTriangle, label: 'Escalated' },
  closed: { color: 'text-gray-400', icon: CheckCircle, label: 'Closed' },
  fake: { color: 'text-red-500 font-bold', icon: AlertOctagon, label: 'Fake / Rejected' },
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function ComplaintDetailPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusNote, setShowStatusNote] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const res = await complaintsAPI.getById(id);
      setComplaint(res.data.data);
    } catch (error) {
      toast.error('Complaint not found');
      router.push('/dashboard/complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      const res = await complaintsAPI.upvote(id);
      setComplaint(prev => ({ ...prev, upvotes: res.data.data.upvotes }));
      toast.success(res.data.data.upvoted ? 'Upvoted!' : 'Removed upvote');
    } catch (error) {
      toast.error('Failed to upvote');
    }
  };

  const handleStatusUpdate = async (newStatus, customNote = null) => {
    if (!newStatus || newStatus === complaint.status) return;
    
    setUpdating(true);
    try {
      const res = await complaintsAPI.updateStatus(id, {
        status: newStatus,
        note: customNote || `Status updated to ${newStatus?.replace('_', ' ')} by authority`
      });
      setComplaint(res.data.data);
      toast.success('Status updated successfully');
      setShowStatusNote(false);
      setStatusNote('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusDropdownChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === 'fake') {
      setShowStatusNote(true);
    } else {
      setShowStatusNote(false);
      handleStatusUpdate(newStatus);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 shimmer rounded-lg" />
        <div className="h-64 shimmer rounded-2xl" />
        <div className="h-48 shimmer rounded-2xl" />
      </div>
    );
  }

  if (!complaint) return null;

  const pConfig = priorityConfig[complaint.priority?.level] || priorityConfig.medium;
  const sConfig = statusConfig[complaint.status] || statusConfig.submitted;
  const StatusIcon = sConfig.icon;

  // Build timeline status steps
  const statusOrder = ['submitted', 'under_review', 'in_progress', 'resolved'];
  const currentIdx = statusOrder.indexOf(complaint.status === 'escalated' ? 'in_progress' : complaint.status);

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Header */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{categoryIcons[complaint.category] || '📋'}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{complaint.title}</h1>
                <p className="text-sm text-[var(--text-dim)] mt-0.5">{complaint.ticketId}</p>
              </div>
            </div>
            <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${pConfig.color}`}>
              {complaint.priority?.level?.toUpperCase()}
            </span>
          </div>

          <p className="text-[var(--text-secondary)] mt-4 leading-relaxed">{complaint.description}</p>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <span className={`flex items-center gap-1.5 text-sm font-medium ${sConfig.color}`}>
              <StatusIcon className="w-4 h-4" />
              {sConfig.label}
            </span>
            {complaint.location?.address && (
              <span className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                <MapPin className="w-4 h-4" />
                {complaint.location.address}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
              <Clock className="w-4 h-4" />
              {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleUpvote}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card-hover)] hover:bg-[var(--border)] transition-colors text-sm"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{complaint.upvotes || 0}</span>
            </button>
            {complaint.duplicateCount > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm">
                <Users className="w-4 h-4" />
                Reported by {complaint.duplicateCount} users
              </div>
            )}
            
            {/* Admin / Authority Controls */}
            {(user?.role === 'admin' || user?.role === 'authority') && (
              <div className="ml-auto flex flex-col items-end gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={complaint.status}
                    onChange={handleStatusDropdownChange}
                    disabled={updating}
                    className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="escalated">Escalated</option>
                    <option value="fake">Fake / Rejected</option>
                    <option value="closed">Closed</option>
                  </select>
                  {updating && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
                </div>
                
                {showStatusNote && (
                  <div className="mt-2 flex flex-col gap-2 w-72">
                    <textarea
                      placeholder="Reason for marking as fake..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full bg-[var(--bg-card-hover)] text-sm text-white p-2 rounded-lg border border-[var(--border)] focus:border-red-500 outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setShowStatusNote(false)}
                        className="px-3 py-1 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate('fake', statusNote || 'Marked as fake/invalid by authorities')}
                        className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Progress */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Progress</h2>
          <div className="flex items-center justify-between mb-2">
            {statusOrder.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-gradient-to-br from-indigo-500 to-cyan-500 text-white'
                        : 'bg-[var(--bg-card-hover)] text-[var(--text-dim)]'
                    } ${isCurrent ? 'ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-[var(--bg-card)]' : ''}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-2 capitalize ${isDone ? 'text-white' : 'text-[var(--text-dim)]'}`}>
                      {s.replace('_', ' ')}
                    </p>
                  </div>
                  {i < statusOrder.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${
                      i < currentIdx ? 'bg-gradient-to-r from-indigo-500 to-cyan-500' : 'bg-[var(--border)]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {complaint.status === 'escalated' && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">
                Escalated to Level {complaint.escalationLevel}
              </p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Timeline</h2>
          <div className="space-y-0">
            {complaint.timeline?.map((event, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-indigo-500' : 'bg-[var(--border)]'
                  }`} />
                  {i < complaint.timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-[var(--border)] min-h-[40px]" />
                  )}
                </div>
                <div className="pb-6">
                  <p className="text-sm text-white font-medium capitalize">
                    {event.status?.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{event.note}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    {new Date(event.timestamp).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Info */}
        {complaint.department && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Assigned Department</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-lg">
                {complaint.department.icon || '🏢'}
              </div>
              <div>
                <p className="font-medium text-white">{complaint.department.name}</p>
                <p className="text-xs text-[var(--text-dim)]">Code: {complaint.department.code}</p>
              </div>
            </div>
            {complaint.estimatedResolution && (
              <p className="text-sm text-[var(--text-muted)] mt-3">
                ⏱️ Estimated resolution: {new Date(complaint.estimatedResolution).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
        )}

        {/* Priority Factors */}
        {complaint.priority?.factors && Object.keys(complaint.priority.factors).length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Priority Score: {complaint.priority.score}/100</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(complaint.priority.factors).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-[var(--bg-card-hover)]">
                  <p className="text-xs text-[var(--text-dim)] capitalize">{key}</p>
                  <p className="text-lg font-bold text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
