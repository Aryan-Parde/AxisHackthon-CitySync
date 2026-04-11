'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { complaintsAPI } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  MapPin, Camera, Send, Loader2, Sparkles, X, ImagePlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import mapboxgl from 'mapbox-gl';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function NewComplaintPage() {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [73.8567, 18.5204], // Pune
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
      }),
      'top-right'
    );

    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      setLocation({ coordinates: [lng, lat] });

      // Update marker
      if (markerRef.current) markerRef.current.remove();
      markerRef.current = new mapboxgl.Marker({ color: '#6366f1' })
        .setLngLat([lng, lat])
        .addTo(map);

      // Reverse geocode
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=IN`
        );
        const data = await res.json();
        if (data.features?.length > 0) {
          setAddress(data.features[0].place_name);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      }
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }
    if (!location) {
      toast.error('Please select a location on the map');
      return;
    }

    setLoading(true);
    try {
      const res = await complaintsAPI.create({
        description: description.trim(),
        title: title.trim() || undefined,
        images,
        location: {
          coordinates: location.coordinates,
          address,
        },
      });

      const data = res.data;

      if (data.isDuplicate) {
        toast.success(`Merged with existing report ${data.originalTicketId}`, { duration: 5000 });
      } else {
        toast.success(`Complaint ${data.data.ticketId} submitted!`);
      }

      setAiResult({
        category: data.data.category,
        priority: data.data.priority,
        ticketId: data.data.ticketId,
      });

      // Redirect after short delay
      setTimeout(() => {
        router.push(`/dashboard/complaints/${data.data._id}`);
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white mb-1">Report an Issue</h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          Describe the problem and pin the location. AI will classify and route it automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="glass rounded-2xl p-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              What&apos;s the issue? *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the civic issue in detail. Be specific about the problem, its impact, and urgency..."
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-white placeholder-[var(--text-dim)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all resize-none min-h-[120px]"
              maxLength={2000}
            />
            <div className="flex justify-between mt-2">
              <div className="flex items-center gap-1 text-xs text-[var(--text-dim)]">
                <Sparkles className="w-3.5 h-3.5" />
                AI will auto-classify your complaint
              </div>
              <span className="text-xs text-[var(--text-dim)]">{description.length}/2000</span>
            </div>
          </div>

          {/* Title (optional) */}
          <div className="glass rounded-2xl p-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Title <span className="text-[var(--text-dim)]">(optional - AI will generate one)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Large pothole near MG Road bus stop"
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-white placeholder-[var(--text-dim)] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
              maxLength={200}
            />
          </div>

          {/* Image Upload */}
          <div className="glass rounded-2xl p-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              <Camera className="w-4 h-4 inline mr-1" />
              Photos <span className="text-[var(--text-dim)]">(max 3)</span>
            </label>
            <div className="flex gap-3 flex-wrap">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)]">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500/50 transition-colors">
                  <ImagePlus className="w-5 h-5 text-[var(--text-dim)]" />
                  <span className="text-xs text-[var(--text-dim)]">Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
          </div>

          {/* Map Location */}
          <div className="glass rounded-2xl p-5">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
              <MapPin className="w-4 h-4 inline mr-1" />
              Pin Location *
            </label>
            <div
              ref={mapContainerRef}
              className="w-full h-72 rounded-xl overflow-hidden border border-[var(--border)]"
            />
            {address && (
              <div className="mt-3 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--text-secondary)]">{address}</p>
              </div>
            )}
            {!location && (
              <p className="text-xs text-amber-400 mt-2">👆 Click on the map to pin the issue location</p>
            )}
          </div>

          {/* AI Result */}
          {aiResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-5 border border-emerald-500/30"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-emerald-400">AI Classification Result</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-[var(--text-dim)]">Category</p>
                  <p className="text-sm font-medium text-white capitalize">{aiResult.category?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-dim)]">Priority</p>
                  <p className={`text-sm font-medium capitalize priority-${aiResult.priority?.level}`}>
                    {aiResult.priority?.level}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-dim)]">Ticket</p>
                  <p className="text-sm font-medium text-indigo-400">{aiResult.ticketId}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !description.trim() || !location}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold text-base hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI is processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Complaint
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
