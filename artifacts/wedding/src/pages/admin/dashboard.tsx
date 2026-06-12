import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetStats, 
  useListGuests, 
  useCreateGuest, 
  useUpdateGuest, 
  useDeleteGuest,
  getListGuestsQueryKey,
  getGetStatsQueryKey,
  setPanelPassword,
  customFetch,
  type Guest
} from "@workspace/api-client-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QRCodeSVG } from "qrcode.react";
import { Plus, Copy, QrCode, Trash, Edit, Search, Users, CheckCircle2, Clock, XCircle, Lock } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "Declinado",
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

const PANEL_PWD_STORAGE_KEY = "wedding_panel_pwd";

export default function AdminDashboard() {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(PANEL_PWD_STORAGE_KEY);
    if (stored) {
      setPanelPassword(stored);
      setUnlocked(true);
    }
  }, []);

  const handleUnlock = (password: string) => {
    sessionStorage.setItem(PANEL_PWD_STORAGE_KEY, password);
    setPanelPassword(password);
    setUnlocked(true);
  };

  if (!unlocked) {
    return <PanelLock onUnlock={handleUnlock} />;
  }

  return <DashboardContent />;
}

function DashboardContent() {
  const { data: stats } = useGetStats();
  const { data: guests, isLoading: guestsLoading } = useListGuests();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const plusOne = formData.get("plusOne") === "on";

    createGuest.mutate({
      data: { name, email, phone, plusOne }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        setIsCreateOpen(false);
        toast({ title: "Invitado agregado correctamente" });
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedGuest) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const plusOne = formData.get("plusOne") === "on";
    const rsvpStatus = formData.get("rsvpStatus") as string;

    updateGuest.mutate({
      id: selectedGuest.id,
      data: { name, email, phone, plusOne, rsvpStatus: rsvpStatus as any }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        setIsEditOpen(false);
        toast({ title: "Invitado actualizado correctamente" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este invitado?")) return;
    deleteGuest.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListGuestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        toast({ title: "Invitado eliminado" });
      }
    });
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invitation/${token}`;
    navigator.clipboard.writeText(url);
    toast({ title: "¡Enlace copiado al portapapeles!" });
  };

  const filteredGuests = guests?.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.rsvpStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const confirmRate =
    stats && stats.totalGuests > 0 ? Math.round((stats.confirmed / stats.totalGuests) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif font-semibold text-[#553927]">Gestión de Invitados</h2>
          <p className="text-[#705B46] mt-1">Administra tu lista de invitados y sus confirmaciones.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#553927] hover:bg-[#705B46] text-white">
              <Plus className="w-4 h-4 mr-2" /> Agregar Invitado
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#FAF9F6]">
            <DialogHeader>
              <DialogTitle className="font-serif text-[#553927]">Nuevo Invitado</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" name="name" required placeholder="Ej. María Pérez" className="border-[#BCAE98]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo (opcional)</Label>
                <Input id="email" name="email" type="email" placeholder="maria@ejemplo.com" className="border-[#BCAE98]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <Input id="phone" name="phone" placeholder="+1 809 123 4567" className="border-[#BCAE98]" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="plusOne" name="plusOne" />
                <Label htmlFor="plusOne">Permitir acompañante</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createGuest.isPending} className="bg-[#553927] hover:bg-[#705B46] text-white">
                  {createGuest.isPending ? "Agregando..." : "Agregar Invitado"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total de Invitados", value: stats.totalGuests, icon: Users, fg: "#705B46", bg: "#E7DFD1" },
              { label: "Confirmados", value: stats.confirmed, icon: CheckCircle2, fg: "#1F7A52", bg: "#DCEDE2" },
              { label: "Pendientes", value: stats.pending, icon: Clock, fg: "#9A6B17", bg: "#F4E7CC" },
              { label: "Declinados", value: stats.declined, icon: XCircle, fg: "#A23B43", bg: "#F2DBDD" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white p-5 rounded-xl border border-[#BCAE98]/30 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-[#705B46] uppercase tracking-[0.15em]">{stat.label}</p>
                      <p className="text-4xl font-serif text-[#553927] mt-2 tabular-nums">{stat.value}</p>
                    </div>
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: stat.bg, color: stat.fg }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {stats.totalGuests > 0 && (
            <div className="bg-white p-6 rounded-xl border border-[#BCAE98]/30 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#553927]">Tasa de confirmación</p>
                <p className="text-sm text-[#705B46] tabular-nums">
                  {stats.confirmed} de {stats.totalGuests} · {confirmRate}%
                </p>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#EDE6DA] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#553927] transition-all duration-700"
                  style={{ width: `${confirmRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#BCAE98]/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#BCAE98]/30 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar invitados..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-[#BCAE98]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] border-[#BCAE98]">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="declined">Declinado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader className="bg-[#FAF9F6]">
            <TableRow className="border-[#BCAE98]/30">
              <TableHead className="text-[#705B46]">Nombre</TableHead>
              <TableHead className="text-[#705B46]">Estado</TableHead>
              <TableHead className="text-[#705B46]">Contacto</TableHead>
              <TableHead className="text-[#705B46]">Acompañante</TableHead>
              <TableHead className="text-right text-[#705B46]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {guestsLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Cargando invitados...</TableCell>
              </TableRow>
            ) : filteredGuests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#A38C70]">
                    <Users className="h-8 w-8" />
                    <p className="text-[#705B46]">No se encontraron invitados.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests?.map((guest) => (
                <TableRow key={guest.id} className="border-[#BCAE98]/20 transition-colors hover:bg-[#FAF9F6]">
                  <TableCell className="font-medium text-[#553927]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#BCAE98]/25 font-serif text-sm text-[#705B46]">
                        {getInitials(guest.name)}
                      </div>
                      <span>{guest.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${
                      guest.rsvpStatus === 'confirmed' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                      guest.rsvpStatus === 'declined' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' :
                      'bg-amber-50 text-amber-700 ring-amber-600/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        guest.rsvpStatus === 'confirmed' ? 'bg-emerald-500' :
                        guest.rsvpStatus === 'declined' ? 'bg-rose-500' :
                        'bg-amber-500'
                      }`} />
                      {statusLabels[guest.rsvpStatus] ?? guest.rsvpStatus}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {guest.email && <div>{guest.email}</div>}
                    {guest.phone && <div>{guest.phone}</div>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {guest.plusOne ? (
                      guest.plusOneName ? <span className="text-[#553927]">{guest.plusOneName}</span> : <span className="text-muted-foreground italic">Pendiente</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => copyLink(guest.invitationToken)} title="Copiar enlace">
                        <Copy className="w-4 h-4 text-[#705B46]" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedGuest(guest); setIsQrOpen(true); }} title="Ver QR">
                        <QrCode className="w-4 h-4 text-[#705B46]" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setSelectedGuest(guest); setIsEditOpen(true); }} title="Editar">
                        <Edit className="w-4 h-4 text-[#705B46]" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(guest.id)} title="Eliminar">
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#FAF9F6]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#553927]">Editar Invitado</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre completo</Label>
                <Input id="edit-name" name="name" defaultValue={selectedGuest.name} required className="border-[#BCAE98]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo (opcional)</Label>
                <Input id="edit-email" name="email" type="email" defaultValue={selectedGuest.email || ""} className="border-[#BCAE98]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Teléfono (opcional)</Label>
                <Input id="edit-phone" name="phone" defaultValue={selectedGuest.phone || ""} className="border-[#BCAE98]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rsvpStatus">Estado de confirmación</Label>
                <Select name="rsvpStatus" defaultValue={selectedGuest.rsvpStatus}>
                  <SelectTrigger className="border-[#BCAE98]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="declined">Declinado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-plusOne" name="plusOne" defaultChecked={selectedGuest.plusOne} />
                <Label htmlFor="edit-plusOne">Permitir acompañante</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateGuest.isPending} className="bg-[#553927] hover:bg-[#705B46] text-white">
                  {updateGuest.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="bg-[#FAF9F6] sm:max-w-md flex flex-col items-center p-12">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-serif text-[#553927] text-center">Invitación de {selectedGuest?.name}</DialogTitle>
          </DialogHeader>
          {selectedGuest && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#BCAE98]/30">
              <QRCodeSVG 
                value={`${window.location.origin}/invitation/${selectedGuest.invitationToken}`} 
                size={200}
                fgColor="#553927"
              />
            </div>
          )}
          <p className="mt-6 text-sm text-center text-[#705B46]">
            Escanea este código para abrir la invitación.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PanelLock({ onUnlock }: { onUnlock: (password: string) => void }) {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!password) return;
    setVerifying(true);
    try {
      await customFetch("/api/panel/verify", {
        method: "POST",
        headers: { "x-panel-password": password },
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
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
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
              Panel de invitaciones
            </h2>
            <p className="text-[#705B46] mt-1 text-sm">
              Ingresa la contraseña para gestionar los invitados.
            </p>
          </div>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="panel-password">Contraseña</Label>
          <Input
            id="panel-password"
            name="panel-password"
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
  );
}
