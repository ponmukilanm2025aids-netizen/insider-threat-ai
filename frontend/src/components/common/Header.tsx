import React, { useState, useEffect } from 'react';
import { Bell, Search, ShieldCheck, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiService } from '../../services/api';
import { Notification, UserRole } from '../../types';
import { Badge } from './Badge';

export const Header: React.FC = () => {
  const { user, switchRoleDemo } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await apiService.getNotifications(false);
      setNotifications(data.slice(0, 6));
    } catch (err) {
      // Quiet fail if offline
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    await apiService.markAllNotificationsRead();
    loadNotifications();
  };

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Admin (Director)', desc: 'Full System & Billing control' },
    { role: 'DOCTOR', label: 'Doctor (Vaidya)', desc: 'Clinical Rx, Doshas, Plans' },
    { role: 'THERAPIST', label: 'Therapist', desc: 'Daily sessions, vitals log' },
    { role: 'RECEPTIONIST', label: 'Receptionist', desc: 'Appointments & Billing desk' },
  ];

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E5DFD3] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Search & Subtitle */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73695E]" size={17} />
          <input
            type="text"
            placeholder="Search patients (name, ID, phone), appointments..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF7EF]/70 border border-[#E5DFD3] rounded-xl text-xs sm:text-sm text-[#40372D] placeholder-[#73695E]/60 focus:outline-none focus:border-[#244C3A] focus:ring-1 focus:ring-[#244C3A]"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#B99756]/40 bg-[#FAF7EF] hover:bg-[#F5EFEB] text-xs font-medium text-[#40372D] transition-colors"
          >
            <Sparkles size={14} className="text-[#B99756]" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-[#244C3A]">{user?.role}</span>
            <ChevronDown size={14} className="text-[#73695E]" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5DFD3] rounded-2xl shadow-xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[#E5DFD3]/60 mb-1">
                <p className="text-xs font-bold text-[#244C3A]">Switch Demo Profile</p>
                <p className="text-[11px] text-[#73695E]">Instant 1-click role testing</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={async () => {
                    await switchRoleDemo(r.role);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    user?.role === r.role ? 'bg-[#244C3A]/10 text-[#244C3A] font-semibold' : 'hover:bg-[#FAF7EF] text-[#40372D]'
                  }`}
                >
                  <div>
                    <p className="font-medium">{r.label}</p>
                    <p className="text-[10px] text-[#73695E]">{r.desc}</p>
                  </div>
                  {user?.role === r.role && <Check size={14} className="text-[#244C3A]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 rounded-xl border border-[#E5DFD3] bg-[#FAF7EF] hover:bg-[#F5EFEB] text-[#40372D] transition-colors"
            title="Notifications"
          >
            <Bell size={18} className="text-[#244C3A]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5DFD3] rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-[#FAF7EF] border-b border-[#E5DFD3] flex items-center justify-between">
                <span className="text-xs font-bold text-[#244C3A]">In-App Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-[#B99756] hover:underline font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#E5DFD3]/50">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-[#73695E]">No alerts at this moment.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs hover:bg-[#FAF7EF]/60 transition-colors ${
                        !n.is_read ? 'bg-[#244C3A]/5 font-medium' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#244C3A]">{n.title}</span>
                        <span className="text-[10px] text-[#73695E]">{n.notification_type}</span>
                      </div>
                      <p className="text-[#40372D] leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar & Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#E5DFD3]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#244C3A] to-[#66856A] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-[#B99756]/30">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-[#40372D] leading-tight">{user?.full_name}</p>
            <p className="text-[10px] text-[#73695E] font-medium">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
