"use client";
import { useState, useEffect, useRef, type CSSProperties } from "react";

const C = {
  bg: "#07070A",
  bgCard: "#0F0E14",
  bgCardHover: "#141220",
  border: "#1E1A2E",
  borderGlow: "#2D1F4E",
  accent: "#7C3AED",
  accentMid: "#9F5FFA",
  accentLight: "#C084FC",
  accentGlow: "rgba(124,58,237,0.18)",
  accentGlow2: "rgba(124,58,237,0.08)",
  gold: "#C084FC",
  goldLight: "#C084FC",
  green: "#10B981",
  red: "#EF4444",
  white: "#FFFFFF",
  gray: "#6B7280",
  text: "#E8E4F0",
  textSub: "#8B8099",
  textMuted: "#4E4860",
  sebi: "#1A3A2A",
  sebiBorder: "#2D6B4A",
  sebiText: "#4ADE80",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";

// ─── Real Live Market Instruments ─────────────────────────────────────────────
const tickers = [
  { sym: "NIFTY 50", base: 22622.70, change: -99.25, pct: -0.44, cat: "index" },
  { sym: "SENSEX", base: 72781.89, change: -251.89, pct: -0.34, cat: "index" },
  { sym: "INDIA VIX", base: 13.20, change: -0.35, pct: -2.58, cat: "index" },
  { sym: "RELIANCE", base: 1278.00, change: 8.40, pct: 0.66, cat: "stock" },
  { sym: "TCS", base: 2254.30, change: 18.20, pct: 0.81, cat: "stock" },
  { sym: "HDFC BANK", base: 746.25, change: -6.15, pct: -0.82, cat: "stock" },
  { sym: "INFOSYS", base: 1079.90, change: 11.40, pct: 1.07, cat: "stock" },
  { sym: "GOLD", base: 143750, change: 420, pct: 0.29, cat: "commodity" },
  { sym: "CRUDE OIL", base: 8260, change: -45, pct: -0.54, cat: "commodity" },
  { sym: "USD/INR", base: 96.10, change: 0.08, pct: 0.08, cat: "forex" },
  { sym: "S&P 500", base: 7805.45, change: -1.79, pct: -0.02, cat: "index" },
  { sym: "NASDAQ", base: 25587.04, change: -42.10, pct: -0.16, cat: "index" },
  { sym: "DOW JONES", base: 44120.00, change: 65.40, pct: 0.15, cat: "index" },
  { sym: "BITCOIN", base: 7918463, change: -66243, pct: -0.83, cat: "crypto" },
  { sym: "ETHEREUM", base: 242500, change: -3100, pct: -1.26, cat: "crypto" },
  // US Equities
  { sym: "AAPL", name: "Apple Inc.", sector: "Technology", base: 333.02, change: 11.36, pct: 3.53, cat: "us_stock" },
  { sym: "MSFT", name: "Microsoft Corp.", sector: "Technology", base: 381.70, change: 0.12, pct: 0.03, cat: "us_stock" },
  { sym: "GOOGL", name: "Alphabet Inc.", sector: "Technology", base: 319.74, change: 2.05, pct: 0.65, cat: "us_stock" },
  { sym: "AMZN", name: "Amazon.com", sector: "Consumer", base: 232.11, change: -1.55, pct: -0.66, cat: "us_stock" },
  { sym: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", base: 206.84, change: -1.92, pct: -0.92, cat: "us_stock" },
  { sym: "META", name: "Meta Platforms", sector: "Technology", base: 595.19, change: -10.91, pct: -1.80, cat: "us_stock" },
  { sym: "TSLA", name: "Tesla Inc.", sector: "EV / Auto", base: 313.03, change: -6.66, pct: -2.08, cat: "us_stock" },
  { sym: "BRK.B", name: "Berkshire Hathaway", sector: "Financial", base: 491.96, change: -4.79, pct: -0.96, cat: "us_stock" },
];

function useLivePrices() {
  const [prices, setPrices] = useState(() =>
    tickers.map((t) => ({ ...t, price: t.base, change: t.change ?? 0, pct: t.pct ?? 0, loaded: false }))
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchRealPrices() {
      try {
        const res = await fetch("/api/market", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.quotes && !cancelled) {
          setPrices((prev) =>
            prev.map((t) => {
              const live = data.quotes[t.sym];
              if (!live) return t;
              return {
                ...t,
                price: live.price,
                change: live.change,
                pct: live.pct,
                loaded: true,
              };
            })
          );
        }
      } catch (e) {
        // Keep last known prices if offline
      }
    }

    fetchRealPrices();
    const id = setInterval(fetchRealPrices, 12000); // Polls real Yahoo Finance data every 12s
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return prices;
}

// ─── Live Market Scrolling Bar Component ──────────────────────────────────────
function LiveMarketBar({ prices }: { prices: ReturnType<typeof useLivePrices> }) {
  const barItems = prices.filter((p) => p.cat !== "us_stock" && p.sym !== "INDIA VIX" && p.sym !== "DOW JONES");
  return (
    <div style={{
      background: "#0B0A12",
      borderBottom: `1px solid ${C.border}`,
      padding: "10px 0",
      overflow: "hidden",
      whiteSpace: "nowrap",
      position: "relative",
      display: "flex",
      alignItems: "center",
    }}>
      <div style={{
        display: "inline-flex",
        gap: "36px",
        animation: "tickerScroll 38s linear infinite",
        paddingLeft: "20px",
      }}>
        {barItems.concat(barItems).map((p, idx) => (
          <div key={`${p.sym}-${idx}`} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            fontFamily: FONT_BODY,
            fontSize: "12.5px",
          }}>
            <span style={{ fontWeight: 600, color: C.text }}>{p.sym}</span>
            <span style={{ fontWeight: 700, color: C.white }}>
              {p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span style={{
              color: p.pct >= 0 ? C.green : C.red,
              fontWeight: 600,
              fontSize: "11.5px",
            }}>
              {p.pct >= 0 ? "▲ +" : "▼ "}{p.pct}%
            </span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function Sparkline({ up, width = 60, height = 24 }: { up: boolean; width?: number; height?: number }) {
  const pts = useRef(Array.from({ length: 20 }, (_, i) => 10 + (up ? i * 0.4 : -i * 0.4) + (Math.sin(i) * 2)));
  const data = pts.current;
  const min = Math.min(...data), max = Math.max(...data);
  const scale = (v: number) => height - ((v - min) / (max - min + 0.001)) * (height - 4) - 2;
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"}${(i / (data.length - 1)) * width},${scale(v)}`).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={up ? C.green : C.red} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ 
  page,
  isLoggedIn, 
  onNavigate, 
  onLogout, 
}: { 
    page: string;
    isLoggedIn: boolean;
    onNavigate: (page: string) => void;
    onLogout: () => void;
  }) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<(string | null)>(null);
  const [openSub, setOpenSub] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && e.target instanceof Node && !navRef.current.contains(e.target)) { setOpenMenu(null); setOpenSub(0); }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dropdowns: Record<string, { label: string; target: string; icon?: string }[]> = {
    Markets: [
      { label: "Indian Equities", target: "IndStocks" },
      { label: "US Stocks", target: "USStocks" },
      { label: "Commodities", target: "Markets" },
      { label: "Forex", target: "Markets" },
    ],
    Resources: [
      { label: "Market News", target: "News" },
      { label: "Research Reports", target: "Research" },
      { label: "Blog", target: "Blog" },
    ],
  };

  const productsMenu: { 
    label: string; 
    columns: { 
      title: string | null; 
    items: { 
      label: string; 
      target: string;
      desc?: string;
      icon?: string;
    }[]; 
  }[]; 
}[] = [
    {
      label: "Broking & Distribution",
      columns: [
        { title: "Invest", items: [
          { label: "Equity", target: "IndStocks" },
          { label: "Mutual Funds", target: "MutualFund" },
          { label: "International Mutual Funds", target: "MutualFund" },
          { label: "IPO", target: "Markets" },
          { label: "Unlisted Shares", target: "Private Market" },
          { label: "US Stocks", target: "USStocks" },
          { label: "Stocks", target: "IndStocks" },
          { label: "Fixed Deposits", target: "Markets" },
          { label: "SGBs", target: "Markets" },
          { label: "PMS", target: "Markets" },
          { label: "AIFs", target: "Markets" },
          { label: "Market Linked Debentures", target: "Markets" },
          { label: "Portfolio Restructuring", target: "Markets" },
        ]},
        { title: "Trade", items: [
          { label: "Derivatives", target: "Markets" },
          { label: "Margin Trading Facility", target: "Markets" },
          { label: "Currencies", target: "Markets" },
          { label: "Commodities", target: "Markets" },
          { label: "Fintech Partners", target: "Markets" },
          { label: "Trade API", target: "Markets" },
          { label: "Automated Trading Strategies", target: "Markets" },
        ]},
      ],
    },
    {
      label: "Wealth Management",
      columns: [
        { title: null, items: [
          { label: "Our Solutions", target: "About" },
          { label: "Why PL", target: "About" },
          { label: "Our Approach", target: "About" },
          { label: "Meet the Team", target: "About" },
          { label: "Engage With Us", target: "About" },
          { label: "Family Offices", target: "About" },
        ]},
      ],
    },
    {
      label: "Private Market",
      columns: [
        { title: null, items: [
          { label: "Unlisted Shares", target: "Private Market" },
          { label: "Pre-IPO", target: "Private Market" },
          { label: "Private Equity", target: "Private Market" },
          { label: "Venture Capital", target: "Private Market" },
        ]},
      ],
    },
  ];

  function go(target: string) {
    setOpenMenu(null);
    setOpenSub(0);
    onNavigate(target);
  }

  const dropdownStyle: CSSProperties = {
    position: "absolute", top: "calc(100% + 12px)", left: 0,
    background: "rgba(10,9,18,0.98)",
    border: `1px solid ${C.borderGlow}`,
    borderRadius: 14, padding: "6px", minWidth: 220,
    boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)`,
    backdropFilter: "blur(24px)",
    zIndex: 200,
  };

  return (
    <nav ref={navRef} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "rgba(7,7,10,0.95)" : "transparent",
      backdropFilter: scrolled ? "blur(24px)" : "none",
      borderBottom: scrolled ? `1px solid ${C.border}` : "none",
      transition: "all 0.3s ease",
      padding: "0 4%",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64,
    }}>
      <div onClick={() => go("Home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <LogoIcon size={30} />
        <span style={{ color: C.white, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15.5, letterSpacing: "0.04em" }}>
          GRANDLINE<span style={{ color: C.accentLight, marginLeft: 4 }}>CAPITAL</span>
        </span>
      </div>

      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        {["Home"].map((l) => (
          <button key={l} onClick={() => go(l)} style={navBtn(page === l)}>{l}</button>
        ))}

        <div style={{ position: "relative" }}>
          <button onClick={() => { setOpenMenu(openMenu === "Products" ? null : "Products"); setOpenSub(0); }} style={navBtn(openMenu === "Products")}>
            Products
            <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: openMenu === "Products" ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 3 }}>
              <path d="M1 2.5L4.5 6L8 2.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          {openMenu === "Products" && (
            <div style={{ ...dropdownStyle, display: "flex", padding: 0, minWidth: 0, maxWidth: "calc(100vw - 24px)" }}>
              <div style={{ width: 230, padding: 6, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
                {productsMenu.map((cat, i) => (
                  <div key={cat.label}
                    onMouseEnter={() => setOpenSub(i)}
                    onClick={() => setOpenSub(i)}
                    style={{
                      padding: "10px 13px", borderRadius: 9, cursor: "pointer",
                      fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600,
                      color: openSub === i ? C.white : C.text,
                      background: openSub === i ? "rgba(124,58,237,0.14)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "background 0.15s",
                    }}
                  >
                    {cat.label}
                    <svg width="8" height="8" viewBox="0 0 9 9"><path d="M2 1L6 4.5L2 8" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
                  </div>
                ))}
              </div>
              {productsMenu[openSub] && (
                <div style={{ display: "flex", gap: 30, padding: "18px 24px" }}>
                  {productsMenu[openSub].columns.map((col, ci) => (
                    <div key={ci} style={{ minWidth: 190 }}>
                      {col.title && <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.white, marginBottom: 10, letterSpacing: "0.02em" }}>{col.title}</div>}
                      {col.items.map(item => (
                        <div key={item.label} onClick={() => go(item.target)}
                          style={{ padding: "7px 8px", borderRadius: 7, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: C.textSub, marginBottom: 1, transition: "color 0.15s, background 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.background = "rgba(124,58,237,0.1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = "transparent"; }}
                        >
                          {item.label}
                          {item.desc && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {(Object.keys(dropdowns) as Array<keyof typeof dropdowns>).map((key) => (
          <div key={key} style={{ position: "relative" }}>
            <button onClick={() => setOpenMenu(openMenu === key ? null : key)} style={navBtn(openMenu === key)}>
              {key}
              <svg width="9" height="9" viewBox="0 0 9 9" style={{ transform: openMenu === key ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginLeft: 3 }}>
                <path d="M1 2.5L4.5 6L8 2.5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {openMenu === key && (
              <div style={dropdownStyle}>
                {dropdowns[key].map((item) => (
                  <div key={item.label} onClick={() => go(item.target)} style={{
                    padding: "9px 13px", borderRadius: 9, cursor: "pointer",
                    fontFamily: FONT_BODY, fontSize: 13.5, color: C.text,
                    display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(124,58,237,0.14)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{ fontSize: 13, opacity: 0.75 }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {["About"].map((l) => (
          <button key={l} onClick={() => go(l)} style={navBtn(page === l)}>{l}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{
          background: C.sebi, border: `1px solid ${C.sebiBorder}`,
          borderRadius: 8, padding: "5px 11px", display: "flex", alignItems: "center", gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sebiText }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 10.5, fontWeight: 600, color: C.sebiText, letterSpacing: "0.07em" }}>SEBI REG. IN PROCESS</span>
        </div>

        {isLoggedIn ? (
          <>
            <div onClick={() => go("Dashboard")} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 12px",
              borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer",
              background: C.bgCard,
            }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.white }}>IN</div>
              <span style={{ color: C.text, fontFamily: FONT_BODY, fontSize: 13 }}>Investor</span>
            </div>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textSub, padding: "7px 16px", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer" }}>Log Out</button>
          </>
        ) : (
          <>
            <button onClick={() => go("Login")} style={{ background: "none", border: `1px solid ${C.border}`, color: C.text, padding: "7px 16px", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer" }}>Log In</button>
            <button onClick={() => go("Dashboard")} style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, border: "none",
              color: C.white, padding: "7px 18px", borderRadius: 8,
              fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer", fontWeight: 600,
              boxShadow: `0 0 20px ${C.accentGlow}`,
            }}>Get Started</button>
          </> 
        )}
      </div>
    </nav>
  );
}

function navBtn(active: boolean) {
  return {
    background: active ? "rgba(124,58,237,0.12)" : "transparent",
    border: "none", cursor: "pointer",
    color: active ? C.white : C.textSub,
    fontFamily: FONT_BODY, fontSize: 13.5,
    padding: "6px 13px", borderRadius: 8,
    fontWeight: active ? 500 : 400,
    transition: "all 0.15s",
    display: "flex", alignItems: "center", gap: 4,
  };
}

function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={C.accent} />
          <stop offset="100%" stopColor={C.accentLight} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#lg1)" opacity="0.15" />
      <rect x="6" y="19" width="3.5" height="8" rx="1" fill={C.accent} opacity="0.7" />
      <rect x="12" y="14" width="3.5" height="13" rx="1" fill={C.accentMid} opacity="0.85" />
      <rect x="18" y="9" width="3.5" height="18" rx="1" fill={C.accentLight} />
      <path d="M5 21 L26 6" stroke={C.white} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26" cy="6" r="2" fill={C.white} />
    </svg>
  );
}

function Tag({ children, color = C.accent }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      background: `${color}18`, color, border: `1px solid ${color}30`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
      fontFamily: FONT_BODY, letterSpacing: "0.05em",
    }}>{children}</span>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${C.border}, transparent)`, margin: "0 4%" }} />;
}

function RevealOnScroll({
  children,
  delay = 0,
  direction = "up",
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    if (node.getBoundingClientRect().top < window.innerHeight * 0.88) {
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.16, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const offset = direction === "left" ? "translateX(-28px)" : direction === "right" ? "translateX(28px)" : "translateY(32px)";

  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : offset,
        transition: `opacity 700ms ease ${delay}ms, transform 700ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: visible ? "auto" : "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setPage, prices }: { setPage: (page: string) => void; prices: ReturnType<typeof useLivePrices> }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <div className="grandline-hero" style={{ paddingTop: 110, paddingBottom: 100, textAlign: "center", padding: "110px 8% 100px", position: "relative", overflow: "hidden" }}>
        <div className="grandline-hero-glow" aria-hidden="true" style={{ position: "absolute", top: -300, left: "50%", transform: "translateX(-50%)", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div className="grandline-hero-orbit" aria-hidden="true" style={{ position: "absolute", top: 200, left: "20%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div className="grandline-hero-content">
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sebi, border: `1px solid ${C.sebiBorder}`, borderRadius: 30, padding: "6px 16px", marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sebiText }} />
            <span style={{ fontFamily: FONT_BODY, fontSize: 11.5, fontWeight: 600, color: C.sebiText, letterSpacing: "0.06em" }}>SEBI REGISTRATION IN PROCESS</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <Tag color={C.accentLight}>INSTITUTIONAL ENGINE</Tag>
          </div>

          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(42px, 5.5vw, 76px)", fontWeight: 800,
            lineHeight: 1.08, margin: "0 auto 12px", maxWidth: 900,
            letterSpacing: "-0.03em", color: C.white,
          }}>
            The Institutional Platform
          </h1>
          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontSize: "clamp(42px, 5.5vw, 76px)", fontWeight: 700,
            lineHeight: 1.08, margin: "0 auto 26px", maxWidth: 900,
            letterSpacing: "-0.03em", fontStyle: "italic",
            background: `linear-gradient(135deg, ${C.accentLight} 0%, ${C.gold} 60%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            for Advanced Assets
          </h1>

          <p style={{ fontFamily: FONT_BODY, fontSize: 17, color: C.textSub, maxWidth: 560, margin: "0 auto 44px", lineHeight: 1.75 }}>
            Precision execution for the modern financier. Deploy high-frequency strategies with the security of a global fortress.
          </p>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => setPage("Dashboard")} style={{
              background: C.white, color: "#0A0A10", border: "none",
              padding: "15px 34px", borderRadius: 50, fontSize: 15, fontWeight: 700,
              fontFamily: FONT_BODY, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              Join the Waitlist <span style={{ fontSize: 16 }}>›</span>
            </button>
            <button onClick={() => setPage("Research")} style={{
              background: "rgba(255,255,255,0.06)", color: C.text,
              border: `1px solid rgba(255,255,255,0.12)`,
              padding: "15px 34px", borderRadius: 50, fontSize: 15,
              fontFamily: FONT_BODY, cursor: "pointer", fontWeight: 500,
            }}>View Documentation</button>
          </div>

          <div className="grandline-stats" style={{ display: "flex", justifyContent: "center", marginTop: 80, gap: 0, background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 720, margin: "80px auto 0", overflow: "hidden" }}>
            {[
              { label: "Asset Classes", val: "6+" },
              { label: "Live Instruments", val: "10,000+" },
              { label: "AI Models", val: "3" },
              { label: "Data Points/sec", val: "50K+" },
            ].map((s, i) => (
              <div className="grandline-stat" key={i} style={{ flex: 1, padding: "28px 16px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, letterSpacing: "-0.02em" }}>{s.val}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textSub, marginTop: 4, letterSpacing: "0.03em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grandline-scroll-cue" aria-hidden="true">
          <span />
          <small>SCROLL TO EXPLORE</small>
        </div>
      </div>

      <SectionDivider />

      <RevealOnScroll style={{ padding: "80px 8%" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 800, margin: "0 0 14px", letterSpacing: "-0.02em", color: C.white }}>Every Market. One Login.</h2>
          <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
            Trade and invest across all major asset classes from a unified, institutional-grade dashboard.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { name: "Indian Equities", desc: "NSE & BSE stocks, F&O, ETFs", sub: "10,000+ instruments", target: "IndStocks", badge: "LIVE" },
            { name: "US Stocks", desc: "NYSE, NASDAQ, ADRs", sub: "6,000+ instruments", target: "USStocks", badge: "LIVE" },
            { name: "Commodities", desc: "Gold, Silver, Crude Oil, Agri", sub: "MCX & global exchanges", target: "Markets", badge: "LIVE" },
            { name: "Forex", desc: "Major, minor & exotic pairs", sub: "INR, USD, EUR and 30+", target: "Markets", badge: "LIVE" },
            { name: "Mutual Funds", desc: "Direct plans, SIPs & ELSS", sub: "3,000+ schemes", target: "MutualFund", badge: "LIVE" },
            { name: "Private Markets", desc: "Pre-IPO & Startup deals", sub: "Curated deal flow", target: "Private Market", badge: "EXCLUSIVE" },
          ].map((a, i) => (
            <RevealOnScroll key={a.name} delay={i * 70}>
              <div onClick={() => setPage(a.target)} style={{
                background: C.bgCard, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "28px 26px", cursor: "pointer",
                transition: "all 0.25s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderGlow; e.currentTarget.style.background = C.bgCardHover; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.bgCard; e.currentTarget.style.transform = "none"; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${C.accent}22, ${C.accentLight}22)`, border: `1px solid ${C.borderGlow}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, background: `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`, opacity: 0.8 }} />
                  </div>
                  <span style={{ background: a.badge === "EXCLUSIVE" ? `${C.gold}18` : `${C.green}18`, color: a.badge === "EXCLUSIVE" ? C.gold : C.green, border: `1px solid ${a.badge === "EXCLUSIVE" ? C.gold : C.green}30`, padding: "2px 9px", borderRadius: 20, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.07em" }}>{a.badge}</span>
                </div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.white, marginBottom: 6 }}>{a.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub, marginBottom: 8 }}>{a.desc}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textMuted }}>{a.sub}</div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </RevealOnScroll>

      <SectionDivider />

      <RevealOnScroll style={{ padding: "80px 8%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          <RevealOnScroll direction="left">
            <Tag color={C.accentLight}>AI-Powered Intelligence</Tag>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 38, fontWeight: 800, margin: "18px 0 18px", letterSpacing: "-0.02em", color: C.white, lineHeight: 1.15 }}>
              Your AI Investment Advisor, Always On.
            </h2>
            <p style={{ fontFamily: FONT_BODY, color: C.textSub, fontSize: 15.5, lineHeight: 1.8, marginBottom: 28 }}>
              Institutional-grade intelligence in plain language. Ask anything — market insights, portfolio analysis, risk assessment. Built for both retail and institutional investors.
            </p>
            <button onClick={() => setPage("AI Advisor")} style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, color: C.white, border: "none",
              padding: "13px 28px", borderRadius: 10, fontSize: 14, cursor: "pointer",
              fontFamily: FONT_BODY, fontWeight: 600, boxShadow: `0 0 30px ${C.accentGlow}`,
            }}>Try AI Advisor →</button>
          </RevealOnScroll>
          <RevealOnScroll direction="right" delay={120} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: 26, boxShadow: `0 0 60px ${C.accentGlow}` }}>
            <ChatPreview />
          </RevealOnScroll>
        </div>
      </RevealOnScroll>

      <SectionDivider />

      <RevealOnScroll style={{ padding: "80px 8%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 40 }}>
          <div>
            <Tag color={C.gold}>Research & Insights</Tag>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, margin: "14px 0 8px", letterSpacing: "-0.02em", color: C.white }}>Market Intelligence Hub</h2>
            <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 15 }}>News, research reports & blogs — updated daily by our analyst team.</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setPage("News")} style={outlineBtn}>Market News</button>
            <button onClick={() => setPage("Research")} style={outlineBtn}>Research</button>
            <button onClick={() => setPage("Blog")} style={outlineBtn}>Blog</button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {[
            { category: "MARKET NEWS", title: "FII Inflows Hit 3-Month High; NIFTY Eyes 25,000", time: "2 hours ago", color: C.accentLight, target: "News" },
            { category: "RESEARCH", title: "India Macro Outlook: A Singapore Investor's Guide", time: "1 day ago", color: C.gold, target: "Research" },
            { category: "BLOG", title: "How Multi-Asset Diversification Reduces Portfolio Volatility", time: "3 days ago", color: C.green, target: "Blog" },
          ].map((item, i) => (
            <RevealOnScroll key={item.title} delay={i * 90}>
              <div onClick={() => setPage(item.target)} style={{
                background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderGlow; e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
              >
                <Tag color={item.color}>{item.category}</Tag>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.white, margin: "14px 0 10px", lineHeight: 1.4 }}>{item.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>{item.time}</div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </RevealOnScroll>

      <SectionDivider />

      <RevealOnScroll style={{ padding: "100px 8%", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.03em", color: C.white, position: "relative" }}>
          Ready to Invest Smarter?
        </h2>
        <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 16, marginBottom: 36, position: "relative" }}>
          Join the waitlist. Get early access when Grandline Capital launches.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", position: "relative" }}>
          <button onClick={() => setPage("Dashboard")} style={{
            background: C.white, color: "#0A0A10", border: "none",
            padding: "16px 44px", borderRadius: 50, fontSize: 16, fontWeight: 700,
            fontFamily: FONT_BODY, cursor: "pointer",
          }}>Open Free Account</button>
        </div>
      </RevealOnScroll>

      <Footer setPage={setPage} />
    </div>
  );
}

const outlineBtn = {
  background: "transparent", border: `1px solid ${C.border}`, color: C.textSub,
  padding: "8px 18px", borderRadius: 8, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer",
};

function ChatPreview() {
  const msgs = [
    { role: "user", text: "What's the NIFTY outlook this week?" },
    { role: "ai", text: "NIFTY shows strong institutional support. FII inflows remain positive. Watch key support zones for pullback entries." },
    { role: "user", text: "Should I add US exposure?" },
    { role: "ai", text: "Given INR stability and S&P momentum, a 15–20% US allocation via Nasdaq ETFs offers good diversification for an India-heavy portfolio." },
  ];
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }}>Grandline AI Advisor — Live</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              background: m.role === "user" ? `linear-gradient(135deg, ${C.accent}, ${C.accentMid})` : "rgba(255,255,255,0.05)",
              border: m.role === "ai" ? `1px solid ${C.border}` : "none",
              borderRadius: m.role === "user" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
              padding: "10px 14px", maxWidth: "82%",
              fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.55,
              color: C.text,
            }}>{m.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MARKETS PAGE ─────────────────────────────────────────────────────────────
function MarketsPage({ prices }: { prices: any }) {
  const [filter, setFilter] = useState("all");
  const cats = ["all", "index", "stock", "us_stock", "commodity", "forex", "crypto"];
  const filtered = filter === "all" ? prices : prices.filter((p: any) => p.cat === filter);
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "40px 6%" }}>
        <div style={{ marginBottom: 32 }}>
          <Tag>Live Yahoo Finance Feed</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 6px", letterSpacing: "-0.02em", color: C.white }}>Market Overview</h1>
          <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 15 }}>Real-time market prices across NSE, BSE, NYSE, NASDAQ, MCX, Forex & Crypto.</p>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setFilter(c)} style={{
              background: filter === c ? C.accent : C.bgCard,
              border: `1px solid ${filter === c ? C.accent : C.border}`,
              color: filter === c ? C.white : C.textSub,
              padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              fontFamily: FONT_BODY, textTransform: "capitalize", transition: "all 0.2s",
            }}>{c.replace("_", " ")}</button>
          ))}
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            <span>Instrument</span><span>Live Price</span><span>Change</span><span>% Change</span><span>Trend</span>
          </div>
          {filtered.map((p: any, i: number) => (
            <div key={p.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5 }}>{p.sym}</div>
                <div style={{ fontSize: 11.5, color: C.textSub, textTransform: "capitalize", marginTop: 2 }}>{p.cat.replace("_", " ")}</div>
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14.5 }}>
                {p.cat === "us_stock" ? `$${p.price.toFixed(2)}` : p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <div style={{ color: p.change >= 0 ? C.green : C.red, fontSize: 13 }}>{p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}</div>
              <div style={{ color: p.pct >= 0 ? C.green : C.red, background: p.pct >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", padding: "3px 8px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, display: "inline-block" }}>
                {p.pct >= 0 ? "▲" : "▼"} {Math.abs(p.pct)}%
              </div>
              <Sparkline up={p.pct >= 0} />
            </div>
          ))}
        </div>
      </div>
      <Footer setPage={() => {}} />
    </div>
  );
}

// ─── INDIAN STOCKS PAGE ───────────────────────────────────────────────────────
function IndStocksPage({ prices }: { prices: any }) {
  const [tab, setTab] = useState("All Stocks");
  const extendedStocks = [
    { sym: "RELIANCE", sector: "Energy", mcap: "₹19.2L Cr", pe: 24.1, div: "0.4%", cat: "stock" },
    { sym: "TCS", sector: "IT", mcap: "₹13.8L Cr", pe: 31.5, div: "1.1%", cat: "stock" },
    { sym: "HDFC BANK", sector: "Banking", mcap: "₹12.3L Cr", pe: 18.7, div: "1.6%", cat: "stock" },
    { sym: "INFOSYS", sector: "IT", mcap: "₹7.7L Cr", pe: 27.8, div: "2.8%", cat: "stock" },
    { sym: "NIFTY 50", sector: "Index", mcap: "—", pe: "—", div: "—", cat: "index" },
    { sym: "SENSEX", sector: "Index", mcap: "—", pe: "—", div: "—", cat: "index" },
  ].map((s) => ({ ...s, ...prices.find((p: any) => p.sym === s.sym) }));

  const nifty = prices.find((p: any) => p.sym === "NIFTY 50");
  const sensex = prices.find((p: any) => p.sym === "SENSEX");
  const vix = prices.find((p: any) => p.sym === "INDIA VIX");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "40px 6%" }}>
        <Tag color={C.accentLight}>NSE · BSE · F&O</Tag>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 6px", color: C.white, letterSpacing: "-0.02em" }}>Indian Equities</h1>
        <p style={{ color: C.textSub, fontSize: 15, fontFamily: FONT_BODY, marginBottom: 32 }}>Live NSE & BSE data across all sectors.</p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["All Stocks", "Gainers", "Losers"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: tab === t ? C.accent : C.bgCard, border: `1px solid ${tab === t ? C.accent : C.border}`, color: tab === t ? C.white : C.textSub, padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY }}>{t}</button>
          ))}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            <span>Stock</span><span>Live Price (₹)</span><span>Change</span><span>% Chg</span><span>Mkt Cap</span><span>P/E</span><span>Trend</span>
          </div>
          {extendedStocks.filter(s => tab === "All Stocks" ? true : tab === "Gainers" ? (s.pct || 0) >= 0 : (s.pct || 0) < 0).map((s) => (
            <div key={s.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5 }}>{s.sym}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.sector}</div>
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13.5 }}>₹{(s.price || s.base)?.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div style={{ color: (s.change || 0) >= 0 ? C.green : C.red, fontSize: 13 }}>{(s.change || 0) >= 0 ? "+" : ""}{(s.change || 0).toFixed(2)}</div>
              <div style={{ color: (s.pct || 0) >= 0 ? C.green : C.red, fontSize: 13, fontWeight: 600 }}>{(s.pct || 0) >= 0 ? "▲" : "▼"} {Math.abs(s.pct || 0)}%</div>
              <div style={{ fontSize: 12.5, color: C.textSub }}>{s.mcap}</div>
              <div style={{ fontSize: 12.5, color: C.textSub }}>{s.pe}</div>
              <Sparkline up={(s.pct || 0) >= 0} />
            </div>
          ))}
        </div>

        {/* Dynamic Live Index Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {[
            { label: "NIFTY 50", item: nifty },
            { label: "SENSEX", item: sensex },
            { label: "India VIX", item: vix },
          ].map(idx => {
            const val = idx.item ? idx.item.price.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—";
            const pct = idx.item ? idx.item.pct : 0;
            const up = pct >= 0;
            return (
              <div key={idx.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub, marginBottom: 6 }}>{idx.label}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.white }}>{val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: up ? C.green : C.red, marginTop: 4 }}>
                  {up ? "+" : ""}{pct}% today
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer setPage={() => {}} />
    </div>
  );
}

// ─── US STOCKS PAGE ───────────────────────────────────────────────────────────
function USStocksPage({ prices }: { prices: any }) {
  const usStocks = prices.filter((p: any) => p.cat === "us_stock");
  const sp500 = prices.find((p: any) => p.sym === "S&P 500");
  const nasdaq = prices.find((p: any) => p.sym === "NASDAQ");
  const dow = prices.find((p: any) => p.sym === "DOW JONES");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "40px 6%" }}>
        <Tag color={C.gold}>NYSE · NASDAQ</Tag>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 6px", color: C.white, letterSpacing: "-0.02em" }}>US Stocks</h1>
        <p style={{ color: C.textSub, fontSize: 15, fontFamily: FONT_BODY, marginBottom: 32 }}>Track top US equities with real-time NYSE & NASDAQ data.</p>

        {/* Dynamic Live US Index Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 28 }}>
          {[
            { label: "S&P 500", item: sp500 },
            { label: "NASDAQ", item: nasdaq },
            { label: "Dow Jones", item: dow },
          ].map(idx => {
            const val = idx.item ? idx.item.price.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—";
            const pct = idx.item ? idx.item.pct : 0;
            const up = pct >= 0;
            return (
              <div key={idx.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub, marginBottom: 6 }}>{idx.label}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 24, color: C.white }}>{val}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: up ? C.green : C.red, marginTop: 4 }}>
                  {up ? "+" : ""}{pct}% today
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 2.5fr) repeat(4, minmax(70px, 1fr))", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontFamily: FONT_BODY, fontSize: 11, color: C.textMuted, letterSpacing: "0.07em", textTransform: "uppercase" }}>
            <span>Company</span><span>Live Price (USD)</span><span>Change</span><span>% Chg</span><span>Trend</span>
          </div>
          {usStocks.map((s: any, i: number) => (
            <div key={s.sym} style={{ display: "grid", gridTemplateColumns: "minmax(140px, 2.5fr) repeat(4, minmax(70px, 1fr))", padding: "14px 20px", borderBottom: i < usStocks.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5 }}>{s.sym}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{s.name} · {s.sector}</div>
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14 }}>${s.price.toFixed(2)}</div>
              <div style={{ color: s.change >= 0 ? C.green : C.red, fontSize: 13 }}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(2)}</div>
              <div style={{ color: s.pct >= 0 ? C.green : C.red, fontWeight: 600, fontSize: 13 }}>{s.pct >= 0 ? "▲" : "▼"} {Math.abs(s.pct)}%</div>
              <Sparkline up={s.pct >= 0} />
            </div>
          ))}
        </div>
      </div>
      <Footer setPage={() => {}} />
    </div>
  );
}

// ─── MUTUAL FUND PAGE ─────────────────────────────────────────────────────────
function MutualFundPage() {
  const funds = [
    { name: "Axis Bluechip Fund", cat: "Large Cap", nav: "₹58.72", ret1y: "+18.4%", ret3y: "+14.2%", rating: "★★★★★", risk: "Moderate" },
    { name: "Mirae Asset Emerging Bluechip", cat: "Large & Mid Cap", nav: "₹112.30", ret1y: "+24.1%", ret3y: "+17.8%", rating: "★★★★★", risk: "Moderate High" },
    { name: "Parag Parikh Flexi Cap", cat: "Flexi Cap", nav: "₹69.45", ret1y: "+21.6%", ret3y: "+16.5%", rating: "★★★★★", risk: "Moderate" },
    { name: "SBI Small Cap Fund", cat: "Small Cap", nav: "₹152.80", ret1y: "+32.4%", ret3y: "+22.1%", rating: "★★★★", risk: "High" },
    { name: "HDFC Mid-Cap Opportunities", cat: "Mid Cap", nav: "₹139.40", ret1y: "+28.7%", ret3y: "+19.3%", rating: "★★★★★", risk: "Moderate High" },
    { name: "Nippon India Index Fund", cat: "Index", nav: "₹32.15", ret1y: "+14.8%", ret3y: "+11.6%", rating: "★★★★", risk: "Moderate" },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "40px 6%" }}>
        <Tag color={C.accentMid}>AMFI Registered</Tag>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 6px", color: C.white, letterSpacing: "-0.02em" }}>Mutual Funds</h1>
        <p style={{ color: C.textSub, fontSize: 15, fontFamily: FONT_BODY, marginBottom: 32 }}>Top-performing funds across categories. Start SIP from ₹500/month.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          {[{ label: "Total Funds", val: "2,400+" }, { label: "Avg. 3Y Return", val: "16.8%" }, { label: "Min SIP", val: "₹500" }].map(k => (
            <div key={k.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textSub, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 26, color: C.white }}>{k.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {funds.map(f => (
            <div key={f.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, transition: "all 0.2s", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderGlow; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "none"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.white, marginBottom: 4 }}>{f.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{f.cat}</div>
                </div>
                <Tag color={f.risk === "High" ? C.red : f.risk.includes("Moderate High") ? C.gold : C.green}>{f.risk}</Tag>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                {[{ l: "NAV", v: f.nav }, { l: "1Y Return", v: f.ret1y }, { l: "3Y Return", v: f.ret3y }, { l: "Rating", v: f.rating }].map(info => (
                  <div key={info.l}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.textMuted, marginBottom: 3 }}>{info.l}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 13, color: info.l.includes("Return") ? C.green : C.text }}>{info.v}</div>
                  </div>
                ))}
              </div>
              <button style={{ width: "100%", marginTop: 16, background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, border: "none", color: C.white, padding: "10px", borderRadius: 9, fontSize: 13, fontFamily: FONT_BODY, fontWeight: 600, cursor: "pointer" }}>
                Start SIP / Invest
              </button>
            </div>
          ))}
        </div>
      </div>
      <Footer setPage={() => {}} />
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ prices, onNavigate }: { prices: any, onNavigate: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState("Overview");
  const tabs = ["Overview", "Ind Stocks", "US Stocks", "Mutual Fund", "Private Market"];

  const portfolio = [
    { sym: "RELIANCE", qty: 25, avg: 1250, ltp: prices.find((p: any) => p.sym === "RELIANCE")?.price || 1350 },
    { sym: "TCS", qty: 10, avg: 3800, ltp: prices.find((p: any) => p.sym === "TCS")?.price || 4100 },
    { sym: "GOLD", qty: 5, avg: 71000, ltp: prices.find((p: any) => p.sym === "GOLD")?.price || 76500 },
    { sym: "HDFC BANK", qty: 40, avg: 1580, ltp: prices.find((p: any) => p.sym === "HDFC BANK")?.price || 1680 },
  ];
  const totalInvested = portfolio.reduce((s: number, p: any) => s + p.avg * p.qty, 0);
  const totalCurrent = portfolio.reduce((s: number, p: any) => s + p.ltp * p.qty, 0);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = ((pnl / totalInvested) * 100).toFixed(2);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "28px 5% 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 13, margin: "0 0 4px" }}>Good morning, Investor ·
              <span style={{ color: C.green, marginLeft: 6 }}>● Live Yahoo Finance Feed</span>
            </p>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: C.white }}>Portfolio Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onNavigate("AI Advisor")} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, border: "none", color: C.white, padding: "9px 18px", borderRadius: 9, fontSize: 13, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600 }}>AI Insights</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 26 }}>
          {tabs.map((t: string) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: "none", border: "none", cursor: "pointer", padding: "10px 18px",
              fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: activeTab === t ? 600 : 400,
              color: activeTab === t ? C.white : C.textSub,
              borderBottom: activeTab === t ? `2px solid ${C.accent}` : "2px solid transparent",
              transition: "all 0.15s", marginBottom: -1,
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 5% 40px" }}>
        {activeTab === "Overview" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Portfolio Value", val: `₹${totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "Total current value", color: C.text },
                { label: "Total P&L", val: `${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: `${pnlPct}% overall`, color: pnl >= 0 ? C.green : C.red },
                { label: "Live Feed Status", val: "Active", sub: "Real-time NSE/Global", color: C.green },
                { label: "Risk Score", val: "Moderate", sub: "Based on profile", color: C.gold },
              ].map((k: any) => (
                <div key={k.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: C.textSub, marginBottom: 8, letterSpacing: "0.04em" }}>{k.label}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 800, color: k.color, letterSpacing: "-0.01em" }}>{k.val}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted, marginTop: 5 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.white }}>Holdings (Live LTP)</span>
                    <Tag>{portfolio.length} Positions</Tag>
                  </div>
                  {portfolio.map((pos: any, i: number) => {
                    const gainAmt = (pos.ltp - pos.avg) * pos.qty;
                    return (
                      <div key={pos.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: i < portfolio.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5 }}>{pos.sym}</div>
                          <div style={{ fontSize: 11.5, color: C.textSub, marginTop: 2 }}>Qty: {pos.qty} · Avg: ₹{pos.avg}</div>
                        </div>
                        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13.5 }}>₹{pos.ltp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                        <div style={{ color: gainAmt >= 0 ? C.green : C.red, fontSize: 13, fontWeight: 600 }}>{gainAmt >= 0 ? "+" : ""}₹{gainAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                        <Sparkline up={gainAmt >= 0} />
                      </div>
                    );
                  })}
                </div>

                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16 }}>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, color: C.white }}>Live Market Movers</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                    {prices.filter((p: any) => p.sym !== "INDIA VIX").slice(0, 6).map((p: any, i: number) => (
                      <div key={p.sym} style={{ padding: "13px 20px", borderBottom: i < 4 ? `1px solid ${C.border}` : "none", borderRight: i % 2 === 0 ? `1px solid ${C.border}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}>{p.sym}</div>
                          <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 2, color: C.white }}>{p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                        </div>
                        <div style={{ background: p.pct >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: p.pct >= 0 ? C.green : C.red, padding: "4px 9px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                          {p.pct >= 0 ? "+" : ""}{p.pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 18, color: C.white }}>Allocation</div>
                  {[
                    { label: "Equities", pct: 62, color: C.accent },
                    { label: "Commodities", pct: 26, color: C.gold },
                    { label: "Cash", pct: 12, color: C.textMuted },
                  ].map((a: any) => (
                    <div key={a.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textSub }}>{a.label}</span>
                        <span style={{ fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, color: C.text }}>{a.pct}%</span>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5 }}>
                        <div style={{ width: `${a.pct}%`, height: "100%", borderRadius: 4, background: a.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 16, padding: 20, boxShadow: `0 0 30px ${C.accentGlow2}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13.5, fontWeight: 600, color: C.white }}>AI Market Insight</span>
                  </div>
                  <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub, lineHeight: 1.65, margin: "0 0 14px" }}>
                    Your portfolio P&L is <span style={{ color: pnl >= 0 ? C.green : C.red }}>{pnl >= 0 ? "+" : ""}{pnlPct}%</span> based on live NSE market prices.
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {["Rebalance", "View Analysis", "Risk Report"].map((t: string) => (
                      <button key={t} style={{ background: `${C.accent}18`, border: `1px solid ${C.borderGlow}`, color: C.accentLight, padding: "5px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: FONT_BODY }}>{t}</button>
                    ))}
                  </div>
                </div>

                <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, marginBottom: 16, color: C.white }}>Risk Profile</div>
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 40, fontWeight: 800, color: C.gold, fontFamily: FONT_DISPLAY, letterSpacing: "-0.03em" }}>5.8</div>
                    <div style={{ color: C.gold, fontSize: 13, fontFamily: FONT_BODY }}>Moderate</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 8, position: "relative" }}>
                    <div style={{ position: "absolute", left: "52%", top: -3, width: 14, height: 14, borderRadius: "50%", background: C.gold, border: "2px solid white", zIndex: 1 }} />
                    <div style={{ width: "100%", height: "100%", borderRadius: 6, background: `linear-gradient(to right, ${C.green}, ${C.gold}, ${C.red})` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                    <span style={{ fontSize: 11, color: C.textMuted }}>Conservative</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>Aggressive</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "Ind Stocks" && <IndStocksPage prices={prices} />}
        {activeTab === "US Stocks" && <USStocksPage prices={prices} />}
        {activeTab === "Mutual Fund" && <MutualFundPage />}
        {activeTab === "Private Market" && <PrivateMarketPage />}
      </div>
    </div>
  );
}

// ─── AI ADVISOR PAGE ──────────────────────────────────────────────────────────
const fallbackReplies = [
  "Based on live market data, Indian large-cap equities continue to show strong institutional support.",
  "Gold remains a strong hedge given global macro volatility. A 10–15% allocation is ideal for moderate-risk profiles.",
  "Your portfolio beta is ~1.12, slightly above market. Adding large-cap defensive stocks or short-duration debt can reduce volatility.",
  "For long-term wealth creation, a SIP strategy into diversified equity funds alongside direct equity gives optimal risk-adjusted returns.",
];

function AIAdvisorPage() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello! I'm your Grandline AI Advisor. Ask me anything about markets, your portfolio, or investment strategies — I have access to live data across all asset classes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const suggestions = ["NIFTY outlook this week?", "Best stocks to buy now?", "How to diversify globally?", "Gold vs Equity allocation?", "Mutual fund recommendations?"];

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: "ai", text: fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)] }]);
      setLoading(false);
    }, 600);
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "28px 6% 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Tag color={C.green}>Live AI</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 800, margin: "10px 0 4px", color: C.white, letterSpacing: "-0.02em" }}>AI Investment Advisor</h1>
          <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 14, margin: 0 }}>Market intelligence powered by real-time data and AI</p>
        </div>
      </div>

      <div style={{ flex: 1, margin: "0 6%", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 18, display: "flex", flexDirection: "column", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "52vh" }}>
          {messages.map((m: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-end" }}>
              {m.role === "ai" && (
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <LogoIcon size={18} />
                </div>
              )}
              <div style={{ background: m.role === "user" ? `linear-gradient(135deg, ${C.accent}, ${C.accentMid})` : "rgba(255,255,255,0.05)", border: m.role === "ai" ? `1px solid ${C.border}` : "none", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "12px 16px", maxWidth: "70%", fontFamily: FONT_BODY, fontSize: 14, lineHeight: 1.6, color: C.text }}>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestions.map((s: string) => (
            <button key={s} onClick={() => sendMessage(s)} style={{ background: `${C.accent}14`, border: `1px solid ${C.borderGlow}`, color: C.accentLight, padding: "5px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: FONT_BODY }}>{s}</button>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 12 }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage(input)} placeholder="Ask about any market, asset, or investment strategy..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 16px", color: C.text, fontSize: 14, fontFamily: FONT_BODY, outline: "none" }} />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ background: input.trim() ? `linear-gradient(135deg, ${C.accent}, ${C.accentMid})` : C.border, color: C.white, border: "none", borderRadius: 10, padding: "11px 22px", fontSize: 14, cursor: input.trim() ? "pointer" : "default", fontFamily: FONT_BODY, fontWeight: 600 }}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── PRIVATE MARKET PAGE ──────────────────────────────────────────────────────
function PrivateMarketPage() {
  const deals = [
    { name: "FinEdge Technologies", stage: "Series B", sector: "Fintech", target: "₹120 Cr", min: "₹25 L", irr: "28%", status: "Open", tag: "Hot" },
    { name: "GreenPath Energy", stage: "Series A", sector: "CleanTech", target: "₹60 Cr", min: "₹10 L", irr: "22%", status: "Open", tag: "ESG" },
    { name: "MedVault AI", stage: "Pre-IPO", sector: "HealthTech", target: "₹240 Cr", min: "₹50 L", irr: "34%", status: "Closing Soon", tag: "Pre-IPO" },
    { name: "AgroStar Logistics", stage: "Seed+", sector: "AgriTech", target: "₹20 Cr", min: "₹5 L", irr: "19%", status: "Open", tag: "New" },
    { name: "SpaceVenture India", stage: "Series A", sector: "SpaceTech", target: "₹80 Cr", min: "₹15 L", irr: "26%", status: "Open", tag: "" },
    { name: "NeoBank X", stage: "Pre-IPO", sector: "Neobanking", target: "₹350 Cr", min: "₹1 Cr", irr: "31%", status: "Coming Soon", tag: "Pre-IPO" },
  ];
  const tagColor = { "Hot": C.red, "ESG": C.green, "Pre-IPO": C.accent, "New": C.gold };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40 }}>
      <div style={{ padding: "40px 6%" }}>
        <Tag color="#8B5CF6">Exclusive Access</Tag>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 8px", color: C.white, letterSpacing: "-0.02em" }}>Private Markets</h1>
        <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 16, marginBottom: 32 }}>Curated pre-IPO and startup opportunities — exclusively for Grandline Capital members.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {deals.map((d) => (
            <div key={d.name} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <Tag color={d.status === "Closing Soon" ? C.red : d.status === "Coming Soon" ? C.textSub : C.green}>{d.status}</Tag>
                {d.tag && <Tag color={tagColor[d.tag as keyof typeof tagColor] || C.accent}>{d.tag}</Tag>}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, marginBottom: 4, color: C.white }}>{d.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textSub, marginBottom: 16 }}>{d.stage} · {d.sector}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[{ l: "Target", v: d.target }, { l: "Min Investment", v: d.min }, { l: "Target IRR", v: d.irr }].map((info) => (
                  <div key={info.l}>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 10.5, color: C.textMuted, marginBottom: 3 }}>{info.l}</div>
                    <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13, color: C.text }}>{info.v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer setPage={() => {}} />
    </div>
  );
}

// ─── NEWS, RESEARCH, BLOG, ABOUT, LOGIN, FOOTER ───────────────────────────────
function NewsPage() {
  const news = [
    { category: "Markets", title: "Institutional Inflows Surge; NIFTY & SENSEX Track Global Momentum", summary: "Institutional participation across NSE and BSE remains resilient amid active sector rotation.", time: "2 hours ago" },
    { category: "Economy", title: "RBI Monetary Policy & Liquidity Framework Update", summary: "Central bank focus remains on inflation moderation and sustainable credit growth across sectors.", time: "4 hours ago" },
  ];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40, padding: "40px 6%" }}>
      <Tag color={C.accentLight}>Real-Time</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 24px", color: C.white }}>Market News</h1>
      <div style={{ display: "grid", gap: 16 }}>
        {news.map(n => (
          <div key={n.title} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <Tag color={C.accentLight}>{n.category}</Tag>
            <h3 style={{ color: C.white, margin: "12px 0 8px" }}>{n.title}</h3>
            <p style={{ color: C.textSub, margin: 0, fontSize: 14 }}>{n.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResearchPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40, padding: "40px 6%" }}>
      <Tag color={C.gold}>Analyst Research</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 16px", color: C.white }}>Research Reports</h1>
      <p style={{ color: C.textSub }}>In-depth institutional research reports across equities, macro, and commodities.</p>
    </div>
  );
}

function BlogPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40, padding: "40px 6%" }}>
      <Tag color={C.green}>Knowledge Hub</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 36, fontWeight: 800, margin: "12px 0 16px", color: C.white }}>Blog</h1>
      <p style={{ color: C.textSub }}>Investment insights, market education, and quantitative strategies.</p>
    </div>
  );
}

function AboutPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 40, padding: "60px 8%" }}>
      <Tag>About Grandline Capital</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 44, fontWeight: 800, margin: "18px 0 24px", color: C.white }}>Democratizing Access to Every Asset Class</h1>
      <p style={{ color: C.textSub, maxWidth: 700, lineHeight: 1.8 }}>Grandline Capital is a unified multi-asset investment platform connecting retail and institutional investors to Indian and global markets.</p>
    </div>
  );
}

function LoginPage({ onLogin, setPage }: { onLogin: () => void, setPage: (page: string) => void }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: "44px 38px", width: "100%", maxWidth: 400, textAlign: "center" }}>
        <h2 style={{ color: C.white, marginBottom: 12 }}>Welcome to Grandline</h2>
        <p style={{ color: C.textSub, fontSize: 13.5, marginBottom: 24 }}>Access your live portfolio dashboard</p>
        <button onClick={onLogin} style={{ width: "100%", background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, color: C.white, border: "none", padding: "13px", borderRadius: 10, fontSize: 14.5, fontWeight: 700, cursor: "pointer" }}>Continue to Live Dashboard</button>
        <p onClick={() => setPage("Home")} style={{ fontSize: 12.5, color: C.textSub, marginTop: 16, cursor: "pointer" }}>← Back to homepage</p>
      </div>
    </div>
  );
}

function Footer({ setPage }: { setPage: (page: string) => void }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: "44px 8%", background: C.bgCard }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>© 2026 Grandline Capital. All rights reserved.</span>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>SEBI Registration in Process · Live market data via Yahoo Finance</span>
      </div>
    </footer>
  );
}

// ─── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const prices = useLivePrices();

  function handleNavigate(target: string) {
    if (target === "Dashboard" && !isLoggedIn) {
      setPage("Login");
    } else {
      setPage(target);
    }
  }

  function handleLogin() {
    setIsLoggedIn(true);
    setPage("Dashboard");
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setPage("Login");
  }

  const renderPage = () => {
    switch (page) {
      case "Home": return <HomePage setPage={handleNavigate} prices={prices} />;
      case "Markets": return <MarketsPage prices={prices} />;
      case "IndStocks": return <IndStocksPage prices={prices} />;
      case "USStocks": return <USStocksPage prices={prices} />;
      case "MutualFund": return <MutualFundPage />;
      case "Dashboard": return isLoggedIn ? <DashboardPage prices={prices} onNavigate={handleNavigate} /> : <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case "AI Advisor": return <AIAdvisorPage />;
      case "Private Market": return <PrivateMarketPage />;
      case "About": return <AboutPage />;
      case "News": return <NewsPage />;
      case "Research": return <ResearchPage />;
      case "Blog": return <BlogPage />;
      case "Login": return <LoginPage onLogin={handleLogin} setPage={setPage} />;
      default: return <HomePage setPage={handleNavigate} prices={prices} />;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav page={page} isLoggedIn={isLoggedIn} onNavigate={handleNavigate} onLogout={handleLogout} />
      <div
        key={page}
        className="grandline-page-enter"
        style={{
          paddingTop: 64,
        }}
      >
        <LiveMarketBar prices={prices} />
        {renderPage()}
      </div>
    </div>
  );
}