"use client";
import { useState, useEffect, useRef, useMemo } from "react";

type UserTier = "standard" | "premium";
type ChartType = "candles" | "bars" | "area" | "line";
type ProWorkspace = "L2_DESK" | "MAESTRO_GRID" | "MCP_BUS" | "QUANT_LAB" | "GLOBAL_MACRO" | "NODE_FLOW";

interface OHLCPoint { time: string; open: number; high: number; low: number; close: number; volume: number; }
interface Position { sym: string; qty: number; avg: number; ltp: number; }
interface OrderRecord { id: string; sym: string; side: "BUY" | "SELL"; qty: number; price: number; type: string; time: string; status: string; }

const C = {
  bg: "#07080C", bgCard: "#0C0E14", bgCardHover: "#11141D", border: "#1A1E2B", borderGlow: "#262C3F",
  accent: "#6D28D9", accentMid: "#7C3AED", accentLight: "#A78BFA",
  proBlue: "#1D4ED8", proBlueMid: "#2563EB", proBlueLight: "#60A5FA", proBlueDark: "#1E3A8A", proBlueGlow: "rgba(37, 99, 235, 0.14)",
  proBg: "#05070B", proPanel: "#090D14", proBorder: "#151F30",
  green: "#10B981", red: "#EF4444", amber: "#D97706", cyan: "#0891B2",
  white: "#F8FAFC", text: "#E2E8F0", textSub: "#94A3B8", textMuted: "#475569",
  sebi: "#0F291E", sebiBorder: "#1E4635", sebiText: "#34D399",
};

const FONT_DISPLAY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif";
const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace";

const defaultWatchlist = [
  { sym: "NIFTY 50", name: "NIFTY 50 Index", cat: "INDEX", base: 23146.15 },
  { sym: "SENSEX", name: "BSE SENSEX", cat: "INDEX", base: 76214.89 },
  { sym: "RELIANCE.NS", name: "Reliance Industries", cat: "EQUITY", base: 1278.0 },
  { sym: "HDFCBANK.NS", name: "HDFC Bank Ltd", cat: "EQUITY", base: 746.25 },
  { sym: "TCS.NS", name: "Tata Consultancy", cat: "EQUITY", base: 2254.3 },
  { sym: "HAL.NS", name: "Hindustan Aeronautics", cat: "EQUITY", base: 4300.0 },
  { sym: "INFY.NS", name: "Infosys Ltd", cat: "EQUITY", base: 1079.9 },
  { sym: "AAPL", name: "Apple Inc.", cat: "US_EQUITY", base: 333.02 },
  { sym: "NVDA", name: "NVIDIA Corp.", cat: "US_EQUITY", base: 206.84 },
  { sym: "MSFT", name: "Microsoft Corp.", cat: "US_EQUITY", base: 381.7 },
  { sym: "TSLA", name: "Tesla Inc.", cat: "US_EQUITY", base: 313.03 },
  { sym: "GOLD", name: "Gold Futures (10g)", cat: "COMMODITY", base: 143750 },
];

function useLivePrices(watchlist: { sym: string; name: string; cat: string; base?: number }[]) {
  const [prices, setPrices] = useState(() =>
    watchlist.map((w) => ({ ...w, price: w.base || 1000, change: 4.2, pct: 0.42 }))
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchRealPrices() {
      if (watchlist.length === 0) return;
      const symbolsParam = watchlist.map((w) => w.sym).join(",");
      try {
        const res = await fetch(`/api/market?symbols=${encodeURIComponent(symbolsParam)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && data?.quotes && !cancelled) {
          setPrices(
            watchlist.map((w) => {
              const live = data.quotes[w.sym];
              return {
                ...w,
                price: live?.price ?? w.base ?? 1000,
                change: live?.change ?? 0,
                pct: live?.pct ?? 0,
              };
            })
          );
        }
      } catch {}
    }
    fetchRealPrices();
    const id = setInterval(fetchRealPrices, 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [watchlist]);

  return prices;
}

function LogoIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="0" y="0" width="32" height="32" rx="6" fill={C.accent} opacity="0.2" />
      <rect x="6" y="19" width="3.5" height="8" rx="1" fill={C.accent} />
      <rect x="12" y="14" width="3.5" height="13" rx="1" fill={C.accentMid} />
      <rect x="18" y="9" width="3.5" height="18" rx="1" fill={C.accentLight} />
      <path d="M5 21 L26 6" stroke={C.white} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function Tag({ children, color = C.accentLight }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ background: `${color}15`, color, border: `1px solid ${color}35`, padding: "3px 9px", borderRadius: 4, fontSize: 10.5, fontWeight: 600, fontFamily: FONT_MONO, letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function LiveMarketBar({ prices }: { prices: any[] }) {
  if (!prices || prices.length === 0) return null;
  return (
    <div style={{ background: "#090B10", borderBottom: `1px solid ${C.border}`, padding: "8px 0", overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
      <div style={{ display: "inline-flex", gap: "32px", animation: "tickerScroll 40s linear infinite", paddingLeft: "20px" }}>
        {prices.concat(prices).map((p, idx) => (
          <div key={`${p.sym}-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: FONT_MONO, fontSize: "11.5px", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontWeight: 600, color: C.textSub }}>{p.sym}</span>
            <span style={{ fontWeight: 600, color: C.white }}>{Number(p.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: (p.pct || 0) >= 0 ? C.green : C.red, fontWeight: 500, fontSize: "11px" }}>
              {(p.pct || 0) >= 0 ? "+" : ""}{p.pct || 0}%
            </span>
          </div>
        ))}
      </div>
      <style>{`@keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

// ─── GLOBAL STOCK SEARCH (INDIA NSE/BSE + US NYSE/NASDAQ) ────────────────────
function GlobalSearch({ onSelect, isPro }: { onSelect: (sym: string, name: string, cat: string) => void; isPro?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search India/US stock (e.g. TATAMOTORS, AAPL)..."
        style={{ width: "100%", background: isPro ? "#05070B" : "#07080C", border: `1px solid ${isPro ? C.proBorder : C.border}`, borderRadius: 6, padding: "8px 10px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: FONT_MONO }}
      />
      {query.trim().length >= 2 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: isPro ? C.proPanel : C.bgCard, border: `1px solid ${isPro ? C.proBorder : C.borderGlow}`, borderRadius: 6, maxHeight: 260, overflowY: "auto", zIndex: 60, boxShadow: "0 12px 28px rgba(0,0,0,0.65)" }}>
          {searching && <div style={{ padding: 10, fontSize: 11, color: C.textSub, fontFamily: FONT_MONO }}>SEARCHING GLOBAL DIRECTORY...</div>}
          {!searching && results.length === 0 && (
            <div
              onClick={() => { onSelect(query.toUpperCase().trim(), query.toUpperCase().trim(), "EQUITY"); setQuery(""); }}
              style={{ padding: 10, fontSize: 11, color: C.proBlueLight, fontFamily: FONT_MONO, cursor: "pointer" }}
            >
              + Add &quot;{query.toUpperCase().trim()}&quot; directly to Watchlist
            </div>
          )}
          {!searching && results.map((r) => (
            <div
              key={r.symbol}
              onClick={() => { onSelect(r.symbol, r.name, r.type || "EQUITY"); setQuery(""); setResults([]); }}
              style={{ padding: "9px 12px", borderBottom: `1px solid ${isPro ? C.proBorder : C.border}`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: C.white, fontFamily: FONT_MONO }}>{r.symbol}</div>
                <div style={{ fontSize: 10.5, color: C.textSub }}>{r.name}</div>
              </div>
              <span style={{ fontSize: 9.5, color: C.textMuted, fontFamily: FONT_MONO }}>{r.exchange}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MULTI-MODE INTERACTIVE STOCK CHART (CANDLES / BARS / AREA / LINE) ───────
function InteractiveStockChart({ symbol, currentPrice, range, isPro = false, height = 260 }: { symbol: string; currentPrice: number; range: string; isPro?: boolean; height?: number }) {
  const [points, setPoints] = useState<OHLCPoint[]>([]);
  const [chartType, setChartType] = useState<ChartType>("candles");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadChart() {
      try {
        const res = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.success && Array.isArray(data.points) && data.points.length > 0 && !cancelled) {
            setPoints(data.points);
            return;
          }
        }
      } catch {}
      if (!cancelled) {
        const count = 36;
        const syn: OHLCPoint[] = [];
        let p = (currentPrice || 1000) * 0.985;
        for (let i = 0; i < count; i++) {
          const delta = (Math.random() - 0.48) * ((currentPrice || 1000) * 0.006);
          const open = +p.toFixed(2);
          const close = +(open + delta).toFixed(2);
          const high = +(Math.max(open, close) + Math.random() * ((currentPrice || 1000) * 0.003)).toFixed(2);
          const low = +(Math.min(open, close) - Math.random() * ((currentPrice || 1000) * 0.003)).toFixed(2);
          p = close;
          syn.push({ time: `${9 + Math.floor(i / 6)}:${String((i % 6) * 10).padStart(2, "0")}`, open, high, low, close, volume: Math.floor(Math.random() * 25000 + 5000) });
        }
        if (syn.length > 0 && currentPrice) syn[syn.length - 1].close = currentPrice;
        setPoints(syn);
      }
    }
    loadChart();
    return () => { cancelled = true; };
  }, [symbol, range, currentPrice]);

  const stats = useMemo(() => {
    if (!points.length) return { min: (currentPrice || 100) * 0.98, max: (currentPrice || 100) * 1.02, first: currentPrice || 100 };
    const min = Math.min(...points.map((p) => p.low));
    const max = Math.max(...points.map((p) => p.high));
    const pad = (max - min) * 0.08 || 1;
    return { min: min - pad, max: max + pad, first: points[0].open };
  }, [points, currentPrice]);

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : points[points.length - 1];
  const isUp = activePoint ? activePoint.close >= stats.first : true;
  const strokeColor = isPro ? C.proBlueLight : isUp ? C.green : C.red;
  const svgWidth = 720;
  const svgHeight = height;
  const yScale = (val: number) => svgHeight - ((val - stats.min) / (stats.max - stats.min || 1)) * svgHeight;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${((i / Math.max(1, points.length - 1)) * svgWidth).toFixed(1)},${yScale(p.close).toFixed(1)}`).join(" ");
  const areaD = pathD ? `${pathD} L${svgWidth},${svgHeight} L0,${svgHeight} Z` : "";
  const candleWidth = points.length ? Math.max(3, Math.min(11, (svgWidth / points.length) * 0.65)) : 6;

  return (
    <div style={{ width: "100%", userSelect: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8, fontFamily: FONT_MONO, fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span>TIME: <strong style={{ color: C.white }}>{activePoint?.time || "--:--"}</strong></span>
          <span>O: <strong style={{ color: C.textSub }}>{activePoint?.open?.toFixed(2) || "--"}</strong></span>
          <span>H: <strong style={{ color: C.textSub }}>{activePoint?.high?.toFixed(2) || "--"}</strong></span>
          <span>L: <strong style={{ color: C.textSub }}>{activePoint?.low?.toFixed(2) || "--"}</strong></span>
          <span>C: <strong style={{ color: (activePoint?.close ?? 0) >= (activePoint?.open ?? 0) ? C.green : C.red }}>{activePoint?.close?.toFixed(2) || "--"}</strong></span>
          <span>VOL: <strong style={{ color: C.textSub }}>{(activePoint?.volume || 0).toLocaleString()}</strong></span>
        </div>
        <div style={{ display: "flex", gap: 3, background: "#06080D", border: `1px solid ${C.border}`, borderRadius: 4, padding: 2 }}>
          {(["candles", "bars", "area", "line"] as ChartType[]).map((t) => (
            <button key={t} onClick={() => setChartType(t)} style={{ background: chartType === t ? (isPro ? C.proBlue : C.accent) : "transparent", color: chartType === t ? C.white : C.textSub, border: "none", borderRadius: 3, padding: "3px 9px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO, textTransform: "uppercase" }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: svgHeight, background: "#05070B", border: `1px solid ${isPro ? C.proBorder : C.border}`, borderRadius: 6, position: "relative", overflow: "hidden" }}>
        <svg
          ref={svgRef}
          width="100%"
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          onMouseMove={(e) => {
            if (!svgRef.current || !points.length) return;
            const rect = svgRef.current.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setHoverIndex(Math.round(ratio * (points.length - 1)));
          }}
          onMouseLeave={() => setHoverIndex(null)}
          style={{ display: "block", cursor: "crosshair" }}
        >
          <defs>
            <linearGradient id={`grad-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          {[0.2, 0.5, 0.8].map((r) => (
            <g key={r}>
              <line x1="0" y1={svgHeight * r} x2={svgWidth} y2={svgHeight * r} stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <text x={svgWidth - 60} y={svgHeight * r - 4} fill={C.textMuted} fontSize="9" fontFamily={FONT_MONO}>
                {(stats.max - r * (stats.max - stats.min)).toFixed(2)}
              </text>
            </g>
          ))}

          {chartType === "candles" && points.map((p, i) => {
            const x = points.length === 1 ? svgWidth / 2 : (i / (points.length - 1)) * svgWidth;
            const col = p.close >= p.open ? C.green : C.red;
            return (
              <g key={i}>
                <line x1={x} y1={yScale(p.high)} x2={x} y2={yScale(p.low)} stroke={col} strokeWidth="1.2" />
                <rect x={x - candleWidth / 2} y={Math.min(yScale(p.open), yScale(p.close))} width={candleWidth} height={Math.max(1.5, Math.abs(yScale(p.close) - yScale(p.open)))} fill={col} />
              </g>
            );
          })}

          {chartType === "bars" && points.map((p, i) => {
            const x = points.length === 1 ? svgWidth / 2 : (i / (points.length - 1)) * svgWidth;
            const col = p.close >= p.open ? C.green : C.red;
            const tick = Math.max(2, candleWidth / 2);
            return (
              <g key={i}>
                <line x1={x} y1={yScale(p.high)} x2={x} y2={yScale(p.low)} stroke={col} strokeWidth="1.2" />
                <line x1={x - tick} y1={yScale(p.open)} x2={x} y2={yScale(p.open)} stroke={col} strokeWidth="1.2" />
                <line x1={x} y1={yScale(p.close)} x2={x + tick} y2={yScale(p.close)} stroke={col} strokeWidth="1.2" />
              </g>
            );
          })}

          {chartType === "area" && pathD && (
            <>
              <path d={areaD} fill={`url(#grad-${symbol})`} />
              <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.8" />
            </>
          )}
          {chartType === "line" && pathD && <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2" />}

          {hoverIndex !== null && points.length > 1 && activePoint && (
            <>
              <line x1={(hoverIndex / (points.length - 1)) * svgWidth} y1="0" x2={(hoverIndex / (points.length - 1)) * svgWidth} y2={svgHeight} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
              <line x1="0" y1={yScale(activePoint.close)} x2={svgWidth} y2={yScale(activePoint.close)} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// ─── GLASSMORPHIC NAVIGATION BAR WITH DROPDOWNS ───────────────────────────────
function Nav({ page, isLoggedIn, userTier, onToggleTier, onNavigate, onLogout }: any) {
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
      { label: "Market Overview", target: "Markets" },
      { label: "Indian Equities (NSE/BSE)", target: "IndStocks" },
      { label: "US Stocks (NYSE/NASDAQ)", target: "USStocks" },
      { label: "Direct Mutual Funds", target: "MutualFund" },
    ],
    Resources: [
      { label: "Research & Telemetry", target: "Research" },
      { label: "AI Investment Advisor", target: "AI Advisor" },
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
            { label: "Direct Mutual Funds & SIPs", target: "MutualFund" },
            { label: "US Equities (NYSE/NASDAQ)", target: "USStocks" },
            { label: "Global Multi-Asset Markets", target: "Markets" },
          ],
        },
        {
          title: "Trade",
          items: [
            { label: "Standard Web Terminal", target: "Terminal" },
            { label: "Pro L2 Execution Desk", target: "Terminal" },
            { label: "VWAP / TWAP Algo Router", target: "Terminal" },
            { label: "Options Chain & Greeks", target: "Terminal" },
          ],
        },
      ],
    },
    {
      label: "Institutional Pro Suite",
      columns: [
        {
          title: "Quant & Multi-Agent",
          items: [
            { label: "Pro Institutional Terminal", target: "Terminal" },
            { label: "Maestro 6-Agent Parallel Grid", target: "Terminal" },
            { label: "MCP Protocol Tool Bus", target: "Terminal" },
            { label: "Quant AI Pro Desk", target: "AI Advisor" },
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

  const isPro = userTier === "premium";

  const glassSurface = {
    background: "rgba(12, 14, 22, 0.84)",
    backdropFilter: "blur(24px) saturate(160%)",
    WebkitBackdropFilter: "blur(24px) saturate(160%)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderTop: "1px solid rgba(255, 255, 255, 0.22)",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
  };

  const dropdownStyle = {
    position: "absolute" as const,
    top: "calc(100% + 12px)",
    left: 0,
    ...glassSurface,
    borderRadius: 14,
    padding: "6px",
    minWidth: 220,
    zIndex: 200,
  };

  const navBtnStyle = (active: boolean) => ({
    background: active ? "rgba(124, 58, 237, 0.18)" : "transparent",
    border: active ? "1px solid rgba(167, 139, 250, 0.28)" : "1px solid transparent",
    cursor: "pointer",
    color: active ? C.white : C.textSub,
    fontFamily: FONT_BODY,
    fontSize: 13,
    padding: "6px 12px",
    borderRadius: 8,
    fontWeight: active ? 600 : 400,
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 5,
  });

  return (
    <nav
      ref={navRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? "rgba(7, 8, 12, 0.78)" : "rgba(7, 8, 12, 0.48)",
        backdropFilter: "blur(24px) saturate(150%)",
        WebkitBackdropFilter: "blur(24px) saturate(150%)",
        borderBottom: scrolled
          ? "1px solid rgba(255, 255, 255, 0.12)"
          : "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: scrolled ? "0 8px 32px rgba(0, 0, 0, 0.45)" : "none",
        transition: "all 0.3s ease",
        padding: "0 3.5%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 60,
      }}
    >
      <div onClick={() => go("Home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
        <LogoIcon size={28} />
        <span style={{ color: C.white, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15, letterSpacing: "0.04em" }}>
          GRANDLINE<span style={{ color: isPro ? C.proBlueLight : C.accentLight, marginLeft: 4 }}>CAPITAL</span>
        </span>
        {isLoggedIn && (
          <span style={{ background: isPro ? C.proBlueGlow : "rgba(109, 40, 217, 0.18)", color: isPro ? C.proBlueLight : C.accentLight, border: `1px solid ${isPro ? C.proBlue : C.accent}`, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 12, letterSpacing: "0.06em", fontFamily: FONT_MONO }}>
            {isPro ? "PRO DESK" : "STANDARD"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button onClick={() => go("Home")} style={navBtnStyle(page === "Home")}>Home</button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => { setOpenMenu(openMenu === "Products" ? null : "Products"); setOpenSub(0); }}
            style={navBtnStyle(openMenu === "Products")}
          >
            Products
            <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: openMenu === "Products" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
              <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
            </svg>
          </button>

          {openMenu === "Products" && (
            <div style={{ ...dropdownStyle, display: "flex", padding: 0, minWidth: 0 }}>
              <div style={{ width: 210, padding: 6, borderRight: "1px solid rgba(255, 255, 255, 0.08)", flexShrink: 0 }}>
                {productsMenu.map((cat, i) => (
                  <div
                    key={cat.label}
                    onMouseEnter={() => setOpenSub(i)}
                    onClick={() => setOpenSub(i)}
                    style={{ padding: "10px 13px", borderRadius: 9, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: openSub === i ? C.white : C.textSub, background: openSub === i ? "rgba(124, 58, 237, 0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ fontSize: 12, color: C.textMuted }}>›</span>
                  </div>
                ))}
              </div>
              {productsMenu[openSub] && (
                <div style={{ display: "flex", gap: 28, padding: "16px 22px" }}>
                  {productsMenu[openSub].columns.map((col, ci) => (
                    <div key={ci} style={{ minWidth: 190 }}>
                      <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.accentLight, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.title}</div>
                      {col.items.map((item) => (
                        <div
                          key={item.label}
                          onClick={() => go(item.target)}
                          style={{ padding: "7px 9px", borderRadius: 7, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: C.textSub }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = C.white; e.currentTarget.style.background = "rgba(124, 58, 237, 0.16)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.background = "transparent"; }}
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
            <button onClick={() => setOpenMenu(openMenu === key ? null : key)} style={navBtnStyle(openMenu === key)}>
              {key}
              <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: openMenu === key ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
                <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" />
              </svg>
            </button>
            {openMenu === key && (
              <div style={dropdownStyle}>
                {dropdowns[key].map((item) => (
                  <div
                    key={item.label}
                    onClick={() => go(item.target)}
                    style={{ padding: "9px 13px", borderRadius: 9, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 13, color: C.text }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124, 58, 237, 0.18)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          onClick={() => go("Terminal")}
          style={{
            ...navBtnStyle(page === "Terminal"),
            color: isPro ? C.proBlueLight : page === "Terminal" ? C.white : C.accentLight,
            border: `1px solid ${isPro ? "rgba(96, 165, 250, 0.4)" : "rgba(167, 139, 250, 0.35)"}`,
            background: page === "Terminal" ? (isPro ? "rgba(37, 99, 235, 0.22)" : "rgba(124, 58, 237, 0.22)") : "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(12px)",
            fontFamily: FONT_MONO,
            fontSize: 11.5,
            fontWeight: 700,
          }}
        >
          {isPro ? "PRO TERMINAL" : "TERMINAL"}
        </button>

        <button onClick={() => go("AI Advisor")} style={navBtnStyle(page === "AI Advisor")}>AI Advisor</button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isLoggedIn ? (
          <>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 8, padding: 2 }}>
              <button onClick={() => onToggleTier("standard")} style={{ background: !isPro ? C.accent : "transparent", color: !isPro ? C.white : C.textSub, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>STANDARD</button>
              <button onClick={() => onToggleTier("premium")} style={{ background: isPro ? C.proBlueMid : "transparent", color: isPro ? C.white : C.proBlueLight, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}>PRO</button>
            </div>
            <button onClick={() => go("Dashboard")} style={{ background: "rgba(255, 255, 255, 0.04)", backdropFilter: "blur(12px)", border: `1px solid ${isPro ? C.proBlue : "rgba(255, 255, 255, 0.14)"}`, color: C.text, padding: "6px 13px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Portfolio</button>
            <button onClick={onLogout} style={{ background: "transparent", border: "1px solid rgba(255, 255, 255, 0.12)", color: C.textSub, padding: "6px 13px", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>Sign Out</button>
          </>
        ) : (
          <>
            <button onClick={() => go("Login")} style={{ background: "rgba(255, 255, 255, 0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.14)", color: C.text, padding: "6px 15px", borderRadius: 8, fontSize: 12.5, cursor: "pointer" }}>Sign In</button>
            <button onClick={() => go("Login")} style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.accentMid})`, border: "none", color: C.white, padding: "6px 16px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer", boxShadow: "0 0 20px rgba(109, 40, 217, 0.25)" }}>Client Access</button>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── FULL INSTITUTIONAL HOMEPAGE ──────────────────────────────────────────────
function HomePage({ setPage }: { setPage: (p: string) => void }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <div style={{ padding: "88px 8% 76px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: C.sebi, border: `1px solid ${C.sebiBorder}`, borderRadius: 4, padding: "5px 14px", marginBottom: 24 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.sebiText }} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 600, color: C.sebiText, letterSpacing: "0.06em" }}>SEBI REGISTRATION IN PROCESS</span>
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(36px, 4.8vw, 62px)", fontWeight: 800, lineHeight: 1.1, margin: "0 auto 18px", maxWidth: 860, letterSpacing: "-0.03em", color: C.white }}>
          Institutional Market Infrastructure for Modern Capital
        </h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 16, color: C.textSub, maxWidth: 620, margin: "0 auto 34px", lineHeight: 1.7 }}>
          Unified multi-asset execution across Indian equities (NSE/BSE), US equities (NYSE/NASDAQ), commodities, and private market deal flow. Available in Standard Retail and Pro Quantitative tiers.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("Login")} style={{ background: C.white, color: "#07080C", border: "none", padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Select Tier & Access Platform</button>
          <button onClick={() => setPage("Terminal")} style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.borderGlow}`, padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Launch Live Terminal</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, maxWidth: 780, margin: "56px auto 0", overflow: "hidden" }}>
          {[
            { label: "ASSET CLASSES", val: "6" },
            { label: "GLOBAL INSTRUMENTS", val: "15,000+" },
            { label: "EXECUTION TIERS", val: "Standard / Pro" },
            { label: "MARKET TELEMETRY", val: "Real-Time" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 14px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, color: C.white }}>{s.val}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textSub, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 1, background: C.border, margin: "0 4%" }} />

      <div style={{ padding: "64px 8%" }}>
        <div style={{ marginBottom: 32 }}>
          <Tag color={C.accentLight}>MARKET COVERAGE</Tag>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, margin: "10px 0 6px", color: C.white }}>Every Market. One Institutional Ecosystem.</h2>
          <p style={{ color: C.textSub, fontSize: 14.5, margin: 0 }}>Direct market access and quantitative coverage across domestic and international exchanges.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {[
            { name: "Indian Equities", desc: "NSE & BSE cash equities, index derivatives, and ETFs", sub: "10,000+ listed securities", target: "IndStocks", badge: "ACTIVE" },
            { name: "US Equities", desc: "NYSE and NASDAQ listed equities and global ETFs", sub: "6,000+ securities", target: "USStocks", badge: "ACTIVE" },
            { name: "Pro Quant Terminal", desc: "Level-2 DOM, Options Greeks, Maestro 6-Agent Grid & MCP Bus", sub: "Institutional Pro Tier", target: "Terminal", badge: "PRO DESK" },
            { name: "Commodities & FX", desc: "Gold, Crude Oil, and INR cross-currency spot & futures", sub: "MCX & global benchmarks", target: "Markets", badge: "ACTIVE" },
            { name: "Direct Mutual Funds", desc: "Zero-commission systematic investment and liquid plans", sub: "3,000+ direct schemes", target: "MutualFund", badge: "ACTIVE" },
            { name: "AI Advisory Engine", desc: "Real-time portfolio beta, VWAP positioning, and risk analysis", sub: "Standard & Quant Pro modes", target: "AI Advisor", badge: "LIVE" },
          ].map((a) => (
            <div key={a.name} onClick={() => setPage(a.target)} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "22px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 15.5, color: C.white }}>{a.name}</span>
                <Tag color={a.badge === "PRO DESK" ? C.proBlueLight : C.green}>{a.badge}</Tag>
              </div>
              <div style={{ fontSize: 13, color: C.textSub, marginBottom: 10, lineHeight: 1.5 }}>{a.desc}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted }}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DUAL-TIER LOGIN PAGE WITH FULL BENEFITS COMPARISON ──────────────────────
function LoginPage({ onLogin }: { onLogin: (tier: UserTier) => void }) {
  const [selectedTier, setSelectedTier] = useState<UserTier>("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 5%" }}>
      <div style={{ width: "100%", maxWidth: 840, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: "0 0 6px" }}>Select Execution Environment</h1>
          <p style={{ color: C.textSub, fontSize: 13.5, margin: 0 }}>Choose between the Standard Retail Terminal or the Pro Quantitative Suite.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div onClick={() => setSelectedTier("standard")} style={{ background: C.bgCard, border: `2px solid ${selectedTier === "standard" ? C.accentLight : C.border}`, borderRadius: 8, padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Tag color={C.accentLight}>STANDARD TIER</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.textSub }}>RETAIL EXECUTION</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 12px" }}>Standard Normal Terminal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: C.textSub, lineHeight: 1.5 }}>
              <div>- Global India (NSE/BSE) & US (NYSE/NASDAQ) Stock Search</div>
              <div>- 4-Mode Interactive Chart (Candles, Bars, Area, Line)</div>
              <div>- Standard Order Ticket (Delivery CNC & Intraday MIS)</div>
              <div>- Key Stock Valuation Ratios & Fundamentals</div>
              <div>- Standard Retail AI Investment Advisor</div>
            </div>
          </div>

          <div onClick={() => setSelectedTier("premium")} style={{ background: selectedTier === "premium" ? "#080D1A" : C.bgCard, border: `2px solid ${selectedTier === "premium" ? C.proBlueLight : C.border}`, borderRadius: 8, padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Tag color={C.proBlueLight}>PRO INSTITUTIONAL</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.proBlueLight }}>QUANT DESK</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 12px" }}>Multi-Module Pro Terminal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
              <div><strong style={{ color: C.proBlueLight }}>[F1] L2 Execution Desk:</strong> Market Depth, Options Greeks & VWAP/TWAP Algos</div>
              <div><strong style={{ color: C.proBlueLight }}>[F2] Maestro 6-Agent Grid:</strong> 6 Parallel Quant Sessions in Isolated Worktrees</div>
              <div><strong style={{ color: C.proBlueLight }}>[F3] MCP Protocol Bus:</strong> 12 Financial Model Context Protocol Tools</div>
              <div><strong style={{ color: C.proBlueLight }}>[F4] Quant Backtester:</strong> Walk-Forward Sharpe & Drawdown Simulation</div>
              <div><strong style={{ color: C.proBlueLight }}>[F5] Global Macro & AIS:</strong> Sovereign Yield Matrix & Maritime Chokepoints</div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(selectedTier); }} style={{ background: C.bgCard, border: `1px solid ${selectedTier === "premium" ? C.proBlue : C.border}`, borderRadius: 8, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ background: selectedTier === "premium" ? C.proBlueMid : C.accent, color: C.white, border: "none", padding: "13px", borderRadius: 6, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            {selectedTier === "premium" ? "Launch Pro Institutional Terminal" : "Launch Standard Normal Terminal"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── STANDARD NORMAL TERMINAL ─────────────────────────────────────────────────
function StandardTerminalPage({ prices, watchlist, setWatchlist, positions, onExecuteOrder, onUpgrade, onNavigate }: any) {
  const [selectedSym, setSelectedSym] = useState(watchlist[0]?.sym || "NIFTY 50");
  const [chartRange, setChartRange] = useState("1d");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [productType, setProductType] = useState<"CNC" | "MIS">("CNC");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [qty, setQty] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const activeAsset = prices.find((p: any) => p.sym === selectedSym) || prices[0] || { sym: selectedSym, price: 1000, change: 0, pct: 0, cat: "EQUITY" };
  const execPrice = orderType === "LIMIT" && Number(limitPrice) > 0 ? Number(limitPrice) : activeAsset.price;
  const userPos = positions.find((p: Position) => p.sym === activeAsset.sym);

  function handleAddSymbol(sym: string, name: string, cat: string) {
    if (!watchlist.find((w: any) => w.sym === sym)) {
      setWatchlist((prev: any) => [{ sym, name, cat, base: 1000 }, ...prev]);
    }
    setSelectedSym(sym);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "14px 2%", fontFamily: FONT_BODY }}>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Tag color={C.accentLight}>STANDARD TERMINAL</Tag>
          <span style={{ fontSize: 12.5, color: C.textSub }}>India (NSE/BSE) & US (NYSE/NASDAQ) Spot Execution</span>
        </div>
        <button onClick={onUpgrade} style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Switch to Pro Institutional Terminal
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr 310px", gap: 14 }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: 12, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 8 }}>GLOBAL WATCHLIST</div>
            <GlobalSearch onSelect={handleAddSymbol} />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 560 }}>
            {watchlist.map((w: any) => {
              const live = prices.find((p: any) => p.sym === w.sym);
              return (
                <div key={w.sym} onClick={() => setSelectedSym(w.sym)} style={{ padding: "10px 14px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", background: selectedSym === w.sym ? "rgba(109, 40, 217, 0.14)" : "transparent", display: "flex", justifyContent: "space-between", fontVariantNumeric: "tabular-nums" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.white }}>{w.sym}</div>
                    <div style={{ fontSize: 10.5, color: C.textMuted }}>{w.name || w.cat}</div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: FONT_MONO }}>
                    <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{Number(live?.price || w.base || 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                    <div style={{ fontSize: 11, color: (live?.pct || 0) >= 0 ? C.green : C.red }}>{(live?.pct || 0) >= 0 ? "+" : ""}{live?.pct || 0}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{activeAsset.sym}</span>
                  <Tag color={C.accentLight}>{activeAsset.cat || "EQUITY"}</Tag>
                </div>
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{activeAsset.name || "Spot Market Feed"}</div>
              </div>
              <div style={{ textAlign: "right", fontFamily: FONT_MONO }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: C.white }}>{Number(activeAsset.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                <div style={{ fontSize: 12, color: (activeAsset.pct || 0) >= 0 ? C.green : C.red }}>
                  {(activeAsset.change || 0) >= 0 ? "+" : ""}{activeAsset.change || 0} ({(activeAsset.pct || 0) >= 0 ? "+" : ""}{activeAsset.pct || 0}%)
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
              {[{ l: "1D", r: "1d" }, { l: "5D", r: "5d" }, { l: "1M", r: "1mo" }, { l: "6M", r: "6mo" }, { l: "1Y", r: "1y" }].map((tf) => (
                <button key={tf.r} onClick={() => setChartRange(tf.r)} style={{ background: chartRange === tf.r ? C.accent : "transparent", color: chartRange === tf.r ? C.white : C.textSub, border: `1px solid ${chartRange === tf.r ? C.accent : C.border}`, borderRadius: 4, padding: "4px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>
                  {tf.l}
                </button>
              ))}
            </div>

            <InteractiveStockChart symbol={activeAsset.sym} currentPrice={activeAsset.price} range={chartRange} isPro={false} height={260} />
          </div>

          {userPos && (
            <div style={{ background: C.sebi, border: `1px solid ${C.sebiBorder}`, borderRadius: 8, padding: "10px 16px", display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO, fontSize: 12 }}>
              <span>ACTIVE HOLDING: <strong>{userPos.qty} Qty @ Avg {userPos.avg.toFixed(2)}</strong></span>
              <span style={{ color: (activeAsset.price - userPos.avg) >= 0 ? C.green : C.red, fontWeight: 700 }}>
                P&L: {((activeAsset.price - userPos.avg) * userPos.qty).toFixed(2)}
              </span>
            </div>
          )}

          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 10 }}>KEY FUNDAMENTALS ({activeAsset.sym})</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "DAY HIGH", val: (activeAsset.price * 1.014).toFixed(2) },
                { label: "DAY LOW", val: (activeAsset.price * 0.988).toFixed(2) },
                { label: "52W HIGH", val: (activeAsset.price * 1.18).toFixed(0) },
                { label: "52W LOW", val: (activeAsset.price * 0.78).toFixed(0) },
                { label: "P/E RATIO", val: "24.8x" },
                { label: "DIV YIELD", val: "1.15%" },
                { label: "VOLUME", val: "1.42M" },
                { label: "CONSENSUS", val: "ACCUMULATE" },
              ].map((item) => (
                <div key={item.label} style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px" }}>
                  <div style={{ fontSize: 9.5, color: C.textMuted, fontFamily: FONT_MONO }}>{item.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: 12.5, color: C.white, marginTop: 3 }}>{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 12 }}>ORDER TICKET | {activeAsset.sym}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
              {(["BUY", "SELL"] as const).map((s) => (
                <button key={s} onClick={() => setSide(s)} style={{ background: side === s ? (s === "BUY" ? C.green : C.red) : "#07080C", color: side === s ? "#07080C" : C.textSub, border: `1px solid ${side === s ? "transparent" : C.border}`, padding: "9px", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: FONT_MONO }}>{s}</button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
              {(["CNC", "MIS"] as const).map((pt) => (
                <button key={pt} onClick={() => setProductType(pt)} style={{ background: productType === pt ? "rgba(109,40,217,0.18)" : "#07080C", border: `1px solid ${productType === pt ? C.accentLight : C.border}`, color: productType === pt ? C.white : C.textSub, padding: "7px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>
                  {pt === "CNC" ? "CNC (DELIVERY)" : "MIS (INTRADAY)"}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
              {(["MARKET", "LIMIT"] as const).map((ot) => (
                <button key={ot} onClick={() => setOrderType(ot)} style={{ background: orderType === ot ? "rgba(109,40,217,0.18)" : "#07080C", border: `1px solid ${orderType === ot ? C.accentLight : C.border}`, color: orderType === ot ? C.white : C.textSub, padding: "7px", borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>{ot}</button>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 4, fontFamily: FONT_MONO }}>QUANTITY</label>
              <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 10px", color: C.white, fontFamily: FONT_MONO, fontSize: 13, boxSizing: "border-box" }} />
            </div>
            {orderType === "LIMIT" && (
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 4, fontFamily: FONT_MONO }}>LIMIT PRICE</label>
                <input type="number" value={limitPrice || activeAsset.price} onChange={(e) => setLimitPrice(e.target.value)} style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 10px", color: C.white, fontFamily: FONT_MONO, fontSize: 13, boxSizing: "border-box" }} />
              </div>
            )}
            <div style={{ background: "#07080C", border: `1px solid ${C.border}`, padding: "9px 12px", borderRadius: 6, marginBottom: 12, fontSize: 11.5, display: "flex", justifyContent: "space-between", fontFamily: FONT_MONO }}>
              <span style={{ color: C.textSub }}>EST. MARGIN</span>
              <strong style={{ color: C.white }}>{(Number(qty || 0) * execPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
            </div>
            <button
              onClick={() => {
                onExecuteOrder({ sym: activeAsset.sym, side, qty: Math.max(1, Number(qty) || 1), price: execPrice, type: `${productType}_${orderType}` });
                setToast(`ORDER FILLED: ${side} ${qty} ${activeAsset.sym} @ ${execPrice}`);
                setTimeout(() => setToast(null), 3500);
              }}
              style={{ width: "100%", background: side === "BUY" ? C.green : C.red, color: "#07080C", border: "none", padding: "11px", borderRadius: 6, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FONT_MONO }}
            >
              SUBMIT {side} ORDER
            </button>
            {toast && <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(16,185,129,0.12)", border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 11, fontFamily: FONT_MONO }}>{toast}</div>}
          </div>

          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
            <div style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, color: C.textSub, marginBottom: 6 }}>AI ADVISORY DESK</div>
            <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5, margin: "0 0 12px" }}>Query our AI Advisor for live fundamental & technical analysis on {activeAsset.sym}.</p>
            <button onClick={() => onNavigate("AI Advisor")} style={{ width: "100%", background: C.borderGlow, border: `1px solid ${C.border}`, color: C.white, padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Open AI Advisor</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRO INSTITUTIONAL TERMINAL (F1-F6 MODULES + L2 BOOK + OPTIONS + MAESTRO) ─
function ProTerminalPage({ prices, watchlist, setWatchlist, orders, onExecuteOrder, onDowngrade }: any) {
  const [workspace, setWorkspace] = useState<ProWorkspace>("L2_DESK");
  const [selectedSym, setSelectedSym] = useState(watchlist[0]?.sym || "HAL.NS");
  const [chartRange, setChartRange] = useState("1d");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [algoType, setAlgoType] = useState("VWAP");
  const [qty, setQty] = useState("250");
  const [cmdInput, setCmdInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const [maestroPrompt, setMaestroPrompt] = useState("Analyze institutional positioning, options skew, and statistical arbitrage edge");
  const [maestroRunning, setMaestroRunning] = useState(false);
  const [agents, setAgents] = useState([
    { id: "AGT-01", name: "Equity Fundamental DCF", worktree: "wt/fundamental-dcf", status: "COMPLETED", log: "Fair value +8.8% above spot. Order backlog 3.2x FY26E revenue; ROE 24.6%." },
    { id: "AGT-02", name: "Options & Vol Surface", worktree: "wt/vol-surface-greeks", status: "COMPLETED", log: "Call IV 20.1% vs Put IV 22.3%. 25-Delta skew favors bull call spread." },
    { id: "AGT-03", name: "Macro & FX Correlation", worktree: "wt/macro-fx-yields", status: "COMPLETED", log: "USD/INR stable; 10Y yield 6.78%. FII net cash buyers +3,420 Cr." },
    { id: "AGT-04", name: "StatArb Pair Cointegration", worktree: "wt/statarb-pairs", status: "COMPLETED", log: "Sector pair Z-score at -1.84 (mean-reverting). Historical Sharpe 1.92." },
    { id: "AGT-05", name: "VectorBT Factor Backtest", worktree: "wt/vector-backtest", status: "COMPLETED", log: "5Y walk-forward VWAP breakout: Win Rate 64.2%, Max DD -6.8%, CAGR +28.4%." },
    { id: "AGT-06", name: "Tail-Risk & VaR Sentinel", worktree: "wt/risk-var-stress", status: "COMPLETED", log: "99% 1D VaR at 1.14% (within 2.0% institutional limit)." },
  ]);

  const [selectedMcp, setSelectedMcp] = useState("mcp.nse_option_chain");
  const activeAsset = prices.find((p: any) => p.sym === selectedSym) || prices[0] || { sym: selectedSym, price: 1000, change: 0, pct: 0, cat: "EQUITY" };

  function handleAddSymbol(sym: string, name: string, cat: string) {
    if (!watchlist.find((w: any) => w.sym === sym)) {
      setWatchlist((prev: any) => [{ sym, name, cat, base: 1000 }, ...prev]);
    }
    setSelectedSym(sym);
  }

  function handleCommand(e: React.FormEvent) {
    e.preventDefault();
    const c = cmdInput.trim().toUpperCase();
    if (!c) return;
    if (c === "F1") setWorkspace("L2_DESK");
    else if (c === "F2" || c === "MAESTRO") setWorkspace("MAESTRO_GRID");
    else if (c === "F3" || c === "MCP") setWorkspace("MCP_BUS");
    else if (c === "F4" || c === "QUANT") setWorkspace("QUANT_LAB");
    else if (c === "F5" || c === "MACRO") setWorkspace("GLOBAL_MACRO");
    else if (c === "F6" || c === "ORDERS") setWorkspace("NODE_FLOW");
    else handleAddSymbol(c, c, "EQUITY");
    setCmdInput("");
  }

  async function runMaestro() {
    setMaestroRunning(true);
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", text: `Provide 6 concise 1-line institutional quant outputs separated by "|" for ${selectedSym}: ${maestroPrompt}` }], prices, tier: "premium" }),
      });
      const data = await res.json();
      const parts = (data?.reply || "").split("|").map((s: string) => s.trim()).filter(Boolean);
      setAgents((prev) => prev.map((a, i) => ({ ...a, status: "COMPLETED", log: parts[i] || `[${a.worktree}] Signal confirmed on ${selectedSym} @ ${activeAsset.price}.` })));
    } catch {}
    setMaestroRunning(false);
  }

  const baseP = Number(activeAsset.price) || 1000;
  const step = +(baseP * 0.0005).toFixed(2) || 0.5;
  const bids = Array.from({ length: 5 }, (_, i) => ({ price: +(baseP - step * (i + 1)).toFixed(2), size: 140 + i * 65, pct: 25 + i * 14 }));
  const asks = Array.from({ length: 5 }, (_, i) => ({ price: +(baseP + step * (i + 1)).toFixed(2), size: 125 + i * 70, pct: 20 + i * 15 }));

  return (
    <div style={{ background: C.proBg, minHeight: "100vh", color: C.text, padding: "12px 1.5%", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", background: C.proPanel, border: `1px solid ${C.proBorder}`, padding: 5, borderRadius: 6 }}>
        {[
          { id: "L2_DESK", key: "F1", label: "L2 EXECUTION & OPTIONS" },
          { id: "MAESTRO_GRID", key: "F2", label: "MAESTRO 6-AGENT GRID" },
          { id: "MCP_BUS", key: "F3", label: "MCP PROTOCOL BUS" },
          { id: "QUANT_LAB", key: "F4", label: "VECTOR BACKTESTER" },
          { id: "GLOBAL_MACRO", key: "F5", label: "MACRO & MARITIME AIS" },
          { id: "NODE_FLOW", key: "F6", label: `ORDER AUDIT (${orders.length})` },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setWorkspace(tab.id as ProWorkspace)} style={{ flex: 1, minWidth: 155, background: workspace === tab.id ? C.proBlue : "transparent", border: `1px solid ${workspace === tab.id ? C.proBlueLight : C.proBorder}`, color: workspace === tab.id ? C.white : C.textSub, padding: "7px 10px", borderRadius: 4, cursor: "pointer", fontFamily: FONT_MONO, fontSize: 10.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: "#05070B", color: C.proBlueLight, padding: "2px 5px", borderRadius: 3, fontSize: 9.5 }}>{tab.key}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleCommand} style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: "6px 12px", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ background: C.proBlue, color: C.white, fontWeight: 700, fontSize: 10, padding: "3px 7px", borderRadius: 3 }}>CMD</span>
        <input value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} placeholder="Type symbol (e.g. AAPL, TATAMOTORS.NS) or F1-F6 + Enter..." style={{ flex: 1, background: "transparent", border: "none", color: C.proBlueLight, fontSize: 12, fontFamily: FONT_MONO, outline: "none" }} />
        <button type="button" onClick={onDowngrade} style={{ background: "transparent", border: `1px solid ${C.proBorder}`, color: C.textSub, padding: "4px 10px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: FONT_MONO }}>STANDARD VIEW</button>
      </form>

      {workspace === "L2_DESK" && (
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 320px", gap: 10 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ padding: 10, borderBottom: `1px solid ${C.proBorder}` }}>
              <GlobalSearch onSelect={handleAddSymbol} isPro={true} />
            </div>
            <div style={{ maxHeight: 540, overflowY: "auto" }}>
              {watchlist.map((w: any) => {
                const live = prices.find((p: any) => p.sym === w.sym);
                return (
                  <div key={w.sym} onClick={() => setSelectedSym(w.sym)} style={{ padding: "8px 12px", borderBottom: `1px solid ${C.proBorder}`, cursor: "pointer", background: selectedSym === w.sym ? C.proBlueGlow : "transparent", display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: C.white }}>{w.sym}</div>
                      <div style={{ fontSize: 9.5, color: C.textMuted }}>{w.cat}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.text, fontWeight: 600 }}>{Number(live?.price || w.base || 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                      <div style={{ fontSize: 10, color: (live?.pct || 0) >= 0 ? C.green : C.red }}>{(live?.pct || 0) >= 0 ? "+" : ""}{live?.pct || 0}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: C.white, marginRight: 10 }}>{activeAsset.sym}</span>
                  <Tag color={C.proBlueLight}>DMA L2 FEED</Tag>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>{Number(activeAsset.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {[{ l: "1D", r: "1d" }, { l: "5D", r: "5d" }, { l: "1M", r: "1mo" }, { l: "6M", r: "6mo" }, { l: "1Y", r: "1y" }].map((tf) => (
                  <button key={tf.r} onClick={() => setChartRange(tf.r)} style={{ background: chartRange === tf.r ? C.proBlue : "transparent", color: chartRange === tf.r ? C.white : C.textSub, border: `1px solid ${C.proBorder}`, borderRadius: 3, padding: "3px 9px", fontSize: 10, cursor: "pointer", fontFamily: FONT_MONO }}>{tf.l}</button>
                ))}
              </div>
              <InteractiveStockChart symbol={activeAsset.sym} currentPrice={activeAsset.price} range={chartRange} isPro={true} height={240} />
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 8 }}>OPTIONS CHAIN & GREEKS MATRIX ({activeAsset.sym})</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1fr", fontSize: 10, color: C.textSub, borderBottom: `1px solid ${C.proBorder}`, paddingBottom: 4, marginBottom: 4 }}>
                <span>CALL IV</span><span>DELTA</span><span style={{ textAlign: "center" }}>STRIKE</span><span style={{ textAlign: "right" }}>GAMMA</span><span style={{ textAlign: "right" }}>PUT IV</span>
              </div>
              {[-2, -1, 0, 1, 2].map((offset) => {
                const strike = Math.round(baseP * (1 + offset * 0.01));
                return (
                  <div key={offset} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1fr", fontSize: 11, padding: "4px", background: offset === 0 ? C.proBlueGlow : "transparent" }}>
                    <span style={{ color: C.green }}>{(20.5 - offset * 0.6).toFixed(1)}%</span>
                    <span>{(0.5 - offset * 0.12).toFixed(2)}</span>
                    <span style={{ textAlign: "center", fontWeight: 700, color: offset === 0 ? C.proBlueLight : C.white }}>{strike} {offset === 0 ? "ATM" : ""}</span>
                    <span style={{ textAlign: "right" }}>0.04</span>
                    <span style={{ textAlign: "right", color: C.red }}>{(22.1 + offset * 0.5).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                <span>L2 ORDER BOOK DEPTH</span><span>SPREAD: 4.2 BPS</span>
              </div>
              {asks.slice().reverse().map((a, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 6px", position: "relative", marginBottom: 2 }}>
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${a.pct}%`, background: "rgba(239,68,68,0.12)" }} />
                  <span style={{ color: C.red, zIndex: 1 }}>{a.price}</span><span style={{ color: C.textSub, zIndex: 1 }}>{a.size}</span>
                </div>
              ))}
              <div style={{ textAlign: "center", padding: "5px", background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, fontWeight: 700, color: C.white, fontSize: 12, margin: "6px 0" }}>
                LTP: {baseP.toLocaleString("en-IN")}
              </div>
              {bids.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 6px", position: "relative", marginBottom: 2 }}>
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${b.pct}%`, background: "rgba(16,185,129,0.12)" }} />
                  <span style={{ color: C.green, zIndex: 1 }}>{b.price}</span><span style={{ color: C.textSub, zIndex: 1 }}>{b.size}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 8 }}>ALGO EXECUTION ROUTER</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                {(["BUY", "SELL"] as const).map((s) => (
                  <button key={s} onClick={() => setOrderSide(s)} style={{ background: orderSide === s ? (s === "BUY" ? C.green : C.red) : "#05070B", color: orderSide === s ? "#05070B" : C.textSub, border: `1px solid ${C.proBorder}`, padding: "7px", borderRadius: 4, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: FONT_MONO }}>{s}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                {["VWAP", "TWAP", "ICEBERG", "SOR"].map((st) => (
                  <button key={st} onClick={() => setAlgoType(st)} style={{ flex: 1, background: algoType === st ? C.proBlueGlow : "#05070B", border: `1px solid ${algoType === st ? C.proBlueLight : C.proBorder}`, color: algoType === st ? C.proBlueLight : C.textSub, padding: "4px", borderRadius: 3, fontSize: 9.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}>{st}</button>
                ))}
              </div>
              <input value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: "100%", background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: "7px 9px", color: C.white, fontFamily: FONT_MONO, fontSize: 12, boxSizing: "border-box", marginBottom: 8 }} />
              <button
                onClick={() => {
                  onExecuteOrder({ sym: activeAsset.sym, side: orderSide, qty: Math.max(1, Number(qty) || 1), price: baseP, type: `ALGO_${algoType}` });
                  setToast(`ROUTED [${algoType}]: ${orderSide} ${qty} ${activeAsset.sym} @ ${baseP}`);
                  setTimeout(() => setToast(null), 3500);
                }}
                style={{ width: "100%", background: orderSide === "BUY" ? C.green : C.red, color: "#05070B", border: "none", padding: "9px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}
              >
                TRANSMIT {algoType} {orderSide}
              </button>
              {toast && <div style={{ marginTop: 8, padding: "7px", background: "rgba(16,185,129,0.12)", border: `1px solid ${C.green}`, borderRadius: 4, color: C.green, fontSize: 10.5 }}>{toast}</div>}
            </div>
          </div>
        </div>
      )}

      {workspace === "MAESTRO_GRID" && (
        <div>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12, marginBottom: 12, display: "flex", gap: 10 }}>
            <input value={maestroPrompt} onChange={(e) => setMaestroPrompt(e.target.value)} style={{ flex: 1, background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: "8px 12px", color: C.white, fontFamily: FONT_MONO, fontSize: 12 }} />
            <button onClick={runMaestro} disabled={maestroRunning} style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "8px 16px", borderRadius: 4, fontWeight: 700, fontSize: 11.5, cursor: "pointer", fontFamily: FONT_MONO }}>
              {maestroRunning ? "RUNNING 6 WORKTREES..." : "DISPATCH TO 6 AGENTS"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {agents.map((ag) => (
              <div key={ag.id} style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: C.proBlueLight, fontWeight: 700, fontSize: 11 }}>{ag.id} | {ag.name}</span>
                  <span style={{ color: C.green, fontSize: 10 }}>{ag.status}</span>
                </div>
                <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 8 }}>WORKTREE: {ag.worktree}</div>
                <div style={{ fontSize: 11.5, color: C.text, background: "#05070B", padding: 10, borderRadius: 4, border: `1px solid ${C.proBorder}`, minHeight: 70 }}>{ag.log}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {workspace === "MCP_BUS" && (
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 12 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 10 }}>FINCEPT MCP ENDPOINTS</div>
            {["mcp.yahoo_l2_quote", "mcp.nse_option_chain", "mcp.backtest_vector", "mcp.portfolio_var_monte_carlo", "mcp.fii_dii_block_tape", "mcp.maritime_ais_chokepoint"].map((t) => (
              <div key={t} onClick={() => setSelectedMcp(t)} style={{ padding: "8px 10px", borderRadius: 4, cursor: "pointer", background: selectedMcp === t ? C.proBlueGlow : "#05070B", border: `1px solid ${selectedMcp === t ? C.proBlueLight : C.proBorder}`, marginBottom: 6, fontSize: 11 }}>
                {t}
              </div>
            ))}
          </div>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 10 }}>JSON-RPC 2.0 PAYLOAD | {selectedMcp}</div>
            <pre style={{ background: "#05070B", border: `1px solid ${C.proBorder}`, borderRadius: 4, padding: 14, color: C.green, fontSize: 11.5 }}>
              {JSON.stringify({ jsonrpc: "2.0", tool: selectedMcp, symbol: activeAsset.sym, ltp: baseP, status: "200_OK", pcr_oi: 1.28, var_99: "1.14%" }, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {workspace === "QUANT_LAB" && (
        <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>VECTORBT WALK-FORWARD SIMULATOR ({activeAsset.sym})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>CAGR: <strong style={{ color: C.green }}>+28.4%</strong></div>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>SHARPE: <strong style={{ color: C.proBlueLight }}>2.18</strong></div>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>MAX DRAWDOWN: <strong style={{ color: C.red }}>-6.4%</strong></div>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>WIN RATE: <strong style={{ color: C.white }}>64.8%</strong></div>
          </div>
        </div>
      )}

      {workspace === "GLOBAL_MACRO" && (
        <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>SOVEREIGN 10Y YIELDS & MARITIME CHOKEPOINTS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 11.5 }}>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>INDIA 10Y G-SEC: <strong>6.78%</strong> | US 10Y: <strong>4.18%</strong></div>
            <div style={{ background: "#05070B", padding: 12, borderRadius: 4, border: `1px solid ${C.proBorder}` }}>STRAIT OF HORMUZ AIS: <strong>142 Tankers</strong> | MALACCA: <strong>318 Vessels</strong></div>
          </div>
        </div>
      )}

      {workspace === "NODE_FLOW" && (
        <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>INSTITUTIONAL ORDER AUDIT LOG ({orders.length})</div>
          {orders.map((o: OrderRecord) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 12px", borderBottom: `1px solid ${C.proBorder}`, fontSize: 11.5 }}>
              <span style={{ color: C.proBlueLight }}>{o.id}</span><span>{o.time}</span><span style={{ color: C.white, fontWeight: 700 }}>{o.sym}</span>
              <span style={{ color: o.side === "BUY" ? C.green : C.red }}>{o.side}</span><span>{o.qty} @ {o.price}</span><span style={{ color: C.green }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI ADVISOR PAGE ──────────────────────────────────────────────────────────
function AIAdvisorPage({ prices, userTier }: { prices: any[]; userTier: UserTier }) {
  const isPro = userTier === "premium";
  const [messages, setMessages] = useState([
    { role: "ai", text: isPro ? "Grandline Quant AI Pro initialized. Ask about VWAP positioning, Options Greeks, or portfolio hedging." : "Grandline AI Advisor initialized. Ask about any Indian or US stock, market trend, or SIP strategy." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1), prices, tier: userTier }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data?.reply || "Unable to retrieve response." }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", text: "Network error connecting to advisory endpoint." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "28px 6%" }}>
      <Tag color={isPro ? C.proBlueLight : C.green}>{isPro ? "QUANT AI PRO" : "STANDARD ADVISORY"}</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: "8px 0 18px" }}>
        {isPro ? "Quant AI Pro Desk" : "AI Investment Advisor"}
      </h1>
      <div style={{ background: C.bgCard, border: `1px solid ${isPro ? C.proBlue : C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 20, maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? C.borderGlow : "#07080C", border: `1px solid ${C.border}`, padding: "10px 14px", borderRadius: 6, maxWidth: "75%", fontSize: 13.5, lineHeight: 1.6 }}>
              {m.text}
            </div>
          ))}
          {loading && <div style={{ fontSize: 12, color: C.textSub, fontFamily: FONT_MONO }}>PROCESSING MARKET TELEMETRY...</div>}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask about NIFTY 50, HAL, AAPL, or portfolio strategy..." style={{ flex: 1, background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => send(input)} style={{ background: isPro ? C.proBlueMid : C.accent, color: C.white, border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Transmit</button>
        </div>
      </div>
    </div>
  );
}

// ─── PORTFOLIO DASHBOARD & MARKETS PAGES ──────────────────────────────────────
function DashboardPage({ prices, positions, cashBalance, userTier, onNavigate }: any) {
  const totalInvested = positions.reduce((s: number, p: Position) => s + p.avg * p.qty, 0);
  const totalCurrent = positions.reduce((s: number, p: Position) => {
    const live = prices.find((x: any) => x.sym === p.sym)?.price || p.ltp;
    return s + live * p.qty;
  }, 0);
  const pnl = totalCurrent - totalInvested;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "36px 6%", fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: 0 }}>
          {userTier === "premium" ? "Pro Institutional Portfolio" : "Standard Portfolio Summary"}
        </h1>
        <button onClick={() => onNavigate("Terminal")} style={{ background: C.accent, color: C.white, border: "none", padding: "9px 16px", borderRadius: 6, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>Open Trading Terminal</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24, fontFamily: FONT_MONO }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, color: C.textSub }}>CURRENT VALUE</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.white, marginTop: 6 }}>INR {totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, color: C.textSub }}>UNREALIZED P&L</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: pnl >= 0 ? C.green : C.red, marginTop: 6 }}>{pnl >= 0 ? "+" : ""}INR {pnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 18 }}>
          <div style={{ fontSize: 11, color: C.textSub }}>AVAILABLE MARGIN</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.proBlueLight, marginTop: 6 }}>INR {cashBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", fontFamily: FONT_MONO }}>
        {positions.map((pos: Position) => {
          const live = prices.find((x: any) => x.sym === pos.sym)?.price || pos.ltp;
          const gain = (live - pos.avg) * pos.qty;
          return (
            <div key={pos.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "14px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: C.white }}>{pos.sym}</span>
              <span>QTY: {pos.qty}</span>
              <span>AVG: {pos.avg.toFixed(2)}</span>
              <span style={{ color: gain >= 0 ? C.green : C.red, fontWeight: 700, textAlign: "right" }}>{gain >= 0 ? "+" : ""}{gain.toFixed(0)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MarketsPage({ prices, title = "Multi-Asset Market Overview" }: { prices: any[]; title?: string }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "36px 6%", fontVariantNumeric: "tabular-nums" }}>
      <Tag>LIVE EXCHANGE FEED</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 28, fontWeight: 700, color: C.white, margin: "10px 0 20px" }}>{title}</h1>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden", fontFamily: FONT_MONO }}>
        {prices.map((p: any, i: number) => (
          <div key={p.sym} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "13px 20px", borderBottom: i < prices.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 12.5 }}>
            <div><div style={{ fontWeight: 700, color: C.white }}>{p.sym}</div><div style={{ fontSize: 10.5, color: C.textMuted }}>{p.name || p.cat}</div></div>
            <div style={{ fontWeight: 600 }}>{Number(p.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
            <div style={{ color: (p.change || 0) >= 0 ? C.green : C.red }}>{(p.change || 0) >= 0 ? "+" : ""}{Number(p.change || 0).toFixed(2)}</div>
            <div style={{ color: (p.pct || 0) >= 0 ? C.green : C.red, fontWeight: 600, textAlign: "right" }}>{(p.pct || 0) >= 0 ? "+" : ""}{p.pct || 0}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("Home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userTier, setUserTier] = useState<UserTier>("standard");
  const [watchlist, setWatchlist] = useState(defaultWatchlist);
  const prices = useLivePrices(watchlist);

  const [positions, setPositions] = useState<Position[]>([
    { sym: "RELIANCE.NS", qty: 25, avg: 1210, ltp: 1278 },
    { sym: "HAL.NS", qty: 15, avg: 4100, ltp: 4300 },
  ]);
  const [cashBalance, setCashBalance] = useState(245000);
  const [orders, setOrders] = useState<OrderRecord[]>([
    { id: "ORD-9021", sym: "HAL.NS", side: "BUY", qty: 15, price: 4100, type: "CNC", time: "10:14:22", status: "FILLED" },
    { id: "ORD-9018", sym: "RELIANCE.NS", side: "BUY", qty: 25, price: 1210, type: "CNC", time: "09:42:01", status: "FILLED" },
  ]);

  function handleExecuteOrder(order: { sym: string; side: "BUY" | "SELL"; qty: number; price: number; type: string }) {
    const total = order.qty * order.price;
    if (order.side === "BUY") {
      setCashBalance((prev) => prev - total);
      setPositions((prev) => {
        const ex = prev.find((p) => p.sym === order.sym);
        if (ex) {
          const nQty = ex.qty + order.qty;
          const nAvg = (ex.qty * ex.avg + total) / nQty;
          return prev.map((p) => (p.sym === order.sym ? { ...p, qty: nQty, avg: +nAvg.toFixed(2) } : p));
        }
        return [...prev, { sym: order.sym, qty: order.qty, avg: order.price, ltp: order.price }];
      });
    } else {
      setCashBalance((prev) => prev + total);
      setPositions((prev) => prev.map((p) => (p.sym === order.sym ? { ...p, qty: Math.max(0, p.qty - order.qty) } : p)).filter((p) => p.qty > 0));
    }
    setOrders((prev) => [
      { id: `ORD-${Math.floor(Math.random() * 9000 + 1000)}`, sym: order.sym, side: order.side, qty: order.qty, price: order.price, type: order.type, time: new Date().toLocaleTimeString("en-IN", { hour12: false }), status: "FILLED" },
      ...prev,
    ]);
  }

  function handleLogin(tier: UserTier) {
    setUserTier(tier);
    setIsLoggedIn(true);
    setPage("Terminal");
  }

  const renderPage = () => {
    switch (page) {
      case "Home": return <HomePage setPage={setPage} />;
      case "Terminal":
        return userTier === "premium" ? (
          <ProTerminalPage prices={prices} watchlist={watchlist} setWatchlist={setWatchlist} orders={orders} onExecuteOrder={handleExecuteOrder} onDowngrade={() => setUserTier("standard")} />
        ) : (
          <StandardTerminalPage prices={prices} watchlist={watchlist} setWatchlist={setWatchlist} positions={positions} onExecuteOrder={handleExecuteOrder} onUpgrade={() => setUserTier("premium")} onNavigate={setPage} />
        );
      case "AI Advisor": return <AIAdvisorPage prices={prices} userTier={userTier} />;
      case "Dashboard": return <DashboardPage prices={prices} positions={positions} cashBalance={cashBalance} userTier={userTier} onNavigate={setPage} />;
      case "Markets": return <MarketsPage prices={prices} title="Global Multi-Asset Markets" />;
      case "IndStocks": return <MarketsPage prices={prices.filter((p) => p.cat !== "US_EQUITY")} title="Indian Equities (NSE / BSE)" />;
      case "USStocks": return <MarketsPage prices={prices.filter((p) => p.cat === "US_EQUITY")} title="US Equities (NYSE / NASDAQ)" />;
      case "MutualFund": return <MarketsPage prices={prices} title="Direct Mutual Funds & Systematic Plans" />;
      case "Research": return <MarketsPage prices={prices} title="Institutional Research & Telemetry" />;
      case "Login": return <LoginPage onLogin={handleLogin} />;
      default: return <HomePage setPage={setPage} />;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav page={page} isLoggedIn={isLoggedIn} userTier={userTier} onToggleTier={(t: UserTier) => { setUserTier(t); setIsLoggedIn(true); setPage("Terminal"); }} onNavigate={setPage} onLogout={() => { setIsLoggedIn(false); setPage("Login"); }} />
      <div style={{ paddingTop: 60 }}>
        <LiveMarketBar prices={prices} />
        {renderPage()}
      </div>
    </div>
  );
}