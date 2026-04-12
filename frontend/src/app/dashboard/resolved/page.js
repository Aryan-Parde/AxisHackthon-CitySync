'use client';

import { useState, useEffect } from 'react';
import { complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import { CheckCircle, MapPin, Clock, ChevronRight, Search, Loader2 } from 'lucide-react';

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function ResolvedComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  useEffect(() => {
    fetchResolved();
  }, []);

  const fetchResolved = async () => {
    try {
      const res = await complaintsAPI.getResolved({ limit: 50 });
      setComplaints(res.data.data);
    } catch (error) {
      console.error('Failed to fetch resolved complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-10 shimmer rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-64 shimmer rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
          Resolved Issues
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          See what&apos;s been fixed in your city — {complaints.length} issues resolved
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl">
          <CheckCircle className="w-12 h-12 text-[var(--text-dim)] mx-auto mb-3" />
          <p className="text-lg text-[var(--text-muted)]">No resolved complaints yet</p>
        </div>
      ) : (
        <>
          {/* Grid of resolved complaints */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complaints.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedComplaint(selectedComplaint?._id === c._id ? null : c)}
                className={`glass rounded-2xl overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500/30 transition-all ${
                  selectedComplaint?._id === c._id ? 'ring-2 ring-emerald-500/40' : ''
                }`}
              >
                {/* Before / After photos */}
                <div className="grid grid-cols-2 h-40">
                  {/* Before */}
                  <div className="relative">
                    {c.images?.[0] ? (
                      <img src={c.images[0]} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[var(--bg-card-hover)] flex items-center justify-center">
                        <span className="text-3xl">{categoryIcons[c.category] || '📋'}</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-red-500/80 text-white text-[10px] font-bold uppercase">
                      Before
                    </span>
                  </div>
                  {/* After */}
                  <div className="relative">
                    {c.resolution?.photo ? (
                      <img src={c.resolution.photo} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500/80 text-white text-[10px] font-bold uppercase">
                      After
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--text-primary)] text-sm">{c.title}</p>
                      <p className="text-xs text-[var(--text-dim)] mt-0.5">{c.ticketId}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium flex-shrink-0">
                      ✅ Resolved
                    </span>
                  </div>

                  {c.location?.address && (
                    <p className="text-xs text-[var(--text-muted)] mt-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {c.location.address.split(',').slice(0, 2).join(',')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-dim)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Reported: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {c.resolvedAt && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3 h-3" />
                        Resolved: {new Date(c.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {selectedComplaint?._id === c._id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-[var(--border)] p-4 bg-emerald-500/5"
                  >
                    <p className="text-xs text-[var(--text-dim)] uppercase tracking-wider font-semibold mb-1">Action Taken</p>
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                      {c.resolution?.actionTaken || 'Resolved by the department.'}
                    </p>
                    {c.resolution?.aiVerification?.score > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-[var(--text-dim)]">AI Verification:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.resolution.aiVerification.score >= 70 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {c.resolution.aiVerification.score}%
                        </span>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
