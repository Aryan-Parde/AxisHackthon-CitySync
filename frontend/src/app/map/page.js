'use client';

import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/lib/api';
import Link from 'next/link';
import { MapPin, Flame, Filter, ArrowLeft, Loader2 } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const priorityMarkerColors = {
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#10b981',
};

const categoryIcons = {
  pothole: '🕳️', garbage: '🗑️', streetlight: '💡', water_supply: '💧',
  sewage: '🚰', road_damage: '🛣️', noise: '🔊', illegal_construction: '🏗️',
  traffic: '🚦', drainage: '🌊', other: '📋'
};

export default function PublicMapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [complaints, setComplaints] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });

  useEffect(() => {
    fetchComplaints();
  }, [filterCategory]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = { limit: 200, sortBy: 'createdAt', sortOrder: 'desc' };
      if (filterCategory) params.category = filterCategory;

      const [complaintsRes, statsRes] = await Promise.all([
        adminAPI.getComplaints(params),
        adminAPI.getDashboard()
      ]);

      const allComplaints = complaintsRes.data.data || [];
      // Only show active complaints on the map (not resolved/closed/fake)
      const activeComplaints = allComplaints.filter(c =>
        !['resolved', 'closed', 'fake'].includes(c.status)
      );
      setComplaints(activeComplaints);
      const overview = statsRes.data.data?.overview || {};
      setStats({
        total: overview.total || 0,
        pending: (overview.pending || 0) + (overview.inProgress || 0),
        resolved: overview.resolved || 0
      });
    } catch (error) {
      console.error('Failed to load complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [73.8567, 18.5204],
      zoom: 12,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Plot markers when complaints change
  useEffect(() => {
    if (!mapRef.current || complaints.length === 0) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    complaints.forEach(c => {
      if (!c.location?.coordinates) return;
      const [lng, lat] = c.location.coordinates;
      const color = priorityMarkerColors[c.priority?.level] || '#f59e0b';
      const icon = categoryIcons[c.category] || '📋';

      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = `0 0 8px ${color}80`;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 15 }).setHTML(`
            <div style="min-width:220px;font-family:system-ui,-apple-system,sans-serif">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="font-size:18px">${icon}</span>
                <strong style="font-size:14px">${c.title || 'Complaint'}</strong>
              </div>
              <p style="font-size:12px;color:#94a3b8;margin:4px 0">${c.ticketId} • ${c.category?.replace('_', ' ')}</p>
              ${c.location?.address ? `<p style="font-size:11px;color:#94a3b8;margin:4px 0">📍 ${c.location.address}</p>` : ''}
              <div style="display:flex;gap:6px;margin-top:8px">
                <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:rgba(46,196,182,0.15);color:#22a99d">${c.status?.replace('_', ' ')}</span>
                <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:${color}25;color:${color}">${c.priority?.level}</span>
              </div>
              ${c.department?.name ? `<p style="font-size:11px;color:#94a3b8;margin-top:6px">🏢 ${c.department.name}</p>` : ''}
              ${c.duplicateCount > 1 ? `<p style="font-size:11px;color:#94a3b8;margin-top:4px">👥 Reported by ${c.duplicateCount} users</p>` : ''}
            </div>
          `)
        )
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [complaints]);

  return (
    <div className="h-screen bg-[var(--bg-darker)] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[var(--border)] px-4 lg:px-6 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Home</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2EC4B6] to-[#90DBF4] flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">CitySync Map</h1>
        </div>

        {/* Stats badges */}
        <div className="hidden sm:flex items-center gap-3 ml-4">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">{stats.total} total</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-medium">{stats.pending} pending</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">{stats.resolved} resolved</span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-secondary)] outline-none"
          >
            <option value="">All Categories</option>
            <option value="pothole">🕳️ Pothole</option>
            <option value="garbage">🗑️ Garbage</option>
            <option value="streetlight">💡 Streetlight</option>
            <option value="water_supply">💧 Water Supply</option>
            <option value="sewage">🚰 Sewage</option>
            <option value="road_damage">🛣️ Road Damage</option>
            <option value="traffic">🚦 Traffic</option>
            <option value="drainage">🌊 Drainage</option>
          </select>
        </div>
      </header>

      {/* Legend */}
      <div className="px-4 lg:px-6 py-2 flex flex-wrap gap-4 text-xs bg-white border-b border-[var(--border)]">
        {Object.entries(priorityMarkerColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[var(--text-muted)] capitalize">{key}</span>
          </div>
        ))}
        <span className="text-[var(--text-dim)]">•</span>
        <span className="text-[var(--text-dim)]">Click a marker for details</span>
      </div>

      {/* Map */}
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <div ref={mapContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        {loading && (
          <div className="absolute inset-0 bg-[#0f172a]/60 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-[#2EC4B6]" />
              Loading complaints...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
