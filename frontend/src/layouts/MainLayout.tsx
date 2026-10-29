import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/common/Sidebar';
import { Header } from '../components/common/Header';
import { useAuth } from '../context/AuthContext';

export const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7EF]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#244C3A] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            AyurSutra Clinical System Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#FAF7EF] text-[#40372D]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
