import { useParams } from "wouter";
import { useGetInvitation, useUpdateRsvp, getGetInvitationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";
import { MapPin, Heart, PartyPopper, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WaveDivider } from "@/components/wave-divider";
import { BackgroundMusic } from "@/components/background-music";
import oceanHeroVideo from "@/assets/ocean-hero.mp4";
import oceanHeroPoster from "@/assets/ocean-hero-poster.jpg";
import oceanTextureVideo from "@/assets/ocean-texture.mp4";
import oceanTexturePoster from "@/assets/ocean-texture-poster.jpg";
import couplePortrait from "@/assets/couple-portrait.jpg";

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
  const reduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const weddingDateObj = weddingConfig.weddingDate ? parseISO(weddingConfig.weddingDate) : null;

  const dateParts = weddingDateObj
    ? {
        weekday: capitalize(format(weddingDateObj, "EEEE", { locale: es })),
        day: format(weddingDateObj, "d", { locale: es }),
        month: capitalize(format(weddingDateObj, "MMMM", { locale: es })),
        year: format(weddingDateObj, "yyyy", { locale: es }),
      }
    : null;

  const diffMs = weddingDateObj ? weddingDateObj.getTime() - now : 0;
  const isFuture = diffMs > 0;
  const countdown = {
    days: Math.floor(diffMs / 86400000),
    hours: Math.floor((diffMs % 86400000) / 3600000),
    minutes: Math.floor((diffMs % 3600000) / 60000),
    seconds: Math.floor((diffMs % 60000) / 1000),
  };

  const customMaps = weddingConfig.mapsUrl?.trim();
  const mapsHref =
    customMaps && /^https?:\/\//i.test(customMaps)
      ? customMaps
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${weddingConfig.venue}, ${weddingConfig.venueAddress}`
        )}`;

  return (
    <MotionConfig reducedMotion="user">
    <BackgroundMusic url={weddingConfig.musicUrl} />
    <div className="min-h-screen bg-[#FDFBF7] text-[#553927] font-sans selection:bg-[#BCAE98] selection:text-white">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Animated background video — real ocean waves */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            className="w-full h-full object-cover"
            autoPlay={!reduceMotion}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            poster={oceanHeroPoster}
          >
            <source src={oceanHeroVideo} type="video/mp4" />
          </video>

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
          <motion.div
            variants={fadeIn}
            className="mb-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#A38C70]/60 font-serif text-lg tracking-wide text-[#705B46] backdrop-blur-[1px]"
            style={{ boxShadow: "0 2px 20px rgba(253,251,247,0.7)" }}
          >
            {weddingConfig.brideName.charAt(0)}
            <span className="mx-0.5 italic text-[#A38C70]">&amp;</span>
            {weddingConfig.groomName.charAt(0)}
          </motion.div>

          <motion.p variants={fadeIn} className="uppercase tracking-[0.4em] text-xs text-[#705B46] mb-10">
            Junto a sus familias
          </motion.p>

          <motion.h1
            variants={fadeIn}
            className="font-script text-7xl sm:text-8xl lg:text-9xl leading-[1.1] text-[#4A301F]"
            style={{ textShadow: "0 2px 22px rgba(253,251,247,0.85)" }}
          >
            {weddingConfig.brideName}
          </motion.h1>

          <motion.div variants={fadeIn} className="flex items-center gap-4 my-5">
            <span className="h-px w-10 sm:w-14 bg-[#A38C70]/70" />
            <span
              className="font-script text-5xl sm:text-6xl text-[#705B46]"
              style={{ textShadow: "0 2px 18px rgba(253,251,247,0.85)" }}
            >
              &amp;
            </span>
            <span className="h-px w-10 sm:w-14 bg-[#A38C70]/70" />
          </motion.div>

          <motion.h1
            variants={fadeIn}
            className="font-script text-7xl sm:text-8xl lg:text-9xl leading-[1.1] text-[#4A301F]"
            style={{ textShadow: "0 2px 22px rgba(253,251,247,0.85)" }}
          >
            {weddingConfig.groomName}
          </motion.h1>

          <motion.div variants={fadeIn} className="w-px h-12 bg-[#BCAE98] my-9" />

          {dateParts ? (
            <motion.div
              variants={fadeIn}
              className="flex items-center justify-center gap-4 sm:gap-6 text-[#705B46]"
            >
              <span className="uppercase tracking-[0.3em] text-[11px] sm:text-xs">
                {dateParts.weekday}
              </span>
              <span className="h-9 w-px bg-[#A38C70]/40" />
              <span className="font-serif text-2xl sm:text-3xl leading-none whitespace-nowrap text-[#4A301F]">
                {dateParts.day} {dateParts.month}
              </span>
              <span className="h-9 w-px bg-[#A38C70]/40" />
              <span className="uppercase tracking-[0.3em] text-[11px] sm:text-xs">
                {dateParts.year}
              </span>
            </motion.div>
          ) : null}

          <motion.p variants={fadeIn} className="uppercase tracking-[0.25em] text-sm text-[#A38C70] mt-5">
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

      {/* Countdown */}
      {weddingDateObj && (
        <section className="py-16 px-6 bg-[#F3EEE6] text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto flex flex-col items-center"
          >
            <motion.h2 variants={fadeIn} className="text-[#A38C70] uppercase tracking-[0.3em] text-xs mb-4">
              Cuenta Regresiva
            </motion.h2>
            <motion.div variants={fadeIn} className="text-[#BCAE98] mb-8">
              <WaveDivider className="mx-auto" />
            </motion.div>

            {isFuture ? (
              <motion.div variants={fadeIn} className="flex items-stretch justify-center gap-3 sm:gap-6">
                {[
                  { value: countdown.days, label: "Días" },
                  { value: countdown.hours, label: "Horas" },
                  { value: countdown.minutes, label: "Minutos" },
                  { value: countdown.seconds, label: "Segundos" },
                ].map((unit, i) => (
                  <div key={unit.label} className="flex items-stretch gap-3 sm:gap-6">
                    {i > 0 && <span className="self-center font-serif text-2xl text-[#BCAE98]">:</span>}
                    <div className="flex w-16 sm:w-24 flex-col items-center">
                      <span className="font-serif text-4xl sm:text-6xl leading-none text-[#553927] tabular-nums">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="mt-3 uppercase tracking-[0.2em] text-[10px] sm:text-xs text-[#A38C70]">
                        {unit.label}
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.p variants={fadeIn} className="font-serif text-2xl sm:text-3xl text-[#553927]">
                ¡Hoy celebramos nuestro amor!
              </motion.p>
            )}
          </motion.div>
        </section>
      )}

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
          <h2 className="font-serif text-3xl md:text-4xl text-[#553927] mb-5">{guest.name}</h2>
          <div className="flex justify-center text-[#BCAE98] mb-6">
            <WaveDivider />
          </div>
          <p className="text-[#705B46] leading-relaxed text-lg">
            Será un honor compartir contigo este día tan especial. Después de
            trece años caminando juntos, queremos celebrar a tu lado el comienzo
            de nuestra vida como esposos.
          </p>
        </motion.div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-24 px-6 bg-[#F3EEE6]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={staggerContainer}
          className="max-w-2xl mx-auto text-center space-y-6"
        >
          <motion.h2 variants={fadeIn} className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">
            Nuestra Historia
          </motion.h2>
          <motion.div variants={fadeIn} className="flex justify-center text-[#BCAE98]">
            <WaveDivider />
          </motion.div>

          <motion.figure variants={fadeIn} className="mx-auto max-w-xl pt-2">
            <div className="bg-white p-2 border border-[#BCAE98]/40 shadow-[0_12px_40px_rgba(85,57,39,0.14)]">
              <img
                src={couplePortrait}
                alt="Katheryne y Rainer sonriendo juntos"
                loading="lazy"
                className="w-full h-auto"
              />
            </div>
          </motion.figure>

          <motion.p variants={fadeIn} className="text-[#705B46] leading-relaxed text-lg">
            Hace trece años, el destino quiso que nuestros caminos se cruzaran.
            Desde aquel primer encuentro nos hicimos pareja,
            y así seguimos, juntos, hasta el sol de hoy.
          </motion.p>
          <motion.p variants={fadeIn} className="text-[#705B46] leading-relaxed text-lg">
            Hemos construido una relación sólida, con altos y bajos, a base de
            comprensión y paciencia. Lo mismo hemos cultivado junto a nuestras
            familias, que hoy se unen para celebrar este amor con nosotros.
          </motion.p>
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
          <motion.div variants={fadeIn} className="space-y-6">
            <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">El Programa</h2>
            <div className="flex justify-center text-[#BCAE98]">
              <WaveDivider />
            </div>
            <div className="mx-auto w-full max-w-xs text-left">
              {weddingConfig.ceremonyTime && (
                <>
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#BCAE98] text-[#705B46]">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-serif text-2xl leading-tight text-[#553927]">Ceremonia</p>
                      <p className="text-[#705B46]">{weddingConfig.ceremonyTime}</p>
                    </div>
                  </div>
                  <div className="ml-6 h-10 w-px bg-[#BCAE98]/50" />
                </>
              )}
              <div className="flex items-center gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#BCAE98] text-[#705B46]">
                  <PartyPopper className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-2xl leading-tight text-[#553927]">Recepción</p>
                  <p className="text-[#705B46]">{weddingConfig.receptionTime}</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-5">
            <h2 className="text-[#A38C70] uppercase tracking-[0.25em] text-sm">El Lugar</h2>
            <div className="flex justify-center text-[#BCAE98]">
              <WaveDivider />
            </div>
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
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay={!reduceMotion}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          poster={oceanTexturePoster}
        >
          <source src={oceanTextureVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#553927]/30" />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="relative z-10 text-white font-serif italic text-2xl md:text-4xl text-center px-6 max-w-2xl drop-shadow"
        >
          "Con altos y bajos, como las olas, nuestro amor siempre vuelve a la orilla."
        </motion.p>
      </section>

      {/* Dress code & info */}
      <section className="py-24 px-6 bg-[#F3EEE6]">
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
              <div className="flex justify-center text-[#BCAE98]">
                <WaveDivider />
              </div>
              <p className="font-serif text-xl">{weddingConfig.dressCode}</p>

              {weddingConfig.allowedColors && weddingConfig.allowedColors.length > 0 && (
                <>
                  <p className="text-sm text-[#705B46]">Paleta de colores sugerida</p>
                  <div className="flex flex-wrap justify-center gap-5 mt-2">
                    {weddingConfig.allowedColors.map((color, i) => (
                      <div
                        key={i}
                        className="h-12 w-12 rounded-full border border-black/5 shadow-sm ring-1 ring-[#BCAE98]/40 ring-offset-2 ring-offset-[#F3EEE6]"
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
              <div
                className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                  guest.rsvpStatus === "confirmed"
                    ? "bg-[#553927] text-white"
                    : "bg-[#D9D3C5] text-[#705B46]"
                }`}
              >
                {guest.rsvpStatus === "confirmed" ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Heart className="h-6 w-6" />
                )}
              </div>
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
        <div className="text-[#BCAE98] mb-8">
          <WaveDivider />
        </div>
        <h3 className="font-serif text-4xl mb-3 text-[#FAF9F6]">
          {weddingConfig.brideName} <span className="italic text-[#BCAE98]">&amp;</span> {weddingConfig.groomName}
        </h3>
        {dateParts && (
          <p className="uppercase tracking-[0.3em] text-[11px] text-[#D9D3C5]/70 mb-12">
            {dateParts.day} · {dateParts.month} · {dateParts.year}
          </p>
        )}

        <div className="bg-[#FAF9F6] p-4 shadow-xl mb-6">
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
    </MotionConfig>
  );
}
