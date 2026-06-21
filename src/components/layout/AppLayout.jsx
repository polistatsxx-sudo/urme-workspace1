import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import QuickCapture from '../shared/QuickCapture';
import GlobalSearch from '@/components/search/GlobalSearch';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={cn(
        "transition-all duration-300 pt-14 lg:pt-0",
        collapsed ? "lg:ml-16" : "lg:ml-56"
      )}>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <QuickCapture />
      <GlobalSearch />
    </div>
  );
}