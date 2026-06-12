import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Settings, LayoutDashboard, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaveDivider } from "@/components/wave-divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { setAdminPassword, customFetch } from "@workspace/api-client-react";

const ADMIN_PWD_STORAGE_KEY = "wedding_admin_pwd";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_PWD_STORAGE_KEY);
    if (stored) {
      setAdminPassword(stored);
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = (password: string) => {
    sessionStorage.setItem(ADMIN_PWD_STORAGE_KEY, password);
    setAdminPassword(password);
    setUnlocked(true);
  };

  if (!unlocked) {
    return <AdminLock onUnlock={handleUnlock} />;
  }

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Panel" },
    { href: "/admin/config", icon: Settings, label: "Configuración" },
  ];

  return (
    <div className="min-h-screen bg-[#F3EEE6] flex flex-col md:flex-row">
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

      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-10 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function AdminLock({ onUnlock }: { onUnlock: (password: string) => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) return;
    setVerifying(true);
    try {
      await customFetch("/api/admin/verify", {
        method: "POST",
        headers: { "x-admin-password": password },
      });
      onUnlock(password);
    } catch {
      toast({
        title: "Contraseña incorrecta",
        description: "Inténtalo de nuevo para acceder al panel.",
        variant: "destructive",
      });
      setPassword("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EEE6] flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-lg border border-[#BCAE98]/30 shadow-sm space-y-6 text-center"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7DFD1] text-[#705B46]">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-semibold text-[#553927]">
                Panel de Administración
              </h2>
              <p className="text-[#705B46] mt-1 text-sm">
                Ingresa la contraseña para acceder.
              </p>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <Label htmlFor="admin-password">Contraseña</Label>
            <Input
              id="admin-password"
              name="admin-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-[#BCAE98]"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={verifying || !password}
            size="lg"
            className="w-full bg-[#553927] hover:bg-[#705B46] text-white"
          >
            {verifying ? "Verificando..." : "Acceder"}
          </Button>
        </form>
      </div>
    </div>
  );
}
