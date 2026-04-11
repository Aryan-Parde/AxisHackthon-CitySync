'use client';

export default function AdminLayout({ children }) {
  // Reuse dashboard layout - admin pages are under /admin but share the same shell
  // This is handled by the parent dashboard layout
  return <>{children}</>;
}
