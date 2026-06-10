import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetStats, 
  useListGuests, 
  useCreateGuest, 
  useUpdateGuest, 
  useDeleteGuest,
  getListGuestsQueryKey,
  getGetStatsQueryKey,
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
import { Plus, Copy, QrCode, Trash, Edit, Search } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  declined: "Declinado",
};

export default function AdminDashboard() {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total de Invitados", value: stats.totalGuests },
            { label: "Confirmados", value: stats.confirmed },
            { label: "Pendientes", value: stats.pending },
            { label: "Declinados", value: stats.declined },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-lg border border-[#BCAE98]/30 shadow-sm">
              <p className="text-sm text-[#705B46] uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-serif text-[#553927] mt-2">{stat.value}</p>
            </div>
          ))}
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
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando invitados...</TableCell>
              </TableRow>
            ) : filteredGuests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No se encontraron invitados.</TableCell>
              </TableRow>
            ) : (
              filteredGuests?.map((guest) => (
                <TableRow key={guest.id} className="border-[#BCAE98]/20">
                  <TableCell className="font-medium text-[#553927]">{guest.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      guest.rsvpStatus === 'confirmed' ? 'bg-green-100 text-green-800' :
                      guest.rsvpStatus === 'declined' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
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
