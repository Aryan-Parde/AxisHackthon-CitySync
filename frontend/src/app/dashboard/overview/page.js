'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { adminAPI, complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import { getMapCenter } from '@/lib/cityCoords';
import 'mapbox-gl/dist/mapbox-gl.css';
import toast from 'react-hot-toast';
import {
  FileText, CheckCircle, Clock, AlertTriangle, MapPin,
  BarChart3, Building2, RefreshCw, Loader2
} from 'lucide-react';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const priorityMarkerColors = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#10b981',
};

export default function CityOverviewPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [reassigning, setReassigning] = useState(false);
  const [reassignDept, setReassignDept] = useState('');
  const mapContainer = useRef(null);
  const map = useRef(null);
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
        adminAPI.getComplaints({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
        adminAPI.getDepartments(),
      ]);
      setStats(statsRes.data.data);
      setComplaints(complaintsRes.data.data);
      setDepartments(deptsRes.data.data);
    } catch (error) {
      console.error('Overview fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Mapbox heatmap
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || complaints.length === 0 || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    getMapCenter().then(({ center, zoom, source }) => {
      if (!mapContainer.current || map.current) return;
      console.log(`🗺️ Overview map centered on [${center}] via ${source}`);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom,
      });

      map.current.on('load', () => {
        // Add complaint markers
        complaints.forEach(c => {
          if (!c.location?.coordinates) return;
          const [lng, lat] = c.location.coordinates;
          const color = priorityMarkerColors[c.priority?.level] || '#f59e0b';

          const el = document.createElement('div');
          el.style.width = '14px';
          el.style.height = '14px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '2px solid white';
          el.style.cursor = 'pointer';
          el.style.boxShadow = `0 0 8px ${color}80`;

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current);

          el.addEventListener('click', () => {
            setSelectedComplaint(c);
            setReassignDept(c.department?._id || '');
          });
        });
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [complaints]);

  const handleReassign = async () => {
    if (!selectedComplaint || !reassignDept) return;
    setReassigning(true);
    try {
      await complaintsAPI.reassign(selectedComplaint._id, {
        departmentId: reassignDept,
        note: 'Reassigned by Nodal Officer from City Overview'
      });
      toast.success('Ticket reassigned successfully');
      setSelectedComplaint(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reassignment failed');
    } finally {
      setReassigning(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
        </div>
        <div className="h-[500px] shimmer rounded-2xl" />
      </div>
    );
  }

  const overview = stats?.overview || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          <BarChart3 className="w-6 h-6 inline mr-2 text-[#2EC4B6]" />
          City Overview
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Nodal Officer Dashboard — Real-time heatmap & ticket management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Complaints', value: overview.total || 0, icon: FileText, color: 'text-indigo-400' },
          { label: 'Pending', value: (overview.pending || 0) + (overview.inProgress || 0), icon: Clock, color: 'text-amber-400' },
          { label: 'Resolved', value: overview.resolved || 0, icon: CheckCircle, color: 'text-emerald-400' },
          { label: 'Resolution Rate', value: `${overview.resolutionRate || 0}%`, icon: BarChart3, color: 'text-cyan-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-[var(--text-muted)]">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Pending Approvals — complaints with resolution evidence awaiting nodal officer approval */}
      {(() => {
        const pendingApprovals = complaints.filter(
          c => c.status === 'in_progress' && c.resolution?.actionTaken
        );
        if (pendingApprovals.length === 0) return null;
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 border-2 border-amber-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                Pending Approvals
                <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold">
                  {pendingApprovals.length}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-dim)]">Officers have submitted resolutions — your review is needed</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {pendingApprovals.map(c => (
                <button
                  key={c._id}
                  onClick={() => router.push(`/dashboard/complaints/${c._id}`)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl bg-[var(--bg-card-hover)] hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 font-bold text-sm flex-shrink-0">
                    ⏳
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{c.title}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{c.ticketId} · {c.resolution?.actionTaken?.slice(0, 60)}...</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.resolution?.aiVerification?.score > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        c.resolution.aiVerification.score >= 70 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        AI: {c.resolution.aiVerification.score}%
                      </span>
                    )}
                    <span className="text-xs text-[var(--text-dim)] group-hover:text-amber-400 transition-colors">Review →</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        );
      })()}

      {/* Map + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 glass rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
          <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '500px' }} />
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected complaint or empty state */}
          {selectedComplaint ? (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-2xl p-5 space-y-3"
            >
              <h3 className="font-semibold text-[var(--text-primary)]">{selectedComplaint.title}</h3>
              <p className="text-xs font-mono text-[var(--text-dim)]">{selectedComplaint.ticketId}</p>
              <p className="text-sm text-[var(--text-muted)] line-clamp-3">{selectedComplaint.description}</p>

              {selectedComplaint.location?.address && (
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {selectedComplaint.location.address}
                </p>
              )}

              <div className="pt-3 border-t border-[var(--border)]">
                <label className="text-xs text-[var(--text-dim)] block mb-1">Reassign to Authority</label>
                <select
                  value={reassignDept}
                  onChange={(e) => setReassignDept(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none mb-2"
                >
                  <option value="">Select authority...</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.icon} {d.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleReassign}
                  disabled={reassigning || !reassignDept}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {reassigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Reassign Ticket
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center">
              <MapPin className="w-8 h-8 text-[var(--text-dim)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-muted)]">Click a marker on the map to view & reassign</p>
            </div>
          )}

          {/* Authority branches */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Authority Branches
            </h3>
            <div className="space-y-2">
              {departments.slice(0, 6).map((dept, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{dept.icon} {dept.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs">{dept.liveStats?.pending || 0} pending</span>
                    <span className="text-emerald-400 text-xs">{dept.liveStats?.resolved || 0} done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
