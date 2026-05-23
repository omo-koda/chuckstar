import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, useScroll, useTransform } from "framer-motion";
import Tilt from "react-parallax-tilt";
import CountUp from "react-countup";
import {
  Sparkles, Flame, Shield, Star, Trophy, Users, Calendar, TrendingUp, Gem,
  ChevronRight, Mail, MapPin, Phone, Instagram, Twitter, Youtube, Menu,
  ShoppingCart, Search, Award, Clock, Heart, Eye, Package, ChevronUp,
  Quote, CheckCircle, CreditCard, Gift, ArrowRight, Lock, FileCheck,
  BarChart3, Truck, CircleDot, LogOut, Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import { getLandingData, getLiveStats, heartbeatPresence, incrementView } from "@/lib/landing.functions";
import { getCart, addToCart, getMyLikes, toggleLike } from "@/lib/cart.functions";
import { useAuth } from "@/hooks/use-auth";
import { CountdownTimer, useInView, getSessionId, useAdaptiveNeon, useWakeLockWhileVisible, haptic } from "@/components/landing/_utils";
import { NewsletterForm } from "@/components/landing/NewsletterForm";
import { ContactForm } from "@/components/landing/ContactForm";

const landingQuery = queryOptions({
  queryKey: ["landing"],
  queryFn: () => getLandingData(),
});
const statsQuery = queryOptions({
  queryKey: ["live-stats"],
  queryFn: () => getLiveStats(),
  refetchInterval: 15_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(landingQuery),
  component: Home,
});

const ICONS: Record<string, JSX.Element> = {
  flame: <Flame className="w-5 h-5" />, shield: <Shield className="w-5 h-5" />,
  gem: <Gem className="w-5 h-5" />, trophy: <Trophy className="w-5 h-5" />,
};

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Categories", href: "#categories" },
  { label: "Featured", href: "#featured" },
  { label: "How It Works", href: "#howitworks" },
  { label: "Events", href: "#events" },
  { label: "Contact", href: "#contact" },
];

const TRUST = [
  { name: "PSA Verified", icon: <FileCheck className="w-5 h-5" /> },
  { name: "BGS Grading", icon: <Award className="w-5 h-5" /> },
  { name: "CGC Authentic", icon: <Shield className="w-5 h-5" /> },
  { name: "TCGPlayer", icon: <TrendingUp className="w-5 h-5" /> },
  { name: "Beckett", icon: <Star className="w-5 h-5" /> },
];

const HOW_STEPS = [
  { step: "01", icon: <Search className="w-8 h-8" />, title: "Browse", description: "Explore 50,000+ authenticated collectibles across TCG, sports, and tabletop categories." },
  { step: "02", icon: <FileCheck className="w-8 h-8" />, title: "Authenticate", description: "Every item is verified by our experts. PSA, BGS & CGC graded options available." },
  { step: "03", icon: <CreditCard className="w-8 h-8" />, title: "Buy or Sell", description: "Secure escrow payments. Instant purchase or list your own items in minutes." },
  { step: "04", icon: <Truck className="w-8 h-8" />, title: "Vault or Ship", description: "Free insured shipping or store in our climate-controlled vault with full insurance." },
];

const SERVICES = [
  { icon: <Search className="w-8 h-8" />, title: "Card Grading", description: "Professional PSA, BGS & CGC grading services for your valuable cards." },
  { icon: <Shield className="w-8 h-8" />, title: "Authentication", description: "Expert verification to ensure every item in our marketplace is 100% authentic." },
  { icon: <TrendingUp className="w-8 h-8" />, title: "Price Tracking", description: "Real-time market data and price history for smart collecting decisions." },
  { icon: <Package className="w-8 h-8" />, title: "Secure Vault", description: "Climate-controlled storage and insurance for your high-value collectibles." },
  { icon: <Users className="w-8 h-8" />, title: "Community Hub", description: "Connect with fellow collectors, trade, and share your passion." },
  { icon: <Award className="w-8 h-8" />, title: "Live Auctions", description: "Weekly live auctions featuring rare and exclusive collectibles." },
];

const SECURITY_BADGES = [
  { icon: <Lock className="w-5 h-5" />, label: "SSL Encrypted" },
  { icon: <FileCheck className="w-5 h-5" />, label: "PSA Verified" },
  { icon: <Shield className="w-5 h-5" />, label: "Escrow Protected" },
  { icon: <CreditCard className="w-5 h-5" />, label: "Stripe-ready" },
];

type Collectible = {
  id: string; slug: string; name: string; category: string;
  price_cents: number; image_url: string | null;
  badge: string | null; badge_color: string | null;
  views: number; likes: number; remaining: number; total: number;
  end_time: string | null;
};

function Home() {
  const { data } = useSuspenseQuery(landingQuery);
  const { data: stats } = useQuery(statsQuery);
  const { user, signOut } = useAuth();
  const qc = useQueryClient();

  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Collectible | null>(null);

  useAdaptiveNeon();

  // Hero parallax via framer-motion scroll
  const heroRef = useRef<HTMLElement | null>(null);
  useWakeLockWhileVisible(heroRef);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.3]);

  // Presence heartbeat
  const beat = useServerFn(heartbeatPresence);
  useEffect(() => {
    const sid = getSessionId();
    beat({ data: { sessionId: sid } }).catch(() => {});
    const id = setInterval(() => beat({ data: { sessionId: sid } }).catch(() => {}), 30_000);
    return () => clearInterval(id);
  }, [beat]);

  // Scroll listeners
  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 50); setShowTop(window.scrollY > 500); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auth-backed cart + likes
  const cartQ = useQuery({ queryKey: ["cart"], queryFn: () => getCart(), enabled: !!user });
  const likesQ = useQuery({ queryKey: ["likes"], queryFn: () => getMyLikes(), enabled: !!user });
  const addCartFn = useServerFn(addToCart);
  const toggleLikeFn = useServerFn(toggleLike);
  const incView = useServerFn(incrementView);

  // Cross-tab cart sync
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
    const bc = new BroadcastChannel("cart");
    bc.onmessage = () => qc.invalidateQueries({ queryKey: ["cart"] });
    return () => bc.close();
  }, [qc]);

  const addM = useMutation({
    mutationFn: (id: string) => addCartFn({ data: { collectibleId: id } }),
    onSuccess: () => {
      haptic(); toast.success("Added to cart");
      qc.invalidateQueries({ queryKey: ["cart"] });
      if (typeof BroadcastChannel !== "undefined") new BroadcastChannel("cart").postMessage("update");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not add"),
  });
  const likeM = useMutation({
    mutationFn: (id: string) => toggleLikeFn({ data: { collectibleId: id } }),
    onSuccess: () => { haptic(); qc.invalidateQueries({ queryKey: ["likes"] }); qc.invalidateQueries({ queryKey: ["landing"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Could not like"),
  });

  const requireAuth = (cb: () => void) => {
    if (!user) { toast.info("Sign in to continue", { description: "Create a free account in seconds." }); return; }
    cb();
  };

  const openItem = (it: Collectible) => {
    setSelected(it);
    const key = `cv_view_${it.id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, "1");
      incView({ data: { id: it.id } }).catch(() => {});
    }
  };

  const shareItem = async (it: Collectible) => {
    const url = `${window.location.origin}/#featured`;
    if ("share" in navigator) {
      try { await (navigator as any).share({ title: it.name, text: `Check out ${it.name} on Clicker Verse`, url }); }
      catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  const cartCount = cartQ.data?.items.length ?? 0;
  const likedSet = new Set(likesQ.data?.ids ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Promo banner */}
      {bannerVisible && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-rajdhani font-semibold">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Limited Launch Offer:</span>
            <span>First 500 members get <strong>FREE GRADING</strong> on orders over $500</span>
            <button onClick={() => setBannerVisible(false)} className="ml-3 opacity-70 hover:opacity-100" aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-500 ${bannerVisible ? "top-8" : "top-0"} ${scrolled ? "nav-blur py-3 shadow-lg shadow-primary/10" : "bg-transparent py-5"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="Clicker Verse" className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold tracking-wider">CLICKER <span className="text-primary">VERSE</span></h1>
              <p className="text-[10px] font-rajdhani tracking-[0.3em] text-accent uppercase">Collectibles</p>
            </div>
          </a>

          <div className="hidden lg:flex items-center gap-1">
            {NAV.map((l) => (
              <a key={l.href} href={l.href} className="px-4 py-2 text-sm font-rajdhani font-semibold text-muted-foreground hover:text-primary transition-colors relative group">
                {l.label}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-accent group-hover:w-full group-hover:left-0 transition-all duration-300" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-1.5 text-xs font-rajdhani">
                <CircleDot className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span className="text-muted-foreground">{stats?.online ?? 0} online</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-rajdhani">
                <CircleDot className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="text-muted-foreground">{stats?.auctions ?? 0} auctions</span>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary hover:bg-primary/10 relative">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center font-bold text-primary-foreground">{cartCount}</span>
              )}
            </Button>

            {user ? (
              <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-primary"><LogOut className="w-5 h-5" /></Button>
            ) : (
              <Link to="/login" className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-md text-sm font-rajdhani font-semibold text-primary hover:bg-primary/10">Sign in</Link>
            )}

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-primary/20 w-80">
                <div className="flex flex-col gap-6 mt-8">
                  {NAV.map((l) => (
                    <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-xl font-display text-muted-foreground hover:text-primary flex items-center gap-3">
                      <ChevronRight className="w-4 h-4 text-primary" />{l.label}
                    </a>
                  ))}
                  {!user && <Link to="/login" onClick={() => setMenuOpen(false)} className="text-xl font-display text-primary">Sign in</Link>}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="absolute inset-0">
          <video autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover" poster="/hero-bg.jpg">
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="hero-overlay absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
        </motion.div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-primary/40 rounded-full animate-stars"
              style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, animationDuration: `${2+Math.random()*3}s` }} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-24">
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-rajdhani">Trusted by <strong>25,000+</strong> Collectors</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-rajdhani">Every Item <strong>Authenticated</strong></span>
            </div>
          </div>

          <div className="animate-float mb-8">
            <img src="/logo.png" alt="Clicker Verse Collectibles" className="w-40 h-40 sm:w-56 sm:h-56 mx-auto drop-shadow-[0_0_30px_var(--neon-purple)]" />
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span>OWN THE RAREST.</span><br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent glow-text hover-rgb-split inline-block">TRADE WITH CONFIDENCE.</span>
          </h1>

          <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-rajdhani leading-relaxed">
            Join 25,000+ collectors in the ultimate universe for Pokémon, Yu-Gi-Oh!, D&D, sports cards & more.
            Every item authenticated. Every deal protected.
          </p>

          <div className="flex items-center justify-center gap-4 sm:gap-6 mb-10 flex-wrap">
            {TRUST.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/70 hover:text-foreground transition-colors">
                {t.icon}<span className="text-xs font-rajdhani font-semibold tracking-wider uppercase hidden sm:inline">{t.name}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => { haptic(); document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" }); }}
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 font-display font-bold px-8 py-6 text-lg shadow-glow-lg animate-pulse-glow relative overflow-hidden">
              <span className="absolute inset-0 prism opacity-50 mix-blend-overlay pointer-events-none" />
              <Sparkles className="w-5 h-5 mr-2" />Browse Collection
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("events")?.scrollIntoView({ behavior: "smooth" })}
              className="border-accent/50 text-accent hover:bg-accent/10 font-display font-bold px-8 py-6 text-lg group">
              <TrendingUp className="w-5 h-5 mr-2" />Join Live Auctions <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: 50000, suffix: "+", label: "Collectibles" },
              { value: 25000, suffix: "+", label: "Collectors" },
              { value: 2, prefix: "$", suffix: "M+", label: "Volume Traded" },
              { value: 99.8, suffix: "%", label: "Trust Score" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {stat.prefix}<CountUp end={stat.value} decimals={stat.value < 1 ? 1 : 0} duration={2.5} suffix={stat.suffix} />
                </div>
                <div className="text-muted-foreground text-sm font-rajdhani uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <Section id="categories" eyebrow="Browse by Category" title={<>YOUR <span className="text-primary">UNIVERSE</span></>} subtitle="From trading cards to tabletop games, find your next prized possession">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.03} transitionSpeed={400} className="rounded-xl h-full">
                <Card className="group relative overflow-hidden bg-transparent border-primary/20 hover:border-primary/50 transition-all duration-500 cursor-pointer h-full clay">
                  <div className="absolute inset-0">
                    {cat.image_url && <img src={cat.image_url} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                  </div>
                  <CardContent className="relative z-10 p-6 flex flex-col items-center text-center min-h-[360px] justify-end">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient ?? "from-primary to-accent"} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      {ICONS[cat.icon_key ?? "flame"] ?? <Sparkles className="w-5 h-5" />}
                    </div>
                    <h3 className="font-display text-lg font-bold mb-1">{cat.title}</h3>
                    <p className="text-muted-foreground text-sm font-rajdhani mb-2">{cat.subtitle}</p>
                    <Badge variant="outline" className="border-accent/30 text-accent font-rajdhani">{cat.item_count}</Badge>
                  </CardContent>
                </Card>
              </Tilt>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FEATURED */}
      <Section id="featured" eyebrow="Trending Now" title={<>FEATURED <span className="text-accent">DROPS</span></>} subtitle={undefined}
        right={<div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-rajdhani"><CircleDot className="w-3 h-3 text-amber-400 animate-pulse" />{stats?.auctions ?? 0} auctions live</div>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.featured.map((item, i) => {
            const it = item as Collectible;
            const liked = likedSet.has(it.id);
            return (
              <motion.div key={it.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="group glass overflow-hidden hover:shadow-glow transition-all duration-500 cursor-pointer" onClick={() => openItem(it)}>
                  <div className="relative overflow-hidden aspect-[3/4]">
                    {it.image_url && <img src={it.image_url} alt={it.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />}
                    <div className="absolute top-4 left-4">
                      <Badge className={`${it.badge_color ?? "bg-primary/20 text-primary border-primary/30"} font-rajdhani font-semibold relative overflow-hidden`}>
                        <span className="absolute inset-0 prism opacity-40 mix-blend-overlay" />{it.badge}
                      </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-background/60 px-2 py-1 rounded-full"><Eye className="w-3 h-3" /> {it.views}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground bg-background/60 px-2 py-1 rounded-full"><Heart className="w-3 h-3" /> {it.likes}</span>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground text-sm font-rajdhani">{it.category}</p>
                      <CountdownTimer target={it.end_time} />
                    </div>
                    <h3 className="font-display text-lg font-bold">{it.name}</h3>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-rajdhani">
                        <span className="text-amber-400 font-semibold">{it.remaining} of {it.total} remaining</span>
                        <span className="text-muted-foreground">{Math.round((it.remaining / Math.max(it.total, 1)) * 100)}% left</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-destructive rounded-full transition-all" style={{ width: `${(it.remaining / Math.max(it.total, 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xl font-bold text-accent font-display">${(it.price_cents / 100).toLocaleString()}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); requireAuth(() => likeM.mutate(it.id)); }}
                          className={liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}>
                          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                        </Button>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); requireAuth(() => addM.mutate(it.id)); }}
                          className="bg-primary hover:bg-primary/85 font-rajdhani font-bold">
                          <ShoppingCart className="w-4 h-4 mr-1" />Add
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section id="howitworks" eyebrow="Simple Process" title={<>HOW IT <span className="text-accent">WORKS</span></>} subtitle="Four simple steps to start collecting with confidence">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_STEPS.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="relative">
              {i < 3 && <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-primary/30 to-accent/30 -z-10" />}
              <Card className="glass p-6 text-center hover:shadow-glow transition-all duration-300 group h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-4 text-primary group-hover:text-accent transition-colors">
                  {s.icon}
                </div>
                <span className="font-display text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3 block">{s.step}</span>
                <h3 className="font-display text-lg font-bold mb-3">{s.title}</h3>
                <p className="text-muted-foreground font-rajdhani leading-relaxed text-sm">{s.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section eyebrow="Community Love" title={<>COLLECTORS <span className="text-primary">TRUST US</span></>} subtitle="Real stories from real collectors in our community">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {data.testimonials.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="glass p-6 hover:shadow-glow transition-all duration-300 relative h-full">
                <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
                <div className="flex items-center gap-4 mb-4">
                  {t.avatar_url && <img src={t.avatar_url} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/30" loading="lazy" />}
                  <div>
                    <h4 className="font-display text-sm font-bold">{t.name}</h4>
                    <p className="text-muted-foreground text-xs font-rajdhani">{t.role}</p>
                  </div>
                </div>
                <p className="text-foreground/85 font-rajdhani text-sm leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">{Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                  {t.result && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-rajdhani text-xs"><TrendingUp className="w-3 h-3 mr-1" />{t.result}</Badge>}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* SERVICES — bento */}
      <Section id="about" eyebrow="Why Choose Us" title={<>THE <span className="text-primary">CLICKER VERSE</span> DIFFERENCE</>} subtitle="We built the most trusted collectibles ecosystem for enthusiasts worldwide">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <Card key={i} className="glass p-6 hover:shadow-glow transition-all duration-300 group">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-5 text-primary group-hover:text-accent transition-colors">{s.icon}</div>
              <h3 className="font-display text-lg font-bold mb-3">{s.title}</h3>
              <p className="text-muted-foreground font-rajdhani leading-relaxed">{s.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
          {SECURITY_BADGES.map((b, i) => (
            <div key={i} className="flex items-center gap-2 text-muted-foreground bg-white/5 rounded-lg px-4 py-2 border border-white/5">
              {b.icon}<span className="text-xs font-rajdhani font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* EVENTS */}
      <Section id="events" eyebrow="Community Events" title={<>UPCOMING <span className="text-accent">EVENTS</span></>} subtitle="Meet fellow collectors, compete in tournaments, and discover rare finds">
        <div className="space-y-6 max-w-4xl mx-auto">
          {data.events.map((evt, i) => (
            <motion.div key={evt.id} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Card className="glass p-6 hover:shadow-glow-cyan transition-all duration-300 group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex flex-col items-center justify-center shrink-0">
                    <Calendar className="w-6 h-6 text-primary mb-1" />
                    <span className="text-xs font-rajdhani text-accent font-bold">2026</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-display text-xl font-bold group-hover:text-primary transition-colors">{evt.title}</h3>
                      <Badge className="bg-primary/10 text-primary border-primary/30 font-rajdhani text-xs">{evt.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground font-rajdhani">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-accent" />{evt.event_date}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary" />{evt.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4 text-accent" />{evt.attendees}</span>
                    </div>
                  </div>
                  <Button onClick={() => toast.info("Registration opens soon", { description: "We'll email you when it goes live." })}
                    className="shrink-0 bg-gradient-to-r from-primary to-accent hover:opacity-90 font-display font-bold">Register</Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* NEWSLETTER */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/30 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass rounded-2xl p-8 sm:p-16">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-6 font-rajdhani"><Gift className="w-3 h-3 mr-1" />Free Gift Inside</Badge>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">JOIN THE <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">VERSE</span></h2>
            <p className="text-muted-foreground font-rajdhani text-lg mb-4 max-w-xl mx-auto">Subscribe for exclusive drops, early access to rare items, grading discounts, and community event invitations.</p>
            <div className="bg-gradient-to-r from-amber-500/10 to-primary/10 rounded-xl p-4 mb-8 border border-amber-500/20 max-w-lg mx-auto">
              <div className="flex items-center gap-3 text-left">
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0"><BarChart3 className="w-6 h-6 text-amber-400" /></div>
                <div>
                  <p className="font-rajdhani font-bold text-sm">Free 2026 Rare Card Price Guide PDF</p>
                  <p className="text-muted-foreground font-rajdhani text-xs">$49 value — Yours free when you join</p>
                </div>
              </div>
            </div>
            <NewsletterForm />
            <p className="text-muted-foreground/70 text-sm font-rajdhani mt-4">No spam. Unsubscribe anytime. Join 25,000+ collectors.</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <Section id="contact" eyebrow="Get in Touch" title={<>CONTACT <span className="text-primary">US</span></>} subtitle="Real humans, real answers.">
        <ContactForm />
      </Section>

      {/* FOOTER */}
      <footer className="py-16 relative">
        <div className="absolute inset-0 bg-background/95" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="Clicker Verse" className="w-16 h-16 object-contain" />
                <div>
                  <h3 className="font-display text-lg font-bold">CLICKER VERSE</h3>
                  <p className="text-xs font-rajdhani tracking-wider text-primary">COLLECTIBLES</p>
                </div>
              </div>
              <p className="text-muted-foreground font-rajdhani leading-relaxed mb-6">The universe's premier destination for trading cards, tabletop games, and sports memorabilia.</p>
              <div className="flex gap-3">
                {[Instagram, Twitter, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"><Icon className="w-5 h-5" /></a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold mb-6 tracking-wider">QUICK LINKS</h4>
              <ul className="space-y-3">
                {["Shop All", "New Arrivals", "Live Auctions", "Card Grading", "Price Guide"].map((l) => (
                  <li key={l}><a href="#featured" className="text-muted-foreground hover:text-primary transition-colors font-rajdhani flex items-center gap-2"><ChevronRight className="w-3 h-3" />{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold mb-6 tracking-wider">CATEGORIES</h4>
              <ul className="space-y-3">
                {["Pokémon Cards", "Yu-Gi-Oh! Cards", "Magic: The Gathering", "Sports Cards", "D&D & RPG", "Funko Pops"].map((l) => (
                  <li key={l}><a href="#categories" className="text-muted-foreground hover:text-accent transition-colors font-rajdhani flex items-center gap-2"><ChevronRight className="w-3 h-3" />{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold mb-6 tracking-wider">CONTACT US</h4>
              <ul className="space-y-4 font-rajdhani text-muted-foreground">
                <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" /><span>123 Collector's Lane, Suite 400<br />Los Angeles, CA 90015</span></li>
                <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-accent" /><span>(555) 123-4567</span></li>
                <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-primary" /><span>hello@clickerverse.com</span></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8 pb-8 border-b border-primary/10">
            {SECURITY_BADGES.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/70 text-xs font-rajdhani">{b.icon}<span>{b.label}</span></div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground/70 text-sm font-rajdhani">© 2026 Clicker Verse Collectibles. All rights reserved.</p>
            <div className="flex gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <a key={l} href="#" className="text-muted-foreground/70 hover:text-primary text-sm font-rajdhani transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Back to top */}
      {showTop && (
        <button onClick={() => { haptic(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center shadow-glow hover:shadow-glow-lg transition-all hover:scale-110">
          <ChevronUp className="w-6 h-6" />
        </button>
      )}

      {/* Item dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-card border-primary/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{selected?.name}</DialogTitle>
            <DialogDescription className="font-rajdhani text-muted-foreground">{selected?.category}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.image_url && <img src={selected.image_url} alt={selected.name} className="w-full rounded-xl" />}
              <div className="flex items-center justify-between">
                <Badge className={`${selected.badge_color ?? "bg-primary/20 text-primary border-primary/30"} font-rajdhani`}>{selected.badge}</Badge>
                <span className="font-display text-2xl text-accent">${(selected.price_cents / 100).toLocaleString()}</span>
              </div>
              <CountdownTimer target={selected.end_time} />
              <div className="flex gap-3">
                <Button onClick={() => requireAuth(() => addM.mutate(selected.id))} className="flex-1 bg-primary hover:bg-primary/85 font-display font-bold"><ShoppingCart className="w-4 h-4 mr-2" />Add to Cart</Button>
                <Button variant="outline" onClick={() => requireAuth(() => likeM.mutate(selected.id))} className={`border-accent/30 ${likedSet.has(selected.id) ? "text-destructive" : "text-accent"} hover:bg-accent/10`}>
                  <Heart className={`w-4 h-4 ${likedSet.has(selected.id) ? "fill-current" : ""}`} />
                </Button>
                <Button variant="outline" onClick={() => shareItem(selected)} className="border-primary/30 text-primary hover:bg-primary/10"><Share2 className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ id, eyebrow, title, subtitle, children, right }: {
  id?: string; eyebrow: string; title: React.ReactNode; subtitle?: string; children: React.ReactNode; right?: React.ReactNode;
}) {
  const { ref, inView } = useInView();
  return (
    <section id={id} className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div ref={ref} className={`mb-16 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className={right ? "" : "text-center w-full"}>
              <Badge className="bg-primary/10 text-primary border-primary/30 mb-4 font-rajdhani text-sm"><Sparkles className="w-3 h-3 mr-1" />{eyebrow}</Badge>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">{title}</h2>
              {subtitle && <p className="text-muted-foreground font-rajdhani text-lg max-w-xl mx-auto">{subtitle}</p>}
            </div>
            {right}
          </div>
        </div>
        {children}
      </div>
    </section>
  );
}
