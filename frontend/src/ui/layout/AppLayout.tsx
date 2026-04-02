import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { DashboardFilterProvider } from '@/hooks/useDashboardFilters';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { FilterDock } from './FilterDock';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <DashboardFilterProvider>
      <div className="min-h-screen">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-[280px] transform transition-transform duration-300 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full overflow-y-auto p-4">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>

        <div className="mx-auto flex max-w-[1700px] gap-6 px-4 py-4 lg:px-6">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>
          <div className="min-w-0 flex-1 space-y-6">
            {/* Mobile topbar with hamburger */}
            <div className="flex items-center gap-3 lg:hidden">
              <button className="button p-3" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-white">WarrantyWise</span>
            </div>
            <TopBar />
            <FilterDock />
            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </DashboardFilterProvider>
  );
}
