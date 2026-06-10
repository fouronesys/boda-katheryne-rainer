import { useParams } from "wouter";
import { useGetInvitation, useUpdateRsvp, getGetInvitationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import oceanHero from "@/assets/ocean-hero.png";
import oceanTexture from "@/assets/ocean-texture.png";

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export default function Invitation() {
  const { token } = useParams<{ token: string }>();
  const { data: invitation, isLoading, error } = useGetInvitation(token || "", {
    query: { enabled: !!token, queryKey: getGetInvitationQueryKey(token || "") }
  });
  const updateRsvp = useUpdateRsvp();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [plusOneName, setPlusOneName] = useState("");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-[#A38C70] tracking-widest uppercase text-sm animate-pulse">
          Abriendo...
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-serif text-[#553927] mb-2">Invitación no encontrada</h2>
          <p className="text-[#705B46]">No pudimos encontrar tu invitación. Por favor verifica el enlace e inténtalo de nuevo.</p>
        </div>
      </div>
    );
  }

  const { guest, weddingConfig } = invitation;
  const isRSVPd = guest.rsvpStatus === "confirmed" || guest.rsvpStatus === "declined";

  const handleRsvp = (status: "confirmed" | "declined" | "pending") => {
    updateRsvp.mutate({
      token: token as string,
      data: {
        rsvpStatus: status,
        ...(guest.plusOne && plusOneName ? { plusOneName } : {})
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvitationQueryKey(token as string) });
        if (status === "pending") {
          toast({
            title: "Puedes actualizar tu respuesta",
            description: "Indícanos si podrás acompañarnos."
          });
          return;
        }
        toast({
          title: status === "confirmed" ? "¡No podemos esperar a verte!" : "¡Te extrañaremos!",
          description: "Tu respuesta ha sido guardada."
        });
      }
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  };

  const formattedDate = weddingConfig.weddingDate
    ? capitalize(format(parseISO(weddingConfig.weddingDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }))
    : "";

  const customMaps = weddingConfig.mapsUrl?.trim();
  const mapsHref =
    customMaps && /^https?:\/\//i.test(customMaps)
      ? customMaps
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${weddingConfig.venue}, ${weddingConfig.venueAddress}`
        )}`;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#553927] font-sans selection:bg-[#BCAE98] selection:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={oceanHero}
            alt="Olas suaves del mar sobre la arena"
            className="w-full h-full object-cover"
          />
          {/* Legibility veil */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/60 via-[#FDFBF7]/30 to-[#FDFBF7]" />
          <div className="absolute inset-0 bg-[#705B46]/5" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 text-center max-w-3xl mx-auto flex flex-col items-center"
        >
          <motion.p variants={fadeIn} className="uppercase tracking-[0.4em] text-xs text-[#705B46] mb-10">
            Junto a sus familias
          </motion.p>

          <motion.h1 variants={fadeIn} className="font-serif text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-[#553927] drop-shadow-sm">
            {weddingConfig.brideName}
          </motion.h1>
          <motion.div variants={fadeIn} className="my-4 text-4xl sm:text-5xl text-[#BCAE98] font-light italic font-serif">
            &amp;
          </motion.div>
          <motion.h1 variants={fadeIn} className="font-serif text-6xl sm:text-7xl lg:text-8xl leading-[1.05] text-[#553927] drop-shadow-sm">
            {weddingConfig.groomName}
          </motion.h1>

          <motion.div variants={fadeIn} className="w-px h-16 bg-[#BCAE98] my-10" />

          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-[#705B46] font-serif mb-3">
            {formattedDate}
          </motion.p>
          <motion.p variants={fadeIn} className="uppercase tracking-[0.25em] text-sm text-[#A38C70]">
            {weddingConfig.venue}
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#BCAE98]"
        >
          <div className="w-px h-12 bg-gradient-to-b from-[#BCAE98] to-transparent animate-pulse" />
        </motion.div>
      </section>

      {/* Greeting */}
      <section className="py-20 px-6 bg-[#FAF9F6] text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={fadeIn}
          className="max-w-2xl mx-auto"
        >
          <p className="uppercase tracking-[0.25em] text-xs text-[#A38C70] mb-4">Con cariño para</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#553927] mb-6">{guest.name}</h2>
          <p className="text-[#705B46] leading-relaxed text-lg">
            Será un honor para nosotros compartir contigo este día tan especial.
            Acompáñanos a celebrar el comienzo de nuestra nueva vida juntos.
          </p>
        </motion.div>
      </section>

      {/* Details Section */}
      <section className="py-24 px-6 bg-[#FAF9F6]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-2xl mx-auto space-y-24 text-center"
        >
          <motion.div variants={fadeIn} className="space-y-4">
            <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">El Programa</h2>
            <div className="font-serif text-2xl space-y-2">
              <p>Ceremonia a las {weddingConfig.ceremonyTime}</p>
              <p>Recepción a las {weddingConfig.receptionTime}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-5">
            <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">El Lugar</h2>
            <div className="font-serif text-2xl">
              <p>{weddingConfig.venue}</p>
              <p className="text-lg text-[#705B46] mt-2 whitespace-pre-line font-sans">{weddingConfig.venueAddress}</p>
            </div>
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Button
                variant="outline"
                className="border-[#BCAE98] text-[#553927] hover:bg-[#BCAE98] hover:text-white rounded-none px-6 py-5 h-auto uppercase tracking-widest text-xs mt-2"
              >
                <MapPin className="w-4 h-4 mr-2" /> Ver en Google Maps
              </Button>
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* Texture band */}
      <section className="relative h-[40vh] min-h-[280px] flex items-center justify-center overflow-hidden">
        <img src={oceanTexture} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#553927]/30" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 text-white font-serif italic text-2xl md:text-4xl text-center px-6 max-w-2xl drop-shadow"
        >
          "Como el mar encuentra la orilla, nos encontramos el uno al otro."
        </motion.p>
      </section>

      {/* Dress code & info */}
      <section className="py-24 px-6 bg-[#FAF9F6]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-2xl mx-auto space-y-24 text-center"
        >
          {weddingConfig.dressCode && (
            <motion.div variants={fadeIn} className="space-y-6">
              <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">Código de Vestimenta</h2>
              <p className="font-serif text-xl">{weddingConfig.dressCode}</p>

              {weddingConfig.allowedColors && weddingConfig.allowedColors.length > 0 && (
                <>
                  <p className="text-sm text-[#705B46]">Paleta de colores sugerida</p>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {weddingConfig.allowedColors.map((color, i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full shadow-sm border border-black/5"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {weddingConfig.additionalInfo && (
            <motion.div variants={fadeIn} className="space-y-4">
              <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">Detalles</h2>
              <p className="text-[#705B46] leading-relaxed max-w-xl mx-auto whitespace-pre-line">
                {weddingConfig.additionalInfo}
              </p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* RSVP Section */}
      <section className="py-24 px-6 bg-[#D9D3C5]/30">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-xl mx-auto bg-white p-8 md:p-12 shadow-sm rounded-none border border-[#BCAE98]/30 text-center relative"
        >
          {/* Corner decorations */}
          <div className="absolute top-4 left-4 w-4 h-4 border-t border-l border-[#BCAE98]" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t border-r border-[#BCAE98]" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b border-l border-[#BCAE98]" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b border-r border-[#BCAE98]" />

          <h2 className="font-serif text-3xl md:text-4xl mb-2 text-[#553927]">Confirma tu Asistencia</h2>
          <p className="text-[#705B46] mb-8 italic font-serif">Nos encantaría contar contigo</p>

          <p className="text-xl font-medium mb-6">¡Hola, {guest.name}!</p>

          {!isRSVPd ? (
            <div className="space-y-8">
              {guest.plusOne && (
                <div className="space-y-3 max-w-xs mx-auto text-left">
                  <Label htmlFor="plusOneName" className="text-[#705B46]">Nombre de tu acompañante (opcional)</Label>
                  <Input
                    id="plusOneName"
                    placeholder="Escribe su nombre completo"
                    value={plusOneName}
                    onChange={(e) => setPlusOneName(e.target.value)}
                    className="border-[#BCAE98] focus-visible:ring-[#BCAE98] rounded-none bg-transparent"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button
                  onClick={() => handleRsvp("confirmed")}
                  disabled={updateRsvp.isPending}
                  className="bg-[#553927] hover:bg-[#705B46] text-white rounded-none px-8 py-6 h-auto uppercase tracking-widest text-xs"
                >
                  Sí, asistiré
                </Button>
                <Button
                  onClick={() => handleRsvp("declined")}
                  disabled={updateRsvp.isPending}
                  variant="outline"
                  className="border-[#BCAE98] text-[#553927] hover:bg-[#FAF9F6] rounded-none px-8 py-6 h-auto uppercase tracking-widest text-xs"
                >
                  No podré asistir
                </Button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8"
            >
              <p className="text-2xl font-serif text-[#553927] mb-4">
                {guest.rsvpStatus === "confirmed"
                  ? "¡Nos alegra mucho que nos acompañes!"
                  : "Te extrañaremos mucho."}
              </p>
              <Button
                variant="link"
                onClick={() => handleRsvp("pending")}
                className="text-[#A38C70] hover:text-[#553927]"
              >
                Cambiar respuesta
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer & QR */}
      <footer className="py-24 px-6 flex flex-col items-center bg-[#553927] text-[#FAF9F6]">
        <h3 className="font-serif text-3xl mb-12 opacity-80">
          {weddingConfig.brideName.charAt(0)} &amp; {weddingConfig.groomName.charAt(0)}
        </h3>

        <div className="bg-[#FAF9F6] p-4 shadow-xl mb-12">
          <QRCodeSVG
            value={window.location.href}
            size={160}
            fgColor="#553927"
            bgColor="#FAF9F6"
          />
        </div>
        <p className="text-sm uppercase tracking-[0.25em] opacity-60">Tu Pase Digital</p>
      </footer>
    </div>
  );
}
