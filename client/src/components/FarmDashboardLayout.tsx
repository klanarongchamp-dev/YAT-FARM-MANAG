/**
 * FarmDashboardLayout
 * Custom sidebar layout for YAT FARM MANAGER with navigation, dark mode toggle,
 * alert badge, and responsive mobile drawer.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronRight,
  DollarSign,
  Home,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  Users,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/pump", icon: Waves, label: "ควบคุมปั๊มน้ำ" },
  { href: "/finance", icon: DollarSign, label: "การเงินฟาร์ม" },
  { href: "/logs", icon: Activity, label: "Activity Log" },
  { href: "/alerts", icon: Bell, label: "การแจ้งเตือน", badge: true },
  { href: "/users", icon: Users, label: "จัดการผู้ใช้", adminOnly: true },
];

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  adminOnly,
  unreadCount,
  userRole,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
  adminOnly?: boolean;
  unreadCount?: number;
  userRole?: string;
  onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = location === href;

  if (adminOnly && userRole !== "admin") return null;

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-sm flex-1">{label}</span>
        {badge && unreadCount && unreadCount > 0 ? (
          <Badge variant="destructive" className="text-xs h-5 px-1.5 min-w-5 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
        {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
      </div>
    </Link>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: unreadCount } = trpc.alerts.getUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  return (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-lg">
            🌱
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-sidebar-foreground">YAT FARM</p>
            <p className="text-xs text-sidebar-foreground/60">MANAGER</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            unreadCount={unreadCount ?? 0}
            userRole={user?.role}
            onClick={onNavClick}
          />
        ))}
      </nav>

      {/* Bottom: user + theme */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-sm"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 shrink-0" />
          ) : (
            <Moon className="w-4 h-4 shrink-0" />
          )}
          <span>{theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}</span>
        </button>

        {/* User info */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sidebar-accent">
            <div className="w-7 h-7 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold shrink-0">
              {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                {user.name ?? user.email ?? "ผู้ใช้"}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้งาน"}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-lg hover:bg-sidebar-border transition-colors"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5 text-sidebar-foreground/60" />
            </button>
          </div>
        ) : (
          <Button
            className="w-full h-9 text-sm"
            onClick={() => startLogin()}
          >
            เข้าสู่ระบบ
          </Button>
        )}
      </div>
    </div>
  );
}

export default function FarmDashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border">
        <SidebarContent />
      </aside>

      {/* Mobile Header + Drawer */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-60">
              <SidebarContent onNavClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-bold text-sm">YAT FARM MANAGER</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

