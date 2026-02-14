import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { LayoutDashboard, CalendarDays, BarChart3, LogOut, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { logoutUser } from '../store/authSlice';

export default function Sidebar() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/history", label: "History", icon: CalendarDays },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-screen">
      <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
        <div className="bg-primary/20 p-2 rounded-lg">
          <Zap className="text-primary w-5 h-5" />
        </div>
        <span className="font-bold text-lg text-foreground">Focus</span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-primary rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="relative z-10 w-5 h-5" />
                <span className="relative z-10 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="mb-4 px-2">
          <p className="font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={() => dispatch(logoutUser())}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full px-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}