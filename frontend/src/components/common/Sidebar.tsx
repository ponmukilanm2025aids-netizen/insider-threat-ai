import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Stethoscope, Sparkles, Flower2,
  Calendar, TrendingUp, FileText, UtensilsCrossed, Receipt,
  Boxes, BarChart3, Bell, Settings, ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LotusLogo } from './LotusLogo';
import { Badge } from './Badge';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: string | number;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Patients', path: '/patients', icon: Users, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'doctors', label: 'Doctors', path: '/doctors', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'therapists', label: 'Therapists', path: '/therapists', icon: Sparkles, roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'RECEPTIONIST'] },
    { id: 'therapies', label: 'Panchakarma Therapies', path: '/therapies', icon: Flower2 },
    { id: 'appointments', label: 'Appointments & Scheduling', path: '/appointments', icon: Calendar },
    { id: 'progress', label: 'Treatment Progress', path: '/treatment-progress', icon: TrendingUp, roles: ['ADMIN', 'DOCTOR', 'THERAPIST'] },
    { id: 'prescriptions', label: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    { id: 'diet', label: 'Diet Plans', path: '/diet-plans', icon: UtensilsCrossed, roles: ['ADMIN', 'DOCTOR', 'THERAPIST'] },
    { id: 'billing', label: 'Billing & Payments', path: '/billing', icon: Receipt, roles: ['ADMIN', 'RECEPTIONIST'] },
    { id: 'inventory', label: 'Inventory & Oils', path: '/inventory', icon: Boxes, roles: ['ADMIN', 'DOCTOR', 'THERAPIST', 'RECEPTIONIST'] },
    { id: 'reports', label: 'Reports & Analytics', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'DOCTOR'] },
    { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell },
    { id: 'settings', label: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles || !user) return true;
    return item.roles.includes(user.role) || user.role === 'ADMIN';
  });

  return (
    <aside
      className={`relative flex flex-col bg-[#FAF7EF] border-r border-[#E5DFD3] transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand Header */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-[#E5DFD3]/70 bg-gradient-to-b from-[#FAF7EF] to-[#F5EFEB]/50">
        <LotusLogo size={38} showText={!collapsed} subtitle="Kerala Panchakarma" />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-[#73695E] hover:text-[#244C3A] hover:bg-[#E5DFD3]/50 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role Pill */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-[#E5DFD3]/50 bg-[#F5EFEB]/40 flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-semibold text-[#40372D] truncate">{user.full_name}</p>
            <p className="text-[11px] text-[#73695E] truncate">{user.email}</p>
          </div>
          <Badge variant="role">{user.role}</Badge>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNavItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-[#244C3A] text-white shadow-sm shadow-[#244C3A]/20'
                    : 'text-[#40372D] hover:bg-[#EAEFEA] hover:text-[#244C3A]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <IconComponent
                    size={20}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-[#DFC894]' : 'text-[#66856A] group-hover:text-[#244C3A]'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1 tracking-tight">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-[#B99756]/20 text-[#8F6F33] rounded">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#E5DFD3]/80 bg-[#FAF7EF]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-800 hover:bg-rose-50 hover:text-rose-900 transition-colors"
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut size={18} className="shrink-0 text-rose-600" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
