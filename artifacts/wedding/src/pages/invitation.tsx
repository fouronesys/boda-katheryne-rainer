import { useParams } from "wouter";
import { useGetInvitation, useUpdateRsvp } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Invitation() {
  const { token } = useParams<{ token: string }>();
  const { data: invitation, isLoading, error } = useGetInvitation(token || "", {
    query: { enabled: !!token }
  });
  const updateRsvp = useUpdateRsvp();
  const { toast } = useToast();

  const [plusOneName, setPlusOneName] = useState("");
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-[#A38C70] tracking-widest uppercase text-sm animate-pulse">
          Opening...
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-serif text-[#553927] mb-2">Invitation Not Found</h2>
          <p className="text-[#705B46]">We couldn't find your invitation. Please check the link and try again.</p>
        </div>
      </div>
    );
  }

  const { guest, weddingConfig } = invitation;
  const isRSVPd = guest.rsvpStatus === "confirmed" || guest.rsvpStatus === "declined";

  const handleRsvp = (status: "confirmed" | "declined") => {
    updateRsvp.mutate({
      token: token as string,
      data: {
        rsvpStatus: status,
        ...(guest.plusOne && plusOneName ? { plusOneName } : {})
      }
    }, {
      onSuccess: () => {
        toast({ 
          title: status === "confirmed" ? "We can't wait to see you!" : "We'll miss you!",
          description: "Your RSVP has been saved."
        });
      }
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const formattedDate = weddingConfig.weddingDate 
    ? format(parseISO(weddingConfig.weddingDate), "EEEE, MMMM do, yyyy")
    : "";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#553927] font-sans selection:bg-[#BCAE98] selection:text-white">
      {/* Hero Section */}
      <section className="min-h-[100svh] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#705B46 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center z-10 max-w-3xl mx-auto flex flex-col items-center"
        >
          <motion.p variants={fadeIn} className="uppercase tracking-[0.3em] text-xs text-[#A38C70] mb-8">
            Together with their families
          </motion.p>
          
          <motion.h1 variants={fadeIn} className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] text-[#553927] mb-8">
            {weddingConfig.brideName} <br/> <span className="text-[#BCAE98] font-light italic">&amp;</span> <br/> {weddingConfig.groomName}
          </motion.h1>
          
          <motion.div variants={fadeIn} className="w-px h-16 bg-[#BCAE98] my-8" />
          
          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-[#705B46] font-serif mb-2">
            {formattedDate}
          </motion.p>
          <motion.p variants={fadeIn} className="uppercase tracking-widest text-sm text-[#A38C70]">
            {weddingConfig.venue}
          </motion.p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[#BCAE98] animate-bounce"
        >
          <div className="w-px h-12 bg-gradient-to-b from-[#BCAE98] to-transparent" />
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
            <h2 className="text-[#A38C70] uppercase tracking-[0.2em] text-sm">The Schedule</h2>
            <div className="font-serif text-2xl space-y-2">
              <p>Ceremony at {weddingConfig.ceremonyTime}</p>
              <p>Reception at {weddingConfig.receptionTime}</p>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="space-y-4">
            <h2 className="text-[#A38C70] uppercase tracking-[0.2em] text-sm">The Venue</h2>
            <div className="font-serif text-2xl">
              <p>{weddingConfig.venue}</p>
              <p className="text-lg text-[#705B46] mt-2 whitespace-pre-line">{weddingConfig.venueAddress}</p>
            </div>
          </motion.div>

          {weddingConfig.dressCode && (
            <motion.div variants={fadeIn} className="space-y-6">
              <h2 className="text-[#A38C70] uppercase tracking-[0.2em] text-sm">Dress Code</h2>
              <p className="font-serif text-xl">{weddingConfig.dressCode}</p>
              
              {weddingConfig.allowedColors && weddingConfig.allowedColors.length > 0 && (
                <div className="flex justify-center gap-4 mt-6">
                  {weddingConfig.allowedColors.map((color, i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full shadow-sm border border-black/5" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {weddingConfig.additionalInfo && (
            <motion.div variants={fadeIn} className="space-y-4">
              <h2 className="text-[#A38C70] uppercase tracking-[0.2em] text-sm">Details</h2>
              <p className="text-[#705B46] leading-relaxed max-w-xl mx-auto whitespace-pre-line">
                {weddingConfig.additionalInfo}
              </p>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* RSVP Section */}
      <section className="py-24 px-6 bg-[#D9D3C5]/20">
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

          <h2 className="font-serif text-3xl md:text-4xl mb-2 text-[#553927]">Répondez</h2>
          <p className="text-[#705B46] mb-8 italic font-serif">S'il vous plaît</p>

          <p className="text-xl font-medium mb-6">Dear {guest.name},</p>

          {!isRSVPd ? (
            <div className="space-y-8">
              {guest.plusOne && (
                <div className="space-y-3 max-w-xs mx-auto text-left">
                  <Label htmlFor="plusOneName" className="text-[#705B46]">Guest Name (Optional)</Label>
                  <Input 
                    id="plusOneName" 
                    placeholder="Enter their full name" 
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
                  className="bg-[#553927] hover:bg-[#705B46] text-white rounded-none px-8 py-6 h-auto text-lg uppercase tracking-widest text-xs"
                >
                  Joyfully Accept
                </Button>
                <Button 
                  onClick={() => handleRsvp("declined")}
                  disabled={updateRsvp.isPending}
                  variant="outline"
                  className="border-[#BCAE98] text-[#553927] hover:bg-[#FAF9F6] rounded-none px-8 py-6 h-auto text-lg uppercase tracking-widest text-xs"
                >
                  Regretfully Decline
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
                  ? "We are overjoyed you will be joining us." 
                  : "We will miss you dearly."}
              </p>
              <Button 
                variant="link" 
                onClick={() => handleRsvp(guest.rsvpStatus === "confirmed" ? "pending" : "pending")} // just reset to pending to allow re-rsvp, but api might not allow pending directly via updateRsvp since types only allow confirmed/declined usually? Wait, api-zod has RsvpUpdateRsvpStatus which is pending/confirmed/declined.
                className="text-[#A38C70] hover:text-[#553927]"
              >
                Change Reply
              </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Footer & QR */}
      <footer className="py-24 px-6 flex flex-col items-center bg-[#553927] text-[#FAF9F6]">
        <h3 className="font-serif text-3xl mb-12 opacity-80">K & R</h3>
        
        <div className="bg-[#FAF9F6] p-4 shadow-xl mb-12">
          <QRCodeSVG 
            value={window.location.href}
            size={160}
            fgColor="#553927"
            bgColor="#FAF9F6"
          />
        </div>
        <p className="text-sm uppercase tracking-[0.2em] opacity-60">Your Digital Pass</p>
      </footer>
    </div>
  );
}
