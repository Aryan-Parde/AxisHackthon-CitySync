'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Clock, ThumbsUp, Users, AlertTriangle,
  CheckCircle, Loader2, ChevronRight, AlertOctagon, Camera, FileText, ShieldCheck, Gavel, ImagePlus
} from 'lucide-react';
import toast from 'react-hot-toast';

const priorityConfig = {
  critical: { color: 'bg-red-100 text-red-600 border-red-200', dot: 'bg-red-500' },
  high: { color: 'bg-orange-100 text-orange-600 border-orange-200', dot: 'bg-orange-500' },
  medium: { color: 'bg-amber-100 text-amber-600 border-amber-200', dot: 'bg-amber-500' },
  low: { color: 'bg-emerald-100 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' },
};

const statusConfig = {
  submitted: { color: 'text-amber-500', icon: Clock, label: 'Submitted' },
  under_review: { color: 'text-sky-500', icon: Clock, label: 'Under Review' },
  in_progress: { color: 'text-[#2EC4B6]', icon: Loader2, label: 'In Progress' },
  resolved: { color: 'text-emerald-500', icon: CheckCircle, label: 'Resolved' },
  escalated: { color: 'text-red-500', icon: AlertTriangle, label: 'Escalated' },
  fake: { color: 'text-red-500 font-bold', icon: AlertOctagon, label: 'Fake / Rejected' },
  closed: { color: 'text-gray-500', icon: CheckCircle, label: 'Closed' },
  appealed: { color: 'text-orange-500 font-bold', icon: Gavel, label: 'Appealed' },
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
  const [resolving, setResolving] = useState(false);
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [progressUpdate, setProgressUpdate] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealPhoto, setAppealPhoto] = useState('');
  const [appealing, setAppealing] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const router = useRouter();

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setResolutionPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const handleResolve = async () => {
    if (!resolutionPhoto) {
      toast.error('Please upload a geotagged photo of the completed work');
      return;
    }
    if (!actionTaken.trim()) {
      toast.error('Please provide an action taken report');
      return;
    }
    setResolving(true);
    try {
      const res = await complaintsAPI.resolve(id, {
        resolutionPhoto,
        actionTaken
      });
      setAiResult(res.data.aiVerification);
      // Re-fetch to get fully updated complaint with timeline
      const freshRes = await complaintsAPI.getById(id);
      setComplaint(freshRes.data.data);
      toast.success('Resolution submitted!');
    } catch (error) {
      const errData = error.response?.data;
      if (errData?.geotagError) {
        toast.error('📍 Photo must be geotagged! Use GPS Map Camera app.', { duration: 6000 });
      } else if (errData?.proximityError) {
        toast.error(`📏 Photo is ${errData.distance}m from the complaint. Must be within 100m.`, { duration: 6000 });
      } else {
        toast.error(errData?.message || 'Failed to resolve');
      }
    } finally {
      setResolving(false);
    }
  };

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
    if (!newStatus) return;

    setUpdating(true);
    try {
      await complaintsAPI.updateStatus(id, {
        status: newStatus,
        note: customNote || `Status updated to ${newStatus?.replace('_', ' ')} by authority`
      });
      // Re-fetch full complaint to get updated timeline
      const freshRes = await complaintsAPI.getById(id);
      setComplaint(freshRes.data.data);
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
    if (newStatus === 'resolved' && !complaint.resolution?.photo) {
      toast.error('Cannot mark as resolved — no resolution photo submitted by the Dept. Officer yet.');
      return;
    }
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
  const statusMapping = {
    submitted: 0,
    under_review: 1,
    in_progress: 2,
    resolved: 3,
    closed: 3,
    escalated: 2,
    fake: 0,
  };
  const currentIdx = statusMapping[complaint.status] ?? 0;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
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
                <h1 className="text-xl font-bold text-[var(--text-primary)]">{complaint.title}</h1>
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
            {complaint.problemType && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                complaint.problemType === 'community'
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
              }`}>
                {complaint.problemType === 'community' ? '👥 Community' : '👤 Personal'}
              </span>
            )}
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
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-card-hover)] hover:bg-[var(--border)] transition-colors text-sm text-[var(--text-primary)]"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{complaint.upvotes || 0}</span>
            </button>
            {complaint.duplicateCount > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2EC4B6]/10 text-[#22a99d] text-sm font-medium">
                <Users className="w-4 h-4" />
                Reported by {complaint.duplicateCount} users
              </div>
            )}

            {/* Nodal Officer — simple status controls (when no pending approval) */}
            {user?.role === 'admin' && !complaint.resolution?.actionTaken && (
              <div className="ml-auto flex items-center gap-2">
                <select
                  value={complaint.status}
                  onChange={handleStatusDropdownChange}
                  disabled={updating}
                  className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="in_progress">In Progress</option>
                  <option value="escalated">Escalated</option>
                  <option value="fake">Fake / Rejected</option>
                </select>
                {updating && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
              </div>
            )}
          </div>
        </div>

        {/* Status Progress */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Progress</h2>

          {/* Percentage bar */}
          {(() => {
            const pct = complaint.status === 'resolved' || complaint.status === 'closed' ? 100
              : complaint.status === 'in_progress' ? 65
                : complaint.status === 'under_review' ? 35
                  : complaint.status === 'fake' ? 100
                    : complaint.status === 'escalated' ? 50
                      : 10;
            const statusLabel = complaint.status === 'resolved' ? '✅ Resolved'
              : complaint.status === 'closed' ? '✅ Closed'
                : complaint.status === 'in_progress' ? '🔧 Work In Progress'
                  : complaint.status === 'under_review' ? '🔍 Under Review'
                    : complaint.status === 'fake' ? '🚫 Fake / Rejected'
                      : complaint.status === 'escalated' ? '⚠️ Escalated'
                        : '📋 Submitted';
            return (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">{statusLabel}</span>
                  <span className="text-sm font-bold text-[#2EC4B6]">{pct}%</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${complaint.status === 'fake' ? 'bg-gradient-to-r from-red-500 to-red-400'
                        : complaint.status === 'escalated' ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                          : 'bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4]'
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Step indicators */}
          <div className="flex items-center justify-between">
            {statusOrder.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDone
                        ? 'bg-gradient-to-br from-[#2EC4B6] to-[#90DBF4] text-white'
                        : 'bg-[var(--bg-card-hover)] text-[var(--text-dim)]'
                      } ${isCurrent ? 'ring-2 ring-[#2EC4B6]/50 ring-offset-2 ring-offset-[var(--bg-card)]' : ''}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-2 capitalize font-medium ${isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-dim)]'}`}>
                      {s.replace('_', ' ')}
                    </p>
                  </div>
                  {i < statusOrder.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded ${i < currentIdx ? 'bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4]' : 'bg-[var(--border)]'
                      }`} />
                  )}
                </div>
              );
            })}
          </div>

          {complaint.status === 'escalated' && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-sm text-red-400">Escalated to Level {complaint.escalationLevel}</p>
            </div>
          )}

          {/* Latest Update — what's happening now */}
          {complaint.timeline?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[var(--border)]">
              <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-2">Latest Update</p>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#2EC4B6]/5 border border-[#2EC4B6]/15">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2EC4B6] mt-1.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm text-[var(--text-primary)] font-medium">{complaint.timeline[complaint.timeline.length - 1]?.note}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-1">
                    {new Date(complaint.timeline[complaint.timeline.length - 1]?.timestamp).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full Timeline (collapsible) */}
        {complaint.timeline?.length > 1 && (
          <details className="glass rounded-2xl overflow-hidden group">
            <summary className="p-6 cursor-pointer flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Full Timeline</h2>
              <span className="text-xs text-[var(--text-dim)] group-open:hidden">{complaint.timeline.length} events — click to expand</span>
              <span className="text-xs text-[var(--text-dim)] hidden group-open:inline">click to collapse</span>
            </summary>
            <div className="px-6 pb-6 space-y-0">
              {[...complaint.timeline].reverse().map((event, i) => {
                const isProgress = event.note?.startsWith('Progress update:');
                const statusIcon = event.status === 'resolved' ? '✅'
                  : event.status === 'in_progress' ? '🔧'
                    : event.status === 'under_review' ? '🔍'
                      : event.status === 'fake' ? '🚫'
                        : event.status === 'escalated' ? '⚠️'
                          : event.status === 'submitted' ? '📋' : '📝';
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-[#2EC4B6]' : isProgress ? 'bg-indigo-400' : 'bg-[var(--border)]'
                        }`} />
                      {i < complaint.timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-[var(--border)] min-h-[40px]" />
                      )}
                    </div>
                    <div className="pb-5">
                      <p className="text-sm text-[var(--text-primary)] font-medium">
                        {statusIcon} {isProgress ? event.note.replace('Progress update: ', '') : event.note}
                      </p>
                      <p className="text-xs text-[var(--text-dim)] mt-1">
                        {new Date(event.timestamp).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                        {' · '}
                        <span className="capitalize">{event.status?.replace('_', ' ')}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        )}

        {/* Department Info */}
        {complaint.department && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Assigned Department</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2EC4B6]/15 flex items-center justify-center text-lg shadow-sm shadow-[#2EC4B6]/5">
                {complaint.department.icon || '🏢'}
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{complaint.department.name}</p>
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Priority Score: {complaint.priority.score}/100</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(complaint.priority.factors).map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-[var(--bg-card-hover)]">
                  <p className="text-xs text-[var(--text-dim)] capitalize">{key}</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Extracted Keywords */}
        {complaint.aiMetadata?.keywords && complaint.aiMetadata.keywords.length > 0 && (
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              AI Extracted Context
            </h2>
            <p className="text-xs text-[var(--text-dim)] mb-4">Keywords auto-extracted by AI classifier from the report and image</p>
            <div className="flex flex-wrap gap-2">
              {complaint.aiMetadata.keywords.map((kw, i) => (
                <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold tracking-wide capitalize shadow-sm shadow-indigo-500/5">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Dept. Officer Workflow Panel ─── */}
        {user?.role === 'authority' && complaint.status !== 'resolved' && complaint.status !== 'closed' && complaint.status !== 'fake' && (
      <div className="glass rounded-2xl p-6 border-2 border-[#2EC4B6]/20">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#2EC4B6]" />
          Officer Actions
        </h2>
        <p className="text-xs text-[var(--text-dim)] mb-5">Update complaint progress based on your site visit</p>

        {/* ── STEP 1: Site Verification (only when submitted) ── */}
        {complaint.status === 'submitted' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[#2EC4B6] text-white text-xs font-bold flex items-center justify-center">1</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">Site Verification</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] -mt-2 ml-8">Visit the location and upload a photo to verify the complaint</p>

            {/* Photo Upload */}
            <div className="ml-8">
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                <Camera className="w-4 h-4 inline mr-1" /> Site Visit Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#2EC4B6]/10 file:text-[#2EC4B6] hover:file:bg-[#2EC4B6]/20 cursor-pointer"
              />
              {resolutionPhoto && (
                <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)] max-w-xs">
                  <img src={resolutionPhoto} alt="Site visit" className="w-full h-40 object-cover" />
                </div>
              )}
            </div>

            {/* Verification Note */}
            <div className="ml-8">
              <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                <FileText className="w-4 h-4 inline mr-1" /> Verification Note
              </label>
              <textarea
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                placeholder="Describe what you observed at the site..."
                className="w-full p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-[#2EC4B6] resize-none"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="ml-8 grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  if (!resolutionPhoto) {
                    toast.error('Upload a site photo to verify the complaint');
                    return;
                  }
                  setResolving(true);
                  try {
                    await complaintsAPI.resolve(id, {
                      resolutionPhoto,
                      actionTaken: actionTaken || 'Complaint verified at site. Issue confirmed.'
                    });
                    await handleStatusUpdate('under_review', actionTaken || 'Site visit completed. Complaint verified by officer.');
                    toast.success('Complaint verified! Status updated.');
                  } catch (err) {
                    toast.error('Failed to update');
                  } finally {
                    setResolving(false);
                  }
                }}
                disabled={resolving}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#2EC4B6] to-[#90DBF4] text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                ✅ Verified
              </button>
              <button
                onClick={async () => {
                  if (!resolutionPhoto) {
                    toast.error('Upload a photo of the site to prove the complaint is fake');
                    return;
                  }
                  if (!actionTaken.trim()) {
                    toast.error('Provide a reason why this complaint is fake');
                    return;
                  }
                  setResolving(true);
                  try {
                    await complaintsAPI.resolve(id, {
                      resolutionPhoto,
                      actionTaken: `FAKE: ${actionTaken}`
                    });
                    await handleStatusUpdate('fake', actionTaken);
                    toast.success('Complaint marked as fake');
                  } catch (err) {
                    toast.error('Failed to update');
                  } finally {
                    setResolving(false);
                  }
                }}
                disabled={resolving}
                className="py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-semibold text-sm hover:bg-red-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
                🚫 Fake
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Begin Work (when under_review) ── */}
        {complaint.status === 'under_review' && (
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">2</span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">Start Resolution Work</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] ml-8 mb-3">Mark that repair/resolution work has started</p>
            <button
              onClick={() => handleStatusUpdate('in_progress', 'Resolution work has been started by the department officer.')}
              disabled={updating}
              className="ml-8 px-6 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-semibold text-sm hover:bg-indigo-500/20 disabled:opacity-40 flex items-center gap-2"
            >
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              🔧 Start Work
            </button>
          </div>
        )}

        {/* ── STEP 3: In Progress ── */}
        {complaint.status === 'in_progress' && (
          <div className="space-y-5">
            {/* If officer already submitted resolution → show pending state */}
            {complaint.resolution?.actionTaken ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Resolution Pending Approval</p>
                  <p className="text-xs text-amber-400/70 mt-1">Your resolution has been submitted and is awaiting Nodal Officer approval.</p>
                  <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-card-hover)]">
                    <p className="text-xs text-[var(--text-dim)] font-semibold uppercase tracking-wider mb-1">Your Report</p>
                    <p className="text-sm text-[var(--text-primary)]">{complaint.resolution.actionTaken}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 3A: Post Progress Update */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">3a</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Post Progress Update</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] ml-8 mb-3">Keep citizens & nodal officer informed about ongoing work</p>
                  <div className="ml-8 flex gap-2">
                    <input
                      type="text"
                      value={progressUpdate}
                      onChange={(e) => setProgressUpdate(e.target.value)}
                      placeholder="e.g. Crew dispatched, materials procured, 50% complete..."
                      className="flex-1 px-3 py-2.5 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={async () => {
                        if (!progressUpdate.trim()) return;
                        setPostingUpdate(true);
                        try {
                          await handleStatusUpdate('in_progress', `Progress update: ${progressUpdate}`);
                          setProgressUpdate('');
                          toast.success('Progress update posted!');
                        } catch (err) {
                          toast.error('Failed to post update');
                        } finally {
                          setPostingUpdate(false);
                        }
                      }}
                      disabled={postingUpdate || !progressUpdate.trim()}
                      className="px-4 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-medium text-sm hover:bg-indigo-500/20 disabled:opacity-40 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {postingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      Post
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[var(--border)]" />

                {/* 3B: Submit Final Resolution */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">3b</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">Submit Final Resolution</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] ml-8 mb-3">Upload a <strong>geotagged</strong> photo taken at the site (use GPS Map Camera app)</p>

                  <div className="ml-8">
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                      <Camera className="w-4 h-4 inline mr-1" /> After-Resolution Photo *
                    </label>
                    <p className="text-xs text-amber-400/80 mb-2">📍 Must be geotagged & within 100m of the complaint location</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 cursor-pointer"
                    />
                    {resolutionPhoto && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)] max-w-xs">
                        <img src={resolutionPhoto} alt="Resolution" className="w-full h-40 object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="ml-8 mt-3">
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                      <FileText className="w-4 h-4 inline mr-1" /> Resolution Report
                    </label>
                    <textarea
                      value={actionTaken}
                      onChange={(e) => setActionTaken(e.target.value)}
                      placeholder="Describe what was done to fully resolve the issue..."
                      className="w-full p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-emerald-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <button
                    onClick={handleResolve}
                    disabled={resolving || !actionTaken.trim() || !resolutionPhoto}
                    className="ml-8 mt-3 w-[calc(100%-2rem)] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {resolving ? 'Verifying with AI...' : '📸 Submit Resolution for Review'}
                  </button>
                  <p className="text-xs text-[var(--text-dim)] ml-8 mt-1">Nodal Officer will review and mark as resolved</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )}

    {/* ── Already marked fake ── */}
    {complaint.status === 'fake' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-400">Complaint marked as Fake / Invalid</p>
              <p className="text-xs text-red-400/70 mt-0.5">This complaint has been rejected after site verification</p>
            </div>
          </div>
        )}

        {/* ── Escalated ── */}
        {complaint.status === 'escalated' && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-400">Complaint Escalated</p>
              <p className="text-xs text-amber-400/70 mt-0.5">This complaint has been escalated to higher authorities. Awaiting further instructions.</p>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ */}
        {/* CITIZEN APPEAL SECTION — Anti-corruption tool */}
        {/* ═══════════════════════════════════════════════ */}
        {user?.role === 'citizen' && complaint.status === 'resolved' && !complaint.appeal?.isAppealed && (
          <div className="glass rounded-2xl p-6 border-2 border-orange-500/20">
            <div className="flex items-center gap-3 mb-2">
              <Gavel className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Problem Still Exists?</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              If the authorities have marked this complaint as resolved but the problem has <strong>not actually been fixed</strong>,
              you can appeal to the <strong>Welfare Officer</strong> for an independent review. This is your right to ensure accountability.
            </p>

            {!showAppealForm ? (
              <button
                onClick={() => setShowAppealForm(true)}
                className="w-full py-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 font-semibold text-sm hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Gavel className="w-4 h-4" />
                File an Appeal to Welfare Officer
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Why do you believe the problem is not resolved? *
                  </label>
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Explain what is still wrong. e.g. 'The pothole was shown as filled but it's still there, the garbage was not cleaned'..."
                    className="w-full p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm outline-none focus:border-orange-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    <Camera className="w-4 h-4 inline mr-1" /> Upload current photo as proof (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setAppealPhoto(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500/10 file:text-orange-500 hover:file:bg-orange-500/20 cursor-pointer"
                  />
                  {appealPhoto && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-[var(--border)] max-w-xs">
                      <img src={appealPhoto} alt="Appeal proof" className="w-full h-40 object-cover" />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!appealReason.trim()) {
                        toast.error('Please explain why you believe the problem is not resolved');
                        return;
                      }
                      setAppealing(true);
                      try {
                        await complaintsAPI.appeal(id, { reason: appealReason, photo: appealPhoto });
                        toast.success('Appeal submitted! A Welfare Officer will review your complaint.');
                        const fresh = await complaintsAPI.getById(id);
                        setComplaint(fresh.data.data);
                        setShowAppealForm(false);
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to submit appeal');
                      } finally {
                        setAppealing(false);
                      }
                    }}
                    disabled={appealing || !appealReason.trim()}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {appealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                    {appealing ? 'Submitting appeal...' : 'Submit Appeal'}
                  </button>
                  <button
                    onClick={() => { setShowAppealForm(false); setAppealReason(''); setAppealPhoto(''); }}
                    className="px-4 py-3 rounded-xl bg-[var(--bg-card-hover)] text-[var(--text-muted)] text-sm hover:bg-[var(--border)]"
                  >
                    Cancel
                  </button>
                  <p className="text-xs text-[var(--text-dim)] ml-8 mt-1">Nodal Officer will review and mark as resolved</p>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Appeal Status (if already appealed) */}
        {complaint.appeal?.isAppealed && (
          <div className={`glass rounded-2xl p-6 border-2 ${
            complaint.appeal.status === 'accepted' ? 'border-emerald-500/20' :
            complaint.appeal.status === 'rejected' ? 'border-red-500/20' :
            'border-orange-500/20'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <Gavel className={`w-5 h-5 ${
                complaint.appeal.status === 'accepted' ? 'text-emerald-400' :
                complaint.appeal.status === 'rejected' ? 'text-red-400' :
                'text-orange-400'
              }`} />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Citizen Appeal {complaint.appeal.status === 'pending' ? '— Under Review' : 
                  complaint.appeal.status === 'accepted' ? '— Accepted ✅' : '— Rejected'}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-muted)] mb-2">
              <strong>Reason:</strong> {complaint.appeal.reason}
            </p>
            {complaint.appeal.photo && (
              <div className="rounded-lg overflow-hidden border border-[var(--border)] max-w-sm mb-3">
                <img src={complaint.appeal.photo} alt="Appeal proof" className="w-full h-40 object-cover" />
              </div>
            )}
            <p className="text-xs text-[var(--text-dim)]">
              Appealed on {new Date(complaint.appeal.appealedAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })}
            </p>
            {complaint.appeal.reviewNote && (
              <div className="mt-3 p-3 rounded-lg bg-[var(--bg-card-hover)]">
                <p className="text-xs text-[var(--text-dim)] font-semibold uppercase tracking-wider mb-1">Welfare Officer Note</p>
                <p className="text-sm text-[var(--text-primary)]">{complaint.appeal.reviewNote}</p>
              </div>
            )}

            {/* Admin review buttons for pending appeals */}
            {user?.role === 'admin' && complaint.appeal.status === 'pending' && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  Welfare Officer Review
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const note = prompt('Add a note (optional):');
                      try {
                        await complaintsAPI.reviewAppeal(id, { decision: 'accepted', note: note || '' });
                        toast.success('Appeal accepted — complaint reopened!');
                        const fresh = await complaintsAPI.getById(id);
                        setComplaint(fresh.data.data);
                      } catch (err) {
                        toast.error('Failed to review appeal');
                      }
                    }}
                    className="py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm hover:opacity-90 flex items-center justify-center gap-2"
                  >
                    <Gavel className="w-4 h-4" />
                    Accept Appeal (Reopen)
                  </button>
                  <button
                    onClick={async () => {
                      const note = prompt('Reason for rejecting the appeal:');
                      if (!note) return;
                      try {
                        await complaintsAPI.reviewAppeal(id, { decision: 'rejected', note });
                        toast.success('Appeal rejected — resolution stands');
                        const fresh = await complaintsAPI.getById(id);
                        setComplaint(fresh.data.data);
                      } catch (err) {
                        toast.error('Failed to review appeal');
                      }
                    }}
                    className="py-3 rounded-xl bg-[var(--bg-card-hover)] border border-[var(--border)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--border)] flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Reject (Resolution Valid)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

  {/* AI Verification Result */ }
  {
    (aiResult || complaint.resolution?.aiVerification?.score > 0) && (
      <div className={`glass rounded-2xl p-6 border-2 ${(aiResult?.score || complaint.resolution?.aiVerification?.score) >= 70
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5'
        }`}>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          🤖 AI Verification Result
        </h2>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-center">
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              {aiResult?.score || complaint.resolution?.aiVerification?.score}%
            </p>
            <p className="text-xs text-[var(--text-muted)]">Confidence</p>
          </div>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-[var(--bg-card-hover)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${(aiResult?.score || complaint.resolution?.aiVerification?.score) >= 70
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                style={{ width: `${aiResult?.score || complaint.resolution?.aiVerification?.score}%` }}
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          {aiResult?.analysis || complaint.resolution?.aiVerification?.analysis}
        </p>
      </div>
    )
  }

  {/* Resolution Report + Nodal Officer Approval Panel */ }
  {
    (complaint.resolution?.actionTaken || complaint.resolution?.photo) && (
      <div className="glass rounded-2xl p-6 border-2 border-indigo-500/20">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-2">
          📋 Officer&apos;s Resolution Report
        </h2>
        <p className="text-xs text-[var(--text-dim)] mb-4">
          {complaint.status === 'resolved' ? 'Approved by Nodal Officer' : 'Submitted by the Department Officer — pending Nodal Officer approval'}
        </p>

        {complaint.resolution.actionTaken && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--bg-card-hover)]">
            <p className="text-xs font-semibold text-[var(--text-dim)] mb-1 uppercase tracking-wider">Action Taken</p>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">{complaint.resolution.actionTaken}</p>
          </div>
        )}

        {complaint.resolution.photo && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-dim)] mb-2 uppercase tracking-wider">Resolution Photo</p>
            <div className="rounded-xl overflow-hidden border border-[var(--border)] max-w-md">
              <img src={complaint.resolution.photo} alt="Resolution proof" className="w-full h-56 object-cover" />
            </div>
          </div>
        )}

        {/* Nodal Officer Approval Buttons — only visible to admin when not yet resolved */}
        {user?.role === 'admin' && complaint.status !== 'resolved' && complaint.status !== 'closed' && (
          <div className="mt-5 pt-4 border-t border-[var(--border)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2EC4B6]" />
              Nodal Officer Decision
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStatusUpdate('resolved', 'Resolution approved by Nodal Officer. Complaint resolved.')}
                disabled={updating}
                className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                ✅ Approve & Resolve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Reason for rejection:');
                  if (reason) {
                    handleStatusUpdate('in_progress', `Resolution rejected by Nodal Officer: ${reason}. Officer must resubmit.`);
                  }
                }}
                disabled={updating}
                className="py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 font-semibold text-sm hover:bg-red-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
                ❌ Reject
              </button>
            </div>
            <p className="text-xs text-[var(--text-dim)] mt-2">Approving will mark the complaint as resolved and notify the citizen</p>
          </div>
        )}
      </div>
    )
  }
      </motion.div >
    </div >
  );
}
