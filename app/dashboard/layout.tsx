"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  Zap,
  Settings,
  Store,
  ChevronRight,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Upload",
    href: "/dashboard/upload",
    icon: Upload,
  },
  {
    label: "Processing",
    href: "/dashboard/jobs",
    icon: Zap,
  },
  {
    label: "Stores",
    href: "/dashboard/stores",
    icon: Store,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-studio-white">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-industrial-grey">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-velolume-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-ivory-100" strokeWidth={1.5} />
            </div>
            <span className="font-serif text-xl text-velolume-500">
              Velolume
            </span>
            <span className="text-micro font-mono text-industrial-dark uppercase tracking-wider">
              Studio
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-industrial-dark hover:text-velolume-500 transition-colors font-mono"
            >
              View Storefront
            </Link>
            <div className="w-8 h-8 rounded-full bg-velolume-500/10 flex items-center justify-center">
              <span className="text-velolume-500 font-mono text-sm">V</span>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className="fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-industrial-grey">
        <nav className="p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                      ${isActive
                        ? "bg-velolume-500 text-ivory-100"
                        : "text-industrial-dark hover:bg-industrial-grey/50"
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                    <span className="font-mono text-sm">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" strokeWidth={1.5} />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer - Quick Stats */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-industrial-grey">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-industrial-dark font-mono">Jobs Today</span>
              <span className="font-mono text-velolume-500">12</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-industrial-dark font-mono">Active Stores</span>
              <span className="font-mono text-velolume-500">3</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="pt-16 pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
