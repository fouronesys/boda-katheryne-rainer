import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaveDivider } from "@/components/wave-divider";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Panel" },
    { href: "/admin/config", icon: Settings, label: "Configuración" },
  ];

  return (
    <div className="min-h-screen bg-[#F3EEE6] flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 shrink-0 bg-[#553927] text-[#FAF9F6] md:min-h-screen md:sticky md:top-0 md:flex md:flex-col">
        <div className="p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#BCAE98]/60 font-serif text-base text-[#FAF9F6]">
              K<span className="mx-0.5 italic text-[#BCAE98]">&amp;</span>R
            </div>
            <div>
              <h1 className="font-serif text-lg leading-tight tracking-wide text-[#FAF9F6]">
                Katheryne &amp; Rainer
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#D9D3C5]/70">
                Panel de Administración
              </p>
            </div>
          </div>
          <div className="mt-6 text-[#BCAE98]/60">
            <WaveDivider />
          </div>
        </div>

        <nav className="px-4 pb-6 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#FAF9F6] text-[#553927] shadow-sm"
                    : "text-[#D9D3C5] hover:bg-white/10 hover:text-[#FAF9F6]"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block px-7 pb-7 mt-auto">
          <p className="text-[11px] text-[#D9D3C5]/50 leading-relaxed">
            Cada invitado tiene un enlace único con su código QR.
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
