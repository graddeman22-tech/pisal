import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { useSendOtp, useVerifyOtp } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, setToken } = useAppStore();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutate: sendOtp, isPending: isSending } = useSendOtp({
    mutation: {
      onSuccess: () => {
        toast({ title: "OTP Sent", description: "Use any 6-digit code for testing." });
        setStep("otp");
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    }
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOtp({
    mutation: {
      onSuccess: (data) => {
        setToken(data.token);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
        toast({ title: "Welcome to PISAL!", description: "You have successfully logged in." });
        handleClose();
      },
      onError: (err: any) => toast({ title: "Error", description: "Invalid OTP", variant: "destructive" }),
    }
  });

  const handleClose = () => {
    setAuthModalOpen(false);
    setTimeout(() => {
      setStep("phone");
      setPhone("");
      setOtp("");
    }, 300);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast({ title: "Invalid Phone", description: "Enter a valid phone number", variant: "destructive" });
    sendOtp({ data: { phone } });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    verifyOtp({ data: { phone, otp } });
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        <div className="flex flex-col md:flex-row h-full">
          <div className="bg-primary p-8 text-primary-foreground flex flex-col justify-between hidden md:flex md:w-2/5">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-2">PISAL</h2>
              <p className="text-primary-foreground/80 text-sm">Pure Taste of India</p>
            </div>
            <div className="mt-12">
              <p className="text-sm font-medium">Unlock exclusive offers and track your orders.</p>
            </div>
          </div>
          
          <div className="p-8 md:w-3/5 bg-card">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="font-serif text-2xl">{step === "phone" ? "Welcome Back" : "Verify OTP"}</DialogTitle>
              <DialogDescription>
                {step === "phone" ? "Enter your phone number to login or create an account." : `We sent a code to ${phone}`}
              </DialogDescription>
            </DialogHeader>

            <AnimatePresence mode="wait">
              {step === "phone" ? (
                <motion.form 
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOtp} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone Number</label>
                    <Input 
                      type="tel" 
                      placeholder="e.g. 9876543210" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="h-12 rounded-xl bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all" disabled={isSending || phone.length < 10}>
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
                  </Button>
                </motion.form>
              ) : (
                <motion.form 
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Enter OTP</label>
                    <Input 
                      type="text" 
                      placeholder="Enter any 6 digits" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="h-12 rounded-xl text-center tracking-[0.5em] font-bold text-lg bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 transition-all" disabled={isVerifying || otp.length < 4}>
                    {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Login"}
                  </Button>
                  <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-2 text-center">
                    Change phone number
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
