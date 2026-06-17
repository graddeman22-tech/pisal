import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle, Send, CheckCircle, Clock, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PHONES = [
  { number: "8953148406", display: "+91 89531 48406", label: "Customer Support" },
  { number: "6391077161", display: "+91 63910 77161", label: "Order Help" },
];
const EMAIL = "contact.pisal@gmail.com";
const WHATSAPP_NUMBERS = [
  { number: "8953148406", display: "+91 89531 48406", label: "Support" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" } }),
};

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
    toast({ title: "Message Sent!", description: "We'll get back to you within 24 hours." });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-secondary py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern-bg.png)`, backgroundSize: "300px" }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="uppercase tracking-[0.3em] text-xs font-semibold text-accent block mb-4"
          >
            We're Here For You
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          >
            Contact PISAL
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/70 text-lg max-w-xl mx-auto"
          >
            Have a question, feedback, or need help with your order? Our team is ready to assist you.
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-serif font-bold mb-2">Get in Touch</h2>
              <p className="text-muted-foreground text-sm">Reach us through any of these channels. We respond quickly!</p>
            </div>

            {/* Phone Cards */}
            {PHONES.map((p, i) => (
              <motion.a
                key={p.number}
                href={`tel:+91${p.number}`}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="flex items-center gap-4 p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{p.label}</p>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{p.display}</p>
                  <p className="text-xs text-primary mt-0.5">Tap to call</p>
                </div>
              </motion.a>
            ))}

            {/* Email */}
            <motion.a
              href={`mailto:${EMAIL}`}
              custom={2}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex items-center gap-4 p-5 bg-card border border-border/50 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Us</p>
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{EMAIL}</p>
                <p className="text-xs text-primary mt-0.5">Tap to email</p>
              </div>
            </motion.a>

            {/* WhatsApp Numbers */}
            <motion.div
              custom={3}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="space-y-3"
            >
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                WhatsApp — Quick Replies!
              </p>
              {WHATSAPP_NUMBERS.map((wa) => (
                <a
                  key={wa.number}
                  href={`https://wa.me/91${wa.number}?text=${encodeURIComponent("Hello PISAL! I need help.")}`}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40 rounded-2xl hover:border-green-400/60 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/25 transition-colors">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.526 5.847L.057 23.945l6.224-1.497A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.814 9.814 0 01-5.006-1.369l-.358-.214-3.717.894.937-3.621-.236-.372A9.82 9.82 0 012.182 12C2.182 6.578 6.578 2.182 12 2.182c5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-green-700/60 dark:text-green-400/60 font-medium uppercase tracking-wider">{wa.label}</p>
                    <p className="font-semibold text-green-700 dark:text-green-400">{wa.display}</p>
                  </div>
                  <span className="text-xs text-green-600 dark:text-green-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Chat →</span>
                </a>
              ))}
            </motion.div>

            {/* Hours */}
            <motion.div
              custom={4}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="p-5 bg-muted/50 border border-border/50 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Support Hours</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Monday – Saturday</span>
                  <span className="font-medium text-foreground">9 AM – 7 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium text-foreground">10 AM – 4 PM</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-card border border-border/50 rounded-3xl p-8 shadow-sm"
            >
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6"
                  >
                    <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </motion.div>
                  <h3 className="text-2xl font-serif font-bold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground max-w-xs">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <Button onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", message: "" }); }} variant="outline" className="mt-8 rounded-xl px-8">Send Another</Button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-serif font-bold mb-2">Send Us a Message</h2>
                  <p className="text-muted-foreground text-sm mb-8">Fill in the form below and we'll respond within 24 hours.</p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Full Name <span className="text-primary">*</span></label>
                        <Input
                          placeholder="Your name"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                          className="h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary focus:bg-background transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Phone Number</label>
                        <Input
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          className="h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary focus:bg-background transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Email Address <span className="text-primary">*</span></label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        className="h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary focus:bg-background transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Message <span className="text-primary">*</span></label>
                      <textarea
                        rows={5}
                        placeholder="How can we help you? Describe your question or issue..."
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none transition-all"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full h-13 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Or reach us instantly on{" "}
                      <a href={`https://wa.me/91${WHATSAPP_NUMBERS[0].number}`} target="_blank" rel="noopener" className="text-green-600 font-medium hover:underline">WhatsApp</a>{" "}
                      or{" "}
                      <a href={`tel:+91${PHONES[0].number}`} className="text-primary font-medium hover:underline">call us directly</a>
                    </p>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
