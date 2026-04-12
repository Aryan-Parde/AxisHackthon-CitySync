'use client';

import { useState, useEffect, useRef } from 'react';
import { mapAPI } from '@/lib/api';
import { getMapCenter } from '@/lib/cityCoords';
import { motion } from 'framer-motion';
import { Layers, Flame, MapPin, Filter } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

const categoryColors = {
  pothole: '#ef4444', garbage: '#f59e0b', streetlight: '#2EC4B6',
  water_supply: '#06b6d4', sewage: '#8b5cf6', road_damage: '#fb923c',
  noise: '#a3a3a3', illegal_construction: '#ec4899', traffic: '#14b8a6',
  drainage: '#3b82f6', other: '#64748b'
};

const priorityColors = {
  critical: '#ef4444', high: '#fb923c', medium: '#f59e0b', low: '#10b981'
};

export default function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [viewMode, setViewMode] = useState('markers'); // markers | heatmap
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    let map;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialize map with dynamic center
    getMapCenter().then(({ center, zoom, source }) => {
      if (!mapContainerRef.current) return;
      console.log(`🗺️ Map centered on [${center}] via ${source}`);

      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center,
        zoom,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        loadData(map);
      });
    });

    return () => { if (map) map.remove(); };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      loadData(mapRef.current);
    }
  }, [viewMode, filterCategory]);

  const loadData = async (map) => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;

      if (viewMode === 'heatmap') {
        const res = await mapAPI.getHeatmap(params);
        const data = res.data.data;

        // Remove existing layers/sources
        if (map.getLayer('heatmap-layer')) map.removeLayer('heatmap-layer');
        if (map.getLayer('complaints-cluster')) map.removeLayer('complaints-cluster');
        if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
        if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
        if (map.getSource('complaints')) map.removeSource('complaints');

        map.addSource('complaints', { type: 'geojson', data });

        map.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'complaints',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'intensity'], 0, 0, 1, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(103,58,183,0.4)',
              0.4, 'rgba(33,150,243,0.6)',
              0.6, 'rgba(76,175,80,0.7)',
              0.8, 'rgba(255,152,0,0.8)',
              1, 'rgba(244,67,54,0.9)'
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 15, 15, 30],
            'heatmap-opacity': 0.8
          }
        });
      } else {
        const res = await mapAPI.getComplaints(params);
        const data = res.data.data;

        // Remove existing layers/sources
        if (map.getLayer('heatmap-layer')) map.removeLayer('heatmap-layer');
        if (map.getLayer('complaints-cluster')) map.removeLayer('complaints-cluster');
        if (map.getLayer('cluster-count')) map.removeLayer('cluster-count');
        if (map.getLayer('unclustered-point')) map.removeLayer('unclustered-point');
        if (map.getSource('complaints')) map.removeSource('complaints');

        map.addSource('complaints', {
          type: 'geojson',
          data,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 50
        });

        // Cluster circles
        map.addLayer({
          id: 'complaints-cluster',
          type: 'circle',
          source: 'complaints',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#2EC4B6', 10,
              '#f59e0b', 30,
              '#ef4444'
            ],
            'circle-radius': ['step', ['get', 'point_count'], 20, 10, 30, 30, 40],
            'circle-opacity': 0.8,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.2)'
          }
        });

        // Cluster count labels
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'complaints',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 14
          },
          paint: { 'text-color': '#ffffff' }
        });

        // Individual points
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'complaints',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': [
              'match', ['get', 'priority'],
              'critical', '#ef4444',
              'high', '#fb923c',
              'medium', '#f59e0b',
              'low', '#10b981',
              '#2EC4B6'
            ],
            'circle-radius': 8,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.3)'
          }
        });

        // Click handlers
        map.on('click', 'unclustered-point', (e) => {
          const props = e.features[0].properties;
          const coords = e.features[0].geometry.coordinates.slice();

          new mapboxgl.Popup({ offset: 15 })
            .setLngLat(coords)
            .setHTML(`
              <div style="min-width:200px">
                <strong style="font-size:14px;color:var(--text-primary)">${props.title}</strong>
                <p style="font-size:12px;color:#94a3b8;margin:4px 0">${props.ticketId} • ${props.category}</p>
                <div style="display:flex;gap:8px;margin-top:8px">
                  <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:rgba(46,196,182,0.15);color:#22a99d">${props.status?.replace('_',' ')}</span>
                  <span style="font-size:11px;padding:2px 8px;border-radius:12px;background:rgba(239,68,68,0.15);color:#f87171">${props.priority}</span>
                </div>
                ${props.duplicateCount > 1 ? `<p style="font-size:11px;color:#94a3b8;margin-top:6px">👥 Reported by ${props.duplicateCount} users</p>` : ''}
                <a href="/dashboard/complaints/${props.id}" style="display:block;margin-top:8px;font-size:12px;color:#2EC4B6;text-decoration:none">View Details →</a>
              </div>
            `)
            .addTo(map);
        });

        map.on('click', 'complaints-cluster', (e) => {
          const features = map.queryRenderedFeatures(e.point, { layers: ['complaints-cluster'] });
          const clusterId = features[0].properties.cluster_id;
          map.getSource('complaints').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom });
          });
        });

        map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
        map.on('mouseenter', 'complaints-cluster', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'complaints-cluster', () => { map.getCanvas().style.cursor = ''; });
      }
    } catch (error) {
      console.error('Map data error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mr-auto">City Complaint Map</h1>

        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            onClick={() => setViewMode('markers')}
            className={`px-4 py-2 text-sm flex items-center gap-1.5 ${
              viewMode === 'markers' ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Markers
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-4 py-2 text-sm flex items-center gap-1.5 ${
              viewMode === 'heatmap' ? 'bg-[#2EC4B6]/15 text-[#2EC4B6]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
            }`}
          >
            <Flame className="w-4 h-4" />
            Heatmap
          </button>
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
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

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        {Object.entries(priorityColors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[var(--text-muted)] capitalize">{key}</span>
          </div>
        ))}
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="flex-1 rounded-2xl overflow-hidden border border-[var(--border)] relative"
      >
        {loading && (
          <div className="absolute inset-0 bg-[var(--bg-card)]/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <div className="w-5 h-5 border-2 border-[#2EC4B6] border-t-transparent rounded-full animate-spin" />
              Loading map data...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
