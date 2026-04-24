import { Link, NavLink } from "react-router-dom";
import { ReactNode } from "react";
import { GraduationCap, LayoutDashboard, User as UserIcon } from "lucide-react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold">Scholarship Assistant</div>
              <div className="text-xs text-muted-foreground">Apply faster. Write better.</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              <UserIcon className="h-4 w-4" /> Profile
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}