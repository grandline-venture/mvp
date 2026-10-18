"use client";
import { useState, useEffect, useRef, type CSSProperties } from "react";

type UserTier = "standard" | "premium";

const C = {
  bg: "#07080C",
  bgCard: "#0C0E14",
  bgCardHover: "#11141D",
  border: "#1A1E2B",
  borderGlow: "#262C3F",
  accent: "#6D28D9",
  accentMid: "#7C3AED",
  accentLight: "#A78BFA",
  accentGlow: "rgba(109, 40, 217, 0.14)",

  // Institutional Blue Palette for Pro Tier
  proBlue: "#1D4ED8",
  proBlueMid: "#2563EB",
  proBlueLight: "#60A5FA",
  proBlueDark: "#1E3A8A",
  proBlueGlow: "rgba(37, 99, 235, 0.12)",
  proBg: "#05070B",
  proPanel: "#090D14",
  proBorder: "#151F30",

  gold: "#94A3B8",
  green: "#10B981",
  red: "#EF4444",
  amber: "#D97706",
  cyan: "#0891B2",
  white: "#F8FAFC",
  gray: "#64748B",
  text: "#E2E8F0",
  textSub: "#94A3B8",
  textMuted: "#475569",
  sebi: "#0F291E",
  sebiBorder: "#1E4635",
  sebiText: "#34D399",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace";

const tickers = [
  { sym: "NIFTY 50", base: 22622.7, change: -99.25, pct: -0.44, cat: "index" },
  { sym: "SENSEX", base: 72781.89, change: -251.89, pct: -0.34, cat: "index" },
  { sym: "INDIA VIX", base: 13.2, change: -0.35, pct: -2.58, cat: "index" },
  { sym: "RELIANCE", base: 1278.0, change: 8.4, pct: 0.66, cat: "stock" },
  { sym: "TCS", base: 2254.3, change: 18.2, pct: 0.81, cat: "stock" },
  { sym: "HDFC BANK", base: 746.25, change: -6.15, pct: -0.82, cat: "stock" },
  { sym: "INFOSYS", base: 1079.9, change: 11.4, pct: 1.07, cat: "stock" },
  { sym: "HAL", base: 4300.0, change: 45.0, pct: 1.05, cat: "stock" },
  { sym: "ZOMATO", base: 195.0, change: 2.5, pct: 1.3, cat: "stock" },
  { sym: "SBI", base: 830.0, change: 5.2, pct: 0.63, cat: "stock" },
  { sym: "GOLD", base: 143750, change: 420, pct: 0.29, cat: "commodity" },
  { sym: "CRUDE OIL", base: 8260, change: -45, pct: -0.54, cat: "commodity" },
  { sym: "USD/INR", base: 96.1, change: 0.08, pct: 0.08, cat: "forex" },
  { sym: "S&P 500", base: 7805.45, change: -1.79, pct: -0.02, cat: "index" },
  { sym: "NASDAQ", base: 25587.04, change: -42.1, pct: -0.16, cat: "index" },
  { sym: "DOW JONES", base: 44120.0, change: 65.4, pct: 0.15, cat: "index" },
  { sym: "BITCOIN", base: 7918463, change: -66243, pct: -0.83, cat: "crypto" },
  { sym: "ETHEREUM", base: 242500, change: -3100, pct: -1.26, cat: "crypto" },
  { sym: "AAPL", name: "Apple Inc.", sector: "Technology", base: 333.02, change: 11.36, pct: 3.53, cat: "us_stock" },
  { sym: "MSFT", name: "Microsoft Corp.", sector: "Technology", base: 381.7, change: 0.12, pct: 0.03, cat: "us_stock" },
  { sym: "GOOGL", name: "Alphabet Inc.", sector: "Technology", base: 319.74, change: 2.05, pct: 0.65, cat: "us_stock" },
  { sym: "AMZN", name: "Amazon.com", sector: "Consumer", base: 232.11, change: -1.55, pct: -0.66, cat: "us_stock" },
  { sym: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", base: 206.84, change: -1.92, pct: -0.92, cat: "us_stock" },
  { sym: "META", name: "Meta Platforms", sector: "Technology", base: 595.19, change: -10.91, pct: -1.8, cat: "us_stock" },
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
              return { ...t, price: live.price, change: live.change, pct: live.pct, loaded: true };
            })
          );
        }
      } catch {}
    }

    fetchRealPrices();
    const id = setInterval(fetchRealPrices, 12000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return prices;
}

function LiveMarketBar({ prices }: { prices: ReturnType<typeof useLivePrices> }) {
  const barItems = prices.filter((p) => p.cat !== "us_stock" && p.sym !== "INDIA VIX" && p.sym !== "DOW JONES");
  return (
    <div style={{ background: "#090B10", borderBottom: `1px solid ${C.border}`, padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap", position: "relative", display: "flex", alignItems: "center" }}>
      <div style={{ display: "inline-flex", gap: "32px", animation: "tickerScroll 42s linear infinite", paddingLeft: "20px" }}>
        {barItems.concat(barItems).map((p, idx) => (
          <div key={`${p.sym}-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: FONT_MONO, fontSize: "11.5px", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontWeight: 600, color: C.textSub }}>{p.sym}</span>
            <span style={{ fontWeight: 600, color: C.white }}>{p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: p.pct >= 0 ? C.green : C.red, fontWeight: 500, fontSize: "11px" }}>
              {p.pct >= 0 ? "+" : ""}{p.pct}%
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Sparkline({ up, width = 60, height = 24 }: { up: boolean; width?: number; height?: number }) {
  const pts = useRef(Array.from({ length: 20 }, (_, i) => 10 + (up ? i * 0.4 : -i * 0.4) + Math.sin(i) * 2));
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

function ChevronDown({ open }: { open?: boolean }) {
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s", marginLeft: 4 }}>
      <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── NAVIGATION BAR ───────────────────────────────────────────────────────────
function Nav({ page, isLoggedIn, userTier, onToggleTier, onNavigate, onLogout }: { page: string; isLoggedIn: boolean; userTier: UserTier; onToggleTier: (tier: UserTier) => void; onNavigate: (page: string) => void; onLogout: () => void; }) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState(0);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (navRef.current && e.target instanceof Node && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenSub(0);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dropdowns: Record<string, { label: string; target: string }[]> = {
    Markets: [
      { label: "Indian Equities", target: "IndStocks" },
      { label: "US Equities", target: "USStocks" },
      { label: "Commodities", target: "Markets" },
      { label: "Foreign Exchange", target: "Markets" },
    ],
    Resources: [
      { label: "Market Wire", target: "News" },
      { label: "Research Publications", target: "Research" },
      { label: "Quantitative Notes", target: "Blog" },
    ],
  };

  const productsMenu = [
    {
      label: "Standard Execution",
      columns: [
        { title: "Retail Suite", items: [
          { label: "Standard Web Terminal", target: "Terminal" },
          { label: "Indian Equities (NSE/BSE)", target: "IndStocks" },
          { label: "Direct Mutual Funds", target: "MutualFund" },
          { label: "US Equities (NYSE/NASDAQ)", target: "USStocks" },
        ]},
      ]
    },
    {
      label: "Institutional Pro",
      columns: [
        { title: "Desk Modules", items: [
          { label: "L2 Order Book & Options Desk", target: "Terminal" },
          { label: "Maestro Parallel Agent Grid", target: "Terminal" },
          { label: "MCP Protocol Tool Bus", target: "Terminal" },
          { label: "Vector Backtester & Node Flows", target: "Terminal" },
        ]}
      ]
    },
  ];

  function go(target: string) { setOpenMenu(null); setOpenSub(0); onNavigate(target); }

  const dropdownStyle: CSSProperties = {
    position: "absolute", top: "calc(100% + 8px)", left: 0, background: "#0B0D14", border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: "6px", minWidth: 210, boxShadow: "0 16px 40px rgba(0,0,0,0.65)", zIndex: 200,
  };

  const isPro = userTier === "premium";

  return (
    <nav ref={navRef} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(7,8,12,0.96)" : "#07080C", borderBottom: `1px solid ${C.border}`, transition: "all 0.2s ease", padding: "0 3%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60,
    }}>
      <div onClick={() => go("Home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <LogoIcon size={26} />
        <span style={{ color: C.white, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 14.5, letterSpacing: "0.05em" }}>
          GRANDLINE<span style={{ color: isPro ? C.proBlueLight : C.accentLight, marginLeft: 4 }}>CAPITAL</span>
        </span>
        {isLoggedIn && (
          <span style={{
            background: isPro ? C.proBlueGlow : "rgba(109, 40, 217, 0.15)",
            color: isPro ? C.proBlueLight : C.accentLight,
            border: `1px solid ${isPro ? C.proBlue : C.accent}`,
            fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.06em", fontFamily: FONT_MONO
          }}>
            {isPro ? "PRO DESK" : "STANDARD"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => go("Home")} style={navBtn(page === "Home")}>Overview</button>

        <div style={{ position: "relative" }}>
          <button onClick={() => { setOpenMenu(openMenu === "Products" ? null : "Products"); setOpenSub(0); }} style={navBtn(openMenu === "Products")}>
            Products <ChevronDown open={openMenu === "Products"} />
          </button>
          {openMenu === "Products" && (
            <div style={{ ...dropdownStyle, display: "flex", padding: 0, minWidth: 0 }}>
              <div style={{ width: 195, padding: 6, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
                {productsMenu.map((cat, i) => (
                  <div key={cat.label} onMouseEnter={() => setOpenSub(i)} onClick={() => setOpenSub(i)} style={{ padding: "9px 12px", borderRadius: 6, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: openSub === i ? C.white : C.textSub, background: openSub === i ? "rgba(255,255,255,0.05)" : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{cat.label}</span>
                    <span style={{ fontSize: 11, color: C.textMuted }}>/</span>
                  </div>
                ))}
              </div>
              {productsMenu[openSub] && (
                <div style={{ display: "flex", gap: 28, padding: "14px 20px" }}>
                  {productsMenu[openSub].columns.map((col, ci) => (
                    <div key={ci} style={{ minWidth: 200 }}>
                      {col.title && <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textMuted, marginBottom: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{col.title}</div>}
                      {col.items.map(item => (
                        <div key={item.label} onClick={() => go(item.target)} style={{ padding: "7px 8px", borderRadius: 5, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: C.textSub, marginBottom: 1 }} onMouseEnter={e => { e.currentTarget.style.color = C.white; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = "transparent"; }}>
                          {item.label}
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
              {key} <ChevronDown open={openMenu === key} />
            </button>
            {openMenu === key && (
              <div style={dropdownStyle}>
                {dropdowns[key].map((item) => (
                  <div key={item.label} onClick={() => go(item.target)} style={{ padding: "8px 12px", borderRadius: 5, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }} onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = C.white; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textSub; }}>
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button onClick={() => go("Terminal")} style={{
          ...navBtn(page === "Terminal"),
          color: isPro ? C.proBlueLight : (page === "Terminal" ? C.white : C.text),
          border: `1px solid ${isPro ? C.proBlue : C.borderGlow}`,
          background: page === "Terminal" ? (isPro ? C.proBlueGlow : "rgba(255,255,255,0.06)") : "transparent",
          fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600
        }}>
          {isPro ? "PRO TERMINAL" : "TERMINAL"}
        </button>

        {["AI Advisor", "About"].map((l) => ( <button key={l} onClick={() => go(l)} style={navBtn(page === l)}>{l}</button> ))}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isLoggedIn ? (
          <>
            <div style={{ display: "flex", background: "#0C0E14", border: `1px solid ${C.border}`, borderRadius: 6, padding: 2 }}>
              <button onClick={() => onToggleTier("standard")} style={{ background: userTier === "standard" ? C.borderGlow : "transparent", color: userTier === "standard" ? C.white : C.textSub, border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>STANDARD</button>
              <button onClick={() => onToggleTier("premium")} style={{ background: userTier === "premium" ? C.proBlue : "transparent", color: userTier === "premium" ? C.white : C.proBlueLight, border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}>PRO</button>
            </div>
            <button onClick={() => go("Dashboard")} style={{ background: C.bgCard, border: `1px solid ${isPro ? C.proBlue : C.border}`, color: C.text, padding: "6px 12px", borderRadius: 6, fontFamily: FONT_BODY, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              Portfolio
            </button>
            <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, color: C.textSub, padding: "6px 12px", borderRadius: 6, fontFamily: FONT_BODY, fontSize: 12.5, cursor: "pointer" }}>Sign Out</button>
          </>
        ) : (
          <>
            <button onClick={() => go("Login")} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text, padding: "6px 14px", borderRadius: 6, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer" }}>Sign In</button>
            <button onClick={() => go("Login")} style={{ background: C.accent, border: "none", color: C.white, padding: "6px 16px", borderRadius: 6, fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Client Access</button>
          </>
        )}
      </div>
    </nav>
  );
}

function navBtn(active: boolean): CSSProperties {
  return { background: active ? "rgba(255,255,255,0.06)" : "transparent", border: "1px solid transparent", cursor: "pointer", color: active ? C.white : C.textSub, fontFamily: FONT_BODY, fontSize: 13, padding: "6px 11px", borderRadius: 6, fontWeight: active ? 600 : 400, transition: "all 0.15s", display: "flex", alignItems: "center" };
}

function LogoIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="0" y="0" width="32" height="32" rx="6" fill={C.accent} opacity="0.18" />
      <rect x="6" y="19" width="3.5" height="8" rx="1" fill={C.accent} />
      <rect x="12" y="14" width="3.5" height="13" rx="1" fill={C.accentMid} />
      <rect x="18" y="9" width="3.5" height="18" rx="1" fill={C.accentLight} />
      <path d="M5 21 L26 6" stroke={C.white} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Tag({ children, color = C.accentLight }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: `${color}14`, color, border: `1px solid ${color}35`, padding: "3px 9px", borderRadius: 4, fontSize: 10.5, fontWeight: 600, fontFamily: FONT_MONO, letterSpacing: "0.06em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function SectionDivider() {
  return <div style={{ height: 1, background: C.border, margin: "0 4%" }} />;
}

// ─── HOME PAGE (CLEAN INSTITUTIONAL DARK THEME) ───────────────────────────────
function HomePage({ setPage }: { setPage: (page: string) => void }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ padding: "96px 8% 84px", textAlign: "center", position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sebi, border: `1px solid ${C.sebiBorder}`, borderRadius: 4, padding: "5px 14px", marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sebiText }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.sebiText, letterSpacing: "0.06em" }}>SEBI REGISTRATION IN PROCESS</span>
        </div>

        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(38px, 4.8vw, 64px)", fontWeight: 800, lineHeight: 1.1, margin: "0 auto 18px", maxWidth: 860, letterSpacing: "-0.03em", color: C.white }}>
          Institutional Market Infrastructure for Modern Capital
        </h1>

        <p style={{ fontFamily: FONT_BODY, fontSize: 16.5, color: C.textSub, maxWidth: 600, margin: "0 auto 36px", lineHeight: 1.7 }}>
          Unified multi-asset execution across Indian equities, global indices, fixed income, and private market deal flow. Available in Standard Retail and Pro Quantitative tiers.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("Login")} style={{ background: C.white, color: "#07080C", border: "none", padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 700, fontFamily: FONT_BODY, cursor: "pointer" }}>
            Access Platform
          </button>
          <button onClick={() => setPage("Research")} style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.borderGlow}`, padding: "13px 28px", borderRadius: 6, fontSize: 14, fontFamily: FONT_BODY, cursor: "pointer", fontWeight: 500 }}>
            Research & Documentation
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, maxWidth: 780, margin: "64px auto 0", overflow: "hidden" }}>
          {[
            { label: "ASSET CLASSES", val: "6" },
            { label: "INSTRUMENTS", val: "10,000+" },
            { label: "EXECUTION TIERS", val: "Standard / Pro" },
            { label: "MARKET FEED", val: "Real-Time" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "22px 16px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: C.white }}>{s.val}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textSub, marginTop: 6, letterSpacing: "0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div style={{ padding: "72px 8%" }}>
        <div style={{ marginBottom: 40 }}>
          <Tag color={C.accentLight}>MARKET COVERAGE</Tag>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, margin: "12px 0 8px", letterSpacing: "-0.02em", color: C.white }}>Multi-Asset Execution</h2>
          <p style={{ color: C.textSub, fontFamily: FONT_BODY, fontSize: 15, margin: 0 }}>Direct market access and research coverage across domestic and international venues.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { name: "Indian Equities", desc: "NSE & BSE cash equities, index derivatives, and ETFs", sub: "10,000+ listed securities", target: "IndStocks", badge: "ACTIVE" },
            { name: "US Equities", desc: "NYSE and NASDAQ listed equities and global ETFs", sub: "6,000+ securities", target: "USStocks", badge: "ACTIVE" },
            { name: "Commodities", desc: "Bullion, energy, and base metals spot and futures", sub: "MCX & international benchmarks", target: "Markets", badge: "ACTIVE" },
            { name: "Foreign Exchange", desc: "INR cross-currency pairs and G10 spot rates", sub: "Institutional liquidity", target: "Markets", badge: "ACTIVE" },
            { name: "Mutual Funds", desc: "Direct plan systematic investment and liquid schemes", sub: "Zero distribution commission", target: "MutualFund", badge: "ACTIVE" },
            { name: "Private Markets", desc: "Late-stage pre-IPO placements and unlisted equity", sub: "Accredited allocation desk", target: "Private Market", badge: "INSTITUTIONAL" },
          ].map((a) => (
            <div key={a.name} onClick={() => setPage(a.target)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "24px", cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderGlow; }} onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: C.white }}>{a.name}</span>
                <Tag color={a.badge === "INSTITUTIONAL" ? C.proBlueLight : C.green}>{a.badge}</Tag>
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: C.textSub, marginBottom: 12, lineHeight: 1.5 }}>{a.desc}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionDivider />

      <div style={{ padding: "72px 8%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
          <div>
            <Tag color={C.proBlueLight}>RESEARCH & ADVISORY ENGINE</Tag>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 700, margin: "14px 0 14px", letterSpacing: "-0.02em", color: C.white, lineHeight: 1.2 }}>
              Quantitative Intelligence Connected to Live Market Feeds
            </h2>
            <p style={{ fontFamily: FONT_BODY, color: C.textSub, fontSize: 15, lineHeight: 1.75, marginBottom: 24 }}>
              Query real-time pricing, evaluate portfolio beta, and run multi-agent quantitative workflows directly against live NSE, BSE, and global market data.
            </p>
            <button onClick={() => setPage("AI Advisor")} style={{ background: C.accent, color: C.white, border: "none", padding: "11px 22px", borderRadius: 6, fontSize: 13.5, cursor: "pointer", fontFamily: FONT_BODY, fontWeight: 600 }}>
              Open Advisory Desk
            </button>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 24 }}>
            <ChatPreview />
          </div>
        </div>
      </div>

      <Footer setPage={setPage} />
    </div>
  );
}

function ChatPreview() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.textSub }}>GRANDLINE ADVISORY ENGINE</span>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>FEED: ACTIVE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ background: C.borderGlow, borderRadius: 6, padding: "10px 14px", maxWidth: "82%", fontFamily: FONT_BODY, fontSize: 13, color: C.white }}>Evaluate NIFTY 50 institutional positioning and key support levels.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div style={{ background: "#080A0F", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", maxWidth: "85%", fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.6, color: C.textSub }}>
            NIFTY 50 is consolidating near volume-weighted support at 22,500. Institutional cash flows remain net positive, with options open interest indicating put-writing support at the 22,400 strike.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE (STANDARD vs PREMIUM PRO WITH FULL BENEFITS) ──────────────────
function LoginPage({ onLogin, setPage }: { onLogin: (tier: UserTier) => void; setPage: (page: string) => void; }) {
  const [selectedTier, setSelectedTier] = useState<UserTier>("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onLogin(selectedTier);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 5%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24, width: "100%", maxWidth: 820 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 12 }}>
            <LogoIcon size={30} />
            <span style={{ color: C.white, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 17, letterSpacing: "0.05em" }}>
              GRANDLINE <span style={{ color: selectedTier === "premium" ? C.proBlueLight : C.accentLight }}>CAPITAL</span>
            </span>
          </div>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: "0 0 6px" }}>Select Execution Environment</h1>
          <p style={{ color: C.textSub, fontSize: 13.5, margin: 0 }}>Choose between the Standard Retail Terminal or the Pro Quantitative Suite.</p>
        </div>

        {/* Side-by-Side Tier Comparison */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Standard Card */}
          <div onClick={() => setSelectedTier("standard")} style={{ background: C.bgCard, border: `1px solid ${selectedTier === "standard" ? C.accentLight : C.border}`, borderRadius: 8, padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Tag color={C.accentLight}>STANDARD TIER</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.textSub }}>RETAIL EXECUTION</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 14px" }}>Standard Web Terminal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
              <div>- Standard Order Ticket (Delivery CNC & Intraday MIS)</div>
              <div>- Spot Price Charting & Key Valuation Multiples</div>
              <div>- Real-Time NSE, BSE, NYSE & NASDAQ Watchlist</div>
              <div>- Direct Mutual Fund & SIP Execution</div>
              <div>- Standard Portfolio Advisory Chat</div>
            </div>
          </div>

          {/* Premium Pro Card */}
          <div onClick={() => setSelectedTier("premium")} style={{
            background: selectedTier === "premium" ? "#080D1A" : C.bgCard,
            border: `1px solid ${selectedTier === "premium" ? C.proBlueLight : C.border}`,
            borderRadius: 8, padding: 24, cursor: "pointer",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Tag color={C.proBlueLight}>PRO INSTITUTIONAL</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.proBlueLight }}>QUANT DESK</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 14px" }}>Multi-Module Pro Terminal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              <div><strong style={{ color: C.proBlueLight }}>[F1] L2 Execution Desk:</strong> Market Depth, Options Greeks & VWAP/TWAP Algos</div>
              <div><strong style={{ color: C.proBlueLight }}>[F2] Maestro Agent Grid:</strong> 6 Parallel Quant Sessions in Isolated Worktrees</div>
              <div><strong style={{ color: C.proBlueLight }}>[F3] MCP Protocol Bus:</strong> 12 Financial Model Context Protocol Tools</div>
              <div><strong style={{ color: C.proBlueLight }}>[F4] Quant Backtester:</strong> Walk-Forward Sharpe, Sortino & Drawdown Simulation</div>
              <div><strong style={{ color: C.proBlueLight }}>[F5] Global Macro & AIS:</strong> Sovereign Yield Matrix & Maritime Chokepoints</div>
              <div><strong style={{ color: C.proBlueLight }}>[F6] Node Workflow Engine:</strong> Automated Signal-to-Order Execution Graph</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ background: C.bgCard, border: `1px solid ${selectedTier === "premium" ? C.proBlue : C.border}`, borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Institutional or retail email (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "11px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "11px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{
            background: selectedTier === "premium" ? C.proBlueMid : C.accent,
            color: C.white, border: "none", padding: "13px", borderRadius: 6, fontSize: 13.5, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em"
          }}>
            {selectedTier === "premium" ? "Authenticate Pro Institutional Terminal" : "Authenticate Standard Web Terminal"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── STANDARD NORMAL TERMINAL (CLEAN RETAIL WEB TRADING VIEW) ─────────────────
function StandardTerminalPage({
  prices,
  onUpgrade,
  onNavigate,
}: {
  prices: ReturnType<typeof useLivePrices>;
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}) {
  const [selectedSym, setSelectedSym] = useState("RELIANCE");
  const [search, setSearch] = useState("");
  const [chartRange, setChartRange] = useState("1M");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [productType, setProductType] = useState<"CNC" | "MIS">("CNC");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [qty, setQty] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const activeAsset = prices.find((p) => p.sym === selectedSym) || prices[0];
  const filteredWatchlist = prices.filter((p) =>
    p.sym.toLowerCase().includes(search.toLowerCase())
  );

  const estTotal = (Number(qty) || 0) * activeAsset.price;

  function placeRetailOrder() {
    setToast(
      `ORDER CONFIRMED: ${side} ${qty} ${selectedSym} (${productType} / ${orderType}) @ ${activeAsset.price.toLocaleString("en-IN")}`
    );
    setTimeout(() => setToast(null), 4500);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "16px 2%", fontFamily: FONT_BODY }}>
      {/* Top Header Strip */}
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
        padding: "12px 18px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Tag color={C.accentLight}>STANDARD TERMINAL</Tag>
          <span style={{ fontSize: 12.5, color: C.textSub }}>
            Retail Spot & Cash Equities Execution
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => onNavigate("Dashboard")}
            style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textSub, padding: "7px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
          >
            Portfolio Holdings
          </button>
          <button
            onClick={onUpgrade}
            style={{
              background: C.proBlueMid,
              color: C.white, border: "none", padding: "7px 14px", borderRadius: 6,
              fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}
          >
            Switch to Pro Institutional Terminal
          </button>
        </div>
      </div>

      {/* Main 3-Column Standard Retail Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr 310px", gap: 14 }}>
        {/* Left: Watchlist */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 8, letterSpacing: "0.05em" }}>
              MARKET WATCHLIST
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter symbol..."
              style={{
                width: "100%", background: "#07080C", border: `1px solid ${C.border}`,
                borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12.5, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ maxHeight: 520, overflowY: "auto" }}>
            {filteredWatchlist.map((p) => (
              <div
                key={p.sym}
                onClick={() => {
                  setSelectedSym(p.sym);
                  setLimitPrice(String(p.price));
                }}
                style={{
                  padding: "10px 14px",
                  borderBottom: `1px solid ${C.border}`,
                  cursor: "pointer",
                  background: selectedSym === p.sym ? "rgba(109, 40, 217, 0.12)" : "transparent",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: C.white }}>{p.sym}</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted, textTransform: "uppercase", marginTop: 2 }}>{p.cat}</div>
                </div>
                <div style={{ textAlign: "right", fontFamily: FONT_MONO }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text }}>
                    {p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: p.pct >= 0 ? C.green : C.red }}>
                    {p.pct >= 0 ? "+" : ""}{p.pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Price Chart + Key Fundamentals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: C.white, margin: 0 }}>
                    {activeAsset.sym}
                  </h2>
                  <Tag color={C.accentLight}>{activeAsset.cat.toUpperCase()}</Tag>
                </div>
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 4 }}>
                  Standard Spot Feed
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.white }}>
                  {activeAsset.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: activeAsset.pct >= 0 ? C.green : C.red }}>
                  {activeAsset.change >= 0 ? "+" : ""}{activeAsset.change} ({activeAsset.pct >= 0 ? "+" : ""}{activeAsset.pct}%)
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              {["1D", "1W", "1M", "6M", "1Y", "ALL"].map((rng) => (
                <button
                  key={rng}
                  onClick={() => setChartRange(rng)}
                  style={{
                    background: chartRange === rng ? C.accent : "transparent",
                    color: chartRange === rng ? C.white : C.textSub,
                    border: `1px solid ${chartRange === rng ? C.accent : C.border}`,
                    borderRadius: 4, padding: "4px 12px",
                    fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO
                  }}
                >
                  {rng}
                </button>
              ))}
            </div>

            <div style={{
              height: 230,
              background: "#080A0F",
              borderRadius: 6, border: `1px solid ${C.border}`, padding: 16,
              display: "flex", flexDirection: "column", justifyContent: "space-between"
            }}>
              <svg width="100%" height="185" viewBox="0 0 700 185">
                {[35, 85, 135].map((y) => (
                  <line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(255,255,255,0.04)" />
                ))}
                <path
                  d={
                    activeAsset.pct >= 0
                      ? "M0,150 Q120,135 220,115 T440,80 T700,30"
                      : "M0,40 Q120,65 220,85 T440,120 T700,155"
                  }
                  fill="none"
                  stroke={activeAsset.pct >= 0 ? C.green : C.red}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: C.textMuted, fontFamily: FONT_MONO }}>
                <span>09:15</span>
                <span>11:30</span>
                <span>13:30</span>
                <span>15:30</span>
              </div>
            </div>
          </div>

          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 12, letterSpacing: "0.05em" }}>
              KEY FUNDAMENTALS & METRICS ({activeAsset.sym})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "DAY HIGH", val: (activeAsset.price * 1.014).toFixed(2) },
                { label: "DAY LOW", val: (activeAsset.price * 0.988).toFixed(2) },
                { label: "52W HIGH", val: (activeAsset.price * 1.18).toFixed(0) },
                { label: "52W LOW", val: (activeAsset.price * 0.78).toFixed(0) },
                { label: "P/E MULTIPLE", val: "24.8x" },
                { label: "DIV YIELD", val: "1.15%" },
                { label: "VOLUME", val: "1.42M" },
                { label: "CONSENSUS", val: "OVERWEIGHT" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_MONO }}>{item.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: 13, color: C.white, marginTop: 4 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Standard Order Ticket */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 14, letterSpacing: "0.05em" }}>
              STANDARD ORDER TICKET · {activeAsset.sym}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {(["BUY", "SELL"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    background: side === s ? (s === "BUY" ? C.green : C.red) : "#07080C",
                    color: side === s ? "#07080C" : C.textSub,
                    border: `1px solid ${side === s ? "transparent" : C.border}`,
                    borderRadius: 6, padding: "9px",
                    fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FONT_MONO
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>PRODUCT</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button
                  onClick={() => setProductType("CNC")}
                  style={{
                    background: productType === "CNC" ? "rgba(109,40,217,0.18)" : "#07080C",
                    border: `1px solid ${productType === "CNC" ? C.accentLight : C.border}`,
                    color: productType === "CNC" ? C.white : C.textSub,
                    padding: "7px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO
                  }}
                >
                  CNC (DELIVERY)
                </button>
                <button
                  onClick={() => setProductType("MIS")}
                  style={{
                    background: productType === "MIS" ? "rgba(109,40,217,0.18)" : "#07080C",
                    border: `1px solid ${productType === "MIS" ? C.accentLight : C.border}`,
                    color: productType === "MIS" ? C.white : C.textSub,
                    padding: "7px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO
                  }}
                >
                  MIS (INTRADAY)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>ORDER TYPE</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {(["MARKET", "LIMIT"] as const).map((ot) => (
                  <button
                    key={ot}
                    onClick={() => setOrderType(ot)}
                    style={{
                      background: orderType === ot ? "rgba(109,40,217,0.18)" : "#07080C",
                      border: `1px solid ${orderType === ot ? C.accentLight : C.border}`,
                      color: orderType === ot ? C.white : C.textSub,
                      padding: "7px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO
                    }}
                  >
                    {ot}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>QUANTITY</label>
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width: "100%", background: "#07080C", border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "9px 10px", color: C.white, fontSize: 13, fontFamily: FONT_MONO, boxSizing: "border-box"
                }}
              />
            </div>

            {orderType === "LIMIT" && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>LIMIT PRICE</label>
                <input
                  type="number"
                  value={limitPrice || activeAsset.price}
                  onChange={(e) => setLimitPrice(e.target.value)}
                  style={{
                    width: "100%", background: "#07080C", border: `1px solid ${C.border}`,
                    borderRadius: 6, padding: "9px 10px", color: C.white, fontSize: 13, fontFamily: FONT_MONO, boxSizing: "border-box"
                  }}
                />
              </div>
            )}

            <div style={{
              background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px",
              marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: FONT_MONO
            }}>
              <span style={{ color: C.textSub }}>EST. VALUE</span>
              <strong style={{ color: C.white }}>
                {estTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </strong>
            </div>

            <button
              onClick={placeRetailOrder}
              style={{
                width: "100%",
                background: side === "BUY" ? C.green : C.red,
                color: "#07080C", border: "none", borderRadius: 6, padding: "11px",
                fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: FONT_MONO
              }}
            >
              SUBMIT {side} ORDER
            </button>

            {toast && (
              <div style={{
                marginTop: 10, padding: "9px 10px", background: "rgba(16, 185, 129, 0.12)",
                border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 11, fontFamily: FONT_MONO
              }}>
                {toast}
              </div>
            )}
          </div>

          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 6 }}>
              ADVISORY DESK
            </div>
            <p style={{ fontSize: 12.5, color: C.textSub, lineHeight: 1.5, margin: "0 0 12px" }}>
              Query the AI Advisor for fundamental analysis on {activeAsset.sym}, or switch to the Pro Terminal for L2 depth and MCP tools.
            </p>
            <button
              onClick={() => onNavigate("AI Advisor")}
              style={{
                width: "100%", background: C.borderGlow,
                color: C.white, border: `1px solid ${C.border}`, padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}
            >
              Open AI Advisor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRO TERMINAL (FINCEPT + MCP SERVER + MAESTRO 6-AGENT PARALLEL SUITE) ─────
type ProWorkspace = "L2_DESK" | "MAESTRO_GRID" | "MCP_BUS" | "QUANT_LAB" | "GLOBAL_MACRO" | "NODE_FLOW";

function ProTerminalPage({ prices, onDowngrade, onNavigate }: { prices: ReturnType<typeof useLivePrices>; onDowngrade: () => void; onNavigate: (page: string) => void; }) {
  const [workspace, setWorkspace] = useState<ProWorkspace>("L2_DESK");
  const [selectedSym, setSelectedSym] = useState("HAL");
  const [timeframe, setTimeframe] = useState("5m");
  const [algoType, setAlgoType] = useState("VWAP");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("250");
  const [cmdInput, setCmdInput] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const [maestroPrompt, setMaestroPrompt] = useState("Analyze HAL & NIFTY 50 institutional positioning, options skew, and statistical arbitrage edge");
  const [maestroRunning, setMaestroRunning] = useState(false);
  const [agents, setAgents] = useState([
    { id: "AGT-01", name: "Equity Fundamental Analyst", worktree: "wt/fundamental-dcf", model: "Quantcept-Core", status: "COMPLETED", log: "[DCF Engine] HAL Fair Value 4,680 (+8.8% upside). Order book backlog 3.2x FY26E revenue; ROE 24.6%." },
    { id: "AGT-02", name: "Options & Volatility Desk", worktree: "wt/vol-surface-greeks", model: "Derivatives-LLM", status: "COMPLETED", log: "[Greeks Scanner] Call IV 20.1% vs Put IV 22.3%. 25-Delta Risk Reversal favors selling 4200 Put to fund 4400/4550 Call Spread." },
    { id: "AGT-03", name: "Macro & FX Correlation Agent", worktree: "wt/macro-fx-yields", model: "Macro-Sense", status: "STANDBY", log: "[Macro Feed] USD/INR stable at 96.10; India 10Y G-Sec yield 6.78%. FII net buyers +3,420 Cr in Defence & CapGoods." },
    { id: "AGT-04", name: "Statistical Arbitrage & Pairs", worktree: "wt/statarb-cointegration", model: "Alpha-Factor", status: "COMPLETED", log: "[Pair Cointegration] HAL vs BEL Z-Score at -1.84 (mean-reverting). Long HAL / Short 0.45x Index Beta shows 1.92 Sharpe." },
    { id: "AGT-05", name: "Backtest & Factor Discovery", worktree: "wt/vector-backtest", model: "Fincept-Quant", status: "ACTIVE", log: "[VectorBT] Running 5-year walk-forward VWAP breakout + RSI(14) filter: Win Rate 64.2%, Max DD -6.8%, CAGR +28.4%." },
    { id: "AGT-06", name: "Tail-Risk & VaR Sentinel", worktree: "wt/risk-var-stress", model: "Sentinel-Risk", status: "COMPLETED", log: "[99% 1D VaR] Portfolio VaR at 1.14% (within 2.0% institutional limit). Zero margin call risk under -3SD index shock." },
  ]);

  const [selectedMcpTool, setSelectedMcpTool] = useState("mcp.nse_option_chain");
  const [mcpOutput, setMcpOutput] = useState<string>(`{\n  "protocol": "mcp/1.0",\n  "server": "grandline-fincept-mcp-core",\n  "tool": "mcp.nse_option_chain",\n  "status": "READY",\n  "payload": {\n    "symbol": "HAL",\n    "pcr_oi": 1.28,\n    "max_pain": 4300,\n    "gamma_flip_level": 4265,\n    "institutional_flow": "BULLISH_ACCUMULATION"\n  }\n}`);

  const [btFastMa, setBtFastMa] = useState(12);
  const [btSlowMa, setBtSlowMa] = useState(26);
  const [btStopLoss, setBtStopLoss] = useState(2.5);
  const [workflowStatus, setWorkflowStatus] = useState("STANDBY — Select 'Execute Node Pipeline' to run all 5 stages");

  const activeAsset = prices.find((p) => p.sym === selectedSym) || prices[0];

  function handleCommand(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = cmdInput.trim().toUpperCase();
    if (cleaned === "F1") { setWorkspace("L2_DESK"); setCmdInput(""); return; }
    if (cleaned === "F2" || cleaned === "MAESTRO") { setWorkspace("MAESTRO_GRID"); setCmdInput(""); return; }
    if (cleaned === "F3" || cleaned === "MCP") { setWorkspace("MCP_BUS"); setCmdInput(""); return; }
    if (cleaned === "F4" || cleaned === "QUANT") { setWorkspace("QUANT_LAB"); setCmdInput(""); return; }
    if (cleaned === "F5" || cleaned === "MACRO") { setWorkspace("GLOBAL_MACRO"); setCmdInput(""); return; }
    if (cleaned === "F6" || cleaned === "FLOW") { setWorkspace("NODE_FLOW"); setCmdInput(""); return; }
    if (cleaned === "AI") { onNavigate("AI Advisor"); return; }

    const match = prices.find((p) => p.sym.includes(cleaned));
    if (match) { setSelectedSym(match.sym); setCmdInput(""); }
  }

  async function runAllMaestroAgents() {
    if (maestroRunning) return;
    setMaestroRunning(true);
    setAgents((prev) => prev.map((a) => ({ ...a, status: "ACTIVE", log: `[${a.worktree}] Executing parallel analysis on: "${maestroPrompt}"...` })));

    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", text: `Provide 6 concise 1-line institutional quant outputs separated by "|" for: 1. Fundamental DCF, 2. Options Greeks, 3. Macro/FX, 4. StatArb Pairs, 5. Backtest Metrics, 6. VaR Risk on: ${maestroPrompt}` }],
          prices,
          tier: "premium",
        }),
      });
      const data = await res.json();
      const parts = (data?.reply || "").split("|").map((s: string) => s.trim()).filter(Boolean);

      setAgents((prev) =>
        prev.map((a, idx) => ({
          ...a,
          status: "COMPLETED",
          log: parts[idx] || `[${a.worktree}] Completed analysis for ${selectedSym} @ ${activeAsset.price}: Institutional signal confirmed.`,
        }))
      );
    } catch {
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          status: "COMPLETED",
          log: `[${a.worktree}] Executed parallel quant pass on ${selectedSym} @ ${activeAsset.price}. Signal: Bullish accumulation.`,
        }))
      );
    } finally {
      setMaestroRunning(false);
    }
  }

  function invokeMcpTool(toolName: string) {
    setSelectedMcpTool(toolName);
    const now = new Date().toISOString();
    const payloads: Record<string, any> = {
      "mcp.yahoo_l2_quote": { symbol: selectedSym, ltp: activeAsset.price, change_pct: activeAsset.pct, bid_ask_spread_bps: 4.2, venue: "NSE_L2_DMA" },
      "mcp.nse_option_chain": { symbol: selectedSym, atm_strike: Math.round(activeAsset.price), call_iv: 20.1, put_iv: 22.3, pcr: 1.28, gamma_wall: Math.round(activeAsset.price * 1.03) },
      "mcp.backtest_vector": { symbol: selectedSym, strategy: "VWAP_Breakout_v4", cagr_pct: 29.4, sharpe: 2.18, sortino: 3.05, max_dd_pct: -6.4, trades: 184 },
      "mcp.portfolio_var_monte_carlo": { simulations: 10000, horizon: "1D", var_99_pct: 1.14, cvar_99_pct: 1.52, beta_to_nifty: 0.91 },
      "mcp.fii_dii_block_tape": { fii_net_cr: 3420, dii_net_cr: 1890, dark_pool_blocks: 14, largest_print: `${selectedSym} 450K @ ${activeAsset.price}` },
      "mcp.maritime_ais_chokepoint": { strait_hormuz_tankers: 142, malacca_containerships: 318, baltic_dry_index: 1892, crude_transit_risk: "MODERATE_LOW" },
    };
    setMcpOutput(JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random() * 9000 + 1000), timestamp: now, tool: toolName, status: "200_OK", result: payloads[toolName] || payloads["mcp.yahoo_l2_quote"] }, null, 2));
  }

  const baseP = activeAsset.price || 1000;
  const step = +(baseP * 0.0005).toFixed(2) || 0.5;
  const bids = Array.from({ length: 5 }, (_, i) => ({ price: +(baseP - step * (i + 1)).toFixed(2), size: Math.floor(120 + ((i * 73) % 450)), pct: Math.min(95, 25 + i * 12) }));
  const asks = Array.from({ length: 5 }, (_, i) => ({ price: +(baseP + step * (i + 1)).toFixed(2), size: Math.floor(110 + ((i * 91) % 420)), pct: Math.min(95, 20 + i * 13) }));

  const optionsChain = [
    { strike: Math.round(baseP * 0.98), callIv: "22.4", delta: "0.78", gamma: "0.02", putIv: "26.1", atm: false },
    { strike: Math.round(baseP * 0.99), callIv: "21.8", delta: "0.62", gamma: "0.04", putIv: "24.5", atm: false },
    { strike: Math.round(baseP), callIv: "20.1", delta: "0.51", gamma: "0.05", putIv: "22.3", atm: true },
    { strike: Math.round(baseP * 1.01), callIv: "19.5", delta: "0.38", gamma: "0.04", putIv: "20.8", atm: false },
    { strike: Math.round(baseP * 1.02), callIv: "18.9", delta: "0.22", gamma: "0.02", putIv: "19.2", atm: false },
  ];

  return (
    <div style={{
      background: C.proBg,
      minHeight: "100vh", color: C.text, padding: "12px 1.5%", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums"
    }}>
      {/* Top Institutional Function-Key Workspace Switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", background: C.proPanel, border: `1px solid ${C.proBorder}`, padding: 5, borderRadius: 6 }}>
        {[
          { id: "L2_DESK", key: "F1", label: "L2 EXECUTION & OPTIONS" },
          { id: "MAESTRO_GRID", key: "F2", label: "MAESTRO 6-AGENT GRID" },
          { id: "MCP_BUS", key: "F3", label: "MCP PROTOCOL BUS" },
          { id: "QUANT_LAB", key: "F4", label: "VECTOR BACKTESTER" },
          { id: "GLOBAL_MACRO", key: "F5", label: "MACRO & MARITIME AIS" },
          { id: "NODE_FLOW", key: "F6", label: "NODE WORKFLOW ENGINE" },
        ].map((tab) => {
          const active = workspace === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setWorkspace(tab.id as ProWorkspace)}
              style={{
                flex: 1, minWidth: 160,
                background: active ? C.proBlue : "transparent",
                border: `1px solid ${active ? C.proBlueLight : C.proBorder}`,
                color: active ? C.white : C.textSub,
                padding: "8px 10px", borderRadius: 4, cursor: "pointer",
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: active ? 700 : 500,
                display: "flex", alignItems: "center", gap: 8
              }}
            >
              <span style={{ background: active ? "#05070B" : "rgba(59,130,246,0.15)", color: C.proBlueLight, padding: "2px 5px", borderRadius: 3, fontSize: 10, fontWeight: 700 }}>{tab.key}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Command Line Interface Bar */}
      <form onSubmit={handleCommand} style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: "7px 12px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ background: C.proBlue, color: C.white, fontWeight: 700, fontSize: 10.5, padding: "3px 8px", borderRadius: 3 }}>CMD</span>
        <input value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} placeholder="Enter symbol (HAL, RELIANCE, NVDA) or module code (F1-F6, MAESTRO, MCP, QUANT, MACRO, FLOW)..." style={{ flex: 1, background: "transparent", border: "none", color: C.proBlueLight, fontSize: 12, fontFamily: FONT_MONO, outline: "none" }} />
        <span style={{ fontSize: 10.5, color: C.textSub }}>MCP: <strong style={{ color: C.cyan }}>12 REGISTERED</strong></span>
        <span style={{ fontSize: 10.5, color: C.textSub }}>WORKTREES: <strong style={{ color: C.green }}>6 ONLINE</strong></span>
        <button type="button" onClick={onDowngrade} style={{ background: "transparent", border: `1px solid ${C.proBorder}`, color: C.textSub, padding: "4px 10px", borderRadius: 4, fontSize: 10.5, cursor: "pointer", fontFamily: FONT_MONO }}>
          STANDARD VIEW
        </button>
      </form>

      {/* ─── WORKSPACE F1: L2 EXECUTION & OPTIONS DESK ─── */}
      {workspace === "L2_DESK" && (
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 330px", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ padding: "9px 12px", borderBottom: `1px solid ${C.proBorder}`, fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, display: "flex", justifyContent: "space-between" }}><span>INSTRUMENT</span><span>CHG%</span></div>
              <div style={{ maxHeight: 330, overflowY: "auto" }}>
                {prices.map((p) => (
                  <div key={p.sym} onClick={() => setSelectedSym(p.sym)} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.proBorder}`, cursor: "pointer", background: selectedSym === p.sym ? C.proBlueGlow : "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5 }}>
                    <div><div style={{ fontWeight: 600, color: C.white }}>{p.sym}</div><div style={{ fontSize: 9.5, color: C.textMuted }}>{p.cat.toUpperCase()}</div></div>
                    <div style={{ textAlign: "right" }}><div style={{ color: C.text, fontWeight: 600 }}>{p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div><div style={{ fontSize: 10.5, color: p.pct >= 0 ? C.green : C.red }}>{p.pct >= 0 ? "+" : ""}{p.pct}%</div></div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 8 }}>SECTOR RELATIVE STRENGTH</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  { name: "DEFENCE", chg: "+2.14%", up: true }, { name: "PSU BANK", chg: "+1.42%", up: true },
                  { name: "IT TECH", chg: "+0.88%", up: true }, { name: "ENERGY", chg: "+0.54%", up: true },
                  { name: "PHARMA", chg: "-0.31%", up: false }, { name: "AUTO EV", chg: "-0.68%", up: false },
                ].map((sec) => (
                  <div key={sec.name} style={{ background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: "7px 9px" }}>
                    <div style={{ fontSize: 9.5, color: C.textSub }}>{sec.name}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: sec.up ? C.green : C.red, marginTop: 2 }}>{sec.chg}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 20, fontWeight: 700, color: C.white }}>{activeAsset.sym}</span><Tag color={C.proBlueLight}>L2 DMA FEED</Tag></div>
                  <div style={{ fontSize: 10.5, color: C.textSub, marginTop: 4 }}>VWAP: {(activeAsset.price * 0.998).toFixed(2)} | SHARPE: 2.14 | IV RANK: 42.8% | RSI(14): 58.4</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.white }}>{activeAsset.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: activeAsset.pct >= 0 ? C.green : C.red }}>{activeAsset.change >= 0 ? "+" : ""}{activeAsset.change} ({activeAsset.pct >= 0 ? "+" : ""}{activeAsset.pct}%)</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${C.proBorder}` }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {["1m", "5m", "15m", "1H", "1D", "1W"].map((tf) => (
                    <button key={tf} onClick={() => setTimeframe(tf)} style={{ background: timeframe === tf ? C.proBlue : "transparent", color: timeframe === tf ? C.white : C.textSub, border: `1px solid ${timeframe === tf ? C.proBlueLight : C.proBorder}`, borderRadius: 4, padding: "3px 9px", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>{tf}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 14, fontSize: 10.5 }}>
                  <span style={{ color: C.cyan }}>VWAP BAND</span>
                  <span style={{ color: C.proBlueLight }}>BOLLINGER (20,2)</span>
                  <span style={{ color: C.green }}>DELTA CUMULATIVE</span>
                </div>
              </div>

              <div style={{ height: 200, background: "#05070B", borderRadius: 4, border: `1px solid ${C.proBorder}`, padding: 14 }}>
                <svg width="100%" height="170" viewBox="0 0 700 170">
                  {[30, 75, 120].map((y) => (<line key={y} x1="0" y1={y} x2="700" y2={y} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />))}
                  <path d="M0,120 Q140,95 280,80 T560,50 T700,30" fill="none" stroke={C.cyan} strokeWidth="1.2" strokeDasharray="4 4" />
                  <path d={activeAsset.pct >= 0 ? "M0,145 L50,132 L110,118 L170,124 L230,98 L290,88 L350,74 L410,82 L470,56 L530,48 L590,34 L650,28 L700,16" : "M0,25 L50,32 L110,48 L170,41 L230,65 L290,74 L350,90 L410,82 L470,104 L530,115 L590,122 L650,130 L700,140"} fill="none" stroke={activeAsset.pct >= 0 ? C.green : C.red} strokeWidth="2" />
                </svg>
              </div>
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                <span>OPTIONS CHAIN & GREEKS MATRIX ({activeAsset.sym})</span>
                <span>PCR OI: 1.28 | MAX PAIN: {Math.round(baseP)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1fr", fontSize: 10, color: C.textSub, borderBottom: `1px solid ${C.proBorder}`, paddingBottom: 6, marginBottom: 6 }}>
                <span>CALL IV</span><span>DELTA</span><span style={{ textAlign: "center" }}>STRIKE</span><span style={{ textAlign: "right" }}>GAMMA</span><span style={{ textAlign: "right" }}>PUT IV</span>
              </div>
              {optionsChain.map((opt, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1fr", fontSize: 11, padding: "5px 4px", background: opt.atm ? C.proBlueGlow : "transparent", borderRadius: 3 }}>
                  <span style={{ color: C.green }}>{opt.callIv}%</span>
                  <span>{opt.delta}</span>
                  <span style={{ textAlign: "center", fontWeight: 700, color: opt.atm ? C.proBlueLight : C.white }}>{opt.strike.toLocaleString("en-IN")} {opt.atm ? "ATM" : ""}</span>
                  <span style={{ textAlign: "right" }}>{opt.gamma}</span>
                  <span style={{ textAlign: "right", color: C.red }}>{opt.putIv}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 10, display: "flex", justifyContent: "space-between" }}><span>L2 ORDER BOOK DEPTH</span><span>SPREAD: 4.2 BPS</span></div>
              <div style={{ marginBottom: 6 }}>
                {asks.slice().reverse().map((a, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 6px", position: "relative", marginBottom: 2 }}>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${a.pct}%`, background: "rgba(239, 68, 68, 0.12)" }} />
                    <span style={{ color: C.red, zIndex: 1 }}>{a.price}</span><span style={{ color: C.textSub, zIndex: 1 }}>{a.size}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", padding: "5px", background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, fontWeight: 700, color: C.white, fontSize: 12, marginBottom: 6 }}>LTP: {activeAsset.price.toLocaleString("en-IN")}</div>
              <div>
                {bids.map((b, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 6px", position: "relative", marginBottom: 2 }}>
                    <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${b.pct}%`, background: "rgba(16, 185, 129, 0.12)" }} />
                    <span style={{ color: C.green, zIndex: 1 }}>{b.price}</span><span style={{ color: C.textSub, zIndex: 1 }}>{b.size}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 10 }}>ALGORITHMIC ORDER ROUTER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {(["BUY", "SELL"] as const).map((side) => (
                  <button key={side} onClick={() => setOrderSide(side)} style={{ background: orderSide === side ? (side === "BUY" ? C.green : C.red) : "#05070B", color: orderSide === side ? "#05070B" : C.textSub, border: `1px solid ${orderSide === side ? "transparent" : C.proBorder}`, padding: "7px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}>{side}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {["VWAP", "TWAP", "ICEBERG", "SOR"].map((st) => (
                  <button key={st} onClick={() => setAlgoType(st)} style={{ flex: 1, background: algoType === st ? C.proBlueGlow : "#05070B", border: `1px solid ${algoType === st ? C.proBlueLight : C.proBorder}`, color: algoType === st ? C.proBlueLight : C.textSub, padding: "5px 4px", borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>{st}</button>
                ))}
              </div>
              <input value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: "100%", background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: "7px 10px", color: C.white, fontFamily: FONT_MONO, fontSize: 12.5, boxSizing: "border-box", marginBottom: 10 }} />
              <button onClick={() => { setOrderStatus(`CONFIRMED [${algoType}]: ${orderSide} ${qty} ${selectedSym} @ ${activeAsset.price}`); setTimeout(() => setOrderStatus(null), 5000); }} style={{ width: "100%", background: orderSide === "BUY" ? C.green : C.red, color: "#05070B", border: "none", padding: "9px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}>
                TRANSMIT {algoType} {orderSide}
              </button>
              {orderStatus && <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(16, 185, 129, 0.12)", border: `1px solid ${C.green}`, borderRadius: 4, color: C.green, fontSize: 10.5 }}>{orderStatus}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ─── WORKSPACE F2: MAESTRO 6-AGENT PARALLEL GRID ─── */}
      {workspace === "MAESTRO_GRID" && (
        <div>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12, marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: C.proBlue, color: C.white, fontWeight: 700, fontSize: 10.5, padding: "5px 10px", borderRadius: 4 }}>MAESTRO DISPATCH</span>
            <input
              value={maestroPrompt}
              onChange={(e) => setMaestroPrompt(e.target.value)}
              placeholder="Enter institutional research directive for parallel execution across all 6 isolated worktrees..."
              style={{ flex: 1, background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: "8px 12px", color: C.white, fontFamily: FONT_MONO, fontSize: 12 }}
            />
            <button
              onClick={runAllMaestroAgents}
              disabled={maestroRunning}
              style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "9px 18px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}
            >
              {maestroRunning ? "EXECUTING 6 SESSIONS..." : "BROADCAST TO ALL 6 AGENTS"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {agents.map((ag) => (
              <div key={ag.id} style={{ background: C.proPanel, border: `1px solid ${ag.status === "ACTIVE" ? C.amber : C.proBorder}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 190 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${C.proBorder}` }}>
                    <div>
                      <span style={{ color: C.proBlueLight, fontWeight: 700, fontSize: 11.5 }}>{ag.id} | {ag.name}</span>
                      <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>BRANCH: {ag.worktree} | ENGINE: {ag.model}</div>
                    </div>
                    <span style={{
                      background: ag.status === "COMPLETED" ? "rgba(16,185,129,0.14)" : ag.status === "ACTIVE" ? "rgba(217,119,6,0.18)" : "rgba(255,255,255,0.05)",
                      color: ag.status === "COMPLETED" ? C.green : ag.status === "ACTIVE" ? C.amber : C.textSub,
                      padding: "2px 7px", borderRadius: 3, fontSize: 9.5, fontWeight: 700
                    }}>
                      {ag.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.text, lineHeight: 1.6, background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}`, minHeight: 80 }}>
                    {ag.log}
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 10, color: C.textMuted }}>
                  <span>STATE: SYNCHRONIZED</span>
                  <span style={{ color: C.proBlueLight, cursor: "pointer" }} onClick={runAllMaestroAgents}>RE-EXECUTE WORKTREE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WORKSPACE F3: FINCEPT MCP PROTOCOL TOOL BUS ─── */}
      {workspace === "MCP_BUS" && (
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 12 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 10 }}>REGISTERED MCP ENDPOINTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { name: "mcp.yahoo_l2_quote", desc: "Real-time L2 quote & DMA spread" },
                { name: "mcp.nse_option_chain", desc: "Greeks, PCR, Max Pain & Gamma wall" },
                { name: "mcp.backtest_vector", desc: "Vectorized walk-forward strategy test" },
                { name: "mcp.portfolio_var_monte_carlo", desc: "10,000-path Monte Carlo VaR engine" },
                { name: "mcp.fii_dii_block_tape", desc: "Institutional cash & dark-pool prints" },
                { name: "mcp.maritime_ais_chokepoint", desc: "Global tanker & container AIS feed" },
              ].map((t) => (
                <div
                  key={t.name}
                  onClick={() => invokeMcpTool(t.name)}
                  style={{
                    padding: "9px 11px", borderRadius: 4, cursor: "pointer",
                    background: selectedMcpTool === t.name ? C.proBlueGlow : "#05070B",
                    border: `1px solid ${selectedMcpTool === t.name ? C.proBlueLight : C.proBorder}`,
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: C.white }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: C.proBlueLight }}>JSON-RPC 2.0 PAYLOAD INSPECTOR | {selectedMcpTool}</span>
              <button onClick={() => invokeMcpTool(selectedMcpTool)} style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "6px 14px", borderRadius: 4, fontWeight: 700, fontSize: 10.5, cursor: "pointer", fontFamily: FONT_MONO }}>
                EXECUTE RPC CALL ({selectedSym})
              </button>
            </div>
            <pre style={{ background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: 16, color: C.green, fontSize: 12, lineHeight: 1.6, overflowX: "auto", margin: 0 }}>
              {mcpOutput}
            </pre>
          </div>
        </div>
      )}

      {/* ─── WORKSPACE F4: QUANT LAB & VECTOR BACKTESTER ─── */}
      {workspace === "QUANT_LAB" && (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 14 }}>VECTORBT PARAMETERS ({selectedSym})</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>Fast EMA Period: <strong style={{ color: C.white }}>{btFastMa}</strong></div>
              <input type="range" min={5} max={30} value={btFastMa} onChange={(e) => setBtFastMa(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>Slow EMA Period: <strong style={{ color: C.white }}>{btSlowMa}</strong></div>
              <input type="range" min={20} max={100} value={btSlowMa} onChange={(e) => setBtSlowMa(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: C.textSub, marginBottom: 4 }}>Stop-Loss Threshold (%): <strong style={{ color: C.white }}>{btStopLoss}%</strong></div>
              <input type="range" min={1} max={8} step={0.5} value={btStopLoss} onChange={(e) => setBtStopLoss(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ padding: 12, background: "#05070B", borderRadius: 4, border: `1px solid ${C.proBorder}`, fontSize: 11.5, lineHeight: 1.8 }}>
              <div>ANNUALIZED CAGR: <strong style={{ color: C.green }}>+{(24.2 + (30 - btFastMa) * 0.3).toFixed(1)}%</strong></div>
              <div>SHARPE RATIO: <strong style={{ color: C.proBlueLight }}>{(1.85 + (btSlowMa % 10) * 0.04).toFixed(2)}</strong></div>
              <div>SORTINO RATIO: <strong style={{ color: C.cyan }}>2.94</strong></div>
              <div>MAX DRAWDOWN: <strong style={{ color: C.red }}>-{(btStopLoss * 2.1).toFixed(1)}%</strong></div>
              <div>WIN RATE: <strong style={{ color: C.white }}>64.8% (184 TRADES)</strong></div>
            </div>
          </div>

          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>WALK-FORWARD CUMULATIVE EQUITY CURVE (STRATEGY VS BENCHMARK)</div>
            <svg width="100%" height="260" viewBox="0 0 700 260" style={{ background: "#05070B", borderRadius: 4, border: `1px solid ${C.proBorder}`, padding: 12 }}>
              <path d="M0,230 L100,215 L200,198 L300,185 L400,160 L500,145 L600,125 L700,105" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M0,230 L100,195 L200,165 L300,140 L400,105 L500,72 L600,45 L700,18" fill="none" stroke={C.proBlueLight} strokeWidth="2.5" />
            </svg>
          </div>
        </div>
      )}

      {/* ─── WORKSPACE F5: GLOBAL MACRO, MARITIME AIS & GEOPOLITICS ─── */}
      {workspace === "GLOBAL_MACRO" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>SOVEREIGN 10Y YIELDS & CENTRAL BANK POLICY MATRIX</div>
            {[
              { country: "INDIA (RBI)", rate: "6.50%", y10: "6.78%", cpi: "4.85%", bias: "NEUTRAL_HOLD" },
              { country: "UNITED STATES (FED)", rate: "4.50%", y10: "4.18%", cpi: "2.60%", bias: "DOVISH_CYCLE" },
              { country: "SINGAPORE (MAS)", rate: "S$NEER", y10: "2.84%", cpi: "2.40%", bias: "SLOPE_STEADY" },
              { country: "JAPAN (BOJ)", rate: "0.25%", y10: "1.06%", cpi: "2.70%", bias: "TIGHTENING_BIAS" },
            ].map((m) => (
              <div key={m.country} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1.3fr", padding: "10px 0", borderBottom: `1px solid ${C.proBorder}`, fontSize: 11 }}>
                <span style={{ fontWeight: 700, color: C.white }}>{m.country}</span>
                <span>RATE: {m.rate}</span>
                <span style={{ color: C.cyan }}>10Y: {m.y10}</span>
                <span>CPI: {m.cpi}</span>
                <span style={{ color: C.proBlueLight, textAlign: "right" }}>{m.bias}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>MARITIME AIS CHOKEPOINTS & COMMODITY TRANSIT TELEMETRY</div>
            {[
              { route: "Strait of Hormuz (Crude/LNG)", vessels: "142 Active Tankers", wait: "0.8 Days", risk: "MODERATE", color: C.amber },
              { route: "Strait of Malacca (Asia Corridor)", vessels: "318 Containerships", wait: "0.3 Days", risk: "NORMAL", color: C.green },
              { route: "Suez / Bab el-Mandeb", vessels: "64 Vessels", wait: "4.2 Days", risk: "ELEVATED", color: C.red },
              { route: "JNPT Mumbai / Mundra Port", vessels: "89 Berth Active", wait: "0.5 Days", risk: "OPTIMAL", color: C.green },
            ].map((r) => (
              <div key={r.route} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.proBorder}`, fontSize: 11 }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.white }}>{r.route}</div>
                  <div style={{ fontSize: 10, color: C.textSub }}>{r.vessels} | Queue: {r.wait}</div>
                </div>
                <span style={{ color: r.color, border: `1px solid ${r.color}`, padding: "2px 7px", borderRadius: 3, fontSize: 9.5, fontWeight: 700 }}>{r.risk}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── WORKSPACE F6: VISUAL NODE WORKFLOW BUILDER ─── */}
      {workspace === "NODE_FLOW" && (
        <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.proBlueLight }}>AUTOMATED QUANT NODE PIPELINE</div>
              <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{workflowStatus}</div>
            </div>
            <button
              onClick={() => setWorkflowStatus(`PIPELINE EXECUTED [${new Date().toLocaleTimeString()}] — Signal: BUY ${selectedSym} routed to VWAP engine`)}
              style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "9px 18px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}
            >
              EXECUTE NODE PIPELINE
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, alignItems: "center" }}>
            {[
              { step: "STAGE 01", title: "L2 Market Stream", detail: `${selectedSym} @ ${activeAsset.price}` },
              { step: "STAGE 02", title: "MCP Options Filter", detail: "PCR > 1.20 & IV < 25%" },
              { step: "STAGE 03", title: "Maestro Consensus", detail: "6/6 Worktrees Bullish" },
              { step: "STAGE 04", title: "VaR Risk Gate", detail: "99% VaR < 1.5% Limit" },
              { step: "STAGE 05", title: "VWAP Algo Router", detail: `Auto-Route ${qty} Qty` },
            ].map((n) => (
              <div key={n.step} style={{ background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
                <div style={{ fontSize: 9.5, color: C.proBlueLight, fontWeight: 700 }}>{n.step}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: C.white, margin: "6px 0" }}>{n.title}</div>
                <div style={{ fontSize: 10.5, color: C.green }}>{n.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI ADVISOR PAGE (TIER-AWARE: STANDARD vs QUANT AI PRO) ───────────────────
function AIAdvisorPage({ prices, userTier, onUpgrade }: { prices?: any; userTier: UserTier; onUpgrade: () => void; }) {
  const isPremium = userTier === "premium";
  const [messages, setMessages] = useState([
    { role: "ai", text: isPremium ? "Grandline Quant AI Pro initialized (MCP + Maestro connected). Live access to L2 market depth, Options Greeks, FII/DII flows, and macro correlation models is active." : "Grandline Advisory Desk initialized. Query real-time market pricing, portfolio allocation, or systematic investment strategies." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const suggestions = isPremium
    ? ["Institutional quant & VWAP view on HAL", "Design a delta-neutral options hedge", "Analyze FII inflows impact on NIFTY 50"]
    : ["Current outlook on HAL stock", "NIFTY 50 support and resistance this week", "Optimal SIP allocation for 25,000/month"];

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const updatedMessages = [...messages, { role: "user", text }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.slice(1), prices, tier: userTier }),
      });
      const textData = await res.text();
      let data: any = {};
      try { data = JSON.parse(textData); } catch { data = { reply: "System Error: Invalid response format." }; }
      setMessages((m) => [...m, { role: "ai", text: data?.reply || "System Error: Empty response." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Network Error: Unable to reach advisory endpoint." }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, paddingTop: 28, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 6% 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Tag color={isPremium ? C.proBlueLight : C.green}>{isPremium ? "QUANT AI PRO | MCP ENABLED" : "STANDARD ADVISORY"}</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, margin: "10px 0 4px", color: C.white }}>{isPremium ? "Quant AI Pro Desk" : "AI Investment Advisor"}</h1>
        </div>
        {!isPremium && (
          <button onClick={onUpgrade} style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "9px 18px", borderRadius: 6, fontWeight: 600, fontSize: 12.5, cursor: "pointer" }}>Switch to Quant AI Pro</button>
        )}
      </div>

      <div style={{ flex: 1, margin: "0 6%", background: C.bgCard, border: `1px solid ${isPremium ? C.proBlue : C.border}`, borderRadius: 8, display: "flex", flexDirection: "column", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "54vh" }}>
          {messages.map((m: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-start" }}>
              {m.role === "ai" && (
                <div style={{ width: 28, height: 28, borderRadius: 4, background: isPremium ? C.proBlue : C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: FONT_MONO, fontSize: 10, fontWeight: 700, color: C.white }}>
                  AI
                </div>
              )}
              <div style={{ background: m.role === "user" ? C.borderGlow : "#07080C", border: `1px solid ${m.role === "ai" ? (isPremium ? C.proBorder : C.border) : C.borderGlow}`, borderRadius: 6, padding: "11px 15px", maxWidth: "72%", fontFamily: FONT_BODY, fontSize: 13.5, lineHeight: 1.65, color: C.text, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          ))}
          {loading && <div style={{ color: isPremium ? C.proBlueLight : C.textSub, fontSize: 12, fontFamily: FONT_MONO }}>PROCESSING MARKET TELEMETRY...</div>}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "10px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {suggestions.map((s) => (
            <button key={s} onClick={() => sendMessage(s)} style={{ background: "#07080C", border: `1px solid ${C.border}`, color: C.textSub, padding: "5px 12px", borderRadius: 4, fontSize: 12, cursor: "pointer", fontFamily: FONT_BODY }}>{s}</button>
          ))}
        </div>
        <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(input)} placeholder="Enter query..." style={{ flex: 1, background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ background: input.trim() ? (isPremium ? C.proBlueMid : C.accent) : C.border, color: C.white, border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 13, cursor: input.trim() ? "pointer" : "default", fontWeight: 600 }}>Transmit</button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ prices, userTier, onUpgrade, onNavigate }: { prices: any; userTier: UserTier; onUpgrade: () => void; onNavigate: (page: string) => void; }) {
  const isPremium = userTier === "premium";
  const portfolio = [
    { sym: "RELIANCE", qty: 25, avg: 1210, ltp: prices.find((p: any) => p.sym === "RELIANCE")?.price || 1278 },
    { sym: "HAL", qty: 15, avg: 4100, ltp: prices.find((p: any) => p.sym === "HAL")?.price || 4300 },
    { sym: "GOLD", qty: 5, avg: 135000, ltp: prices.find((p: any) => p.sym === "GOLD")?.price || 143750 },
  ];
  const totalInvested = portfolio.reduce((s, p) => s + p.avg * p.qty, 0);
  const totalCurrent = portfolio.reduce((s, p) => s + p.ltp * p.qty, 0);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = ((pnl / totalInvested) * 100).toFixed(2);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "36px 5%", fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <Tag color={isPremium ? C.proBlueLight : C.accentLight}>{isPremium ? "PRO INSTITUTIONAL ACCOUNT" : "STANDARD RETAIL ACCOUNT"}</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, margin: "10px 0 0", color: C.white }}>Portfolio Summary</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onNavigate("Terminal")} style={{ background: isPremium ? C.proBlueMid : C.bgCard, border: `1px solid ${isPremium ? C.proBlueLight : C.borderGlow}`, color: C.white, padding: "9px 16px", borderRadius: 6, fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>
            {isPremium ? "Open Pro Terminal" : "Open Standard Terminal"}
          </button>
          {!isPremium && (
            <button onClick={onUpgrade} style={{ background: C.proBlueMid, border: "none", color: C.white, padding: "9px 16px", borderRadius: 6, fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "NET LIQUIDATION VALUE", val: `INR ${totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: "Marked-to-market", color: C.white },
          { label: "UNREALIZED P&L", val: `${pnl >= 0 ? "+" : ""}INR ${pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, sub: `${pnlPct}% total return`, color: pnl >= 0 ? C.green : C.red },
          { label: "EXECUTION TIER", val: isPremium ? "Pro Institutional" : "Standard Retail", sub: isPremium ? "L2 + Maestro Enabled" : "Standard Spot Feed", color: isPremium ? C.proBlueLight : C.accentLight },
          { label: "MARGIN FACILITY", val: isPremium ? "4.0x Intraday" : "1.0x Cash", sub: isPremium ? "Institutional Line" : "Cash Collateral", color: C.green },
        ].map((k) => (
          <div key={k.label} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ fontSize: 10.5, color: C.textSub, marginBottom: 8, fontFamily: FONT_MONO }}>{k.label}</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 20, fontWeight: 700, color: k.color }}>{k.val}</div>
            <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 11, color: C.textSub }}>
          <span>OPEN POSITIONS</span>
          <span>MARKED TO MARKET</span>
        </div>
        {portfolio.map((pos, i) => {
          const gainAmt = (pos.ltp - pos.avg) * pos.qty;
          return (
            <div key={pos.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: i < portfolio.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", fontFamily: FONT_MONO }}>
              <div><div style={{ fontWeight: 600, fontSize: 13, color: C.white }}>{pos.sym}</div><div style={{ fontSize: 11, color: C.textSub }}>QTY: {pos.qty} | AVG: {pos.avg}</div></div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{pos.ltp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div style={{ color: gainAmt >= 0 ? C.green : C.red, fontSize: 12.5, fontWeight: 600 }}>{gainAmt >= 0 ? "+" : ""}{gainAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
              <Sparkline up={gainAmt >= 0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SECONDARY PAGES ────────────────────────────────────────────────────────
function MarketsPage({ prices }: { prices: any }) {
  const [filter, setFilter] = useState("all");
  const cats = ["all", "index", "stock", "us_stock", "commodity", "forex", "crypto"];
  const filtered = filter === "all" ? prices : prices.filter((p: any) => p.cat === filter);
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "36px 6%", fontVariantNumeric: "tabular-nums" }}>
      <Tag>LIVE MARKET TELEMETRY</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 700, margin: "12px 0 20px", color: C.white }}>Multi-Asset Quotes</h1>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <button key={c} onClick={() => setFilter(c)} style={{ background: filter === c ? C.accent : C.bgCard, border: `1px solid ${filter === c ? C.accent : C.border}`, color: filter === c ? C.white : C.textSub, padding: "6px 14px", borderRadius: 4, fontSize: 12, cursor: "pointer", textTransform: "uppercase", fontFamily: FONT_MONO }}>{c.replace("_", " ")}</button>
        ))}
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", fontFamily: FONT_MONO }}>
        {filtered.map((p: any, i: number) => (
          <div key={p.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1fr", padding: "12px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none", alignItems: "center", fontSize: 12.5 }}>
            <div><div style={{ fontWeight: 600, color: C.white }}>{p.sym}</div><div style={{ fontSize: 10.5, color: C.textMuted, textTransform: "uppercase" }}>{p.cat}</div></div>
            <div style={{ fontWeight: 600 }}>{p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <div style={{ color: p.change >= 0 ? C.green : C.red }}>{p.change >= 0 ? "+" : ""}{p.change.toFixed(2)}</div>
            <div style={{ color: p.pct >= 0 ? C.green : C.red, fontWeight: 600 }}>{p.pct >= 0 ? "+" : ""}{p.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndStocksPage({ prices }: { prices: any }) { return <MarketsPage prices={prices.filter((p: any) => p.cat === "stock" || p.sym === "NIFTY 50" || p.sym === "SENSEX")} />; }
function USStocksPage({ prices }: { prices: any }) { return <MarketsPage prices={prices.filter((p: any) => p.cat === "us_stock" || p.sym === "S&P 500" || p.sym === "NASDAQ")} />; }
function MutualFundPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "40px 6%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Direct Mutual Funds</h1></div>; }
function PrivateMarketPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "40px 6%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Private Markets & Pre-IPO</h1></div>; }
function NewsPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "40px 6%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Market Wire</h1></div>; }
function ResearchPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "40px 6%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Institutional Research</h1></div>; }
function BlogPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "40px 6%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Quantitative Notes</h1></div>; }
function AboutPage() { return <div style={{ minHeight: "100vh", color: C.text, padding: "60px 8%" }}><h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>About Grandline Capital</h1></div>; }

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage: (page: string) => void }) {
  return (
    <footer style={{ borderTop: `1px solid ${C.border}`, padding: "44px 8%", background: C.bgCard }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <LogoIcon size={24} />
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 13.5, color: C.white, letterSpacing: "0.05em" }}>GRANDLINE CAPITAL</span>
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: C.textSub, lineHeight: 1.7, maxWidth: 260, margin: 0 }}>
            Multi-asset execution and quantitative intelligence infrastructure for retail and institutional market participants.
          </p>
        </div>
        {[
          { title: "Markets", links: [{ label: "Indian Equities", target: "IndStocks" }, { label: "US Equities", target: "USStocks" }] },
          { title: "Execution", links: [{ label: "Standard Terminal", target: "Terminal" }, { label: "Pro Terminal", target: "Terminal" }] },
          { title: "Firm", links: [{ label: "Overview", target: "About" }, { label: "Research", target: "Research" }] },
        ].map((col) => (
          <div key={col.title}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, marginBottom: 12, color: C.white, letterSpacing: "0.05em" }}>{col.title.toUpperCase()}</div>
            {col.links.map((l) => (
              <div key={l.label} onClick={() => setPage(l.target)} style={{ fontSize: 12.5, color: C.textSub, marginBottom: 8, cursor: "pointer" }}>{l.label}</div>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>("standard");
  const prices = useLivePrices();

  function handleNavigate(target: string) {
    if (target === "Dashboard" && !isLoggedIn) {
      setPage("Login");
    } else {
      setPage(target);
    }
  }

  function handleLogin(chosenTier: UserTier) {
    setUserTier(chosenTier);
    setIsLoggedIn(true);
    setPage("Terminal");
  }

  function handleToggleTier(tier: UserTier) {
    setUserTier(tier);
    setIsLoggedIn(true);
    setPage("Terminal");
  }

  function handleUpgradeToPro() {
    setUserTier("premium");
    setIsLoggedIn(true);
    setPage("Terminal");
  }

  function handleDowngradeToStandard() {
    setUserTier("standard");
    setIsLoggedIn(true);
    setPage("Terminal");
  }

  function handleLogout() {
    setIsLoggedIn(false);
    setPage("Login");
  }

  const renderPage = () => {
    switch (page) {
      case "Home":
        return <HomePage setPage={handleNavigate} />;
      case "Terminal":
        return userTier === "premium" ? (
          <ProTerminalPage
            prices={prices}
            onDowngrade={handleDowngradeToStandard}
            onNavigate={handleNavigate}
          />
        ) : (
          <StandardTerminalPage
            prices={prices}
            onUpgrade={handleUpgradeToPro}
            onNavigate={handleNavigate}
          />
        );
      case "Markets":
        return <MarketsPage prices={prices} />;
      case "IndStocks":
        return <IndStocksPage prices={prices} />;
      case "USStocks":
        return <USStocksPage prices={prices} />;
      case "MutualFund":
        return <MutualFundPage />;
      case "Dashboard":
        return isLoggedIn ? (
          <DashboardPage
            prices={prices}
            userTier={userTier}
            onUpgrade={handleUpgradeToPro}
            onNavigate={handleNavigate}
          />
        ) : (
          <LoginPage onLogin={handleLogin} setPage={setPage} />
        );
      case "AI Advisor":
        return (
          <AIAdvisorPage
            prices={prices}
            userTier={userTier}
            onUpgrade={handleUpgradeToPro}
          />
        );
      case "Private Market":
        return <PrivateMarketPage />;
      case "About":
        return <AboutPage />;
      case "News":
        return <NewsPage />;
      case "Research":
        return <ResearchPage />;
      case "Blog":
        return <BlogPage />;
      case "Login":
        return <LoginPage onLogin={handleLogin} setPage={setPage} />;
      default:
        return <HomePage setPage={handleNavigate} />;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav
        page={page}
        isLoggedIn={isLoggedIn}
        userTier={userTier}
        onToggleTier={handleToggleTier}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <div key={page} style={{ paddingTop: 60 }}>
        <LiveMarketBar prices={prices} />
        {renderPage()}
      </div>
    </div>
  );
}