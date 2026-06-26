import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, KanbanSquare, CheckSquare, Lightbulb, 
  Calendar, MessageSquare, User, ChevronLeft, ChevronRight, Menu, X, DollarSign,
  Search, Users, BarChart3, FileText, UserCog, Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { path: '#search', icon: Search, label: 'Search', isAction: true },
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/pipeline', icon: KanbanSquare, label: 'Pipeline' },
  { path: '/businesses', icon: Building2, label: 'Businesses' },
  { path: '/contacts', icon: Users, label: 'Contacts' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/templates', icon: FileText, label: 'Templates' },
  { path: '/ideas', icon: Lightbulb, label: 'Ideas' },
  { path: '/events', icon: Calendar, label: 'Events' },
  { path: '/sync', icon: MessageSquare, label: 'Sync Hub' },
  { path: '/finance', icon: DollarSign, label: 'Finance' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/team', icon: UserCog, label: 'Team' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings', adminOnly: true },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-2 px-4 py-5 border-b border-border/50", collapsed && "justify-center px-2")}>
        <img
          src="https://media.base44.com/images/public/6a2e6b5c552bd19313d69f46/b43319c91_1choice.png"
          alt="URME"
          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-display font-bold text-sm tracking-tight text-foreground">URME</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Workspace</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !['admin', 'ceo'].includes(user?.role)) return null;
          const isActive = location.pathname === item.path;
          if (item.isAction) {
            return (
              <button
                key={item.path}
                onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-muted-foreground hover:text-foreground hover:bg-secondary active:scale-95",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          }
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-primary")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-border/50 hidden lg:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="https://media.base44.com/images/public/6a2e6b5c552bd19313d69f46/b43319c91_1choice.png"
            alt="URME"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="font-display font-bold text-sm">URME</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => window.dispatchEvent(new CustomEvent('open-global-search'))} className="h-10 w-10">
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="h-10 w-10">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/25 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="w-[min(85vw,18rem)] h-full bg-background border-r border-border shadow-xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="pt-14">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:block fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-30 transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}>
        <NavContent />
      </aside>
    </>
  );
}