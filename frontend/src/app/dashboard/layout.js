'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  MapPin, LayoutDashboard, PlusCircle, Map, List,
  BarChart3, LogOut, Menu, X, ChevronRight,
  Shield, Bell, ClipboardList, Eye
} from 'lucide-react';

const citizenNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/complaints/new', icon: PlusCircle, label: 'Report Issue' },
  { href: '/dashboard/complaints', icon: List, label: 'My Complaints' },
  { href: '/dashboard/map', icon: Map, label: 'City Map' },
];

const officerNav = [
  { href: '/dashboard/work-queue', icon: ClipboardList, label: 'Work Queue' },
  { href: '/dashboard/complaints', icon: List, label: 'All Complaints' },
  { href: '/dashboard/map', icon: Map, label: 'City Map' },
];

const nodalNav = [
  { href: '/dashboard/overview', icon: Eye, label: 'City Overview' },
  { href: '/dashboard/all-complaints', icon: List, label: 'All Complaints' },
  { href: '/admin', icon: Shield, label: 'Admin Dashboard' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/dashboard/map', icon: Map, label: 'City Map' },
];

export default function DashboardLayout({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cityName, setCityName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('citysync_city');
    if (saved) setCityName(saved);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-darker)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2EC4B6] to-[#90DBF4] flex items-center justify-center animate-pulse">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <p className="text-[var(--text-muted)] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Role-based navigation
  const roleLabel = user?.role === 'admin' ? 'Nodal Officer' : user?.role === 'authority' ? 'Dept. Officer' : 'Citizen';
  const navItems = user?.role === 'admin' ? nodalNav : user?.role === 'authority' ? officerNav : citizenNav;

  return (
    <div className="min-h-screen flex bg-[var(--bg-darker)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[#1F2937]/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white border-r border-[var(--border)] flex flex-col transition-transform duration-300 shadow-lg ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="CitySync" className="w-9 h-9 rounded-lg object-contain" />
            <span className="text-lg font-bold gradient-text">CitySync</span>
          </Link>
          <button className="lg:hidden text-[var(--text-muted)]" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider px-3 mb-2">
            {roleLabel}
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2EC4B6]/12 text-[#2EC4B6] font-semibold'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#2EC4B6]' : ''}`} />
                {item.label}
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-[#2EC4B6]" />}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-darker)]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2EC4B6] to-[#90DBF4] flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || user?.mobile?.slice(-2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name || 'Citizen'}</p>
              <p className="text-xs text-[var(--text-dim)] truncate">{user?.mobile}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[var(--text-dim)] hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/80 backdrop-blur-md border-b border-[var(--border)] flex items-center px-4 lg:px-6">
          <button
            className="lg:hidden p-2 -ml-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* City name - center */}
          <div className="flex-1 flex justify-center">
            {cityName && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2EC4B6]/8 border border-[#2EC4B6]/15">
                <MapPin className="w-3.5 h-3.5 text-[#2EC4B6]" />
                <span className="text-sm font-medium text-[#22a99d]">{cityName}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFBF69] rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
