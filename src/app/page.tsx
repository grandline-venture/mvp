"use client";
import { useState, useEffect, useRef, type CSSProperties } from "react";

type UserTier = "standard" | "premium";

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
  gold: "#F59E0B",
  goldLight: "#FBBF24",
  green: "#10B981",
  red: "#EF4444",
  cyan: "#06B6D4",
  white: "#FFFFFF",
  gray: "#6B7280",
  text: "#E8E4F0",
  textSub: "#8B8099",
  textMuted: "#4E4860",
  sebi: "#1A3A2A",
  sebiBorder: "#2D6B4A",
  sebiText: "#4ADE80",
};

// Reusable Glassmorphism Surface Helper
const glassPanel = (
  tint = "rgba(255, 255, 255, 0.035)",
  border = "rgba(255, 255, 255, 0.11)"
): CSSProperties => ({
  background: tint,
  backdropFilter: "blur(24px) saturate(160%)",
  WebkitBackdropFilter: "blur(24px) saturate(160%)",
  border: `1px solid ${border}`,
  borderTop: "1px solid rgba(255, 255, 255, 0.22)",
  boxShadow:
    "0 20px 50px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
});

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
    tickers.map((t) => ({
      ...t,
      price: t.base,
      change: t.change ?? 0,
      pct: t.pct ?? 0,
      loaded: false,
    }))
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
      } catch {}
    }

    fetchRealPrices();
    const id = setInterval(fetchRealPrices, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return prices;
}

function LiveMarketBar({ prices }: { prices: ReturnType<typeof useLivePrices> }) {
  const barItems = prices.filter(
    (p) => p.cat !== "us_stock" && p.sym !== "INDIA VIX" && p.sym !== "DOW JONES"
  );
  return (
    <div
      style={{
        background: "rgba(11, 10, 18, 0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "10px 0",
        overflow: "hidden",
        whiteSpace: "nowrap",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          gap: "36px",
          animation: "tickerScroll 38s linear infinite",
          paddingLeft: "20px",
        }}
      >
        {barItems.concat(barItems).map((p, idx) => (
          <div
            key={`${p.sym}-${idx}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              fontFamily: FONT_BODY,
              fontSize: "12.5px",
            }}
          >
            <span style={{ fontWeight: 600, color: C.text }}>{p.sym}</span>
            <span style={{ fontWeight: 700, color: C.white }}>
              {p.price.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
            <span
              style={{
                color: p.pct >= 0 ? C.green : C.red,
                fontWeight: 600,
                fontSize: "11.5px",
              }}
            >
              {p.pct >= 0 ? "▲ +" : "▼ "}
              {p.pct}%
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function Sparkline({
  up,
  width = 60,
  height = 24,
}: {
  up: boolean;
  width?: number;
  height?: number;
}) {
  const pts = useRef(
    Array.from(
      { length: 20 },
      (_, i) => 10 + (up ? i * 0.4 : -i * 0.4) + Math.sin(i) * 2
    )
  );
  const data = pts.current;
  const min = Math.min(...data),
    max = Math.max(...data);
  const scale = (v: number) =>
    height - ((v - min) / (max - min + 0.001)) * (height - 4) - 2;
  const d = data
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${(i / (data.length - 1)) * width},${scale(v)}`
    )
    .join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <path
        d={d}
        fill="none"
        stroke={up ? C.green : C.red}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── NAVIGATION BAR ───────────────────────────────────────────────────────────
function Nav({
  page,
  isLoggedIn,
  userTier,
  onToggleTier,
  onNavigate,
  onLogout,
}: {
  page: string;
  isLoggedIn: boolean;
  userTier: UserTier;
  onToggleTier: (tier: UserTier) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}) {
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
      if (
        navRef.current &&
        e.target instanceof Node &&
        !navRef.current.contains(e.target)
      ) {
        setOpenMenu(null);
        setOpenSub(0);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const dropdowns: Record<string, { label: string; target: string }[]> = {
    Markets: [
      { label: "Market Overview", target: "Markets" },
      { label: "Indian Equities", target: "IndStocks" },
      { label: "US Stocks", target: "USStocks" },
      { label: "Mutual Funds", target: "MutualFund" },
      { label: "Private Markets", target: "Private Market" },
    ],
    Resources: [
      { label: "Market News", target: "News" },
      { label: "Research Reports", target: "Research" },
      { label: "Blog", target: "Blog" },
    ],
  };

  const productsMenu = [
    {
      label: "Broking & Distribution",
      columns: [
        {
          title: "Invest",
          items: [
            { label: "Indian Equities", target: "IndStocks" },
            { label: "Mutual Funds & SIPs", target: "MutualFund" },
            { label: "US Stocks (NYSE/NASDAQ)", target: "USStocks" },
            { label: "Unlisted & Pre-IPO", target: "Private Market" },
          ],
        },
        {
          title: "Trade (Pro)",
          items: [
            { label: "Bloomberg-Style Terminal", target: "Terminal" },
            { label: "Derivatives & F&O Desk", target: "Terminal" },
            { label: "TWAP / VWAP Algo Execution", target: "Terminal" },
            { label: "Currencies & Commodities", target: "Markets" },
          ],
        },
      ],
    },
    {
      label: "Prime Institutional",
      columns: [
        {
          title: "Grandline Prime",
          items: [
            { label: "Pro Terminal Access", target: "Terminal" },
            { label: "Quant AI Pro Advisor", target: "AI Advisor" },
            { label: "Priority Pre-IPO Allocations", target: "Private Market" },
            { label: "Dedicated Wealth Concierge", target: "Dashboard" },
          ],
        },
      ],
    },
  ];

  function go(target: string) {
    setOpenMenu(null);
    setOpenSub(0);
    onNavigate(target);
  }

  const dropdownStyle: CSSProperties = {
    position: "absolute",
    top: "calc(100% + 12px)",
    left: 0,
    ...glassPanel("rgba(12, 10, 22, 0.94)", "rgba(192, 132, 252, 0.25)"),
    borderRadius: 14,
    padding: "6px",
    minWidth: 220,
    zIndex: 200,
  };

  return (
    <nav
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled
          ? "rgba(7, 7, 10, 0.78)"
          : "rgba(7, 7, 10, 0.45)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        borderBottom: `1px solid ${
          scrolled ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)"
        }`,
        transition: "all 0.3s ease",
        padding: "0 4%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 64,
      }}
    >
      <div
        onClick={() => go("Home")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      >
        <LogoIcon size={30} />
        <span
          style={{
            color: C.white,
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 15.5,
            letterSpacing: "0.04em",
          }}
        >
          GRANDLINE
          <span style={{ color: C.accentLight, marginLeft: 4 }}>CAPITAL</span>
        </span>
        {isLoggedIn && userTier === "premium" && (
          <span
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#07070A",
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 12,
              letterSpacing: "0.08em",
            }}
          >
            PRIME
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <button onClick={() => go("Home")} style={navBtn(page === "Home")}>
          Home
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => {
              setOpenMenu(openMenu === "Products" ? null : "Products");
              setOpenSub(0);
            }}
            style={navBtn(openMenu === "Products")}
          >
            Products ▾
          </button>
          {openMenu === "Products" && (
            <div
              style={{
                ...dropdownStyle,
                display: "flex",
                padding: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: 210,
                  padding: 6,
                  borderRight: `1px solid ${C.border}`,
                  flexShrink: 0,
                }}
              >
                {productsMenu.map((cat, i) => (
                  <div
                    key={cat.label}
                    onMouseEnter={() => setOpenSub(i)}
                    onClick={() => setOpenSub(i)}
                    style={{
                      padding: "10px 13px",
                      borderRadius: 9,
                      cursor: "pointer",
                      fontFamily: FONT_BODY,
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: openSub === i ? C.white : C.text,
                      background:
                        openSub === i
                          ? "rgba(124,58,237,0.18)"
                          : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {cat.label} ›
                  </div>
                ))}
              </div>
              {productsMenu[openSub] && (
                <div style={{ display: "flex", gap: 28, padding: "16px 22px" }}>
                  {productsMenu[openSub].columns.map((col, ci) => (
                    <div key={ci} style={{ minWidth: 185 }}>
                      {col.title && (
                        <div
                          style={{
                            fontFamily: FONT_DISPLAY,
                            fontWeight: 700,
                            fontSize: 12.5,
                            color: C.accentLight,
                            marginBottom: 10,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {col.title}
                        </div>
                      )}
                      {col.items.map((item) => (
                        <div
                          key={item.label}
                          onClick={() => go(item.target)}
                          style={{
                            padding: "7px 8px",
                            borderRadius: 7,
                            cursor: "pointer",
                            fontFamily: FONT_BODY,
                            fontSize: 13,
                            color: C.textSub,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = C.white;
                            e.currentTarget.style.background =
                              "rgba(124,58,237,0.14)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = C.textSub;
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
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
            <button
              onClick={() => setOpenMenu(openMenu === key ? null : key)}
              style={navBtn(openMenu === key)}
            >
              {key} ▾
            </button>
            {openMenu === key && (
              <div style={dropdownStyle}>
                {dropdowns[key].map((item) => (
                  <div
                    key={item.label}
                    onClick={() => go(item.target)}
                    style={{
                      padding: "9px 13px",
                      borderRadius: 9,
                      cursor: "pointer",
                      fontFamily: FONT_BODY,
                      fontSize: 13.5,
                      color: C.text,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(124,58,237,0.16)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Bloomberg Terminal Nav Button */}
        <button
          onClick={() => go("Terminal")}
          style={{
            ...navBtn(page === "Terminal"),
            color:
              page === "Terminal" || userTier === "premium"
                ? C.goldLight
                : C.textSub,
            border:
              userTier === "premium"
                ? "1px solid rgba(245, 158, 11, 0.35)"
                : "1px solid transparent",
            background:
              page === "Terminal"
                ? "rgba(245, 158, 11, 0.16)"
                : "rgba(245, 158, 11, 0.06)",
          }}
        >
          ⚡ Pro Terminal
        </button>

        {["AI Advisor", "About"].map((l) => (
          <button key={l} onClick={() => go(l)} style={navBtn(page === l)}>
            {l}
          </button>
        ))}
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isLoggedIn ? (
          <>
            {/* Quick Tier Switcher Pill */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 2,
              }}
            >
              <button
                onClick={() => onToggleTier("standard")}
                style={{
                  background:
                    userTier === "standard" ? C.accent : "transparent",
                  color: userTier === "standard" ? C.white : C.textSub,
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Standard
              </button>
              <button
                onClick={() => onToggleTier("premium")}
                style={{
                  background:
                    userTier === "premium"
                      ? "linear-gradient(135deg, #F59E0B, #D97706)"
                      : "transparent",
                  color: userTier === "premium" ? "#07070A" : C.goldLight,
                  border: "none",
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ★ Prime Pro
              </button>
            </div>

            <div
              onClick={() => go("Dashboard")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px",
                borderRadius: 8,
                border: `1px solid ${
                  userTier === "premium" ? C.gold : C.border
                }`,
                cursor: "pointer",
                background: C.bgCard,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background:
                    userTier === "premium"
                      ? "linear-gradient(135deg, #F59E0B, #FBBF24)"
                      : `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 800,
                  color: userTier === "premium" ? "#07070A" : C.white,
                }}
              >
                {userTier === "premium" ? "PRO" : "STD"}
              </div>
              <span
                style={{
                  color: C.text,
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {userTier === "premium" ? "Prime Desk" : "Investor"}
              </span>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: `1px solid ${C.border}`,
                color: C.textSub,
                padding: "7px 14px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => go("Login")}
              style={{
                ...glassPanel("rgba(255,255,255,0.04)", "rgba(255,255,255,0.14)"),
                color: C.text,
                padding: "7px 16px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Log In
            </button>
            <button
              onClick={() => go("Login")}
              style={{
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
                border: "none",
                color: C.white,
                padding: "7px 18px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 600,
                boxShadow: `0 0 20px ${C.accentGlow}`,
              }}
            >
              Select Tier & Join
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function navBtn(active: boolean): CSSProperties {
  return {
    background: active ? "rgba(124,58,237,0.15)" : "transparent",
    border: "none",
    cursor: "pointer",
    color: active ? C.white : C.textSub,
    fontFamily: FONT_BODY,
    fontSize: 13.5,
    padding: "6px 12px",
    borderRadius: 8,
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 4,
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
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#lg1)" opacity="0.18" />
      <rect x="6" y="19" width="3.5" height="8" rx="1" fill={C.accent} opacity="0.7" />
      <rect x="12" y="14" width="3.5" height="13" rx="1" fill={C.accentMid} opacity="0.85" />
      <rect x="18" y="9" width="3.5" height="18" rx="1" fill={C.accentLight} />
      <path d="M5 21 L26 6" stroke={C.white} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="26" cy="6" r="2" fill={C.white} />
    </svg>
  );
}

function Tag({
  children,
  color = C.accent,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
        padding: "4px 11px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: FONT_BODY,
        letterSpacing: "0.05em",
        backdropFilter: "blur(8px)",
      }}
    >
      {children}
    </span>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)`,
        margin: "0 4%",
      }}
    />
  );
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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const offset =
    direction === "left"
      ? "translateX(-28px)"
      : direction === "right"
      ? "translateX(28px)"
      : "translateY(28px)";
  return (
    <div
      ref={ref}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate3d(0,0,0)" : offset,
        transition: `opacity 650ms ease ${delay}ms, transform 650ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── HOME PAGE WITH FULL GLASSMORPHISM ────────────────────────────────────────
function HomePage({
  setPage,
  prices,
  onSelectTierAndLogin,
}: {
  setPage: (page: string) => void;
  prices: ReturnType<typeof useLivePrices>;
  onSelectTierAndLogin: (tier: UserTier) => void;
}) {
  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Background Light Orbs for Glassmorphism Depth */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "8%",
          left: "12%",
          width: 520,
          height: 520,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "45%",
          right: "8%",
          width: 480,
          height: 480,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 70%)",
          filter: "blur(70px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          bottom: "5%",
          left: "28%",
          width: 560,
          height: 560,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Hero Section */}
      <div
        style={{
          padding: "100px 8% 90px",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Frosted Hero Glass Container */}
        <div
          style={{
            ...glassPanel(
              "rgba(255, 255, 255, 0.03)",
              "rgba(255, 255, 255, 0.12)"
            ),
            maxWidth: 1040,
            margin: "0 auto",
            borderRadius: 32,
            padding: "64px 48px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Specular Top Glow */}
          <div
            style={{
              position: "absolute",
              top: -120,
              left: "50%",
              transform: "translateX(-50%)",
              width: 600,
              height: 240,
              background:
                "radial-gradient(circle, rgba(192,132,252,0.22) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              ...glassPanel("rgba(26, 58, 42, 0.55)", "rgba(74, 222, 128, 0.35)"),
              borderRadius: 30,
              padding: "6px 16px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: C.sebiText,
              }}
            />
            <span
              style={{
                fontFamily: FONT_BODY,
                fontSize: 11.5,
                fontWeight: 600,
                color: C.sebiText,
                letterSpacing: "0.06em",
              }}
            >
              SEBI REGISTRATION IN PROCESS · DUAL-TIER ARCHITECTURE
            </span>
          </div>

          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(40px, 5.2vw, 72px)",
              fontWeight: 800,
              lineHeight: 1.08,
              margin: "0 auto 10px",
              maxWidth: 880,
              letterSpacing: "-0.03em",
              color: C.white,
            }}
          >
            The Institutional Platform
          </h1>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(40px, 5.2vw, 72px)",
              fontWeight: 700,
              lineHeight: 1.08,
              margin: "0 auto 24px",
              maxWidth: 880,
              letterSpacing: "-0.03em",
              fontStyle: "italic",
              background: `linear-gradient(135deg, ${C.accentLight} 0%, ${C.goldLight} 80%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            for Standard & Prime Investors
          </h1>

          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: 17,
              color: C.textSub,
              maxWidth: 620,
              margin: "0 auto 40px",
              lineHeight: 1.75,
            }}
          >
            Start with effortless multi-asset investing on{" "}
            <strong style={{ color: C.white }}>Grandline Standard</strong>, or
            unlock a full Bloomberg-grade execution terminal, Quant AI Pro, and
            priority Pre-IPO deal flow with{" "}
            <strong style={{ color: C.goldLight }}>Grandline Prime</strong>.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setPage("Login")}
              style={{
                background: C.white,
                color: "#0A0A10",
                border: "none",
                padding: "15px 34px",
                borderRadius: 50,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: FONT_BODY,
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(255,255,255,0.18)",
              }}
            >
              Choose Your Tier ›
            </button>
            <button
              onClick={() => onSelectTierAndLogin("premium")}
              style={{
                ...glassPanel(
                  "rgba(245, 158, 11, 0.14)",
                  "rgba(245, 158, 11, 0.45)"
                ),
                color: C.goldLight,
                padding: "15px 34px",
                borderRadius: 50,
                fontSize: 15,
                fontFamily: FONT_BODY,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              ⚡ Launch Bloomberg Pro Terminal
            </button>
          </div>

          {/* Frosted Glass Stats Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              marginTop: 56,
              ...glassPanel(
                "rgba(255, 255, 255, 0.04)",
                "rgba(255, 255, 255, 0.14)"
              ),
              borderRadius: 20,
              overflow: "hidden",
            }}
          >
            {[
              { label: "Asset Classes", val: "6+" },
              { label: "Live Instruments", val: "10,000+" },
              { label: "Execution Latency", val: "<12ms" },
              { label: "User Tiers", val: "Standard & Prime" },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 16px",
                  textAlign: "center",
                  borderRight:
                    i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 24,
                    fontWeight: 800,
                    color: C.white,
                  }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 11.5,
                    color: C.textSub,
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionDivider />

      {/* Two User Tiers Comparison (Glassmorphic Cards) */}
      <RevealOnScroll
        style={{ padding: "80px 8%", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Tag color={C.goldLight}>TWO TAILORED EXPERIENCES</Tag>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 38,
              fontWeight: 800,
              margin: "14px 0 12px",
              color: C.white,
            }}
          >
            Standard Retail vs. Grandline Prime
          </h2>
          <p
            style={{
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 16,
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            Select your account tier on the login screen to unlock the tools
            built for your investment style.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
            maxWidth: 1040,
            margin: "0 auto",
          }}
        >
          {/* Standard Tier Glass Card */}
          <div
            style={{
              ...glassPanel(
                "rgba(255, 255, 255, 0.035)",
                "rgba(255, 255, 255, 0.12)"
              ),
              borderRadius: 24,
              padding: 36,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <Tag color={C.accentLight}>STANDARD TIER</Tag>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.white,
                  }}
                >
                  ₹0 / month
                </span>
              </div>
              <h3
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.white,
                  margin: "0 0 10px",
                }}
              >
                Standard Investor
              </h3>
              <p
                style={{
                  color: C.textSub,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Clean, unified multi-asset investing for everyday wealth
                creation across India and US markets.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                {[
                  "Live NSE, BSE, NYSE & NASDAQ Equities",
                  "Direct Mutual Funds & Automated SIPs",
                  "Standard Grandline AI Advisor (Retail Mode)",
                  "Unified Portfolio Tracker & Risk Score",
                  "Market News, Blogs & Standard Research",
                ].map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13.5,
                      color: C.text,
                    }}
                  >
                    <span style={{ color: C.green, fontWeight: 700 }}>✓</span>{" "}
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => onSelectTierAndLogin("standard")}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
                color: C.white,
                border: "none",
                padding: "14px",
                borderRadius: 12,
                fontSize: 14.5,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Enter as Standard User →
            </button>
          </div>

          {/* Premium Tier Glass Card */}
          <div
            style={{
              ...glassPanel(
                "rgba(245, 158, 11, 0.06)",
                "rgba(245, 158, 11, 0.4)"
              ),
              borderRadius: 24,
              padding: 36,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 18,
                }}
              >
                <Tag color={C.goldLight}>★ GRANDLINE PRIME (PREMIUM)</Tag>
                <span
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 22,
                    fontWeight: 800,
                    color: C.goldLight,
                  }}
                >
                  Institutional
                </span>
              </div>
              <h3
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 26,
                  fontWeight: 800,
                  color: C.white,
                  margin: "0 0 10px",
                }}
              >
                Prime & Institutional Desk
              </h3>
              <p
                style={{
                  color: C.textSub,
                  fontSize: 14,
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                Full Bloomberg-like multi-pane terminal, quantitative AI
                modeling, algo execution, and private market allocations.
              </p>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginBottom: 28,
                }}
              >
                {[
                  "⚡ Bloomberg-Style Pro Terminal (Level-2 Order Book & Tape)",
                  "🧠 Quant AI Pro Advisor (Deep Derivatives, Hedging & Flow Alpha)",
                  "⚙️ Algorithmic Execution (TWAP, VWAP & Iceberg Orders)",
                  "🏛️ Priority Pre-IPO & Private Market Deal Allocations",
                  "📊 Institutional FII/DII Flow Radar & Sector Heatmap",
                  "🤝 Dedicated Family Office & Wealth Concierge Desk",
                ].map((f) => (
                  <div
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 13.5,
                      color: C.white,
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: C.goldLight, fontWeight: 800 }}>
                      ★
                    </span>{" "}
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => onSelectTierAndLogin("premium")}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                color: "#07070A",
                border: "none",
                padding: "14px",
                borderRadius: 12,
                fontSize: 14.5,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 10px 30px rgba(245, 158, 11, 0.25)",
              }}
            >
              Launch Prime Terminal & Pro AI →
            </button>
          </div>
        </div>
      </RevealOnScroll>

      <SectionDivider />

      {/* Asset Classes Grid (Frosted Glass Cards) */}
      <RevealOnScroll
        style={{ padding: "80px 8%", position: "relative", zIndex: 1 }}
      >
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h2
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 38,
              fontWeight: 800,
              margin: "0 0 14px",
              color: C.white,
            }}
          >
            Every Market. One Glassmorphic Ecosystem.
          </h2>
          <p
            style={{
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 16,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Trade and invest across all major asset classes from a unified,
            institutional-grade dashboard.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {[
            {
              name: "Indian Equities",
              desc: "NSE & BSE stocks, F&O, ETFs",
              sub: "10,000+ instruments",
              target: "IndStocks",
              badge: "LIVE",
            },
            {
              name: "US Stocks",
              desc: "NYSE, NASDAQ, ADRs",
              sub: "6,000+ instruments",
              target: "USStocks",
              badge: "LIVE",
            },
            {
              name: "Bloomberg Pro Terminal",
              desc: "Level-2 DOM, VWAP & Algo Desk",
              sub: "Grandline Prime Exclusive",
              target: "Terminal",
              badge: "PRIME PRO",
            },
            {
              name: "Forex & Commodities",
              desc: "Gold, Crude Oil, USD/INR",
              sub: "MCX & global exchanges",
              target: "Markets",
              badge: "LIVE",
            },
            {
              name: "Mutual Funds",
              desc: "Direct plans, SIPs & ELSS",
              sub: "3,000+ schemes",
              target: "MutualFund",
              badge: "LIVE",
            },
            {
              name: "Private Markets",
              desc: "Pre-IPO & Startup deals",
              sub: "Priority for Prime members",
              target: "Private Market",
              badge: "EXCLUSIVE",
            },
          ].map((a, i) => (
            <RevealOnScroll key={a.name} delay={i * 60}>
              <div
                onClick={() => setPage(a.target)}
                style={{
                  ...glassPanel(
                    a.badge === "PRIME PRO"
                      ? "rgba(245, 158, 11, 0.06)"
                      : "rgba(255, 255, 255, 0.035)",
                    a.badge === "PRIME PRO"
                      ? "rgba(245, 158, 11, 0.35)"
                      : "rgba(255, 255, 255, 0.12)"
                  ),
                  borderRadius: 18,
                  padding: "28px 26px",
                  cursor: "pointer",
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor =
                    a.badge === "PRIME PRO" ? C.goldLight : C.accentLight;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor =
                    a.badge === "PRIME PRO"
                      ? "rgba(245, 158, 11, 0.35)"
                      : "rgba(255, 255, 255, 0.12)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      ...glassPanel(
                        "rgba(124, 58, 237, 0.18)",
                        "rgba(192, 132, 252, 0.3)"
                      ),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background:
                          a.badge === "PRIME PRO"
                            ? C.goldLight
                            : `linear-gradient(135deg, ${C.accent}, ${C.accentLight})`,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      background:
                        a.badge === "PRIME PRO" || a.badge === "EXCLUSIVE"
                          ? `${C.gold}22`
                          : `${C.green}22`,
                      color:
                        a.badge === "PRIME PRO" || a.badge === "EXCLUSIVE"
                          ? C.goldLight
                          : C.green,
                      border: `1px solid ${
                        a.badge === "PRIME PRO" || a.badge === "EXCLUSIVE"
                          ? C.gold
                          : C.green
                      }40`,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {a.badge}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: 17,
                    color: C.white,
                    marginBottom: 6,
                  }}
                >
                  {a.name}
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 13.5,
                    color: C.textSub,
                    marginBottom: 8,
                  }}
                >
                  {a.desc}
                </div>
                <div
                  style={{
                    fontFamily: FONT_BODY,
                    fontSize: 11.5,
                    color: C.textMuted,
                  }}
                >
                  {a.sub}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </RevealOnScroll>

      <SectionDivider />

      {/* AI Section with Glass Preview */}
      <RevealOnScroll
        style={{ padding: "80px 8%", position: "relative", zIndex: 1 }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 60,
            alignItems: "center",
          }}
        >
          <RevealOnScroll direction="left">
            <Tag color={C.accentLight}>TIER-ADAPTIVE AI ENGINE</Tag>
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 38,
                fontWeight: 800,
                margin: "18px 0 18px",
                color: C.white,
                lineHeight: 1.15,
              }}
            >
              Standard Advisor or Quant AI Pro.
            </h2>
            <p
              style={{
                fontFamily: FONT_BODY,
                color: C.textSub,
                fontSize: 15.5,
                lineHeight: 1.8,
                marginBottom: 28,
              }}
            >
              Standard users get crisp, jargon-free guidance. Prime users unlock{" "}
              <strong style={{ color: C.goldLight }}>Quant AI Pro</strong>—with
              real-time VWAP positioning, FII/DII institutional flow models, and
              multi-leg options hedging.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setPage("AI Advisor")}
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
                  color: C.white,
                  border: "none",
                  padding: "13px 26px",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  fontWeight: 600,
                }}
              >
                Try AI Advisor →
              </button>
              <button
                onClick={() => setPage("Terminal")}
                style={{
                  ...glassPanel(
                    "rgba(255,255,255,0.05)",
                    "rgba(255,255,255,0.16)"
                  ),
                  color: C.white,
                  padding: "13px 26px",
                  borderRadius: 10,
                  fontSize: 14,
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  fontWeight: 600,
                }}
              >
                Open Terminal
              </button>
            </div>
          </RevealOnScroll>
          <RevealOnScroll
            direction="right"
            delay={120}
            style={{
              ...glassPanel(
                "rgba(255, 255, 255, 0.04)",
                "rgba(192, 132, 252, 0.28)"
              ),
              borderRadius: 22,
              padding: 26,
            }}
          >
            <ChatPreview />
          </RevealOnScroll>
        </div>
      </RevealOnScroll>

      <Footer setPage={setPage} />
    </div>
  );
}

function ChatPreview() {
  const msgs = [
    {
      role: "user",
      text: "Give me an institutional quant view on HAL and NIFTY 50.",
    },
    {
      role: "ai",
      text: "[QUANT AI PRO] NIFTY 50 is consolidating near VWAP with strong put-writing support at 22,500. HAL maintains high relative strength; consider a bull-call spread or accumulating on dips toward the 20-DMA.",
    },
  ];
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.green,
            }}
          />
          <span
            style={{ fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }}
          >
            Grandline Quant AI Pro — Live
          </span>
        </div>
        <Tag color={C.goldLight}>PRIME MODE</Tag>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background:
                  m.role === "user"
                    ? `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`
                    : "rgba(255,255,255,0.06)",
                border:
                  m.role === "ai"
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "none",
                borderRadius:
                  m.role === "user"
                    ? "14px 14px 2px 14px"
                    : "14px 14px 14px 2px",
                padding: "11px 15px",
                maxWidth: "85%",
                fontFamily: FONT_BODY,
                fontSize: 13,
                lineHeight: 1.6,
                color: C.text,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── BLOOMBERG-STYLE PRO TERMINAL PAGE (PREMIUM EXCLUSIVE) ────────────────────
function TerminalPage({
  prices,
  userTier,
  onUpgrade,
  onNavigate,
}: {
  prices: ReturnType<typeof useLivePrices>;
  userTier: UserTier;
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}) {
  const [selectedSym, setSelectedSym] = useState("NIFTY 50");
  const [timeframe, setTimeframe] = useState("5m");
  const [algoType, setAlgoType] = useState("VWAP");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [qty, setQty] = useState("100");
  const [cmdInput, setCmdInput] = useState("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  const activeAsset =
    prices.find((p) => p.sym === selectedSym) || prices[0];

  // If Standard user visits Terminal, show an interactive preview + 1-click upgrade banner
  const isLocked = userTier !== "premium";

  function handleCommand(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = cmdInput.trim().toUpperCase();
    const match = prices.find((p) => p.sym.includes(cleaned));
    if (match) {
      setSelectedSym(match.sym);
      setCmdInput("");
    } else if (cleaned === "AI" || cleaned === "QUANT") {
      onNavigate("AI Advisor");
    }
  }

  function executeAlgoOrder() {
    setOrderStatus(
      `✓ [${algoType} ALGO FILLED] ${orderSide} ${qty} units of ${selectedSym} @ ${activeAsset.price.toLocaleString(
        "en-IN"
      )}`
    );
    setTimeout(() => setOrderStatus(null), 5000);
  }

  // Generate synthetic Level-2 Order Book around live price
  const baseP = activeAsset.price || 1000;
  const step = +(baseP * 0.0005).toFixed(2) || 0.5;
  const bids = Array.from({ length: 6 }, (_, i) => ({
    price: +(baseP - step * (i + 1)).toFixed(2),
    size: Math.floor(120 + ((i * 73) % 450)),
    pct: Math.min(95, 25 + i * 12),
  }));
  const asks = Array.from({ length: 6 }, (_, i) => ({
    price: +(baseP + step * (i + 1)).toFixed(2),
    size: Math.floor(110 + ((i * 91) % 420)),
    pct: Math.min(95, 20 + i * 13),
  }));

  return (
    <div
      style={{
        background: "#050508",
        minHeight: "100vh",
        color: C.text,
        padding: "18px 2%",
        fontFamily: FONT_MONO,
      }}
    >
      {/* Upgrade Banner for Standard Users */}
      {isLocked && (
        <div
          style={{
            ...glassPanel(
              "rgba(245, 158, 11, 0.12)",
              "rgba(245, 158, 11, 0.5)"
            ),
            borderRadius: 14,
            padding: "16px 24px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                color: C.goldLight,
                fontWeight: 800,
                fontSize: 13,
                marginRight: 10,
              }}
            >
              🔒 GRANDLINE PRIME TERMINAL PREVIEW
            </span>
            <span style={{ color: C.text, fontSize: 13, fontFamily: FONT_BODY }}>
              You are currently logged in as a <strong>Standard</strong> user.
              Switch to <strong>Grandline Prime</strong> to unlock live Level-2
              execution and Algo routing.
            </span>
          </div>
          <button
            onClick={onUpgrade}
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#07070A",
              border: "none",
              padding: "9px 20px",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            Switch to Prime Now →
          </button>
        </div>
      )}

      {/* Bloomberg Command Bar */}
      <form
        onSubmit={handleCommand}
        style={{
          background: "#0C0B14",
          border: `1px solid ${C.gold}55`,
          borderRadius: 10,
          padding: "8px 14px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            background: C.gold,
            color: "#050508",
            fontWeight: 800,
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 4,
          }}
        >
          GL-TERM &gt;
        </span>
        <input
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder="Type ticker symbol (e.g. HAL, RELIANCE, NVDA, BITCOIN) or 'QUANT' + Enter..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: C.goldLight,
            fontSize: 13,
            fontFamily: FONT_MONO,
            outline: "none",
          }}
        />
        <span style={{ fontSize: 11, color: C.textSub }}>
          FEED: <strong style={{ color: C.green }}>● LOW-LATENCY L2</strong>
        </span>
        <span style={{ fontSize: 11, color: C.textSub }}>
          DESK: <strong style={{ color: C.goldLight }}>INSTITUTIONAL</strong>
        </span>
      </form>

      {/* Main 3-Column Bloomberg Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr 330px",
          gap: 12,
        }}
      >
        {/* Left Column: Watchlist & Sector Heatmap */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              background: "#0B0A12",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${C.border}`,
                fontSize: 11,
                fontWeight: 700,
                color: C.goldLight,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>INSTITUTIONAL WATCH</span>
              <span>CHG%</span>
            </div>
            <div style={{ maxHeight: 370, overflowY: "auto" }}>
              {prices.map((p) => (
                <div
                  key={p.sym}
                  onClick={() => setSelectedSym(p.sym)}
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    background:
                      selectedSym === p.sym
                        ? "rgba(245, 158, 11, 0.14)"
                        : "transparent",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: C.white }}>
                      {p.sym}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>
                      {p.cat.toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.text, fontWeight: 600 }}>
                      {p.price.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: p.pct >= 0 ? C.green : C.red,
                      }}
                    >
                      {p.pct >= 0 ? "+" : ""}
                      {p.pct}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sector Alpha Heatmap */}
          <div
            style={{
              background: "#0B0A12",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.goldLight,
                marginBottom: 10,
              }}
            >
              SECTOR FLOW HEATMAP
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
              }}
            >
              {[
                { name: "DEFENCE", chg: "+2.14%", up: true },
                { name: "PSU BANK", chg: "+1.42%", up: true },
                { name: "IT TECH", chg: "+0.88%", up: true },
                { name: "ENERGY", chg: "+0.54%", up: true },
                { name: "PHARMA", chg: "-0.31%", up: false },
                { name: "AUTO EV", chg: "-0.68%", up: false },
              ].map((sec) => (
                <div
                  key={sec.name}
                  style={{
                    background: sec.up
                      ? "rgba(16, 185, 129, 0.14)"
                      : "rgba(239, 68, 68, 0.14)",
                    border: `1px solid ${sec.up ? C.green : C.red}40`,
                    borderRadius: 6,
                    padding: "8px 10px",
                  }}
                >
                  <div style={{ fontSize: 10, color: C.text }}>{sec.name}</div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: sec.up ? C.green : C.red,
                    }}
                  >
                    {sec.chg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Multi-Indicator Chart + Institutional Flow Metrics */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              background: "#0B0A12",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{ fontSize: 22, fontWeight: 800, color: C.white }}
                  >
                    {activeAsset.sym}
                  </span>
                  <Tag color={C.goldLight}>L2 INSTITUTIONAL FEED</Tag>
                </div>
                <div style={{ fontSize: 11, color: C.textSub, marginTop: 4 }}>
                  VWAP: {(activeAsset.price * 0.998).toFixed(2)} · IV RANK:
                  42.8% · RSI(14): 58.4
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.white }}>
                  {activeAsset.price.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: activeAsset.pct >= 0 ? C.green : C.red,
                  }}
                >
                  {activeAsset.change >= 0 ? "+" : ""}
                  {activeAsset.change} ({activeAsset.pct >= 0 ? "+" : ""}
                  {activeAsset.pct}%)
                </div>
              </div>
            </div>

            {/* Timeframe & Indicator Bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                {["1m", "5m", "15m", "1H", "1D", "1W"].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    style={{
                      background:
                        timeframe === tf ? C.gold : "rgba(255,255,255,0.04)",
                      color: timeframe === tf ? "#050508" : C.textSub,
                      border: "none",
                      borderRadius: 5,
                      padding: "4px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                <span style={{ color: C.cyan }}>● VWAP BAND</span>
                <span style={{ color: C.accentLight }}>● EMA 20</span>
                <span style={{ color: C.goldLight }}>● VOL PROFILE</span>
              </div>
            </div>

            {/* Terminal SVG Chart */}
            <div
              style={{
                height: 250,
                background:
                  "linear-gradient(180deg, rgba(124,58,237,0.08) 0%, rgba(5,5,8,0.9) 100%)",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.05)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <svg width="100%" height="190" viewBox="0 0 700 190">
                {/* Grid lines */}
                {[30, 75, 120, 165].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="700"
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* VWAP Curve */}
                <path
                  d="M0,140 Q140,120 280,105 T560,75 T700,55"
                  fill="none"
                  stroke={C.cyan}
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                />
                {/* Main Price Action */}
                <path
                  d={
                    activeAsset.pct >= 0
                      ? "M0,155 L50,148 L110,132 L170,139 L230,115 L290,108 L350,92 L410,99 L470,74 L530,68 L590,52 L650,48 L700,34"
                      : "M0,45 L50,52 L110,68 L170,61 L230,85 L290,94 L350,110 L410,102 L470,124 L530,135 L590,142 L650,150 L700,160"
                  }
                  fill="none"
                  stroke={activeAsset.pct >= 0 ? C.green : C.red}
                  strokeWidth="2.5"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: C.textMuted,
                }}
              >
                <span>09:15 IST</span>
                <span>11:00 IST</span>
                <span>13:00 IST</span>
                <span>14:30 IST</span>
                <span>15:30 IST (LIVE)</span>
              </div>
            </div>
          </div>

          {/* Institutional Order Flow & Block Deals Tape */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div
              style={{
                background: "#0B0A12",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.goldLight,
                  marginBottom: 10,
                }}
              >
                INSTITUTIONAL NET FLOWS (TODAY)
              </div>
              {[
                { who: "FII Cash Market", val: "+₹3,420 Cr", up: true },
                { who: "DII Institutional", val: "+₹1,890 Cr", up: true },
                { who: "Index OptionsOI", val: "PCR 1.24 (Bullish)", up: true },
                { who: "Block Deal Volume", val: "₹940 Cr Executed", up: true },
              ].map((fl) => (
                <div
                  key={fl.who}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    padding: "6px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: C.textSub }}>{fl.who}</span>
                  <span style={{ color: C.green, fontWeight: 700 }}>
                    {fl.val}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: "#0B0A12",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.goldLight,
                  marginBottom: 10,
                }}
              >
                PRIME CONCIERGE & RESEARCH DESK
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: C.textSub,
                  lineHeight: 1.6,
                  fontFamily: FONT_BODY,
                  margin: "0 0 12px",
                }}
              >
                Need custom derivatives structuring, portfolio hedging, or
                Pre-IPO block allocation?
              </p>
              <button
                onClick={() => onNavigate("AI Advisor")}
                style={{
                  width: "100%",
                  background: "rgba(245, 158, 11, 0.15)",
                  border: `1px solid ${C.gold}`,
                  color: C.goldLight,
                  padding: "9px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Ask Quant AI Pro About {activeAsset.sym} →
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Level-2 Order Book + Algo Execution Ticket */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Level 2 DOM */}
          <div
            style={{
              background: "#0B0A12",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.goldLight,
                marginBottom: 10,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>LEVEL-2 ORDER BOOK</span>
              <span>SPREAD: 0.05%</span>
            </div>

            <div style={{ marginBottom: 8 }}>
              {asks
                .slice()
                .reverse()
                .map((a, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11.5,
                      padding: "3px 6px",
                      position: "relative",
                      marginBottom: 2,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: `${a.pct}%`,
                        background: "rgba(239, 68, 68, 0.14)",
                      }}
                    />
                    <span style={{ color: C.red, zIndex: 1 }}>{a.price}</span>
                    <span style={{ color: C.textSub, zIndex: 1 }}>
                      {a.size}
                    </span>
                  </div>
                ))}
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "6px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 6,
                fontWeight: 800,
                color: C.white,
                fontSize: 13,
                marginBottom: 8,
              }}
            >
              LTP: {activeAsset.price.toLocaleString("en-IN")}
            </div>

            <div>
              {bids.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11.5,
                    padding: "3px 6px",
                    position: "relative",
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: `${b.pct}%`,
                      background: "rgba(16, 185, 129, 0.14)",
                    }}
                  />
                  <span style={{ color: C.green, zIndex: 1 }}>{b.price}</span>
                  <span style={{ color: C.textSub, zIndex: 1 }}>{b.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Algo Execution Ticket */}
          <div
            style={{
              background: "#0B0A12",
              border: `1px solid ${C.gold}44`,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: C.goldLight,
                marginBottom: 12,
              }}
            >
              ALGO EXECUTION TICKET ({activeAsset.sym})
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 6,
                marginBottom: 12,
              }}
            >
              {(["BUY", "SELL"] as const).map((side) => (
                <button
                  key={side}
                  onClick={() => setOrderSide(side)}
                  style={{
                    background:
                      orderSide === side
                        ? side === "BUY"
                          ? C.green
                          : C.red
                        : "rgba(255,255,255,0.05)",
                    color: orderSide === side ? "#050508" : C.textSub,
                    border: "none",
                    padding: "8px",
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {side}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div
                style={{ fontSize: 10.5, color: C.textSub, marginBottom: 4 }}
              >
                EXECUTION STRATEGY
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["VWAP", "TWAP", "ICEBERG", "LIMIT"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setAlgoType(st)}
                    style={{
                      flex: 1,
                      background:
                        algoType === st
                          ? "rgba(245, 158, 11, 0.22)"
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        algoType === st ? C.gold : C.border
                      }`,
                      color: algoType === st ? C.goldLight : C.textSub,
                      padding: "5px 4px",
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div
                style={{ fontSize: 10.5, color: C.textSub, marginBottom: 4 }}
              >
                QUANTITY
              </div>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: C.white,
                  fontFamily: FONT_MONO,
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={executeAlgoOrder}
              disabled={isLocked}
              style={{
                width: "100%",
                background: isLocked
                  ? C.border
                  : orderSide === "BUY"
                  ? C.green
                  : C.red,
                color: isLocked ? C.textSub : "#050508",
                border: "none",
                padding: "11px",
                borderRadius: 7,
                fontWeight: 800,
                fontSize: 12.5,
                cursor: isLocked ? "not-allowed" : "pointer",
              }}
            >
              {isLocked
                ? "Switch to Prime to Execute"
                : `TRANSMIT ${algoType} ${orderSide} ORDER`}
            </button>

            {orderStatus && (
              <div
                style={{
                  marginTop: 10,
                  padding: "8px 10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: `1px solid ${C.green}`,
                  borderRadius: 6,
                  color: C.green,
                  fontSize: 11,
                }}
              >
                {orderStatus}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI ADVISOR PAGE (TIER-AWARE: STANDARD vs QUANT AI PRO) ───────────────────
function AIAdvisorPage({
  prices,
  userTier,
  onUpgrade,
}: {
  prices?: any;
  userTier: UserTier;
  onUpgrade: () => void;
}) {
  const isPremium = userTier === "premium";

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: isPremium
        ? "Welcome to Grandline Quant AI Pro (Institutional Mode). I have live access to your Level-2 market feed, derivatives Greeks, FII/DII institutional flows, and macro correlation models. What position or strategy shall we analyze?"
        : "Hello! I'm your Grandline AI Advisor (Standard Mode). Ask me anything about live markets, your portfolio, or SIP strategies. Upgrade to Grandline Prime anytime for institutional Quant AI Pro analysis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  const suggestions = isPremium
    ? [
        "Institutional quant & VWAP analysis on HAL and NIFTY 50",
        "Design a delta-neutral options hedge for my ₹25L equity portfolio",
        "Analyze FII inflows impact on HDFC Bank vs SBI",
        "Cross-asset correlation: Gold vs USD/INR & US Tech",
      ]
    : [
        "How is HAL stock performing today?",
        "NIFTY 50 & SENSEX outlook this week?",
        "Best SIP strategy for ₹25,000/month?",
        "How should I diversify between Gold and Equities?",
      ];

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
        body: JSON.stringify({
          messages: updatedMessages.slice(1),
          prices,
          tier: userTier,
        }),
      });

      const textData = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(textData);
      } catch {
        data = {
          reply: `⚠️ Route Error (Status ${res.status}): Make sure src/app/api/market/route.ts is saved.`,
        };
      }

      setMessages((m) => [
        ...m,
        { role: "ai", text: data?.reply || "⚠️ Empty response from server." },
      ]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `⚠️ Network Error: ${
            err?.message || "Could not reach /api/market."
          }`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        paddingTop: 28,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px 6% 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Tag color={isPremium ? C.goldLight : C.green}>
            {isPremium ? "★ QUANT AI PRO · INSTITUTIONAL" : "STANDARD RETAIL AI"}
          </Tag>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 30,
              fontWeight: 800,
              margin: "10px 0 4px",
              color: C.white,
            }}
          >
            {isPremium
              ? "Grandline Quant AI Pro"
              : "AI Investment Advisor"}
          </h1>
          <p
            style={{
              color: C.textSub,
              fontFamily: FONT_BODY,
              fontSize: 14,
              margin: 0,
            }}
          >
            {isPremium
              ? "Deep quantitative modeling, VWAP order-flow analysis & multi-leg derivatives structuring"
              : "Real-time market insights for everyday investors"}
          </p>
        </div>

        {!isPremium && (
          <button
            onClick={onUpgrade}
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              color: "#07070A",
              border: "none",
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ★ Upgrade to Quant AI Pro
          </button>
        )}
      </div>

      {/* Prime Quant Metrics Strip */}
      {isPremium && (
        <div
          style={{
            margin: "0 6% 16px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "MODEL ENGINE", val: "Quant-Alpha v4 (Deep)" },
            { label: "PORTFOLIO BETA", val: "0.94 (Hedged)" },
            { label: "VA-R (99% 1D)", val: "1.18% (Low Risk)" },
            { label: "DERIVATIVES DESK", val: "Greeks & OI Active" },
          ].map((m) => (
            <div
              key={m.label}
              style={{
                ...glassPanel(
                  "rgba(245, 158, 11, 0.06)",
                  "rgba(245, 158, 11, 0.3)"
                ),
                borderRadius: 12,
                padding: "10px 16px",
              }}
            >
              <div style={{ fontSize: 10, color: C.goldLight, fontWeight: 700 }}>
                {m.label}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: C.white,
                  marginTop: 2,
                }}
              >
                {m.val}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          flex: 1,
          margin: "0 6%",
          ...glassPanel(
            "rgba(15, 14, 20, 0.85)",
            isPremium ? "rgba(245, 158, 11, 0.35)" : C.border
          ),
          borderRadius: 18,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxHeight: "50vh",
          }}
        >
          {messages.map((m: any, i: number) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                gap: 10,
                alignItems: "flex-end",
              }}
            >
              {m.role === "ai" && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: isPremium
                      ? "linear-gradient(135deg, #F59E0B, #D97706)"
                      : `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <LogoIcon size={18} />
                </div>
              )}
              <div
                style={{
                  background:
                    m.role === "user"
                      ? `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`
                      : "rgba(255,255,255,0.05)",
                  border:
                    m.role === "ai"
                      ? `1px solid ${
                          isPremium ? "rgba(245, 158, 11, 0.35)" : C.border
                        }`
                      : "none",
                  borderRadius:
                    m.role === "user"
                      ? "16px 16px 4px 16px"
                      : "16px 16px 16px 4px",
                  padding: "12px 16px",
                  maxWidth: "74%",
                  fontFamily: FONT_BODY,
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: C.text,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div
              style={{
                color: isPremium ? C.goldLight : C.textSub,
                fontSize: 13,
                fontFamily: FONT_BODY,
              }}
            >
              {isPremium
                ? "⚡ Running Quant AI Pro institutional order-flow & volatility models..."
                : "Analyzing live market data..."}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Prompt Pills */}
        <div
          style={{
            padding: "10px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              style={{
                background: isPremium
                  ? "rgba(245, 158, 11, 0.1)"
                  : `${C.accent}14`,
                border: `1px solid ${
                  isPremium ? "rgba(245, 158, 11, 0.35)" : C.borderGlow
                }`,
                color: isPremium ? C.goldLight : C.accentLight,
                padding: "5px 12px",
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: FONT_BODY,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            gap: 12,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={
              isPremium
                ? "Ask Quant AI Pro for VWAP levels, options hedging, or institutional flow analysis..."
                : "Ask about any market, stock, or investment strategy..."
            }
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "11px 16px",
              color: C.text,
              fontSize: 14,
              fontFamily: FONT_BODY,
              outline: "none",
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              background: input.trim()
                ? isPremium
                  ? "linear-gradient(135deg, #F59E0B, #D97706)"
                  : `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`
                : C.border,
              color: isPremium && input.trim() ? "#07070A" : C.white,
              border: "none",
              borderRadius: 10,
              padding: "11px 22px",
              fontSize: 14,
              cursor: input.trim() ? "pointer" : "default",
              fontFamily: FONT_BODY,
              fontWeight: 700,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DUAL-TIER LOGIN PAGE (STANDARD vs PREMIUM) ───────────────────────────────
function LoginPage({
  onLogin,
  setPage,
  defaultTier = "standard",
}: {
  onLogin: (tier: UserTier) => void;
  setPage: (page: string) => void;
  defaultTier?: UserTier;
}) {
  const [selectedTier, setSelectedTier] = useState<UserTier>(defaultTier);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onLogin(selectedTier);
  }

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 5%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            selectedTier === "premium"
              ? "radial-gradient(circle, rgba(245, 158, 11, 0.14) 0%, transparent 65%)"
              : "radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          ...glassPanel(
            "rgba(15, 14, 22, 0.85)",
            selectedTier === "premium"
              ? "rgba(245, 158, 11, 0.45)"
              : "rgba(255, 255, 255, 0.14)"
          ),
          borderRadius: 24,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 520,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <LogoIcon size={32} />
          <span
            style={{
              color: C.white,
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 17,
            }}
          >
            GRANDLINE <span style={{ color: C.accentLight }}>CAPITAL</span>
          </span>
        </div>

        <h1
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 24,
            fontWeight: 800,
            textAlign: "center",
            margin: "0 0 6px",
            color: C.white,
          }}
        >
          Select Your Account Tier
        </h1>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13.5,
            color: C.textSub,
            textAlign: "center",
            margin: "0 0 22px",
          }}
        >
          Choose between Standard Retail or Grandline Prime Institutional access
        </p>

        {/* Interactive Tier Selector Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div
            onClick={() => setSelectedTier("standard")}
            style={{
              padding: 16,
              borderRadius: 14,
              cursor: "pointer",
              border: `2px solid ${
                selectedTier === "standard" ? C.accentLight : C.border
              }`,
              background:
                selectedTier === "standard"
                  ? "rgba(124, 58, 237, 0.16)"
                  : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: 15,
                color: C.white,
                marginBottom: 4,
              }}
            >
              Standard User
            </div>
            <div style={{ fontSize: 11.5, color: C.textSub, lineHeight: 1.5 }}>
              Retail Dashboard, Live Equities, Mutual Funds & Standard AI
              Advisor
            </div>
          </div>

          <div
            onClick={() => setSelectedTier("premium")}
            style={{
              padding: 16,
              borderRadius: 14,
              cursor: "pointer",
              border: `2px solid ${
                selectedTier === "premium" ? C.goldLight : C.border
              }`,
              background:
                selectedTier === "premium"
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(255,255,255,0.02)",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 800,
                fontSize: 15,
                color: C.goldLight,
                marginBottom: 4,
              }}
            >
              ★ Premium (Prime)
            </div>
            <div style={{ fontSize: 11.5, color: C.textSub, lineHeight: 1.5 }}>
              Bloomberg Terminal, Quant AI Pro, Algo Execution & Pre-IPO Deals
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address (optional for demo)"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "12px 15px",
              color: C.text,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (optional for demo)"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "12px 15px",
              color: C.text,
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            style={{
              background:
                selectedTier === "premium"
                  ? "linear-gradient(135deg, #F59E0B, #D97706)"
                  : `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
              color: selectedTier === "premium" ? "#07070A" : C.white,
              border: "none",
              padding: "14px",
              borderRadius: 10,
              fontSize: 14.5,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 6,
            }}
          >
            {selectedTier === "premium"
              ? "★ Log In as Premium (Prime) User"
              : "Log In as Standard User"}
          </button>
        </form>

        <p
          onClick={() => setPage("Home")}
          style={{
            fontFamily: FONT_BODY,
            fontSize: 12.5,
            color: C.textSub,
            textAlign: "center",
            marginTop: 18,
            cursor: "pointer",
          }}
        >
          ← Back to homepage
        </p>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE (WITH PRIME EXCLUSIVE SERVICES) ───────────────────────────
function DashboardPage({
  prices,
  userTier,
  onUpgrade,
  onNavigate,
}: {
  prices: any;
  userTier: UserTier;
  onUpgrade: () => void;
  onNavigate: (page: string) => void;
}) {
  const isPremium = userTier === "premium";
  const portfolio = [
    {
      sym: "RELIANCE",
      qty: 25,
      avg: 1210,
      ltp: prices.find((p: any) => p.sym === "RELIANCE")?.price || 1278,
    },
    {
      sym: "HAL",
      qty: 15,
      avg: 4100,
      ltp: prices.find((p: any) => p.sym === "HAL")?.price || 4300,
    },
    {
      sym: "TCS",
      qty: 10,
      avg: 2180,
      ltp: prices.find((p: any) => p.sym === "TCS")?.price || 2254.3,
    },
    {
      sym: "GOLD",
      qty: 5,
      avg: 135000,
      ltp: prices.find((p: any) => p.sym === "GOLD")?.price || 143750,
    },
  ];
  const totalInvested = portfolio.reduce((s, p) => s + p.avg * p.qty, 0);
  const totalCurrent = portfolio.reduce((s, p) => s + p.ltp * p.qty, 0);
  const pnl = totalCurrent - totalInvested;
  const pnlPct = ((pnl / totalInvested) * 100).toFixed(2);

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        padding: "36px 5%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 26,
        }}
      >
        <div>
          <Tag color={isPremium ? C.goldLight : C.accentLight}>
            {isPremium
              ? "★ GRANDLINE PRIME INSTITUTIONAL DESK"
              : "STANDARD RETAIL PORTFOLIO"}
          </Tag>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 30,
              fontWeight: 800,
              margin: "10px 0 0",
              color: C.white,
            }}
          >
            {isPremium ? "Prime Wealth & Quant Command" : "Portfolio Dashboard"}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {isPremium ? (
            <button
              onClick={() => onNavigate("Terminal")}
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                border: "none",
                color: "#07070A",
                padding: "10px 18px",
                borderRadius: 9,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              ⚡ Open Pro Terminal
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              style={{
                background: "linear-gradient(135deg, #F59E0B, #D97706)",
                border: "none",
                color: "#07070A",
                padding: "10px 18px",
                borderRadius: 9,
                fontSize: 13,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              ★ Upgrade to Prime
            </button>
          )}
          <button
            onClick={() => onNavigate("AI Advisor")}
            style={{
              background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`,
              border: "none",
              color: C.white,
              padding: "10px 18px",
              borderRadius: 9,
              fontSize: 13,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {isPremium ? "Quant AI Pro" : "AI Insights"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Portfolio Value",
            val: `₹${totalCurrent.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}`,
            sub: "Live marked-to-market",
            color: C.white,
          },
          {
            label: "Total P&L",
            val: `${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN", {
              maximumFractionDigits: 0,
            })}`,
            sub: `${pnlPct}% overall return`,
            color: pnl >= 0 ? C.green : C.red,
          },
          {
            label: "Account Tier",
            val: isPremium ? "Grandline Prime" : "Standard",
            sub: isPremium
              ? "Zero-latency L2 + Quant AI"
              : "Standard execution",
            color: isPremium ? C.goldLight : C.accentLight,
          },
          {
            label: isPremium ? "Margin & Leverage" : "Risk Score",
            val: isPremium ? "4.0x Intraday" : "Moderate (5.8)",
            sub: isPremium ? "Prime Institutional Line" : "Balanced allocation",
            color: C.green,
          },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              ...glassPanel(),
              borderRadius: 14,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 8 }}>
              {k.label}
            </div>
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                fontWeight: 800,
                color: k.color,
              }}
            >
              {k.val}
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings Table */}
      <div
        style={{
          background: C.bgCard,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 15,
              color: C.white,
            }}
          >
            Live Holdings
          </span>
          <Tag>{portfolio.length} Active Positions</Tag>
        </div>
        {portfolio.map((pos, i) => {
          const gainAmt = (pos.ltp - pos.avg) * pos.qty;
          return (
            <div
              key={pos.sym}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                padding: "14px 20px",
                borderBottom:
                  i < portfolio.length - 1 ? `1px solid ${C.border}` : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{pos.sym}</div>
                <div style={{ fontSize: 11.5, color: C.textSub }}>
                  Qty: {pos.qty} · Avg: ₹{pos.avg}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>
                ₹{pos.ltp.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>
              <div
                style={{
                  color: gainAmt >= 0 ? C.green : C.red,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {gainAmt >= 0 ? "+" : ""}₹
                {gainAmt.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <Sparkline up={gainAmt >= 0} />
            </div>
          );
        })}
      </div>

      {/* Prime Exclusive Services Panel */}
      {isPremium && (
        <div
          style={{
            ...glassPanel(
              "rgba(245, 158, 11, 0.06)",
              "rgba(245, 158, 11, 0.35)"
            ),
            borderRadius: 18,
            padding: 24,
          }}
        >
          <Tag color={C.goldLight}>★ PRIME EXCLUSIVE SERVICES ACTIVE</Tag>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginTop: 16,
            }}
          >
            {[
              {
                title: "Direct Algo Execution Desk",
                desc: "Deploy TWAP, VWAP, and Iceberg orders with zero-latency NSE/BSE routing.",
                action: "Open Terminal",
                target: "Terminal",
              },
              {
                title: "Priority Pre-IPO Allocations",
                desc: "Guaranteed institutional lot access in MedVault AI & NeoBank X Pre-IPO rounds.",
                action: "View Private Deals",
                target: "Private Market",
              },
              {
                title: "Portfolio Stress-Test & Hedging",
                desc: "Generate custom multi-leg NIFTY option hedges via Quant AI Pro.",
                action: "Launch Quant AI",
                target: "AI Advisor",
              },
            ].map((srv) => (
              <div
                key={srv.title}
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 700,
                    fontSize: 15,
                    color: C.white,
                    marginBottom: 6,
                  }}
                >
                  {srv.title}
                </div>
                <p
                  style={{
                    fontSize: 12.5,
                    color: C.textSub,
                    lineHeight: 1.55,
                    marginBottom: 14,
                  }}
                >
                  {srv.desc}
                </p>
                <button
                  onClick={() => onNavigate(srv.target)}
                  style={{
                    background: "rgba(245, 158, 11, 0.16)",
                    border: `1px solid ${C.gold}`,
                    color: C.goldLight,
                    padding: "7px 14px",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {srv.action} →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MARKETS PAGE ─────────────────────────────────────────────────────────────
function MarketsPage({ prices }: { prices: any }) {
  const [filter, setFilter] = useState("all");
  const cats = [
    "all",
    "index",
    "stock",
    "us_stock",
    "commodity",
    "forex",
    "crypto",
  ];
  const filtered =
    filter === "all" ? prices : prices.filter((p: any) => p.cat === filter);
  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
        paddingTop: 30,
      }}
    >
      <div style={{ padding: "30px 6%" }}>
        <div style={{ marginBottom: 28 }}>
          <Tag>Live Yahoo Finance Feed</Tag>
          <h1
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 36,
              fontWeight: 800,
              margin: "12px 0 6px",
              color: C.white,
            }}
          >
            Market Overview
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              style={{
                background: filter === c ? C.accent : C.bgCard,
                border: `1px solid ${filter === c ? C.accent : C.border}`,
                color: filter === c ? C.white : C.textSub,
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {c.replace("_", " ")}
            </button>
          ))}
        </div>
        <div
          style={{
            background: C.bgCard,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
              padding: "12px 20px",
              borderBottom: `1px solid ${C.border}`,
              fontSize: 11,
              color: C.textMuted,
              textTransform: "uppercase",
            }}
          >
            <span>Instrument</span>
            <span>Live Price</span>
            <span>Change</span>
            <span>% Change</span>
            <span>Trend</span>
          </div>
          {filtered.map((p: any, i: number) => (
            <div
              key={p.sym}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1.5fr 1fr 1fr 1fr",
                padding: "14px 20px",
                borderBottom:
                  i < filtered.length - 1 ? `1px solid ${C.border}` : "none",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.sym}</div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.textSub,
                    textTransform: "capitalize",
                  }}
                >
                  {p.cat.replace("_", " ")}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                {p.cat === "us_stock"
                  ? `$${p.price.toFixed(2)}`
                  : p.price.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
              </div>
              <div style={{ color: p.change >= 0 ? C.green : C.red, fontSize: 13 }}>
                {p.change >= 0 ? "+" : ""}
                {p.change.toFixed(2)}
              </div>
              <div
                style={{
                  color: p.pct >= 0 ? C.green : C.red,
                  fontWeight: 600,
                  fontSize: 12.5,
                }}
              >
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

// ─── INDIAN EQUITIES, US STOCKS, MUTUAL FUNDS, PRIVATE MARKETS ────────────────
function IndStocksPage({ prices }: { prices: any }) {
  const ind = prices.filter(
    (p: any) => p.cat === "stock" || p.sym === "NIFTY 50" || p.sym === "SENSEX"
  );
  return <MarketsPage prices={ind} />;
}

function USStocksPage({ prices }: { prices: any }) {
  const us = prices.filter(
    (p: any) =>
      p.cat === "us_stock" ||
      p.sym === "S&P 500" ||
      p.sym === "NASDAQ" ||
      p.sym === "DOW JONES"
  );
  return <MarketsPage prices={us} />;
}

function MutualFundPage() {
  const funds = [
    { name: "Axis Bluechip Direct Plan", cat: "Large Cap", nav: "₹58.72", ret3y: "+14.2%" },
    { name: "Parag Parikh Flexi Cap Direct", cat: "Flexi Cap", nav: "₹69.45", ret3y: "+18.5%" },
    { name: "SBI Small Cap Direct Growth", cat: "Small Cap", nav: "₹152.80", ret3y: "+22.1%" },
    { name: "HDFC Mid-Cap Opportunities", cat: "Mid Cap", nav: "₹139.40", ret3y: "+19.3%" },
  ];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "40px 6%" }}>
      <Tag color={C.accentLight}>AMFI Direct Plans</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: C.white, margin: "12px 0 24px" }}>
        Zero-Commission Mutual Funds
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {funds.map((f) => (
          <div key={f.name} style={{ ...glassPanel(), borderRadius: 16, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.white }}>{f.name}</div>
            <div style={{ fontSize: 12, color: C.textSub, margin: "4px 0 14px" }}>{f.cat}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>NAV: <strong>{f.nav}</strong></span>
              <span style={{ color: C.green, fontWeight: 700 }}>3Y CAGR: {f.ret3y}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivateMarketPage({ userTier }: { userTier: UserTier }) {
  const deals = [
    { name: "MedVault AI", stage: "Pre-IPO", sector: "HealthTech", min: "₹50 L", irr: "34%", primeOnly: true },
    { name: "NeoBank X", stage: "Pre-IPO", sector: "Fintech", min: "₹25 L", irr: "31%", primeOnly: true },
    { name: "FinEdge Technologies", stage: "Series B", sector: "Wealthtech", min: "₹10 L", irr: "28%", primeOnly: false },
  ];
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "40px 6%" }}>
      <Tag color={C.goldLight}>Pre-IPO & Unlisted Equity</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 34, fontWeight: 800, color: C.white, margin: "12px 0 24px" }}>
        Private Market Deal Flow
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {deals.map((d) => (
          <div key={d.name} style={{ ...glassPanel(), borderRadius: 16, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Tag color={d.primeOnly ? C.goldLight : C.green}>
                {d.primeOnly ? "★ PRIME PRIORITY" : "OPEN"}
              </Tag>
              <span style={{ fontSize: 12, color: C.textSub }}>{d.stage}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: C.white }}>{d.name}</div>
            <div style={{ fontSize: 13, color: C.textSub, margin: "4px 0 16px" }}>{d.sector}</div>
            <div style={{ fontSize: 13, color: C.text }}>
              Min Ticket: <strong>{d.min}</strong> · Target IRR: <strong style={{ color: C.green }}>{d.irr}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "40px 6%" }}>
      <Tag color={C.accentLight}>Real-Time Desk</Tag>
      <h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Market News</h1>
      <p style={{ color: C.textSub }}>Live institutional macro & earnings wire.</p>
    </div>
  );
}
function ResearchPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "40px 6%" }}>
      <Tag color={C.goldLight}>Institutional Research</Tag>
      <h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Research Reports</h1>
      <p style={{ color: C.textSub }}>Deep-dive macro & sector alpha reports.</p>
    </div>
  );
}
function BlogPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "40px 6%" }}>
      <Tag color={C.green}>Knowledge Hub</Tag>
      <h1 style={{ color: C.white, fontFamily: FONT_DISPLAY }}>Grandline Blog</h1>
      <p style={{ color: C.textSub }}>Quantitative investing & multi-asset portfolio guides.</p>
    </div>
  );
}
function AboutPage() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "60px 8%" }}>
      <Tag>About Grandline Capital</Tag>
      <h1 style={{ color: C.white, fontFamily: FONT_DISPLAY, fontSize: 40 }}>
        Institutional Infrastructure for Every Investor
      </h1>
      <p style={{ color: C.textSub, maxWidth: 680, lineHeight: 1.8 }}>
        Grandline Capital bridges retail convenience with Bloomberg-grade institutional execution across Indian and global markets.
      </p>
    </div>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────
function Footer({ setPage }: { setPage: (page: string) => void }) {
  return (
    <footer
      style={{
        borderTop: `1px solid ${C.border}`,
        padding: "44px 8%",
        background: "rgba(15, 14, 20, 0.85)",
        backdropFilter: "blur(20px)",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoIcon size={26} />
          <span
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 800,
              fontSize: 14,
              color: C.white,
            }}
          >
            GRANDLINE CAPITAL
          </span>
        </div>
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: C.textSub }}>
          <span onClick={() => setPage("Markets")} style={{ cursor: "pointer" }}>Markets</span>
          <span onClick={() => setPage("Terminal")} style={{ cursor: "pointer", color: C.goldLight }}>Pro Terminal</span>
          <span onClick={() => setPage("AI Advisor")} style={{ cursor: "pointer" }}>Quant AI</span>
          <span onClick={() => setPage("Private Market")} style={{ cursor: "pointer" }}>Private Markets</span>
        </div>
        <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: C.textMuted }}>
          © 2026 Grandline Capital · Standard & Prime Tiers
        </span>
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
    setPage(chosenTier === "premium" ? "Terminal" : "Dashboard");
  }

  function handleSelectTierAndLogin(tier: UserTier) {
    setUserTier(tier);
    setIsLoggedIn(true);
    setPage(tier === "premium" ? "Terminal" : "Dashboard");
  }

  function handleUpgradeToPrime() {
    setUserTier("premium");
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
        return (
          <HomePage
            setPage={handleNavigate}
            prices={prices}
            onSelectTierAndLogin={handleSelectTierAndLogin}
          />
        );
      case "Terminal":
        return (
          <TerminalPage
            prices={prices}
            userTier={userTier}
            onUpgrade={handleUpgradeToPrime}
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
            onUpgrade={handleUpgradeToPrime}
            onNavigate={handleNavigate}
          />
        ) : (
          <LoginPage
            onLogin={handleLogin}
            setPage={setPage}
            defaultTier={userTier}
          />
        );
      case "AI Advisor":
        return (
          <AIAdvisorPage
            prices={prices}
            userTier={userTier}
            onUpgrade={handleUpgradeToPrime}
          />
        );
      case "Private Market":
        return <PrivateMarketPage userTier={userTier} />;
      case "About":
        return <AboutPage />;
      case "News":
        return <NewsPage />;
      case "Research":
        return <ResearchPage />;
      case "Blog":
        return <BlogPage />;
      case "Login":
        return (
          <LoginPage
            onLogin={handleLogin}
            setPage={setPage}
            defaultTier={userTier}
          />
        );
      default:
        return (
          <HomePage
            setPage={handleNavigate}
            prices={prices}
            onSelectTierAndLogin={handleSelectTierAndLogin}
          />
        );
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav
        page={page}
        isLoggedIn={isLoggedIn}
        userTier={userTier}
        onToggleTier={(t) => setUserTier(t)}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
      <div key={page} style={{ paddingTop: 64 }}>
        <LiveMarketBar prices={prices} />
        {renderPage()}
      </div>
    </div>
  );
}