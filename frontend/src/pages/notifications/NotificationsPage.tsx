import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, CheckCircle2, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import { apiService } from '../../services/api';
import { Notification } from '../../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [unreadOnly]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await apiService.getNotifications(unreadOnly);
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiService.markNotificationRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'danger':
        return <AlertCircle className="text-rose-600" size={18} />;
      case 'warning':
        return <AlertTriangle className="text-amber-600" size={18} />;
      case 'success':
        return <CheckCircle2 className="text-emerald-600" size={18} />;
      default:
        return <Bell className="text-[#244C3A]" size={18} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#244C3A]" style={{ fontFamily: 'Georgia, serif' }}>
            In-App Notification Center
          </h1>
          <p className="text-xs sm:text-sm text-[#73695E] mt-0.5">
            Operational alerts, conflict warnings, inventory thresholds, and appointment reminders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              unreadOnly
                ? 'bg-[#244C3A] text-white border-[#244C3A]'
                : 'bg-white border-[#E5DFD3] text-[#73695E] hover:text-[#40372D]'
            }`}
          >
            {unreadOnly ? 'Showing Unread Only' : 'Show All Alerts'}
          </button>
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF7EF] border border-[#B99756] text-[#8F6F33] text-xs font-semibold rounded-xl hover:bg-[#F5EFEB] transition-colors"
          >
            <CheckCheck size={16} /> Mark All as Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-[#E5DFD3] shadow-xs divide-y divide-[#E5DFD3]/60 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-xs text-[#73695E]">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-[#244C3A]">No notifications found</p>
            <p className="text-xs text-[#73695E] mt-1">All clinical and operational tasks are currently in sync.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                !notif.is_read ? 'bg-[#244C3A]/5 font-medium' : 'hover:bg-[#FAF7EF]/30'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span className="p-2 rounded-xl bg-white border border-[#E5DFD3] shrink-0 mt-0.5 shadow-2xs">
                  {getSeverityIcon(notif.severity)}
                </span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm text-[#244C3A]">{notif.title}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF7EF] border border-[#E5DFD3] text-[#73695E]">
                      {notif.notification_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#40372D] leading-relaxed max-w-2xl">{notif.message}</p>
                  <span className="text-[10px] text-[#73695E] mt-2 block font-mono">
                    {notif.created_at}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="px-3 py-1 bg-white border border-[#E5DFD3] hover:border-[#244C3A] text-xs font-semibold text-[#244C3A] rounded-lg shrink-0 transition-colors shadow-2xs"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
