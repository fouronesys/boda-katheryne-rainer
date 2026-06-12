import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetWeddingConfig,
  useUpdateWeddingConfig,
  getGetWeddingConfigQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Heart, Shirt } from "lucide-react";

export default function AdminConfig() {
  return <ConfigForm />;
}

function ConfigForm() {
  const { data: config, isLoading } = useGetWeddingConfig();
  const updateConfig = useUpdateWeddingConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [allowedColors, setAllowedColors] = useState<string[]>([]);
  const [newColor, setNewColor] = useState("#FFFFFF");

  useEffect(() => {
    if (config?.allowedColors) {
      setAllowedColors(config.allowedColors);
    }
  }, [config]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    updateConfig.mutate({
      data: {
        brideName: formData.get("brideName") as string,
        groomName: formData.get("groomName") as string,
        weddingDate: formData.get("weddingDate") as string,
        venue: formData.get("venue") as string,
        venueAddress: formData.get("venueAddress") as string,
        mapsUrl: formData.get("mapsUrl") as string,
        musicUrl: formData.get("musicUrl") as string,
        ceremonyTime: formData.get("ceremonyTime") as string,
        receptionTime: formData.get("receptionTime") as string,
        dressCode: formData.get("dressCode") as string,
        additionalInfo: formData.get("additionalInfo") as string,
        allowedColors: allowedColors
      }
    }, {
      onSuccess: (data) => {
        queryClient.setQueryData(getGetWeddingConfigQueryKey(), data);
        toast({ title: "Configuración guardada correctamente" });
      },
      onError: () => {
        toast({
          title: "No se pudo guardar",
          description: "Verifica tu acceso e inténtalo de nuevo.",
          variant: "destructive",
        });
      }
    });
  };

  const addColor = () => {
    if (!allowedColors.includes(newColor)) {
      setAllowedColors([...allowedColors, newColor]);
    }
  };

  const removeColor = (color: string) => {
    setAllowedColors(allowedColors.filter(c => c !== color));
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando configuración...</div>;
  }

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-serif font-semibold text-[#553927]">Detalles de la Boda</h2>
        <p className="text-[#705B46] mt-1">Configura la información que aparece en la invitación.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg border border-[#BCAE98]/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-[#BCAE98]/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7DFD1] text-[#705B46]">
              <Heart className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-serif text-[#553927]">Los novios y el lugar</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="brideName">Nombre de la novia</Label>
              <Input id="brideName" name="brideName" defaultValue={config?.brideName} required className="border-[#BCAE98]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groomName">Nombre del novio</Label>
              <Input id="groomName" name="groomName" defaultValue={config?.groomName} required className="border-[#BCAE98]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Fecha de la boda</Label>
              <Input id="weddingDate" name="weddingDate" type="date" defaultValue={config?.weddingDate?.split('T')[0]} required className="border-[#BCAE98]" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ceremonyTime">Hora de la ceremonia <span className="text-[#A38C70] font-normal">(opcional)</span></Label>
              <Input id="ceremonyTime" name="ceremonyTime" defaultValue={config?.ceremonyTime} className="border-[#BCAE98]" placeholder="6:00 PM — dejar vacío para omitir" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receptionTime">Hora de la recepción</Label>
              <Input id="receptionTime" name="receptionTime" defaultValue={config?.receptionTime} required className="border-[#BCAE98]" placeholder="7:30 PM" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Nombre del lugar</Label>
            <Input id="venue" name="venue" defaultValue={config?.venue} required className="border-[#BCAE98]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueAddress">Dirección del lugar</Label>
            <Textarea id="venueAddress" name="venueAddress" defaultValue={config?.venueAddress} required className="border-[#BCAE98] min-h-[80px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapsUrl">Enlace de Google Maps (opcional)</Label>
            <Input id="mapsUrl" name="mapsUrl" type="url" defaultValue={config?.mapsUrl || ""} className="border-[#BCAE98]" placeholder="https://maps.google.com/..." />
            <p className="text-xs text-muted-foreground">Si lo dejas vacío, se generará un enlace automáticamente a partir de la dirección.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#BCAE98]/30 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-[#BCAE98]/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7DFD1] text-[#705B46]">
              <Shirt className="h-4 w-4" />
            </div>
            <h3 className="text-xl font-serif text-[#553927]">Código de Vestimenta e Información</h3>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dressCode">Descripción del código de vestimenta</Label>
            <Input id="dressCode" name="dressCode" defaultValue={config?.dressCode} className="border-[#BCAE98]" />
          </div>

          <div className="space-y-4">
            <Label>Colores permitidos</Label>
            <div className="flex gap-2 items-center">
              <Input 
                type="color" 
                value={newColor} 
                onChange={(e) => setNewColor(e.target.value)} 
                className="w-16 p-1 h-10 border-[#BCAE98]" 
              />
              <Button type="button" variant="outline" onClick={addColor} className="border-[#BCAE98] text-[#553927]">
                <Plus className="w-4 h-4 mr-2" /> Agregar color
              </Button>
            </div>
            {allowedColors.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4">
                {allowedColors.map((color) => (
                  <div key={color} className="flex items-center gap-2 bg-[#FAF9F6] border border-[#BCAE98]/50 rounded-full pl-3 pr-1 py-1">
                    <div className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                    <span className="text-sm font-mono text-[#705B46]">{color}</span>
                    <button 
                      type="button" 
                      onClick={() => removeColor(color)}
                      className="p-1 hover:bg-[#BCAE98]/20 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="musicUrl">Música de fondo (enlace de YouTube)</Label>
            <Input id="musicUrl" name="musicUrl" type="url" defaultValue={config?.musicUrl || ""} className="border-[#BCAE98]" placeholder="https://www.youtube.com/watch?v=..." />
            <p className="text-xs text-muted-foreground">Pega un enlace de YouTube. La música se reproducirá automáticamente al abrir la invitación; los invitados pueden silenciarla con el botón de la esquina. Déjalo vacío para no usar música.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Información adicional</Label>
            <Textarea id="additionalInfo" name="additionalInfo" defaultValue={config?.additionalInfo || ""} className="border-[#BCAE98] min-h-[100px]" placeholder="Transporte, estacionamiento, mesa de regalos..." />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateConfig.isPending} size="lg" className="bg-[#553927] hover:bg-[#705B46] text-white">
            {updateConfig.isPending ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </form>
    </div>
  );
}
