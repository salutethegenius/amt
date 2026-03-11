import { useState, useEffect, useRef, useActionState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, animate, AnimatePresence } from "framer-motion";
import { bookStrategySession } from "./actions/bookStrategySession";

/* ─── Google Font + Global Styles ──────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --navy:      #0A1628;
      --navy-mid:  #0F2040;
      --accent:    #0066FF;
      --accent-lt: #EBF2FF;
      --surface:   #FFFFFF;
      --muted-bg:  #F5F7FC;
      --border:    #DDE3F0;
      --text:      #1A2340;
      --text-mid:  #3D4F73;
      --text-mute: #6B7A99;
      --font:      'Plus Jakarta Sans', sans-serif;
      --mono:      'DM Mono', monospace;
    }
    html { scroll-behavior: smooth; }
    body { font-family: var(--font); color: var(--text); background: var(--surface); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
    @keyframes pulse-dot { 0%,100%{opacity:.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
    @keyframes drawLine { from{stroke-dashoffset:1000} to{stroke-dashoffset:0} }
    .nav { position:fixed;top:0;left:0;right:0;z-index:100;transition:background .3s,box-shadow .3s; border-bottom:1px solid transparent; }
    .nav.scrolled { background:rgba(255,255,255,.96);backdrop-filter:blur(12px);box-shadow:0 1px 0 var(--border);border-color:var(--border); }
    .nav-inner { max-width:1200px;margin:0 auto;padding:0 32px;height:68px;display:flex;align-items:center;justify-content:space-between; }
    .nav-links { display:flex;gap:32px; }
    .nav-link { font-size:14px;font-weight:500;color:var(--text-mid);text-decoration:none;transition:color .2s; }
    .nav-link:hover { color:var(--navy); }
    .btn-nav { font-size:14px;font-weight:600;color:white;background:var(--accent);border:none;border-radius:8px;padding:9px 20px;cursor:pointer;font-family:var(--font); }
    .dot-grid { background-image:radial-gradient(circle,#c8d3ea 1px,transparent 1px);background-size:28px 28px; }
    ::-webkit-scrollbar{width:6px} ::-webkit-scrollbar-track{background:#f0f2f8} ::-webkit-scrollbar-thumb{background:#b0bcd8;border-radius:3px}
    .section-label { font-size:11.5px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:var(--accent);margin-bottom:14px;font-family:var(--mono); }
  `}</style>
);

/* ─── Spring configs ─────────────────────────────────────────────────────────── */
const SPRING = {
  gentle:  { type: "spring", stiffness: 80,  damping: 20 },
  snappy:  { type: "spring", stiffness: 160, damping: 22 },
  bouncy:  { type: "spring", stiffness: 200, damping: 18 },
  slow:    { type: "spring", stiffness: 50,  damping: 20 },
  card:    { type: "spring", stiffness: 300, damping: 28 },
};

/* ─── Stagger container variants ────────────────────────────────────────────── */
const stagger = (delay = 0.08) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.1 } }
});

const fadeUp = (yOffset = 32) => ({
  hidden:  { opacity: 0, y: yOffset },
  visible: { opacity: 1, y: 0, transition: SPRING.gentle }
});

/* ─── useScrollReveal ───────────────────────────────────────────────────────── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: threshold });
  return [ref, isInView];
}

/* ─── Magnetic Card ─────────────────────────────────────────────────────────── */
function MagneticCard({ children, style, className }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-60, 60], [4, -4]), SPRING.card);
  const rotY = useSpring(useTransform(x, [-60, 60], [-4, 4]), SPRING.card);
  const scale = useSpring(1, SPRING.card);

  const handleMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleLeave = () => { x.set(0); y.set(0); scale.set(1); };
  const handleEnter = () => scale.set(1.025);

  return (
    <motion.div
      style={{ rotateX: rotX, rotateY: rotY, scale, transformStyle: "preserve-3d", ...style }}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onMouseEnter={handleEnter}
    >
      {children}
    </motion.div>
  );
}

/* ─── Animated Counter ──────────────────────────────────────────────────────── */
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(0, to, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => setVal(Math.round(v))
    });
    return ctrl.stop;
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ─── Nav ────────────────────────────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
        {/* Logo: Concept 01 — Platform Stack */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.snappy, delay: 0.1 }}
        >
          <svg width="190" height="36" viewBox="0 0 220 40" fill="none">
            <rect x="0"  y="0"  width="36" height="9"  rx="2.5" fill="#0A1628"/>
            <rect x="0"  y="14" width="28" height="9"  rx="2.5" fill="#0066FF"/>
            <rect x="0"  y="28" width="18" height="9"  rx="2.5" fill="#0A1628" opacity="0.35"/>
            <text x="48" y="28" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="21" fontWeight="800" fill="#0A1628" letterSpacing="-0.6">Kemis<tspan fill="#0066FF">Digital</tspan></text>
          </svg>
        </motion.div>

        <motion.div
          className="nav-links"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.snappy, delay: 0.2 }}
        >
          {["Services", "Ecosystem", "How We Work", "Case Studies"].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="nav-link">{l}</a>
          ))}
        </motion.div>

        <motion.button
          className="btn-nav"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING.bouncy, delay: 0.3 }}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,102,255,0.35)" }}
          whileTap={{ scale: 0.97 }}
          onClick={() => document.getElementById("book-session")?.scrollIntoView({ behavior: "smooth" })}
        >
          Book a Call
        </motion.button>
      </div>
    </nav>
  );
}

/* ─── Hero Product Mockup ────────────────────────────────────────────────────── */
const HERO_DASHBOARDS = [
  {
    src: "/screencapture-urbannassaurides-admin-2026-03-11-11_37_32.png",
    alt: "Urban Nassau admin dashboard preview",
  },
  {
    src: "/screencapture-localsquares-vercel-app-me-2026-03-11-11_40_16.png",
    alt: "Localsquares customer dashboard preview",
  },
  {
    src: "/screencapture-krmdesk-dashboard-2026-03-11-11_38_45.png",
    alt: "KRM relationship management dashboard preview",
  },
];

function ProductMockup() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (HERO_DASHBOARDS.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_DASHBOARDS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const current = HERO_DASHBOARDS[index];

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        border: "1px solid var(--border)",
        boxShadow:
          "0 32px 80px rgba(10,22,40,0.14), 0 8px 24px rgba(10,22,40,0.06)",
        overflow: "hidden",
        width: "100%",
        maxWidth: "520px",
      }}
    >
      <div
        style={{
          background: "var(--navy)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c, i) => (
          <div
            key={i}
            style={{ width: 11, height: 11, borderRadius: "50%", background: c }}
          />
        ))}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.1)",
              borderRadius: "5px",
              padding: "3px 12px",
              fontSize: "11px",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--mono)",
            }}
          >
            KemisDigital Platforms
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          background: "var(--navy)",
          padding: "16px",
        }}
      >
        <div
          style={{
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid rgba(15,32,64,0.8)",
            boxShadow:
              "0 22px 60px rgba(10,22,40,0.7), 0 10px 26px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxHeight: "420px",
              minHeight: "260px",
              background:
                "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 55%), #020617",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={current.src}
                src={current.src}
                alt={current.alt}
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </AnimatePresence>
          </div>
        </div>

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "11.5px",
              color: "rgba(255,255,255,0.72)",
              fontFamily: "var(--mono)",
            }}
          >
            {current.alt}
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            {HERO_DASHBOARDS.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show dashboard ${i + 1}`}
                onClick={() => setIndex(i)}
                style={{
                  width: i === index ? 18 : 8,
                  height: 8,
                  borderRadius: 999,
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background:
                    i === index
                      ? "rgba(59,130,246,0.95)"
                      : "rgba(148,163,184,0.6)",
                  transition: "all 0.18s ease-out",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SECTION 1: Hero ─────────────────────────────────────────────────────────── */
function Hero() {
  const words = ["The software", "platform built for", "Bahamian business."];

  return (
    <section style={{ paddingTop: "148px", paddingBottom: "100px", position: "relative", overflow: "hidden" }}>
      <div className="dot-grid" style={{ position: "absolute", inset: 0, opacity: 0.45, zIndex: 0 }} aria-hidden="true" />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(255,255,255,0) 40%,rgba(255,255,255,1) 100%)", zIndex: 1 }} />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 32px", position: "relative", zIndex: 2, display: "flex", gap: "64px", alignItems: "center" }}>

        {/* Left */}
        <div style={{ flex: "0 0 auto", width: "clamp(300px,46%,520px)" }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.snappy, delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--accent-lt)", border: "1px solid rgba(0,102,255,0.2)", borderRadius: "100px", padding: "5px 14px", marginBottom: "28px" }}
          >
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent)", animation: "pulse-dot 2s ease-in-out infinite" }} />
            <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--mono)" }}>Now building for The Bahamas</span>
          </motion.div>

          {/* Headline — word by word spring */}
          <h1 style={{ fontSize: "clamp(38px,4.8vw,58px)", fontWeight: 800, color: "var(--navy)", lineHeight: 1.1, letterSpacing: "-1.5px", marginBottom: "22px" }}>
            {words.map((line, li) => (
              <motion.span
                key={li}
                style={{ display: "block" }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.gentle, delay: 0.2 + li * 0.12 }}
              >
                {li === 2 ? (
                  <span style={{ color: "var(--accent)", position: "relative" }}>
                    {line}
                    <motion.svg
                      style={{ position: "absolute", bottom: "-6px", left: 0, width: "100%", height: "6px" }}
                      viewBox="0 0 200 6" preserveAspectRatio="none"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
                    >
                      <motion.path d="M0 5 Q50 1 100 4 Q150 7 200 3" stroke="var(--accent)" strokeWidth="2" fill="none" opacity="0.4"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, delay: 0.8 }}
                      />
                    </motion.svg>
                  </span>
                ) : line}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 0.55 }}
            style={{ fontSize: "17px", color: "var(--text-mid)", lineHeight: 1.75, marginBottom: "36px", maxWidth: "440px" }}
          >
            We design and build digital platforms that automate operations, connect your systems, and give companies room to grow. From payments to portals — we build it all.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 0.68 }}
            style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 12px 32px rgba(0,102,255,0.35)" }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING.bouncy}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "white", background: "var(--accent)", border: "none", borderRadius: "9px", padding: "14px 28px", cursor: "pointer", fontFamily: "var(--font)" }}
              onClick={() => document.getElementById("book-session")?.scrollIntoView({ behavior: "smooth" })}
            >
              Book a Strategy Session
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>→</motion.span>
            </motion.button>
            <motion.button
              whileHover={{ borderColor: "var(--accent)", color: "var(--accent)", y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING.snappy}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "15px", fontWeight: 600, color: "var(--navy)", background: "transparent", border: "1.5px solid var(--border)", borderRadius: "9px", padding: "13px 26px", cursor: "pointer", fontFamily: "var(--font)" }}
            >
              See Our Platforms
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.6 }}
            style={{ display: "flex", gap: "28px", marginTop: "44px", paddingTop: "28px", borderTop: "1px solid var(--border)" }}
          >
            {[["15", "+", "Platforms built"], ["3", "", "Active ecosystems"], ["100", "%", "Bahamian-built"]].map(([n, suf, label]) => (
              <div key={label}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.5px" }}>
                  <Counter to={parseInt(n)} suffix={suf} />
                </div>
                <div style={{ fontSize: "12.5px", color: "var(--text-mute)", marginTop: "2px" }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: Mockup — springs in from right with slight rotation */}
        <motion.div
          initial={{ opacity: 0, x: 60, rotateY: 8 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ ...SPRING.slow, delay: 0.35 }}
          style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", perspective: "1000px" }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          >
            <ProductMockup />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── SECTION 2: Problem ──────────────────────────────────────────────────────── */
function Problem() {
  const [ref, inView] = useScrollReveal();
  const problems = [
    { icon: "📋", title: "Manual everything",    desc: "Spreadsheets, WhatsApp threads, and paper forms running critical operations." },
    { icon: "🔌", title: "Disconnected tools",    desc: "Your accounting doesn't talk to your CRM. Your website doesn't talk to your POS." },
    { icon: "⚙️", title: "Outdated software",     desc: "Built years ago. Expensive to maintain. Impossible to scale." },
    { icon: "⏱️", title: "Wasted hours",          desc: "Your best people are doing work that software should handle." },
  ];
  return (
    <section style={{ background: "var(--muted-bg)", padding: "100px 32px" }}>
      <motion.div
        ref={ref}
        variants={stagger(0.1)}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        style={{ maxWidth: "1200px", margin: "0 auto" }}
      >
        <motion.div variants={fadeUp()} style={{ textAlign: "center", marginBottom: "56px" }}>
          <div className="section-label">The Problem</div>
          <h2 style={{ fontSize: "clamp(26px,3vw,40px)", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2, letterSpacing: "-0.6px", maxWidth: "620px", margin: "0 auto" }}>
            Most Bahamian businesses are running on systems that don’t work together.
          </h2>
        </motion.div>

        <motion.div
          variants={stagger(0.1)}
          style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "20px", marginBottom: "48px" }}
        >
          {problems.map((p) => (
            <MagneticCard key={p.title}>
              <motion.div
                variants={fadeUp(24)}
                style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", padding: "28px" }}
              >
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={inView ? { scale: 1, opacity: 1 } : {}}
                  transition={{ ...SPRING.bouncy, delay: 0.3 }}
                  style={{ fontSize: "28px", marginBottom: "14px" }}
                >{p.icon}</motion.div>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>{p.title}</div>
                <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.6 }}>{p.desc}</div>
              </motion.div>
            </MagneticCard>
          ))}
        </motion.div>

        <motion.p
          variants={fadeUp()}
          style={{ textAlign: "center", fontSize: "22px", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.3px" }}
        >
          Your team shouldn’t fight your software.
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ─── SECTION 3: What We Build ───────────────────────────────────────────────── */
function WhatWeBuild() {
  const [ref, inView] = useScrollReveal();
  const services = [
    { icon: "⚡", title: "Business Automation",  desc: "Replace manual workflows with custom dashboards, CRMs, HR systems, and booking platforms.", tag: "Most requested" },
    { icon: "💳", title: "Payments & Fintech",   desc: "Digital payment systems, invoicing, vendor portals, and financial reporting tools.", tag: null },
    { icon: "🖥️", title: "Customer Portals",     desc: "Self-service platforms that let your clients manage accounts, bookings, and transactions.", tag: null },
    { icon: "🔗", title: "System Integration",   desc: "Connect your existing tools so data flows automatically across your business.", tag: null },
    { icon: "🤖", title: "AI-Powered Tools",     desc: "Intelligent automation and AI assistants built on the VerityOS platform.", tag: "New" },
    { icon: "🏛️", title: "Enterprise Platforms", desc: "Large-scale internal systems, government tools, and multi-tenant SaaS applications.", tag: null },
  ];
  return (
    <section id="services" style={{ padding: "100px 32px" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.div variants={fadeUp()} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "52px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div className="section-label">What We Build</div>
              <h2 style={{ fontSize: "clamp(28px,3.2vw,42px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.6px", lineHeight: 1.2 }}>
                Everything your business runs on,<br />we can build.
              </h2>
            </div>
            <motion.button
              whileHover={{ borderColor: "var(--accent)", color: "var(--accent)" }}
              transition={SPRING.snappy}
              style={{ fontSize: "14px", fontWeight: 600, color: "var(--navy)", background: "transparent", border: "1.5px solid var(--border)", borderRadius: "9px", padding: "10px 22px", cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}
            >
              View all services
            </motion.button>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "18px" }}>
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                variants={{ hidden: { opacity: 0, y: 32, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { ...SPRING.gentle, delay: i * 0.07 } } }}
              >
                <MagneticCard style={{ height: "100%" }}>
                  <motion.div
                    whileHover={{ boxShadow: "0 16px 48px rgba(10,22,40,0.1)", borderColor: "#c5cfea" }}
                    transition={SPRING.card}
                    style={{ background: "white", border: "1px solid var(--border)", borderRadius: "14px", padding: "28px", position: "relative", height: "100%", cursor: "default" }}
                  >
                    {s.tag && (
                      <div style={{ position: "absolute", top: "20px", right: "20px", background: "var(--accent-lt)", color: "var(--accent)", fontSize: "10.5px", fontWeight: 700, padding: "3px 10px", borderRadius: "100px" }}>{s.tag}</div>
                    )}
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.15 }}
                      transition={{ duration: 0.4 }}
                      style={{ fontSize: "26px", marginBottom: "14px", display: "inline-block" }}
                    >{s.icon}</motion.div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy)", marginBottom: "8px" }}>{s.title}</div>
                    <div style={{ fontSize: "14.5px", color: "var(--text-mid)", lineHeight: 1.65, marginBottom: "16px" }}>{s.desc}</div>
                    <motion.div
                      style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }}
                      whileHover={{ gap: "10px" }}
                      transition={SPRING.snappy}
                    >
                      Learn more
                      <span>→</span>
                    </motion.div>
                  </motion.div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── SECTION 4: Ecosystem ───────────────────────────────────────────────────── */
function Ecosystem() {
  const [ref, inView] = useScrollReveal(0.1);
  const platforms = [
    { name: "KemisPay",             desc: "Payment & financial infrastructure",   color: "#0066FF", initial: "KP" },
    { name: "VerityOS",             desc: "AI platform & automation layer",        color: "#6B21A8", initial: "VO" },
    { name: "LawBey",               desc: "AI-powered legal assistant",            color: "#0D9488", initial: "LB" },
    { name: "Anchor",               desc: "Sovereign digital document vault",      color: "#1D4ED8", initial: "AN" },
    { name: "KemisEmail",           desc: "Email marketing platform",              color: "#DC2626", initial: "KE" },
    { name: "Voice of The Bahamas", desc: "Civic intelligence platform",           color: "#059669", initial: "VB" },
    { name: "Freeport Squares",     desc: "Community & business directory",        color: "#D97706", initial: "FS" },
    { name: "Grand Bahama Rewards", desc: "Digital loyalty ecosystem",             color: "#7C3AED", initial: "GR" },
  ];

  return (
    <section id="ecosystem" style={{ background: "var(--navy)", padding: "100px 32px", position: "relative", overflow: "hidden" }}>
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        style={{ position: "absolute", top: "10%", left: "15%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.3) 0%, transparent 70%)", pointerEvents: "none" }}
        aria-hidden="true"
      />

      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <motion.div
          variants={stagger(0.05)}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.div variants={fadeUp()} style={{ textAlign: "center", marginBottom: "56px" }}>
            <div className="section-label" style={{ color: "rgba(255,255,255,0.4)" }}>Built on a Real Platform</div>
            <h2 style={{ fontSize: "clamp(28px,3.2vw,44px)", fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: "-0.8px", maxWidth: "600px", margin: "0 auto" }}>
              We don’t just build software.<br />We build the layer underneath it.
            </h2>
            <p style={{ fontSize: "16.5px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginTop: "16px", maxWidth: "520px", margin: "16px auto 0" }}>
              Every platform we create connects to a growing ecosystem built specifically for the Bahamian and Caribbean market.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            {platforms.map((p, i) => (
              <motion.div
                key={p.name}
                variants={{ hidden: { opacity: 0, y: 40, scale: 0.92 }, visible: { opacity: 1, y: 0, scale: 1, transition: { ...SPRING.gentle, delay: i * 0.06 } } }}
                whileHover={{ y: -4, background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.22)", transition: SPRING.card }}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "20px", display: "flex", alignItems: "flex-start", gap: "14px", cursor: "default" }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -4 }}
                  transition={SPRING.bouncy}
                  style={{ width: "40px", height: "40px", borderRadius: "10px", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "white", flexShrink: 0, fontFamily: "var(--mono)" }}
                >
                  {p.initial}
                </motion.div>
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: "white", marginBottom: "4px" }}>{p.name}</div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{p.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.p
            variants={fadeUp()}
            style={{ textAlign: "center", marginTop: "44px", fontSize: "15px", color: "rgba(255,255,255,0.35)" }}
          >
            When you build with KemisDigital, you build on infrastructure that is{" "}
            <motion.span
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}
            >
              already in production.
            </motion.span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── SECTION 5: How We Work ─────────────────────────────────────────────────── */
function HowWeWork() {
  const [ref, inView] = useScrollReveal(0.2);
  const steps = [
    { n: "01", title: "Discover",        desc: "A strategy session to understand your operations, pain points, and goals. No generic proposals.", icon: "🔍" },
    { n: "02", title: "Design",          desc: "We architect the platform and design the UX before a single line of code is written.", icon: "✏️" },
    { n: "03", title: "Build",           desc: "Development in focused sprints, with regular previews and your feedback in the process.", icon: "🔨" },
    { n: "04", title: "Launch & Support",desc: "We deploy, train your team, and stay available for ongoing improvements.", icon: "🚀" },
  ];

  return (
    <section id="how-we-work" style={{ background: "var(--muted-bg)", padding: "100px 32px" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.gentle }}
          style={{ textAlign: "center", marginBottom: "64px" }}
        >
          <div className="section-label">How We Work</div>
          <h2 style={{ fontSize: "clamp(28px,3.2vw,42px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.6px" }}>
            From first call to live platform.
          </h2>
          <p style={{ fontSize: "16px", color: "var(--text-mute)", marginTop: "12px" }}>
            Most platforms go from strategy session to launch in 8–16 weeks depending on scope.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0", position: "relative" }}>
          {/* Animated connecting line */}
          <div style={{ position: "absolute", top: "32px", left: "12.5%", right: "12.5%", height: "2px", zIndex: 0, overflow: "hidden", borderRadius: "2px", background: "var(--border)" }}>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={inView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: "100%", background: "var(--accent)", borderRadius: "2px" }}
            />
          </div>

          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.gentle, delay: 0.4 + i * 0.15 }}
              style={{ textAlign: "center", padding: "0 20px", position: "relative", zIndex: 1 }}
            >
              <motion.div
                whileHover={{ scale: 1.1, boxShadow: "0 8px 28px rgba(0,102,255,0.2)" }}
                transition={SPRING.bouncy}
                style={{ width: "64px", height: "64px", borderRadius: "50%", background: "white", border: "2px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 4px 16px rgba(10,22,40,0.06)", position: "relative", cursor: "default" }}
              >
                <span style={{ fontSize: "22px" }}>{s.icon}</span>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ ...SPRING.bouncy, delay: 0.5 + i * 0.15 }}
                  style={{ position: "absolute", top: "-8px", right: "-8px", width: "22px", height: "22px", borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <span style={{ fontSize: "9.5px", fontWeight: 800, color: "white", fontFamily: "var(--mono)" }}>{i + 1}</span>
                </motion.div>
              </motion.div>
              <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--navy)", marginBottom: "10px" }}>{s.title}</div>
              <div style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.65 }}>{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── SECTION 6: Case Studies ────────────────────────────────────────────────── */
function CaseStudies() {
  const [ref, inView] = useScrollReveal();
  const cases = [
    { industry: "Hospitality",          title: "Digital Rewards & Loyalty Ecosystem",  result: "Replaced paper loyalty cards with a fully digital rewards platform tied to point-of-sale systems across multiple locations.", metric: "3 locations connected", color: "#D97706" },
    { industry: "Professional Services",title: "Business Automation Platform",          result: "Eliminated manual HR, payroll, and scheduling workflows for a Nassau-based organization with 100+ employees.", metric: "100+ employees automated", color: "#0066FF" },
    { industry: "Financial Services",   title: "Payment & Invoicing System",            result: "Custom payment infrastructure replacing manual invoicing and vendor payment processes, reducing processing time significantly.", metric: "60% less admin time", color: "#059669" },
  ];

  return (
    <section id="case-studies" style={{ padding: "100px 32px" }}>
      <div ref={ref} style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          <motion.div variants={fadeUp()} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "52px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div className="section-label">Case Studies</div>
              <h2 style={{ fontSize: "clamp(28px,3.2vw,42px)", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.6px" }}>What we have built.</h2>
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-mute)", maxWidth: "260px", lineHeight: 1.5 }}>Full case studies available during a strategy session.</p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
            {cases.map((c, i) => (
              <motion.div
                key={c.title}
                variants={{ hidden: { opacity: 0, y: 40, rotate: -1 }, visible: { opacity: 1, y: 0, rotate: 0, transition: { ...SPRING.gentle, delay: i * 0.12 } } }}
              >
                <MagneticCard>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: "0 20px 56px rgba(10,22,40,0.1)" }}
                    transition={SPRING.card}
                    style={{ background: "white", border: "1px solid var(--border)", borderTop: `3px solid ${c.color}`, borderRadius: "14px", padding: "28px", height: "100%", cursor: "default" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", background: "var(--muted-bg)", borderRadius: "100px", padding: "4px 12px", fontSize: "11.5px", fontWeight: 700, color: "var(--text-mid)", marginBottom: "16px" }}>
                      {c.industry}
                    </div>
                    <div style={{ fontSize: "17px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.35, marginBottom: "12px" }}>{c.title}</div>
                    <div style={{ fontSize: "14px", color: "var(--text-mid)", lineHeight: 1.7, marginBottom: "20px" }}>{c.result}</div>
                    <motion.div
                      style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}
                      whileHover={{ gap: "12px" }}
                      transition={SPRING.snappy}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5 }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: c.color, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: c.color }}>{c.metric}</span>
                    </motion.div>
                  </motion.div>
                </MagneticCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Pre-footer CTA ─────────────────────────────────────────────────────────── */
function CTASection() {
  const [ref, inView] = useScrollReveal(0.3);
  return (
    <section style={{ background: "var(--navy-mid)", padding: "100px 32px", position: "relative", overflow: "hidden" }}>
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        style={{ position: "absolute", top: "20%", right: "10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(0,102,255,0.18) 0%, transparent 70%)", pointerEvents: "none" }}
        aria-hidden="true"
      />
      <div ref={ref} style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.gentle }}
        >
          <div className="section-label" style={{ color: "rgba(255,255,255,0.35)" }}>Get Started</div>
          <h2 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: "white", lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: "20px" }}>
            Ready to build the software your business actually needs?
          </h2>
          <p style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: "36px" }}>
            Book a free 30-minute strategy session. We’ll review your current setup, identify the biggest inefficiencies, and show you what a custom platform could do for your team.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 16px 48px rgba(0,102,255,0.5)" }}
            whileTap={{ scale: 0.97 }}
            animate={{ boxShadow: ["0 8px 24px rgba(0,102,255,0.3)", "0 8px 40px rgba(0,102,255,0.5)", "0 8px 24px rgba(0,102,255,0.3)"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "16px", fontWeight: 600, color: "white", background: "var(--accent)", border: "none", borderRadius: "10px", padding: "16px 36px", cursor: "pointer", fontFamily: "var(--font)" }}
            onClick={() => document.getElementById("book-session")?.scrollIntoView({ behavior: "smooth" })}
          >
            Schedule a Strategy Session
            <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Booking Form ─────────────────────────────────────────────────────────── */

const PAIN_POINTS = [
  "Manual data entry / paperwork",
  "Disconnected systems & spreadsheets",
  "No online payments or invoicing",
  "Poor customer communication",
  "Can\u2019t track inventory or orders",
  "No reporting or visibility",
  "Slow internal approvals",
  "Difficulty scheduling or booking",
];

const GOALS = [
  "Automate repetitive tasks",
  "Accept payments online",
  "Launch a customer portal",
  "Consolidate tools into one platform",
  "Improve team collaboration",
  "Get real-time analytics & reporting",
  "Reduce operational costs",
  "Scale without hiring more staff",
];

const PROJECT_TYPES = [
  "Internal operations platform",
  "Customer-facing web app",
  "Payment / invoicing system",
  "Booking or scheduling tool",
  "CRM / client management",
  "Inventory / supply chain",
  "AI-powered automation",
  "Mobile app (iOS / Android)",
];

const FEATURES = [
  "User authentication & roles",
  "Payment processing",
  "Email / SMS notifications",
  "Dashboard & analytics",
  "Document management",
  "API integrations",
  "Workflow automation",
  "Search & filtering",
];

const BUDGETS = [
  "Under $5,000",
  "$5,000 – $15,000",
  "$15,000 – $30,000",
  "$30,000 – $50,000",
  "$50,000+",
  "Not sure yet",
];

const TIMELINES = [
  "ASAP / within 1 month",
  "1 – 3 months",
  "3 – 6 months",
  "6+ months",
  "Just exploring options",
];

const INDUSTRIES = [
  "Retail & E-commerce",
  "Financial Services",
  "Legal",
  "Healthcare",
  "Real Estate",
  "Hospitality & Tourism",
  "Construction",
  "Government & Public Sector",
  "Education",
  "Other",
];

const TEAM_SIZES = [
  "Just me",
  "2 – 5",
  "6 – 15",
  "16 – 50",
  "50+",
];

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  fontSize: "15px",
  fontFamily: "var(--font)",
  border: "1.5px solid var(--border)",
  borderRadius: "10px",
  background: "white",
  color: "var(--text)",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-mid)",
  marginBottom: "6px",
  fontFamily: "var(--font)",
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--navy)",
  letterSpacing: "-0.2px",
  marginBottom: "14px",
  paddingBottom: "10px",
  borderBottom: "1px solid var(--border)",
};

function CheckboxGroup({ name, options, selected, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
      {options.map((option) => (
        <label
          key={option}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            padding: "10px 12px",
            borderRadius: "9px",
            border: `1.5px solid ${selected.includes(option) ? "var(--accent)" : "var(--border)"}`,
            background: selected.includes(option) ? "var(--accent-lt)" : "white",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "13.5px",
            fontWeight: 500,
            color: selected.includes(option) ? "var(--accent)" : "var(--text-mid)",
            lineHeight: 1.4,
          }}
        >
          <input
            type="checkbox"
            name={name}
            value={option}
            checked={selected.includes(option)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, option]);
              else onChange(selected.filter((i) => i !== option));
            }}
            style={{ display: "none" }}
          />
          <span style={{
            width: "18px",
            height: "18px",
            minWidth: "18px",
            borderRadius: "5px",
            border: `2px solid ${selected.includes(option) ? "var(--accent)" : "var(--border)"}`,
            background: selected.includes(option) ? "var(--accent)" : "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "1px",
            transition: "all 0.2s",
          }}>
            {selected.includes(option) && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 3.5L3.5 6L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {option}
        </label>
      ))}
    </div>
  );
}

function RadioGroup({ name, options, selected, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      {options.map((option) => (
        <label
          key={option}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "9px 16px",
            borderRadius: "20px",
            border: `1.5px solid ${selected === option ? "var(--accent)" : "var(--border)"}`,
            background: selected === option ? "var(--accent)" : "white",
            color: selected === option ? "white" : "var(--text-mid)",
            cursor: "pointer",
            transition: "all 0.2s",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={selected === option}
            onChange={() => onChange(option)}
            style={{ display: "none" }}
          />
          {option}
        </label>
      ))}
    </div>
  );
}

function BookingForm() {
  const [ref, inView] = useScrollReveal(0.05);

  const [painPoints, setPainPoints] = useState([]);
  const [goals, setGoals] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [features, setFeatures] = useState([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const [state, formAction, isPending] = useActionState(bookStrategySession, null);

  const formRef = useRef(null);

  const selectedCount = painPoints.length + goals.length + projectTypes.length + features.length + (budget ? 1 : 0) + (timeline ? 1 : 0);

  return (
    <section
      id="book-session"
      ref={ref}
      style={{ background: "var(--muted-bg)", padding: "100px 32px", position: "relative" }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.gentle }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div className="section-label">Book a Strategy Session</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,40px)", fontWeight: 800, color: "var(--navy)", lineHeight: 1.15, letterSpacing: "-0.6px", marginBottom: "16px" }}>
              Tell us about your project
            </h2>
            <p style={{ fontSize: "17px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "580px", margin: "0 auto" }}>
              Fill out the form below so we can understand your business and come prepared with ideas for your free 30-minute strategy session.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {state?.ok ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={SPRING.gentle}
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "64px 40px",
                  textAlign: "center",
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 40px rgba(10,22,40,0.06)",
                }}
              >
                <div style={{ fontSize: "56px", marginBottom: "20px" }}>&#10003;</div>
                <h3 style={{ fontSize: "24px", fontWeight: 700, color: "var(--navy)", marginBottom: "12px" }}>
                  Request Received
                </h3>
                <p style={{ fontSize: "17px", color: "var(--text-mid)", lineHeight: 1.7, maxWidth: "440px", margin: "0 auto" }}>
                  {state.message}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={SPRING.gentle}
                style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px", alignItems: "start" }}
              >
                {/* Main form */}
                <form
                  ref={formRef}
                  action={formAction}
                  style={{
                    background: "white",
                    borderRadius: "20px",
                    padding: "36px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 24px rgba(10,22,40,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "32px",
                  }}
                >
                  {/* Hidden meta fields */}
                  <input type="hidden" name="source_url" value={typeof window !== "undefined" ? window.location.href : ""} />
                  <input type="hidden" name="user_agent" value={typeof window !== "undefined" ? navigator.userAgent : ""} />

                  {/* Contact Info */}
                  <div>
                    <div style={sectionTitleStyle}>Contact Information</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input name="full_name" required placeholder="John Smith" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Email Address *</label>
                        <input name="email" type="email" required placeholder="john@company.com" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Phone Number</label>
                        <input name="phone" type="tel" placeholder="(242) 555-1234" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Company Name</label>
                        <input name="company_name" placeholder="Acme Ltd." style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Your Role</label>
                        <input name="role_title" placeholder="Founder, Operations Manager..." style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                    </div>
                  </div>

                  {/* Business Profile */}
                  <div>
                    <div style={sectionTitleStyle}>About Your Business</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Industry</label>
                        <RadioGroup name="industry" options={INDUSTRIES} selected={industry} onChange={setIndustry} />
                        <input type="hidden" name="industry" value={industry} />
                      </div>
                      <div>
                        <label style={labelStyle}>Team Size</label>
                        <RadioGroup name="team_size_radio" options={TEAM_SIZES} selected={teamSize} onChange={setTeamSize} />
                        <input type="hidden" name="team_size" value={teamSize} />
                      </div>
                      <div>
                        <label style={labelStyle}>Current Tools / Software</label>
                        <input name="current_tools" placeholder="QuickBooks, Excel, WhatsApp, pen & paper..." style={inputStyle} onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }} onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
                      </div>
                    </div>
                  </div>

                  {/* Pain Points */}
                  <div>
                    <div style={sectionTitleStyle}>What challenges are you facing?</div>
                    <CheckboxGroup name="pain_points" options={PAIN_POINTS} selected={painPoints} onChange={setPainPoints} />
                  </div>

                  {/* Goals */}
                  <div>
                    <div style={sectionTitleStyle}>What are your goals?</div>
                    <CheckboxGroup name="goals" options={GOALS} selected={goals} onChange={setGoals} />
                  </div>

                  {/* Project Types */}
                  <div>
                    <div style={sectionTitleStyle}>What type of platform do you need?</div>
                    <CheckboxGroup name="project_types" options={PROJECT_TYPES} selected={projectTypes} onChange={setProjectTypes} />
                  </div>

                  {/* Features */}
                  <div>
                    <div style={sectionTitleStyle}>Key features you need</div>
                    <CheckboxGroup name="features_needed" options={FEATURES} selected={features} onChange={setFeatures} />
                  </div>

                  {/* Budget & Timeline */}
                  <div>
                    <div style={sectionTitleStyle}>Budget & Timeline</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Estimated Budget</label>
                        <RadioGroup name="budget_radio" options={BUDGETS} selected={budget} onChange={setBudget} />
                        <input type="hidden" name="budget_range" value={budget} />
                      </div>
                      <div>
                        <label style={labelStyle}>Desired Timeline</label>
                        <RadioGroup name="timeline_radio" options={TIMELINES} selected={timeline} onChange={setTimeline} />
                        <input type="hidden" name="timeline" value={timeline} />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div style={sectionTitleStyle}>Tell Us More</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <label style={labelStyle}>Describe your project or idea</label>
                        <textarea
                          name="project_description"
                          rows={4}
                          placeholder="What problem are you trying to solve? What does success look like?"
                          style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Anything else we should know?</label>
                        <textarea
                          name="additional_notes"
                          rows={3}
                          placeholder="Deadlines, compliance requirements, integrations..."
                          style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                          onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,102,255,0.1)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                        />
                      </div>
                    </div>
                  </div>

                  {state && !state.ok && (
                    <div style={{ padding: "14px 18px", borderRadius: "10px", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "14px", fontWeight: 500 }}>
                      {state.message}
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isPending}
                    whileHover={!isPending ? { scale: 1.02, boxShadow: "0 12px 32px rgba(0,102,255,0.35)" } : {}}
                    whileTap={!isPending ? { scale: 0.98 } : {}}
                    transition={SPRING.bouncy}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "16px",
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "white",
                      background: isPending ? "var(--text-mid)" : "var(--accent)",
                      border: "none",
                      borderRadius: "12px",
                      cursor: isPending ? "wait" : "pointer",
                      fontFamily: "var(--font)",
                      transition: "background 0.2s",
                    }}
                  >
                    {isPending ? "Submitting..." : "Submit Strategy Session Request"}
                    {!isPending && <span>→</span>}
                  </motion.button>
                </form>

                {/* Summary sidebar */}
                <div style={{ position: "sticky", top: "88px" }}>
                  <div style={{
                    background: "white",
                    borderRadius: "20px",
                    padding: "28px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 24px rgba(10,22,40,0.04)",
                  }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--navy)", marginBottom: "20px" }}>
                      Your Request Summary
                    </div>

                    <SummaryItem label="Pain Points" items={painPoints} />
                    <SummaryItem label="Goals" items={goals} />
                    <SummaryItem label="Platform Type" items={projectTypes} />
                    <SummaryItem label="Features" items={features} />

                    {budget && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-mute)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontFamily: "var(--mono)" }}>Budget</div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--accent)" }}>{budget}</div>
                      </div>
                    )}

                    {timeline && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-mute)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontFamily: "var(--mono)" }}>Timeline</div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--accent)" }}>{timeline}</div>
                      </div>
                    )}

                    {industry && (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-mute)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "4px", fontFamily: "var(--mono)" }}>Industry</div>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>{industry}</div>
                      </div>
                    )}

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "6px" }}>
                      <div style={{ fontSize: "12px", color: "var(--text-mute)" }}>
                        {selectedCount === 0
                          ? "Start selecting options to see your summary."
                          : `${selectedCount} option${selectedCount !== 1 ? "s" : ""} selected`}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: "16px", padding: "18px 20px", borderRadius: "14px", background: "var(--navy)", color: "rgba(255,255,255,0.7)", fontSize: "13px", lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 700, color: "white", marginBottom: "6px", fontSize: "14px" }}>What happens next?</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>1. We review your submission</div>
                      <div>2. We reach out within 24 hours</div>
                      <div>3. Free 30-min strategy session</div>
                      <div>4. Custom proposal & roadmap</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function SummaryItem({ label, items }) {
  if (!items.length) return null;
  return (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-mute)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--mono)" }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {items.map((item) => (
          <span key={item} style={{ display: "inline-block", padding: "3px 10px", borderRadius: "6px", background: "var(--accent-lt)", color: "var(--accent)", fontSize: "12px", fontWeight: 600 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Footer ─────────────────────────────────────────────────────────────────── */
function Footer() {
  const cols = [
    { title: "Services",  links: ["Business Automation", "Payments & Fintech", "Customer Portals", "System Integration", "AI Tools"] },
    { title: "Ecosystem", links: ["KemisPay", "VerityOS", "LawBey", "KemisEmail", "Anchor"] },
    { title: "Company",   links: ["About", "Careers", "Contact", "Privacy Policy"] },
  ];
  return (
    <footer style={{ background: "var(--navy)", padding: "64px 32px 32px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(3,1fr)", gap: "48px", marginBottom: "56px" }}>
          <div>
            <div style={{ marginBottom: "14px" }}>
              <svg width="170" height="32" viewBox="0 0 220 40" fill="none">
                <rect x="0"  y="0"  width="36" height="9"  rx="2.5" fill="white"/>
                <rect x="0"  y="14" width="28" height="9"  rx="2.5" fill="#0066FF"/>
                <rect x="0"  y="28" width="18" height="9"  rx="2.5" fill="white" opacity="0.3"/>
                <text x="48" y="28" fontFamily="'Plus Jakarta Sans', sans-serif" fontSize="21" fontWeight="800" fill="white" letterSpacing="-0.6">Kemis<tspan fill="#0066FF">Digital</tspan></text>
              </svg>
            </div>
            <p style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: "220px" }}>
              Building the platforms that power modern Bahamian businesses.
            </p>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.2)", marginTop: "16px" }}>Nassau, The Bahamas</p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "var(--mono)", marginBottom: "16px" }}>{col.title}</div>
              {col.links.map(l => (
                <motion.div
                  key={l}
                  whileHover={{ x: 4, color: "rgba(255,255,255,0.85)" }}
                  transition={SPRING.snappy}
                  style={{ fontSize: "13.5px", color: "rgba(255,255,255,0.45)", marginBottom: "10px", cursor: "pointer" }}
                >{l}</motion.div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.2)" }}>© 2025 The Kemis Group of Companies. All rights reserved.</p>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)" }}>kemisdigital.com</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── App ────────────────────────────────────────────────────────────────────── */
export default function KemisDigital() {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KemisDigital",
    url: "https://kemisdigital.com",
    logo: "https://kemisdigital.com/og-image.svg"
  };

  return (
    <>
      <GlobalStyles />
      <Nav />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <main>
        <Hero />
        <Problem />
        <WhatWeBuild />
        <Ecosystem />
        <HowWeWork />
        <CaseStudies />
        <CTASection />
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}
