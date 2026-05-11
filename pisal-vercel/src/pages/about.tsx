import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck, Star, Award, Users, Heart } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const TEAM = [
  {
    name: "Brijesh",
    role: "Founder & CEO · Tech Head",
    initials: "BR",
    color: "from-red-600 to-rose-800",
    photo: `${import.meta.env.BASE_URL}images/brijesh.png`,
    description: "Visionary leader driving PISAL's mission to bring premium spices to every Indian kitchen through technology and innovation.",
  },
  {
    name: "Durgesh",
    role: "Finance Management",
    initials: "DU",
    color: "from-amber-600 to-yellow-700",
    photo: `${import.meta.env.BASE_URL}images/durgesh.png`,
    description: "Ensures financial health and sustainable growth, managing resources to fuel PISAL's expansion across India.",
  },
  {
    name: "Krish",
    role: "Social Media Manager",
    initials: "KR",
    color: "from-green-600 to-emerald-700",
    photo: `${import.meta.env.BASE_URL}images/krish.png`,
    description: "Crafts engaging content and builds the PISAL community online, making spice culture exciting for a new generation.",
  },
  {
    name: "Ananya",
    role: "System Management",
    initials: "AN",
    color: "from-teal-600 to-cyan-700",
    photo: `${import.meta.env.BASE_URL}images/ananya.png`,
    description: "Keeps our digital backbone running smoothly, ensuring every order and operation flows without a hitch.",
  },
  {
    name: "Salander",
    role: "Marketing Management",
    initials: "SA",
    color: "from-orange-600 to-amber-700",
    photo: `${import.meta.env.BASE_URL}images/salander.png`,
    description: "Executes powerful marketing campaigns that amplify the PISAL brand and drive customer engagement across channels.",
  },
  {
    name: "Shivam",
    role: "Field Officer",
    initials: "SH",
    color: "from-red-700 to-pink-800",
    photo: `${import.meta.env.BASE_URL}images/shivam.png`,
    description: "Our boots on the ground, building relationships with farmers and partners to source the finest quality spices.",
  },
  {
    name: "Pankaj",
    role: "Product Management",
    initials: "PA",
    color: "from-indigo-600 to-blue-800",
    photo: `${import.meta.env.BASE_URL}images/pankaj.png`,
    description: "Manages end-to-end product lifecycle, from sourcing to packaging, ensuring PISAL quality in every batch.",
  },
];

const VALUES = [
  { icon: Leaf, title: "100% Natural", description: "No artificial colors, preservatives, or additives. Just pure, authentic flavors." },
  { icon: ShieldCheck, title: "Premium Quality", description: "Hand-picked from the finest farms, tested for purity and potency." },
  { icon: Star, title: "Authentic Taste", description: "Traditional recipes and processing methods that preserve original flavors." },
  { icon: Heart, title: "Customer First", description: "Every decision we make is guided by the satisfaction of our customers." },
];

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-secondary py-24 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern-bg.png)`, backgroundSize: "350px" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary/80" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white">
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="uppercase tracking-[0.35em] text-xs font-semibold text-accent block mb-5"
          >
            Our Story
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-bold mb-6 leading-tight"
          >
            The Pure Taste<br />of India
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            PISAL was born from a deep love for Indian cuisine and a commitment to preserving the authentic flavors that define our culinary heritage.
          </motion.p>
        </div>
      </section>

      {/* Brand story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="uppercase tracking-[0.3em] text-xs font-semibold text-primary block mb-4">Why PISAL?</span>
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6 text-foreground leading-snug">
                From Farm to Your Kitchen — Pure & Uncompromised
              </h2>
              <p className="text-muted-foreground mb-5 leading-relaxed">
                At PISAL, we believe that great food starts with great spices. We work directly with farmers across India's spice-growing regions — from the cardamom hills of Kerala to the chili fields of Rajasthan — to source only the finest produce.
              </p>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Our processing is minimal and careful, preserving the essential oils and compounds that give each spice its distinctive aroma and taste. No shortcuts. No compromises. Just the pure taste of India.
              </p>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-3xl font-serif font-bold text-primary">50+</p>
                  <p className="text-sm text-muted-foreground mt-1">Products</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-serif font-bold text-primary">10k+</p>
                  <p className="text-sm text-muted-foreground mt-1">Happy Customers</p>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <p className="text-3xl font-serif font-bold text-primary">15+</p>
                  <p className="text-sm text-muted-foreground mt-1">States Served</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="grid grid-cols-2 gap-4"
            >
              {VALUES.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={v.title} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1.5">{v.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.description}</p>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="uppercase tracking-[0.3em] text-xs font-semibold text-primary block mb-3"
            >
              The People Behind PISAL
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="text-3xl md:text-4xl font-serif font-bold text-foreground"
            >
              Meet Our Team
            </motion.h2>
            <motion.div
              initial={{ width: 0 }} whileInView={{ width: 80 }} viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="h-1 bg-primary mx-auto mt-5 rounded-full"
            />
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="text-muted-foreground mt-5 max-w-xl mx-auto"
            >
              A passionate team of innovators, marketers, and food lovers working together to bring the finest Indian spices to your doorstep.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                className="group bg-card border border-border/50 rounded-3xl p-8 text-center shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-400"
              >
                {/* Avatar */}
                <div className="relative mx-auto mb-6 w-24 h-24">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-24 h-24 rounded-full object-cover object-top shadow-lg group-hover:scale-105 transition-transform duration-300 border-2 border-primary/30"
                    />
                  ) : (
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white text-2xl font-serif font-bold shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                      {member.initials}
                    </div>
                  )}
                  {/* Decorative ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 scale-110 group-hover:border-primary/50 transition-colors duration-300" />
                </div>

                {/* Info */}
                <h3 className="text-xl font-serif font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors duration-200">
                  {member.name}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-4 leading-tight">
                  {member.role}
                </p>
                <div className="w-8 h-0.5 bg-primary/30 mx-auto mb-4 group-hover:w-16 transition-all duration-300" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {member.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Users className="w-12 h-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Join the PISAL Family</h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-xl mx-auto">
              Experience the difference that premium, authentic spices make in your cooking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 h-13 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                <Link href="/products">Shop Now</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-10 h-13 text-base hover:border-primary hover:text-primary transition-colors">
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
