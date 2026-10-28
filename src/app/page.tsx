"use client";
import { useState, useEffect, useRef, useMemo } from "react";

type UserTier = "standard" | "premium";
type ChartType = "candles" | "bars" | "area" | "line";
type ProWorkspace = "L2_DESK" | "MAESTRO_GRID" | "MCP_BUS" | "QUANT_LAB" | "GLOBAL_MACRO" | "NODE_FLOW";
type HubTab =
  | "Explore"
  | "Terminal"
  | "PortfolioDetail"
  | "My Stocks"
  | "Orders"
  | "Watchlist"
  | "Screeners"
  | "Wallet"
  | "P&L Calendar"
  | "IPOs";

interface OHLCPoint { time: string; open: number; high: number; low: number; close: number; volume: number; }
interface Position { sym: string; qty: number; avg: number; ltp: number; assetType?: "STOCK" | "MF" | "IPO"; }
interface OrderRecord { id: string; sym: string; side: "BUY" | "SELL"; qty: number; price: number; type: string; time: string; status: string; }
interface NewsItem { id: string; title: string; publisher: string; link: string; time: string; region: "INDIA" | "US"; tag: string; }
interface WalletTx { id: string; date: string; method: string; type: "DEPOSIT" | "WITHDRAWAL" | "MARGIN_BLOCK"; amount: number; status: string; }

export interface ExecuteOrderPayload {
  sym: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  type: string;
  assetType?: "STOCK" | "MF" | "IPO";
}

interface IPOItem {
  id: string;
  company: string;
  symbol: string;
  board: "MAINBOARD" | "SME";
  status: "OPEN" | "UPCOMING" | "LISTED";
  sector: string;
  priceBand: string;
  cutoffPrice: number;
  lotSize: number;
  issueSizeCr: number;
  closeDate: string;
  listingDate: string;
  gmp: number;
  subQIB: number;
  subNII: number;
  subRetail: number;
  subTotal: number;
  listingGainPct?: number;
}

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
  { sym: "NIFTY 50", name: "NIFTY 50 Index", cat: "INDEX", base: 22706.65, cap: "Large Cap", low52: 21281.45, high52: 26277.35, vol: "28,45,12,900", pe: 22.4, roe: 15.8, rsi: 54.2, delivery: 64, group: "Core India" },
  { sym: "SENSEX", name: "BSE SENSEX", cat: "INDEX", base: 73303.12, cap: "Large Cap", low52: 70234.40, high52: 85978.25, vol: "14,12,80,400", pe: 23.1, roe: 16.1, rsi: 53.8, delivery: 61, group: "Core India" },
  { sym: "RELIANCE.NS", name: "Reliance Industries", cat: "EQUITY", base: 1390.70, cap: "Large Cap", low52: 1210.00, high52: 1608.80, vol: "1,47,63,321", pe: 25.4, roe: 9.8, rsi: 61.4, delivery: 68, group: "Core India" },
  { sym: "HDFCBANK.NS", name: "HDFC Bank Ltd", cat: "EQUITY", base: 1646.25, cap: "Large Cap", low52: 1363.55, high52: 1794.00, vol: "2,12,29,850", pe: 18.6, roe: 17.2, rsi: 58.9, delivery: 72, group: "Core India" },
  { sym: "TCS.NS", name: "Tata Consultancy", cat: "EQUITY", base: 3816.20, cap: "Large Cap", low52: 3591.50, high52: 4440.00, vol: "54,74,207", pe: 28.9, roe: 51.4, rsi: 49.2, delivery: 66, group: "Core India" },
  { sym: "HAL.NS", name: "Hindustan Aeronautics", cat: "EQUITY", base: 4300.00, cap: "Large Cap", low52: 3045.00, high52: 5674.75, vol: "89,14,510", pe: 34.2, roe: 28.9, rsi: 66.8, delivery: 59, group: "Defence & PSU" },
  { sym: "BEL.NS", name: "Bharat Electronics", cat: "EQUITY", base: 292.40, cap: "Large Cap", low52: 179.10, high52: 340.50, vol: "3,42,10,900", pe: 41.5, roe: 26.4, rsi: 64.1, delivery: 62, group: "Defence & PSU" },
  { sym: "INFY.NS", name: "Infosys Ltd", cat: "EQUITY", base: 1551.60, cap: "Large Cap", low52: 1358.35, high52: 1952.50, vol: "1,19,51,500", pe: 24.8, roe: 31.8, rsi: 44.6, delivery: 71, group: "Core India" },
  { sym: "ZOMATO.NS", name: "Zomato Ltd", cat: "EQUITY", base: 264.40, cap: "Mid Cap", low52: 146.30, high52: 304.70, vol: "4,82,19,400", pe: 112.0, roe: 8.4, rsi: 68.5, delivery: 48, group: "Core India" },
  { sym: "SBIN.NS", name: "State Bank of India", cat: "EQUITY", base: 832.10, cap: "Large Cap", low52: 600.65, high52: 912.00, vol: "1,94,10,220", pe: 10.8, roe: 18.9, rsi: 57.3, delivery: 55, group: "Defence & PSU" },
  { sym: "AAPL", name: "Apple Inc.", cat: "US_EQUITY", base: 233.02, cap: "Large Cap", low52: 164.08, high52: 260.10, vol: "4,12,88,100", pe: 31.2, roe: 147.0, rsi: 59.4, delivery: 74, group: "US Tech & AI" },
  { sym: "NVDA", name: "NVIDIA Corp.", cat: "US_EQUITY", base: 138.84, cap: "Large Cap", low52: 75.60, high52: 149.76, vol: "6,84,12,000", pe: 48.6, roe: 115.2, rsi: 71.2, delivery: 69, group: "US Tech & AI" },
  { sym: "MSFT", name: "Microsoft Corp.", cat: "US_EQUITY", base: 428.70, cap: "Large Cap", low52: 385.58, high52: 468.35, vol: "1,92,44,110", pe: 34.8, roe: 36.4, rsi: 52.1, delivery: 77, group: "US Tech & AI" },
  { sym: "TSLA", name: "Tesla Inc.", cat: "US_EQUITY", base: 258.03, cap: "Large Cap", low52: 138.80, high52: 299.29, vol: "5,19,02,300", pe: 62.4, roe: 21.3, rsi: 63.7, delivery: 52, group: "US Tech & AI" },
];

const IPO_PIPELINE_DATA: IPOItem[] = [
  { id: "ipo-1", company: "NSDL (National Securities Depository)", symbol: "NSDL", board: "MAINBOARD", status: "OPEN", sector: "Market Infrastructure", priceBand: "₹760 - ₹800", cutoffPrice: 800, lotSize: 18, issueSizeCr: 4011, closeDate: "30 Oct", listingDate: "04 Nov", gmp: 145, subQIB: 18.4, subNII: 24.1, subRetail: 6.8, subTotal: 14.2 },
  { id: "ipo-2", company: "HDB Financial Services Ltd", symbol: "HDBFIN", board: "MAINBOARD", status: "OPEN", sector: "NBFC / Banking", priceBand: "₹700 - ₹740", cutoffPrice: 740, lotSize: 20, issueSizeCr: 12500, closeDate: "31 Oct", listingDate: "05 Nov", gmp: 92, subQIB: 9.2, subNII: 11.6, subRetail: 4.1, subTotal: 7.4 },
  { id: "ipo-3", company: "Ather Energy Electric Mobility", symbol: "ATHER", board: "MAINBOARD", status: "OPEN", sector: "EV & CleanTech", priceBand: "₹304 - ₹321", cutoffPrice: 321, lotSize: 46, issueSizeCr: 2980, closeDate: "31 Oct", listingDate: "06 Nov", gmp: 48, subQIB: 6.4, subNII: 8.9, subRetail: 5.2, subTotal: 6.3 },
  { id: "ipo-4", company: "Vikran Engineering & EPC", symbol: "VIKRAN", board: "SME", status: "OPEN", sector: "Power Transmission", priceBand: "₹92 - ₹97", cutoffPrice: 97, lotSize: 1200, issueSizeCr: 772, closeDate: "30 Oct", listingDate: "04 Nov", gmp: 34, subQIB: 31.0, subNII: 64.5, subRetail: 42.8, subTotal: 45.1 },
  { id: "ipo-5", company: "Zepto Quick-Commerce India", symbol: "ZEPTO", board: "MAINBOARD", status: "UPCOMING", sector: "Consumer Tech", priceBand: "₹520 - ₹550", cutoffPrice: 550, lotSize: 27, issueSizeCr: 8400, closeDate: "12 Nov", listingDate: "18 Nov", gmp: 110, subQIB: 0, subNII: 0, subRetail: 0, subTotal: 0 },
  { id: "ipo-6", company: "LG Electronics India Pvt Ltd", symbol: "LGEINDIA", board: "MAINBOARD", status: "UPCOMING", sector: "Consumer Durables", priceBand: "₹1,080 - ₹1,140", cutoffPrice: 1140, lotSize: 13, issueSizeCr: 15200, closeDate: "19 Nov", listingDate: "25 Nov", gmp: 195, subQIB: 0, subNII: 0, subRetail: 0, subTotal: 0 },
  { id: "ipo-7", company: "Waaree Energies Ltd", symbol: "WAAREEENER", board: "MAINBOARD", status: "LISTED", sector: "Solar PV Modules", priceBand: "₹1,427 - ₹1,503", cutoffPrice: 1503, lotSize: 9, issueSizeCr: 4321, closeDate: "Closed", listingDate: "Listed @ ₹2,500", gmp: 997, subQIB: 208.6, subNII: 62.4, subRetail: 10.7, subTotal: 76.3, listingGainPct: 66.33 },
  { id: "ipo-8", company: "Bajaj Housing Finance Ltd", symbol: "BAJAJHFL", board: "MAINBOARD", status: "LISTED", sector: "Housing Finance", priceBand: "₹66 - ₹70", cutoffPrice: 70, lotSize: 214, issueSizeCr: 6560, closeDate: "Closed", listingDate: "Listed @ ₹150", gmp: 80, subQIB: 222.0, subNII: 43.9, subRetail: 7.5, subTotal: 67.4, listingGainPct: 114.28 },
];

const INITIAL_NEWS: NewsItem[] = [
  { id: "in-1", title: "NSE NIFTY 50 institutional desk sees strong DII inflows across private banking and defence heavies", publisher: "Grandline India Wire", link: "#", time: "2m ago", region: "INDIA", tag: "NSE / FLOWS" },
  { id: "us-1", title: "US Treasury 10Y yields stabilize ahead of Federal Reserve liquidity commentary; semiconductor complex leads NASDAQ volume", publisher: "Grandline US Desk", link: "#", time: "5m ago", region: "US", tag: "NYSE / MACRO" },
  { id: "in-2", title: "RBI maintains systemic liquidity stance; INR spot volatility remains compressed near institutional support bands", publisher: "Mumbai FX Desk", link: "#", time: "9m ago", region: "INDIA", tag: "RBI / FX" },
  { id: "us-2", title: "Mega-cap AI infrastructure capex guidance drives institutional call-option block prints on NVDA and MSFT", publisher: "Wall Street Derivatives", link: "#", time: "14m ago", region: "US", tag: "NASDAQ / OPTIONS" },
  { id: "in-3", title: "HAL & Bharat Electronics record elevated delivery percentages on NSE cash tape amid defence order book expansion", publisher: "Equities Research India", link: "#", time: "19m ago", region: "INDIA", tag: "BSE / EQUITIES" },
  { id: "us-3", title: "S&P 500 dark-pool block volume registers +14% above 30-day moving average into afternoon New York session", publisher: "US Institutional Tape", link: "#", time: "24m ago", region: "US", tag: "S&P 500 / DMA" },
];

function useLivePrices(watchlist: any[]) {
  const [prices, setPrices] = useState(() =>
    watchlist.map((w, i) => ({
      ...w,
      price: w.base || 1000,
      change: i % 3 === 0 ? -12.4 : 24.6,
      pct: i % 3 === 0 ? -0.68 : 2.14,
    }))
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
            watchlist.map((w, idx) => {
              const live = data.quotes[w.sym];
              const fallbackPct = idx % 3 === 0 ? -0.68 : 2.14;
              return {
                ...w,
                price: live?.price ?? w.base ?? 1000,
                change: live?.change ?? +(((w.base || 1000) * fallbackPct) / 100).toFixed(2),
                pct: live?.pct ?? fallbackPct,
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

function useLiveNews() {
  const [news, setNews] = useState<NewsItem[]>(INITIAL_NEWS);
  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      try {
        const res = await fetch("/api/market?news=true", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.news) && data.news.length > 0 && !cancelled) {
          setNews(data.news);
        }
      } catch {}
    }
    loadNews();
    const id = setInterval(loadNews, 45000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);
  return news;
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

function PortfolioBriefcaseIcon({ size = 18, color = "#F8FAFC" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <path d="M6 12h4m4 0h4" />
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

function MiniSparkline({ up }: { up: boolean }) {
  const points = up ? "0,22 14,19 28,20 42,13 56,15 70,7 84,3" : "0,4 14,8 28,7 42,14 56,13 70,20 84,23";
  const color = up ? C.green : C.red;
  return (
    <svg width="86" height="26" viewBox="0 0 86 26" style={{ display: "block" }}>
      <polyline fill="none" stroke={color} strokeWidth="1.8" points={points} strokeLinecap="round" strokeLinejoin="round" />
      <line x1="0" y1="24" x2="86" y2="24" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
    </svg>
  );
}

// ─── TOP GLOBAL PRICE TICKER (FAST 40s SPEED) ─────────────────────────────────
function LiveMarketBar({ prices }: { prices: any[] }) {
  if (!prices || prices.length === 0) return null;
  return (
    <div style={{ background: "#090B10", borderBottom: `1px solid ${C.border}`, padding: "7px 0", overflow: "hidden", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>
      <div className="global-price-ticker" style={{ display: "inline-flex", gap: "32px", paddingLeft: "20px" }}>
        {prices.concat(prices).map((p, idx) => (
          <div key={`${p.sym}-${idx}`} style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: FONT_MONO, fontSize: "11.5px", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ fontWeight: 600, color: C.textSub }}>{p.sym}</span>
            <span style={{ fontWeight: 600, color: C.white }}>{Number(p.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            <span style={{ color: (p.pct || 0) >= 0 ? C.green : C.red, fontWeight: 500, fontSize: "11px" }}>
              {(p.change || 0) >= 0 ? "+" : ""}{Number(p.change || 0).toFixed(2)} ({(p.pct || 0) >= 0 ? "▲" : "▼"}{Math.abs(Number(p.pct || 0)).toFixed(2)}%)
            </span>
          </div>
        ))}
      </div>
      <style>{`
        .global-price-ticker { animation: tickerScroll 40s linear infinite; }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}

// ─── LARGER PORTFOLIO BAR + ICON TRIGGER + SECONDARY NAVIGATION BAR ──────────
function CompactPortfolioAndSecondaryNav({
  activeTab,
  setActiveTab,
  positions,
  prices,
  cashBalance,
  ordersCount,
  userTier,
  onSelectSymbol,
}: {
  activeTab: HubTab;
  setActiveTab: (t: HubTab) => void;
  positions: Position[];
  prices: any[];
  cashBalance: number;
  ordersCount: number;
  userTier: UserTier;
  onSelectSymbol: (sym: string, name: string, cat: string) => void;
}) {
  const isPro = userTier === "premium";
  const stockOnlyPositions = positions.filter((p) => (p.assetType || "STOCK") === "STOCK");

  const invested = positions.reduce((sum, p) => sum + p.avg * p.qty, 0);
  const currentVal = positions.reduce((sum, p) => {
    const live = prices.find((x) => x.sym === p.sym)?.price ?? p.ltp;
    return sum + live * p.qty;
  }, 0);
  const totalPnl = currentVal - invested;
  const totalPnlPct = invested > 0 ? (totalPnl / invested) * 100 : 0;

  const todayPnl = positions.reduce((sum, p) => {
    const liveObj = prices.find((x) => x.sym === p.sym);
    const chg = liveObj?.change ?? 8.5;
    return sum + chg * p.qty;
  }, 0);
  const todayPnlPct = currentVal > 0 ? (todayPnl / currentVal) * 100 : 0;

  const tabs: { id: HubTab; label: string; badge?: string }[] = [
    { id: "Explore", label: "Explore" },
    { id: "Terminal", label: isPro ? "Pro Terminal" : "Terminal", badge: isPro ? "L2" : undefined },
    { id: "My Stocks", label: `My Stocks (${stockOnlyPositions.length})` },
    { id: "Orders", label: `Orders (${ordersCount})` },
    { id: "Watchlist", label: "Watchlist" },
    { id: "Screeners", label: "Screeners", badge: "QUANT" },
    { id: "Wallet", label: "Wallet" },
    { id: "P&L Calendar", label: "P&L Calendar" },
    { id: "IPOs", label: "IPOs", badge: "4 OPEN" },
  ];

  return (
    <div style={{ background: "#090D16", borderBottom: `1px solid ${C.border}` }}>
      <div
        style={{
          padding: "14px 3%",
          background: "linear-gradient(90deg, rgba(12,16,28,0.98) 0%, rgba(15,23,42,0.92) 55%, rgba(12,16,28,0.98) 100%)",
          borderBottom: `1px solid ${C.borderGlow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 18,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
          <div
            onClick={() => setActiveTab("PortfolioDetail")}
            title="Click to open Full Portfolio & Grandline AI Analysis"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "pointer",
              background: activeTab === "PortfolioDetail" ? "rgba(109,40,217,0.22)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${activeTab === "PortfolioDetail" ? C.accentLight : C.borderGlow}`,
              padding: "8px 14px",
              borderRadius: 10,
              transition: "all 0.15s",
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 8, background: isPro ? C.proBlue : C.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(109,40,217,0.35)" }}>
              <PortfolioBriefcaseIcon size={19} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: FONT_MONO, color: C.textSub, fontWeight: 700, letterSpacing: "0.06em" }}>
                {isPro ? "PRO INSTITUTIONAL" : "TOTAL PORTFOLIO"}
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.white, fontFamily: FONT_MONO, marginTop: 1 }}>
                ₹{currentVal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div style={{ height: 34, width: 1, background: C.border }} />

          <div>
            <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_MONO, fontWeight: 600 }}>TODAY&apos;S P&amp;L</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: todayPnl >= 0 ? C.green : C.red, fontFamily: FONT_MONO, marginTop: 2 }}>
              {todayPnl >= 0 ? "+" : ""}₹{todayPnl.toLocaleString("en-IN", { maximumFractionDigits: 1 })}{" "}
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                ({todayPnl >= 0 ? "▲" : "▼"}{Math.abs(todayPnlPct).toFixed(2)}%)
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_MONO, fontWeight: 600 }}>OVERALL P&amp;L</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: totalPnl >= 0 ? C.green : C.red, fontFamily: FONT_MONO, marginTop: 2 }}>
              {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>
                ({totalPnl >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_MONO, fontWeight: 600 }}>INVESTED VALUE</div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: C.text, fontFamily: FONT_MONO, marginTop: 2 }}>
              ₹{invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            onClick={() => setActiveTab("Wallet")}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${C.borderGlow}`,
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            <div style={{ fontSize: 9.5, color: C.textMuted }}>AVAILABLE WALLET MARGIN</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: isPro ? C.proBlueLight : C.accentLight, marginTop: 2 }}>
              ₹{cashBalance.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          <button
            onClick={() => setActiveTab("PortfolioDetail")}
            style={{
              background: activeTab === "PortfolioDetail"
                ? `linear-gradient(135deg, ${C.accent}, ${C.proBlueMid})`
                : "linear-gradient(135deg, rgba(109,40,217,0.32), rgba(37,99,235,0.32))",
              border: `1px solid ${isPro ? C.proBlueLight : C.accentLight}`,
              color: C.white,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT_MONO,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 6px 20px rgba(109, 40, 217, 0.28)",
            }}
          >
            <PortfolioBriefcaseIcon size={16} color="#FFFFFF" />
            <span>Full Portfolio &amp; Grandline AI</span>
            <span>→</span>
          </button>
        </div>
      </div>

      <div style={{ padding: "0 3%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, minHeight: 48, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto" }}>
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? `2.5px solid ${isPro ? C.proBlueLight : C.green}` : "2.5px solid transparent",
                  color: active ? C.white : C.textSub,
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  padding: "13px 13px 11px",
                  cursor: "pointer",
                  fontFamily: FONT_BODY,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                <span>{t.label}</span>
                {t.badge && (
                  <span style={{ background: t.id === "IPOs" ? "rgba(16,185,129,0.2)" : C.proBlue, color: t.id === "IPOs" ? C.green : C.white, border: t.id === "IPOs" ? `1px solid ${C.green}` : "none", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, fontFamily: FONT_MONO }}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ width: 270, padding: "5px 0" }}>
          <GlobalSearch onSelect={(sym, name, cat) => { onSelectSymbol(sym, name, cat); setActiveTab("Terminal"); }} isPro={isPro} />
        </div>
      </div>
    </div>
  );
}

// ─── 1. FULL PORTFOLIO ANALYTICS & GRANDLINE AI DOCTOR ───────────────────────
function FullPortfolioAndAIView({
  positions,
  prices,
  cashBalance,
  userTier,
  stocksOnly = false,
  onOpenStockInTerminal,
  onExecuteOrder,
}: {
  positions: Position[];
  prices: any[];
  cashBalance: number;
  userTier: UserTier;
  stocksOnly?: boolean;
  onOpenStockInTerminal: (sym: string, name: string, cat: string) => void;
  onExecuteOrder: (order: ExecuteOrderPayload) => void;
}) {
  const isPro = userTier === "premium";
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("Analyze my portfolio concentration, beta risk, profit-booking levels, and suggest 2 hedging or rebalancing moves.");

  const targetPositions = useMemo(() => {
    if (!stocksOnly) return positions;
    return positions.filter((p) => (p.assetType || "STOCK") === "STOCK");
  }, [positions, stocksOnly]);

  const enrichedPositions = useMemo(() => {
    const totalVal = targetPositions.reduce((sum, p) => {
      const ltp = prices.find((x) => x.sym === p.sym)?.price ?? p.ltp;
      return sum + ltp * p.qty;
    }, 0) || 1;

    return targetPositions.map((pos) => {
      const liveObj = prices.find((x) => x.sym === pos.sym);
      const ltp = liveObj?.price ?? pos.ltp;
      const dayChange = liveObj?.change ?? 8.4;
      const dayPct = liveObj?.pct ?? 0.65;
      const invested = pos.avg * pos.qty;
      const current = ltp * pos.qty;
      const netPnl = current - invested;
      const netPnlPct = invested > 0 ? (netPnl / invested) * 100 : 0;
      const todayPnl = dayChange * pos.qty;
      const weightPct = (current / totalVal) * 100;
      const isUS = !pos.sym.includes(".NS") && !pos.sym.includes(".BO") && pos.sym.length <= 5;
      return {
        ...pos,
        name: liveObj?.name || pos.sym,
        ltp,
        dayChange,
        dayPct,
        invested,
        current,
        netPnl,
        netPnlPct,
        todayPnl,
        weightPct,
        market: pos.assetType === "MF" ? "Direct Mutual Fund" : pos.assetType === "IPO" ? "Primary IPO" : isUS ? "US Equity (NASDAQ/NYSE)" : "India Equity (NSE/BSE)",
      };
    });
  }, [targetPositions, prices]);

  const totalInvested = enrichedPositions.reduce((s, p) => s + p.invested, 0);
  const totalCurrent = enrichedPositions.reduce((s, p) => s + p.current, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const totalTodayPnl = enrichedPositions.reduce((s, p) => s + p.todayPnl, 0);
  const netWorth = totalCurrent + cashBalance;

  async function runAIPortfolioAnalysis() {
    if (aiLoading) return;
    setAiLoading(true);
    const holdingsSummary = enrichedPositions
      .map((p) => `${p.sym}: Qty ${p.qty}, Avg ₹${p.avg.toFixed(2)}, LTP ₹${p.ltp.toFixed(2)}, Weight ${p.weightPct.toFixed(1)}%, P&L ${p.netPnl >= 0 ? "+" : ""}₹${p.netPnl.toFixed(0)} (${p.netPnlPct.toFixed(1)}%)`)
      .join(" | ");

    const promptText = `Portfolio Holdings: [${holdingsSummary}]. Total Invested: ₹${totalInvested.toFixed(0)}, Current Value: ₹${totalCurrent.toFixed(0)}, Net P&L: ₹${totalPnl.toFixed(0)} (${totalPnlPct.toFixed(2)}%), Cash Margin: ₹${cashBalance.toFixed(0)}. User Request: ${customPrompt}`;

    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", text: promptText }],
          prices,
          tier: userTier,
        }),
      });
      const data = await res.json();
      setAiAnalysis(data?.reply || "Grandline AI portfolio audit completed.");
    } catch {
      setAiAnalysis("Unable to reach Grandline AI Engine. Verify your network or API configuration.");
    }
    setAiLoading(false);
  }

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Tag color={isPro ? C.proBlueLight : C.green}>
            {stocksOnly ? "MY EQUITY STOCKS & POSITIONS" : "COMPLETE PORTFOLIO TELEMETRY & GRANDLINE AI"}
          </Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
            {stocksOnly ? `Active Equity Stock Positions (${enrichedPositions.length})` : "Full Portfolio Valuation, Risk Metrics & Grandline AI Doctor"}
          </h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
            {stocksOnly
              ? "Showing strictly your direct Indian (NSE/BSE) and US (NYSE/NASDAQ) stock positions."
              : "Comprehensive mark-to-market breakdown across all holdings with automated Grandline AI portfolio diagnostics."}
          </p>
        </div>

        <button
          onClick={runAIPortfolioAnalysis}
          disabled={aiLoading}
          style={{
            background: `linear-gradient(135deg, ${C.accent}, ${C.proBlueMid})`,
            color: C.white,
            border: "none",
            padding: "11px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: FONT_MONO,
            boxShadow: "0 8px 25px rgba(109, 40, 217, 0.35)",
          }}
        >
          {aiLoading ? "ANALYZING WITH GRANDLINE AI..." : "ANALYZE WITH GRANDLINE AI"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20, fontFamily: FONT_MONO }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>ACCOUNT NET WORTH</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginTop: 6 }}>₹{netWorth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Holdings + Wallet Cash</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>HOLDINGS MARKET VALUE</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.white, marginTop: 6 }}>₹{totalCurrent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>{enrichedPositions.length} Active Positions</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>INVESTED PRINCIPAL</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginTop: 6 }}>₹{totalInvested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Cost Basis</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>OVERALL UNREALIZED P&amp;L</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalPnl >= 0 ? C.green : C.red, marginTop: 6 }}>
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 10.5, color: totalPnl >= 0 ? C.green : C.red, marginTop: 4 }}>
            {totalPnl >= 0 ? "+" : ""}{totalPnlPct.toFixed(2)}% Net Return
          </div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>TODAY&apos;S P&amp;L</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: totalTodayPnl >= 0 ? C.green : C.red, marginTop: 6 }}>
            {totalTodayPnl >= 0 ? "+" : ""}₹{totalTodayPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div style={{ fontSize: 10.5, color: C.proBlueLight, marginTop: 4 }}>Beta: 0.94 · Sharpe: 1.88</div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(12,14,20,0.95), rgba(15,23,42,0.9))", border: `1px solid ${isPro ? C.proBlue : C.accent}`, borderRadius: 10, padding: 20, marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green }} />
            <span style={{ fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700, color: C.white }}>
              GRANDLINE AI PORTFOLIO RISK &amp; ALLOCATION ENGINE
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              "Check concentration & beta risk",
              "Suggest stop-loss & profit targets",
              "How to deploy my remaining cash?",
            ].map((preset) => (
              <button
                key={preset}
                onClick={() => setCustomPrompt(preset)}
                style={{ background: "#07080C", border: `1px solid ${C.border}`, color: C.textSub, padding: "4px 10px", borderRadius: 4, fontSize: 11, cursor: "pointer", fontFamily: FONT_MONO }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: aiAnalysis ? 14 : 0 }}>
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAIPortfolioAnalysis()}
            placeholder="Ask Grandline AI to stress-test your portfolio, evaluate P&L, or suggest hedges..."
            style={{ flex: 1, background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.white, fontSize: 13, outline: "none" }}
          />
          <button
            onClick={runAIPortfolioAnalysis}
            disabled={aiLoading}
            style={{ background: isPro ? C.proBlueMid : C.accent, color: C.white, border: "none", borderRadius: 6, padding: "10px 20px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}
          >
            {aiLoading ? "SCANNING..." : "RUN GRANDLINE AI"}
          </button>
        </div>

        {aiAnalysis && (
          <div style={{ background: "#06080E", border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: 16, fontSize: 13.5, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {aiAnalysis}
          </div>
        )}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 10 }}>
          PORTFOLIO ALLOCATION WEIGHTS BY STOCK
        </div>
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginBottom: 12, gap: 2 }}>
          {enrichedPositions.map((p, idx) => {
            const palette = [C.proBlueLight, C.accentLight, C.green, C.amber, C.cyan];
            return (
              <div
                key={p.sym}
                style={{ width: `${Math.max(4, p.weightPct)}%`, background: palette[idx % palette.length], height: "100%" }}
                title={`${p.sym}: ${p.weightPct.toFixed(1)}%`}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontFamily: FONT_MONO, fontSize: 11.5 }}>
          {enrichedPositions.map((p, idx) => {
            const palette = [C.proBlueLight, C.accentLight, C.green, C.amber, C.cyan];
            return (
              <div key={p.sym} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: palette[idx % palette.length] }} />
                <strong style={{ color: C.white }}>{p.sym}</strong>
                <span style={{ color: C.textSub }}>{p.weightPct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", fontFamily: FONT_MONO }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.9fr 0.9fr 1fr 1fr 0.8fr 1.1fr 1.1fr", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 10.5, color: C.textSub, fontWeight: 700 }}>
          <span>STOCK / EXCHANGE</span>
          <span>QTY</span>
          <span>AVG COST</span>
          <span>LIVE LTP</span>
          <span>INVESTED</span>
          <span>CURRENT VAL</span>
          <span>WEIGHT</span>
          <span>NET P&amp;L</span>
          <span style={{ textAlign: "right" }}>QUICK EXECUTE</span>
        </div>

        {enrichedPositions.map((p) => (
          <div
            key={p.sym}
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 0.7fr 0.9fr 0.9fr 1fr 1fr 0.8fr 1.1fr 1.1fr",
              padding: "14px 18px",
              borderBottom: `1px solid ${C.border}`,
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <div onClick={() => onOpenStockInTerminal(p.sym, p.name, "EQUITY")} style={{ cursor: "pointer" }}>
              <div style={{ fontWeight: 700, color: C.white, fontSize: 13 }}>{p.sym}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{p.market}</div>
            </div>
            <div style={{ color: C.white, fontWeight: 600 }}>{p.qty}</div>
            <div style={{ color: C.textSub }}>₹{p.avg.toFixed(2)}</div>
            <div>
              <div style={{ color: C.white, fontWeight: 600 }}>₹{p.ltp.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: p.dayPct >= 0 ? C.green : C.red }}>{p.dayPct >= 0 ? "+" : ""}{p.dayPct}%</div>
            </div>
            <div style={{ color: C.text }}>₹{p.invested.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <div style={{ color: C.white, fontWeight: 700 }}>₹{p.current.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
            <div style={{ color: C.proBlueLight }}>{p.weightPct.toFixed(1)}%</div>
            <div>
              <div style={{ color: p.netPnl >= 0 ? C.green : C.red, fontWeight: 700 }}>
                {p.netPnl >= 0 ? "+" : ""}₹{p.netPnl.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
              <div style={{ fontSize: 10, color: p.netPnlPct >= 0 ? C.green : C.red }}>
                ({p.netPnlPct >= 0 ? "+" : ""}{p.netPnlPct.toFixed(2)}%)
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button
                onClick={() => onExecuteOrder({ sym: p.sym, side: "BUY", qty: 5, price: p.ltp, type: "CNC_ADD", assetType: p.assetType || "STOCK" })}
                style={{ background: "rgba(16,185,129,0.16)", border: `1px solid ${C.green}`, color: C.green, borderRadius: 4, padding: "4px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}
              >
                +BUY 5
              </button>
              <button
                onClick={() => onExecuteOrder({ sym: p.sym, side: "SELL", qty: 5, price: p.ltp, type: "CNC_TRIM", assetType: p.assetType || "STOCK" })}
                style={{ background: "rgba(239,68,68,0.16)", border: `1px solid ${C.red}`, color: C.red, borderRadius: 4, padding: "4px 8px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}
              >
                -SELL 5
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 2. INTERACTIVE P&L CALENDAR HEATMAP TAB ──────────────────────────────────
function PnLCalendarView({ orders }: { orders: OrderRecord[] }) {
  const [selectedMonth, setSelectedMonth] = useState<"OCTOBER 2026" | "SEPTEMBER 2026">("OCTOBER 2026");
  const [selectedDay, setSelectedDay] = useState<number>(28);

  const daysData = useMemo(() => {
    const arr = [];
    for (let d = 1; d <= 31; d++) {
      const dayOfWeek = (d + 3) % 7;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      if (isWeekend || d > 28) {
        arr.push({ day: d, pnl: 0, trades: 0, status: "FLAT", topSym: "—" });
      } else {
        const raw = Math.sin(d * 1.7 + (selectedMonth === "OCTOBER 2026" ? 1 : 2)) * 18500 + (d % 4 === 0 ? -6200 : 4800);
        const pnl = Math.round(raw / 50) * 50;
        const trades = (d % 5) + 2;
        const syms = ["RELIANCE.NS", "HAL.NS", "TCS.NS", "NVDA", "HDFCBANK.NS", "NIFTY 50"];
        arr.push({
          day: d,
          pnl,
          trades,
          status: pnl > 0 ? "PROFIT" : "LOSS",
          topSym: syms[d % syms.length],
        });
      }
    }
    return arr;
  }, [selectedMonth]);

  const activeDays = daysData.filter((d) => d.status !== "FLAT");
  const winDays = activeDays.filter((d) => d.pnl > 0);
  const lossDays = activeDays.filter((d) => d.pnl < 0);
  const netRealized = activeDays.reduce((s, d) => s + d.pnl, 0);
  const winRate = activeDays.length > 0 ? +((winDays.length / activeDays.length) * 100).toFixed(1) : 0;
  const bestDay = activeDays.reduce((best, d) => (d.pnl > best.pnl ? d : best), activeDays[0] || { day: 1, pnl: 0 });
  const worstDay = activeDays.reduce((worst, d) => (d.pnl < worst.pnl ? d : worst), activeDays[0] || { day: 1, pnl: 0 });
  const inspected = daysData.find((d) => d.day === selectedDay) || daysData[27];

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Tag color={C.green}>VERIFIED REALIZED P&amp;L LEDGER</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
            Interactive P&amp;L Calendar &amp; Daily Trade Journal
          </h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
            Click any trading session in the calendar heatmap to inspect realized profit/loss, brokerage charges, and session trades.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(["OCTOBER 2026", "SEPTEMBER 2026"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonth(m)}
              style={{
                background: selectedMonth === m ? C.accent : C.bgCard,
                color: C.white,
                border: `1px solid ${selectedMonth === m ? C.accentLight : C.border}`,
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT_MONO,
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20, fontFamily: FONT_MONO }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>NET REALIZED P&amp;L ({selectedMonth})</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: netRealized >= 0 ? C.green : C.red, marginTop: 6 }}>
            {netRealized >= 0 ? "+" : ""}₹{netRealized.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>{activeDays.length} Active Sessions</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>SESSION WIN RATE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.proBlueLight, marginTop: 6 }}>{winRate}%</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>{winDays.length} Green · {lossDays.length} Red Days</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>BEST TRADING SESSION</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.green, marginTop: 6 }}>+₹{bestDay.pnl.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Oct {bestDay.day}, 2026</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>MAX DAILY DRAWDOWN</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.red, marginTop: 6 }}>₹{worstDay.pnl.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Oct {worstDay.day}, 2026</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 18, alignItems: "start" }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 10, fontFamily: FONT_MONO, fontSize: 11, color: C.textSub, textAlign: "center", fontWeight: 700 }}>
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => <span key={d}>{d}</span>)}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {daysData.map((d) => {
              const isSelected = d.day === selectedDay;
              const bg =
                d.status === "PROFIT"
                  ? "rgba(16, 185, 129, 0.14)"
                  : d.status === "LOSS"
                  ? "rgba(239, 68, 68, 0.14)"
                  : "#07080C";
              const borderCol = isSelected
                ? C.white
                : d.status === "PROFIT"
                ? "rgba(16, 185, 129, 0.4)"
                : d.status === "LOSS"
                ? "rgba(239, 68, 68, 0.4)"
                : C.border;

              return (
                <div
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  style={{
                    background: bg,
                    border: `1.5px solid ${borderCol}`,
                    borderRadius: 8,
                    padding: "10px",
                    minHeight: 74,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    fontFamily: FONT_MONO,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub }}>
                    <span>{String(d.day).padStart(2, "0")}</span>
                    {d.trades > 0 && <span style={{ fontSize: 9.5, color: C.textMuted }}>{d.trades}T</span>}
                  </div>
                  {d.status !== "FLAT" ? (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: d.pnl >= 0 ? C.green : C.red }}>
                        {d.pnl >= 0 ? "+" : ""}₹{d.pnl.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: 9.5, color: C.textMuted, marginTop: 2 }}>{d.topSym}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 10, color: C.textMuted }}>HOLIDAY / FLAT</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 10, padding: 20, fontFamily: FONT_MONO }}>
          <Tag color={inspected.pnl >= 0 ? C.green : C.red}>SESSION AUDIT · OCT {inspected.day}, 2026</Tag>
          <div style={{ fontSize: 26, fontWeight: 800, color: inspected.pnl >= 0 ? C.green : C.red, margin: "12px 0 4px" }}>
            {inspected.pnl >= 0 ? "+" : ""}₹{inspected.pnl.toLocaleString("en-IN")}
          </div>
          <div style={{ fontSize: 11.5, color: C.textSub, marginBottom: 16 }}>
            {inspected.trades} Executed Trades · Primary Driver: {inspected.topSym}
          </div>

          <div style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.textSub }}>GROSS REALIZED P&amp;L</span>
              <strong style={{ color: C.white }}>₹{(inspected.pnl + 145).toLocaleString("en-IN")}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: C.textSub }}>STT &amp; EXCHANGE CHARGES</span>
              <span style={{ color: C.red }}>-₹105</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: C.textSub }}>BROKERAGE (ZERO EQUITY)</span>
              <span style={{ color: C.green }}>₹40</span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: C.textSub, fontWeight: 700, marginBottom: 8 }}>RECENT ACCOUNT FILLS ({orders.length})</div>
          {orders.slice(0, 4).map((o) => (
            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 11.5 }}>
              <span><strong style={{ color: C.white }}>{o.sym}</strong> ({o.side})</span>
              <span style={{ color: C.textSub }}>{o.qty} @ ₹{o.price}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 3. QUANTITATIVE & FUNDAMENTAL STOCK SCREENER TAB ────────────────────────
function StockScreenersView({
  prices,
  onOpenStockInTerminal,
}: {
  prices: any[];
  onOpenStockInTerminal: (sym: string, name: string, cat: string) => void;
}) {
  const [activeScan, setActiveScan] = useState<string>("ALL");
  const [marketFilter, setMarketFilter] = useState<"ALL" | "INDIA" | "US">("ALL");

  const scans = [
    { id: "ALL", label: "All Institutional Universe", desc: "Complete tracked India & US equities" },
    { id: "MOMENTUM", label: "52W High Momentum Breakouts", desc: "RSI > 58 & positive price velocity" },
    { id: "VALUE", label: "Undervalued Low P/E (< 26x)", desc: "High margin of safety & institutional accumulation" },
    { id: "COMPOUNDER", label: "High ROE Compounders (> 25%)", desc: "Superior capital efficiency & cash flow" },
    { id: "DELIVERY", label: "High Institutional Delivery (> 65%)", desc: "Heavy cash-market DII/FII absorption" },
  ];

  const screenedList = useMemo(() => {
    return prices.filter((p) => {
      if (marketFilter === "INDIA" && p.cat === "US_EQUITY") return false;
      if (marketFilter === "US" && p.cat !== "US_EQUITY") return false;
      const pe = p.pe ?? 24.5;
      const roe = p.roe ?? 22.0;
      const rsi = p.rsi ?? 56.0;
      const deliv = p.delivery ?? 64;
      if (activeScan === "MOMENTUM") return rsi >= 58;
      if (activeScan === "VALUE") return pe <= 26;
      if (activeScan === "COMPOUNDER") return roe >= 25;
      if (activeScan === "DELIVERY") return deliv >= 65;
      return true;
    });
  }, [prices, activeScan, marketFilter]);

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Tag color={C.proBlueLight}>GRANDLINE QUANT SCREENER ENGINE</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
            Multi-Factor Technical &amp; Fundamental Stock Screener
          </h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
            Scan NSE/BSE and NYSE/NASDAQ equities across P/E valuation, ROE capital efficiency, RSI(14), and institutional delivery %.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["ALL", "INDIA", "US"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMarketFilter(m)}
              style={{
                background: marketFilter === m ? C.proBlue : C.bgCard,
                color: C.white,
                border: `1px solid ${marketFilter === m ? C.proBlueLight : C.border}`,
                borderRadius: 6,
                padding: "7px 14px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT_MONO,
              }}
            >
              {m === "ALL" ? "ALL MARKETS" : m === "INDIA" ? "INDIA (NSE/BSE)" : "US (NYSE/NASDAQ)"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 20 }}>
        {scans.map((sc) => {
          const active = activeScan === sc.id;
          return (
            <div
              key={sc.id}
              onClick={() => setActiveScan(sc.id)}
              style={{
                background: active ? "rgba(37, 99, 235, 0.16)" : C.bgCard,
                border: `1px solid ${active ? C.proBlueLight : C.border}`,
                borderRadius: 8,
                padding: "14px",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color: C.white, marginBottom: 4 }}>{sc.label}</div>
              <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.4 }}>{sc.desc}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", fontFamily: FONT_MONO }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr 1.1fr", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 10.5, color: C.textSub, fontWeight: 700 }}>
          <span>SYMBOL &amp; NAME</span>
          <span>LIVE PRICE</span>
          <span>1D CHANGE</span>
          <span>P/E RATIO</span>
          <span>ROE %</span>
          <span>RSI (14)</span>
          <span>DELIVERY %</span>
          <span style={{ textAlign: "right" }}>QUANT SIGNAL</span>
        </div>

        {screenedList.map((s) => {
          const rsi = s.rsi ?? 56.4;
          const signal = rsi > 62 ? "STRONG BREAKOUT" : rsi < 46 ? "OVERSOLD VALUE" : "ACCUMULATE";
          return (
            <div
              key={s.sym}
              onClick={() => onOpenStockInTerminal(s.sym, s.name || s.sym, s.cat || "EQUITY")}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr 1.1fr",
                padding: "14px 18px",
                borderBottom: `1px solid ${C.border}`,
                alignItems: "center",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: C.white, fontSize: 13 }}>{s.sym}</div>
                <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_BODY }}>{s.name}</div>
              </div>
              <div style={{ fontWeight: 700, color: C.white }}>₹{Number(s.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              <div style={{ color: (s.pct ?? 0) >= 0 ? C.green : C.red, fontWeight: 600 }}>
                {(s.pct ?? 0) >= 0 ? "+" : ""}{s.pct ?? 0}%
              </div>
              <div style={{ color: C.text }}>{(s.pe ?? 24.2).toFixed(1)}x</div>
              <div style={{ color: C.green, fontWeight: 600 }}>{(s.roe ?? 21.4).toFixed(1)}%</div>
              <div style={{ color: rsi > 65 ? C.amber : C.proBlueLight }}>{rsi.toFixed(1)}</div>
              <div style={{ color: C.textSub }}>{s.delivery ?? 64}%</div>
              <div style={{ textAlign: "right" }}>
                <span style={{ background: "rgba(16,185,129,0.14)", border: `1px solid ${C.green}`, color: C.green, padding: "3px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  {signal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 4. MODIFIED MULTI-GROUP WATCHLIST TAB ───────────────────────────────────
function WatchlistManagerView({
  prices,
  watchlist,
  setWatchlist,
  onOpenStockInTerminal,
  onExecuteOrder,
}: {
  prices: any[];
  watchlist: any[];
  setWatchlist: (fn: any) => void;
  onOpenStockInTerminal: (sym: string, name: string, cat: string) => void;
  onExecuteOrder: (order: ExecuteOrderPayload) => void;
}) {
  const [activeGroup, setActiveGroup] = useState<string>("All Watchlists");
  const groups = ["All Watchlists", "Core India", "US Tech & AI", "Defence & PSU"];

  const filtered = useMemo(() => {
    if (activeGroup === "All Watchlists") return prices;
    return prices.filter((p) => (p.group || "Core India") === activeGroup);
  }, [prices, activeGroup]);

  function handleAddToWatchlist(sym: string, name: string, cat: string) {
    if (!watchlist.find((w: any) => w.sym === sym)) {
      setWatchlist((prev: any) => [
        { sym, name, cat, base: 1000, low52: 820, high52: 1280, vol: "45,10,000", group: activeGroup === "All Watchlists" ? "Core India" : activeGroup },
        ...prev,
      ]);
    }
  }

  function handleRemoveFromWatchlist(sym: string) {
    setWatchlist((prev: any) => prev.filter((w: any) => w.sym !== sym));
  }

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Tag color={C.accentLight}>CUSTOM MULTI-ASSET WATCHLISTS</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
            Curated Watchlist Groups &amp; 52-Week Range Tracker
          </h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
            Organize Indian and US instruments into custom lists, monitor 52W range positioning, and route instant orders.
          </p>
        </div>

        <div style={{ width: 320 }}>
          <GlobalSearch onSelect={handleAddToWatchlist} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            style={{
              background: activeGroup === g ? C.accent : C.bgCard,
              color: C.white,
              border: `1px solid ${activeGroup === g ? C.accentLight : C.border}`,
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", fontFamily: FONT_MONO }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 0.9fr 1fr 1.1fr 1.6fr 1.3fr", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 10.5, color: C.textSub, fontWeight: 700 }}>
          <span>INSTRUMENT &amp; GROUP</span>
          <span>TREND</span>
          <span>LTP</span>
          <span>1D CHANGE</span>
          <span>52W LOW / HIGH RANGE</span>
          <span style={{ textAlign: "right" }}>QUICK ACTIONS</span>
        </div>

        {filtered.map((item) => {
          const isUp = (item.pct ?? 0) >= 0;
          const low52 = item.low52 || +(item.price * 0.78).toFixed(1);
          const high52 = item.high52 || +(item.price * 1.18).toFixed(1);
          const rangePct = Math.min(100, Math.max(5, ((item.price - low52) / Math.max(1, high52 - low52)) * 100));

          return (
            <div
              key={item.sym}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 0.9fr 1fr 1.1fr 1.6fr 1.3fr",
                padding: "14px 18px",
                borderBottom: `1px solid ${C.border}`,
                alignItems: "center",
                fontSize: 12,
              }}
            >
              <div onClick={() => onOpenStockInTerminal(item.sym, item.name || item.sym, item.cat || "EQUITY")} style={{ cursor: "pointer" }}>
                <div style={{ fontWeight: 700, color: C.white, fontSize: 13.5 }}>{item.sym}</div>
                <div style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_BODY }}>{item.name} · {item.group || "Core India"}</div>
              </div>

              <div><MiniSparkline up={isUp} /></div>

              <div style={{ fontWeight: 700, color: C.white, fontSize: 13 }}>
                ₹{Number(item.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </div>

              <div style={{ color: isUp ? C.green : C.red, fontWeight: 600 }}>
                {isUp ? "+" : ""}{Number(item.change || 0).toFixed(2)} ({isUp ? "+" : ""}{item.pct || 0}%)
              </div>

              <div style={{ paddingRight: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: C.textMuted, marginBottom: 4 }}>
                  <span>L: ₹{low52}</span>
                  <span>H: ₹{high52}</span>
                </div>
                <div style={{ height: 5, background: "#07080C", borderRadius: 3, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <div style={{ width: `${rangePct}%`, height: "100%", background: isUp ? C.green : C.proBlueLight }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  onClick={() => onExecuteOrder({ sym: item.sym, side: "BUY", qty: 10, price: item.price, type: "WATCHLIST_BUY", assetType: "STOCK" })}
                  style={{ background: C.green, color: "#05070B", border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 10.5, fontWeight: 800, cursor: "pointer", fontFamily: FONT_MONO }}
                >
                  BUY
                </button>
                <button
                  onClick={() => onOpenStockInTerminal(item.sym, item.name || item.sym, item.cat || "EQUITY")}
                  style={{ background: C.proBlueMid, color: C.white, border: "none", borderRadius: 4, padding: "5px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}
                >
                  CHART
                </button>
                <button
                  onClick={() => handleRemoveFromWatchlist(item.sym)}
                  style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.textMuted, borderRadius: 4, padding: "5px 8px", fontSize: 10.5, cursor: "pointer" }}
                  title="Remove from Watchlist"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 5. DETAILED WALLET, MARGIN BREAKDOWN & LEDGER TAB ───────────────────────
function DetailedWalletView({
  cashBalance,
  positions,
  prices,
  onAddCash,
  onWithdrawCash,
}: {
  cashBalance: number;
  positions: Position[];
  prices: any[];
  onAddCash: (amt: number, method: string) => void;
  onWithdrawCash: (amt: number) => void;
}) {
  const [amountInput, setAmountInput] = useState("50000");
  const [paymentMethod, setPaymentMethod] = useState<"UPI INSTANT" | "NEFT / RTGS" | "IMPS">("UPI INSTANT");
  const [txHistory, setTxHistory] = useState<WalletTx[]>([
    { id: "TXN-88412", date: "28 Oct 2026, 09:12", method: "UPI INSTANT (HDFC Bank)", type: "DEPOSIT", amount: 100000, status: "SETTLED" },
    { id: "TXN-88390", date: "25 Oct 2026, 14:40", method: "ASBA IPO Mandate Block", type: "MARGIN_BLOCK", amount: 14800, status: "ACTIVE BLOCK" },
    { id: "TXN-88219", date: "18 Oct 2026, 11:05", method: "NEFT / RTGS (Federal Bank)", type: "DEPOSIT", amount: 150000, status: "SETTLED" },
    { id: "TXN-88104", date: "10 Oct 2026, 16:30", method: "Payout to Primary Bank", type: "WITHDRAWAL", amount: 25000, status: "PROCESSED" },
  ]);

  const usedMargin = useMemo(() => {
    return positions.reduce((s, p) => s + p.avg * p.qty, 0);
  }, [positions]);

  const currentHoldingsVal = useMemo(() => {
    return positions.reduce((s, p) => {
      const ltp = prices.find((x) => x.sym === p.sym)?.price ?? p.ltp;
      return s + ltp * p.qty;
    }, 0);
  }, [positions, prices]);

  const collateralMargin = Math.round(currentHoldingsVal * 0.8);
  const totalTradingPower = cashBalance + collateralMargin;
  const withdrawableCash = Math.max(0, cashBalance - 5000);

  function handleDeposit(amt: number) {
    onAddCash(amt, paymentMethod);
    setTxHistory((prev) => [
      { id: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`, date: "Just now", method: paymentMethod, type: "DEPOSIT", amount: amt, status: "SETTLED" },
      ...prev,
    ]);
  }

  function handleWithdraw() {
    const amt = Math.min(withdrawableCash, Math.max(1000, Number(amountInput) || 10000));
    if (amt <= 0) return;
    onWithdrawCash(amt);
    setTxHistory((prev) => [
      { id: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`, date: "Just now", method: "IMPS Instant Payout", type: "WITHDRAWAL", amount: amt, status: "PROCESSED" },
      ...prev,
    ]);
  }

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ marginBottom: 20 }}>
        <Tag color={C.proBlueLight}>INSTITUTIONAL TREASURY &amp; MARGIN LEDGER</Tag>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
          Trading Wallet, Collateral Margin &amp; Instant Transfers
        </h1>
        <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
          Zero-fee instant UPI/NEFT capital transfers, pledged equity collateral margin, and real-time T+1 settlement ledger.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 22, fontFamily: FONT_MONO }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>AVAILABLE CASH MARGIN</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.green, marginTop: 6 }}>₹{cashBalance.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Ready for Spot &amp; F&amp;O</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>USED DELIVERY MARGIN</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.white, marginTop: 6 }}>₹{usedMargin.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Allocated in Positions</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>PLEDGED COLLATERAL (80%)</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.proBlueLight, marginTop: 6 }}>₹{collateralMargin.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>20% Haircut Applied</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>TOTAL BUYING POWER</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.accentLight, marginTop: 6 }}>₹{totalTradingPower.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.textMuted, marginTop: 4 }}>Cash + Equity Collateral</div>
        </div>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 16 }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>WITHDRAWABLE BALANCE</div>
          <div style={{ fontSize: 21, fontWeight: 800, color: C.white, marginTop: 6 }}>₹{withdrawableCash.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 10.5, color: C.green, marginTop: 4 }}>Instant IMPS Eligible</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 18, alignItems: "start" }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>
            INSTANT CAPITAL TRANSFER DESK
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>TRANSFER CHANNEL</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(["UPI INSTANT", "NEFT / RTGS", "IMPS"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  style={{
                    background: paymentMethod === m ? C.accent : "#07080C",
                    color: C.white,
                    border: `1px solid ${paymentMethod === m ? C.accentLight : C.border}`,
                    borderRadius: 5,
                    padding: "7px 4px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: FONT_MONO,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>AMOUNT (INR)</label>
            <input
              type="number"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px", color: C.white, fontSize: 15, fontWeight: 700, fontFamily: FONT_MONO, boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {[25000, 50000, 100000, 250000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmountInput(String(amt))}
                  style={{ flex: 1, background: "#07080C", border: `1px solid ${C.border}`, color: C.textSub, borderRadius: 4, padding: "5px 0", fontSize: 10.5, fontFamily: FONT_MONO, cursor: "pointer" }}
                >
                  +₹{(amt / 1000)}k
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, marginBottom: 14, fontFamily: FONT_MONO, fontSize: 11.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.textSub }}>PRIMARY LINKED BANK</span>
              <strong style={{ color: C.white }}>Verified Bank ····4821</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.textSub }}>GATEWAY FEE</span>
              <strong style={{ color: C.green }}>₹0 (FREE)</strong>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => handleDeposit(Math.max(1000, Number(amountInput) || 50000))}
              style={{ background: C.green, color: "#05070B", border: "none", padding: "12px", borderRadius: 6, fontWeight: 800, fontSize: 12, fontFamily: FONT_MONO, cursor: "pointer" }}
            >
              + ADD FUNDS
            </button>
            <button
              onClick={handleWithdraw}
              style={{ background: "transparent", color: C.text, border: `1px solid ${C.borderGlow}`, padding: "12px", borderRadius: 6, fontWeight: 700, fontSize: 12, fontFamily: FONT_MONO, cursor: "pointer" }}
            >
              WITHDRAW
            </button>
          </div>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", fontFamily: FONT_MONO }}>
          <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: C.textSub }}>
            <span>RECENT WALLET &amp; SETTLEMENT LEDGER</span>
            <span>T+1 CLEARING VERIFIED</span>
          </div>
          {txHistory.map((tx) => (
            <div key={tx.id} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 1.6fr 1fr 0.9fr", padding: "13px 18px", borderBottom: `1px solid ${C.border}`, fontSize: 12, alignItems: "center" }}>
              <span style={{ color: C.proBlueLight, fontWeight: 600 }}>{tx.id}</span>
              <span style={{ color: C.textSub, fontSize: 11 }}>{tx.date}</span>
              <span style={{ color: C.white }}>{tx.method}</span>
              <strong style={{ color: tx.type === "DEPOSIT" ? C.green : tx.type === "WITHDRAWAL" ? C.red : C.amber }}>
                {tx.type === "DEPOSIT" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
              </strong>
              <span style={{ textAlign: "right", color: C.green, fontSize: 11 }}>{tx.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PRIMARY MARKET IPO DESK (MAINBOARD & SME + GMP + ASBA BIDDING) ──────────
function IPODeskView({
  onExecuteOrder,
}: {
  cashBalance: number;
  onExecuteOrder: (order: ExecuteOrderPayload) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "UPCOMING" | "LISTED">("ALL");
  const [selectedIPO, setSelectedIPO] = useState<IPOItem>(IPO_PIPELINE_DATA[0]);
  const [lots, setLots] = useState<number>(1);
  const [investorCategory, setInvestorCategory] = useState<"RETAIL" | "sHNI" | "bHNI">("RETAIL");
  const [upiId, setUpiId] = useState("client@okaxis");
  const [bidToast, setBidToast] = useState<string | null>(null);

  const filteredIPOs = useMemo(() => {
    return IPO_PIPELINE_DATA.filter((item) => statusFilter === "ALL" || item.status === statusFilter);
  }, [statusFilter]);

  const totalShares = lots * selectedIPO.lotSize;
  const totalBidAmount = totalShares * selectedIPO.cutoffPrice;
  const estListingPrice = selectedIPO.cutoffPrice + selectedIPO.gmp;
  const estListingGainPerLot = selectedIPO.gmp * selectedIPO.lotSize * lots;
  const estGmpPct = +((selectedIPO.gmp / selectedIPO.cutoffPrice) * 100).toFixed(1);

  function submitIPOBid() {
    onExecuteOrder({
      sym: `${selectedIPO.symbol}-IPO`,
      side: "BUY",
      qty: totalShares,
      price: selectedIPO.cutoffPrice,
      type: `ASBA_${investorCategory}`,
      assetType: "IPO",
    });
    setBidToast(
      `ASBA BID SUBMITTED: ${lots} Lot (${totalShares} shares) of ${selectedIPO.company} @ ₹${selectedIPO.cutoffPrice} (₹${totalBidAmount.toLocaleString("en-IN")} blocked via ${upiId})`
    );
    setTimeout(() => setBidToast(null), 4500);
  }

  return (
    <div style={{ padding: "24px 4% 56px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <div>
          <Tag color={C.green}>PRIMARY MARKETS · NSE &amp; BSE ASBA DESK</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>
            Initial Public Offerings (Mainboard &amp; SME) &amp; Live GMP Tracker
          </h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>
            Real-time QIB / NII / Retail subscription telemetry, Grey Market Premium (GMP) signals, and instant UPI ASBA bidding.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {(["ALL", "OPEN", "UPCOMING", "LISTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? C.accent : C.bgCard,
                color: statusFilter === st ? C.white : C.textSub,
                border: `1px solid ${statusFilter === st ? C.accentLight : C.border}`,
                borderRadius: 6,
                padding: "7px 14px",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT_MONO,
              }}
            >
              {st} ({st === "ALL" ? IPO_PIPELINE_DATA.length : IPO_PIPELINE_DATA.filter((i) => i.status === st).length})
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 365px", gap: 18, alignItems: "start" }}>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1fr 0.8fr 0.9fr 1.1fr 1.1fr 0.9fr", padding: "12px 18px", borderBottom: `1px solid ${C.border}`, fontFamily: FONT_MONO, fontSize: 10.5, color: C.textSub, fontWeight: 700 }}>
            <span>COMPANY &amp; SECTOR</span>
            <span>PRICE BAND</span>
            <span>LOT SIZE</span>
            <span>ISSUE SIZE</span>
            <span>SUBSCRIPTION</span>
            <span>LIVE GMP (EST.)</span>
            <span style={{ textAlign: "right" }}>STATUS</span>
          </div>

          {filteredIPOs.map((ipo) => {
            const active = selectedIPO.id === ipo.id;
            const gmpPct = +((ipo.gmp / ipo.cutoffPrice) * 100).toFixed(1);
            return (
              <div
                key={ipo.id}
                onClick={() => { setSelectedIPO(ipo); setLots(1); }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.1fr 1fr 0.8fr 0.9fr 1.1fr 1.1fr 0.9fr",
                  padding: "14px 18px",
                  borderBottom: `1px solid ${C.border}`,
                  background: active ? "rgba(109,40,217,0.14)" : "transparent",
                  cursor: "pointer",
                  alignItems: "center",
                  fontFamily: FONT_MONO,
                  fontSize: 12,
                }}
              >
                <div style={{ fontFamily: FONT_BODY, paddingRight: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.white, marginBottom: 4 }}>{ipo.company}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9.5, fontFamily: FONT_MONO, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: ipo.board === "MAINBOARD" ? "rgba(37,99,235,0.18)" : "rgba(217,119,6,0.18)", color: ipo.board === "MAINBOARD" ? C.proBlueLight : C.amber }}>
                      {ipo.board}
                    </span>
                    <span style={{ fontSize: 11, color: C.textSub }}>{ipo.sector}</span>
                    <span style={{ fontSize: 10.5, color: C.textMuted }}>· Closes {ipo.closeDate}</span>
                  </div>
                </div>

                <div style={{ color: C.white, fontWeight: 600 }}>{ipo.priceBand}</div>
                <div style={{ color: C.textSub }}>{ipo.lotSize} Sh</div>
                <div style={{ color: C.text }}>₹{ipo.issueSizeCr.toLocaleString("en-IN")} Cr</div>

                <div>
                  {ipo.subTotal > 0 ? (
                    <>
                      <div style={{ color: C.white, fontWeight: 700 }}>{ipo.subTotal}x Total</div>
                      <div style={{ fontSize: 10, color: C.textMuted }}>QIB {ipo.subQIB}x · Ret {ipo.subRetail}x</div>
                    </>
                  ) : (
                    <span style={{ color: C.textMuted, fontSize: 11 }}>Opens Soon</span>
                  )}
                </div>

                <div>
                  <div style={{ color: C.green, fontWeight: 700 }}>+₹{ipo.gmp} ({gmpPct}%)</div>
                  <div style={{ fontSize: 10, color: C.textSub }}>Est. ₹{ipo.cutoffPrice + ipo.gmp}</div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{
                    background: ipo.status === "OPEN" ? "rgba(16,185,129,0.16)" : ipo.status === "UPCOMING" ? "rgba(217,119,6,0.16)" : "rgba(96,165,250,0.16)",
                    color: ipo.status === "OPEN" ? C.green : ipo.status === "UPCOMING" ? C.amber : C.proBlueLight,
                    border: `1px solid ${ipo.status === "OPEN" ? C.green : ipo.status === "UPCOMING" ? C.amber : C.proBlueLight}`,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                  }}>
                    {ipo.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 10, padding: 20, position: "sticky", top: 78 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Tag color={selectedIPO.status === "OPEN" ? C.green : C.amber}>{selectedIPO.board} · {selectedIPO.status}</Tag>
            <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: C.textSub }}>CUT-OFF: ₹{selectedIPO.cutoffPrice}</span>
          </div>

          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 17, fontWeight: 700, color: C.white, margin: "0 0 4px" }}>{selectedIPO.company}</h3>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 14 }}>
            {selectedIPO.sector} · Listing: {selectedIPO.listingDate}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: 10, marginBottom: 14, fontFamily: FONT_MONO, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 9.5, color: C.textMuted }}>QIB SUB</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.proBlueLight, marginTop: 2 }}>{selectedIPO.subQIB}x</div>
            </div>
            <div style={{ borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 9.5, color: C.textMuted }}>NII / HNI</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accentLight, marginTop: 2 }}>{selectedIPO.subNII}x</div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: C.textMuted }}>RETAIL</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginTop: 2 }}>{selectedIPO.subRetail}x</div>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 6, fontFamily: FONT_MONO }}>INVESTOR CATEGORY</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {(["RETAIL", "sHNI", "bHNI"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setInvestorCategory(cat); if (cat === "sHNI" && lots < 14) setLots(14); }}
                  style={{
                    background: investorCategory === cat ? C.accent : "#07080C",
                    color: investorCategory === cat ? C.white : C.textSub,
                    border: `1px solid ${investorCategory === cat ? C.accentLight : C.border}`,
                    borderRadius: 5,
                    padding: "7px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: FONT_MONO,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, marginBottom: 6, fontFamily: FONT_MONO }}>
              <span>NUMBER OF LOTS ({selectedIPO.lotSize} shares/lot)</span>
              <strong style={{ color: C.white }}>{totalShares} Shares</strong>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 5, 14].map((l) => (
                <button
                  key={l}
                  onClick={() => setLots(l)}
                  style={{
                    flex: 1,
                    background: lots === l ? "rgba(109,40,217,0.22)" : "#07080C",
                    border: `1px solid ${lots === l ? C.accentLight : C.border}`,
                    color: lots === l ? C.white : C.textSub,
                    borderRadius: 5,
                    padding: "8px 0",
                    fontSize: 11.5,
                    fontWeight: 700,
                    fontFamily: FONT_MONO,
                    cursor: "pointer",
                  }}
                >
                  {l} {l === 1 ? "Lot" : "Lots"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10.5, color: C.textSub, display: "block", marginBottom: 5, fontFamily: FONT_MONO }}>UPI ID (ASBA BLOCK MANDATE)</label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 12px", color: C.white, fontSize: 12.5, fontFamily: FONT_MONO, boxSizing: "border-box" }}
            />
          </div>

          <div style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: 12, marginBottom: 14, fontFamily: FONT_MONO, fontSize: 11.5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.textSub }}>EST. LISTING PRICE (GMP +₹{selectedIPO.gmp})</span>
              <strong style={{ color: C.green }}>₹{estListingPrice} (+{estGmpPct}%)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: C.textSub }}>EST. LISTING GAIN ({lots} LOT)</span>
              <strong style={{ color: C.green }}>+₹{estListingGainPerLot.toLocaleString("en-IN")}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: `1px solid ${C.border}` }}>
              <span style={{ color: C.textSub }}>TOTAL ASBA AMOUNT BLOCKED</span>
              <strong style={{ color: C.white, fontSize: 13 }}>₹{totalBidAmount.toLocaleString("en-IN")}</strong>
            </div>
          </div>

          <button
            onClick={submitIPOBid}
            disabled={selectedIPO.status === "LISTED"}
            style={{
              width: "100%",
              background: selectedIPO.status === "LISTED" ? C.border : C.green,
              color: selectedIPO.status === "LISTED" ? C.textMuted : "#05070B",
              border: "none",
              borderRadius: 6,
              padding: "12px",
              fontWeight: 800,
              fontSize: 12.5,
              cursor: selectedIPO.status === "LISTED" ? "not-allowed" : "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            {selectedIPO.status === "OPEN"
              ? `APPLY ASBA BID · ₹${totalBidAmount.toLocaleString("en-IN")}`
              : selectedIPO.status === "UPCOMING"
              ? `PRE-APPLY MANDATE · ₹${totalBidAmount.toLocaleString("en-IN")}`
              : "IPO ALREADY LISTED"}
          </button>

          {bidToast && (
            <div style={{ marginTop: 10, padding: "9px 10px", background: "rgba(16,185,129,0.14)", border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 11, fontFamily: FONT_MONO, lineHeight: 1.4 }}>
              {bidToast}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REAL-MARKET DEPTH COMPONENT ──────────────────────────────────────────────
function MarketDepthWidget({ symbol, ltp, exchange = "NSE" }: { symbol: string; ltp: number; exchange?: string }) {
  const [expanded, setExpanded] = useState(false);

  const isUS = !symbol.includes(".NS") && !symbol.includes(".BO") && symbol !== "NIFTY 50" && symbol !== "SENSEX";
  const tick = isUS ? 0.05 : ltp > 1000 ? 0.1 : 0.05;
  const levels = expanded ? 10 : 5;

  const seed = symbol.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rows = useMemo(() => {
    const arr = [];
    for (let i = 0; i < levels; i++) {
      const bidPrice = +(ltp - tick * (i + 1)).toFixed(2);
      const offerPrice = +(ltp + tick * i).toFixed(2);
      const bidQty = Math.floor(26 + ((seed * (i + 3) * 137) % (i === 4 ? 14500 : 2200)));
      const offerQty = Math.floor(180 + ((seed * (i + 5) * 97) % 1600));
      arr.push({ bidQty, bidPrice, offerPrice, offerQty });
    }
    return arr;
  }, [ltp, tick, levels, seed]);

  const totalBidQty = useMemo(() => rows.reduce((s, r) => s + r.bidQty, 0) * 412, [rows]);
  const totalOfferQty = useMemo(() => rows.reduce((s, r) => s + r.offerQty, 0) * 118, [rows]);
  const grandTotal = totalBidQty + totalOfferQty || 1;
  const buyPct = +((totalBidQty / grandTotal) * 100).toFixed(2);
  const sellPct = +(100 - buyPct).toFixed(2);

  return (
    <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 8, padding: "14px 16px", fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C.proBorder}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.white }}>Market Depth</span>
          <span style={{ color: C.proBorder }}>|</span>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.green, fontFamily: FONT_MONO }}>
            {isUS ? "NASDAQ" : exchange} ▾
          </span>
        </div>
        <span style={{ fontSize: 10.5, color: C.textMuted, fontFamily: FONT_MONO }}>{symbol}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.textSub, fontWeight: 600, marginBottom: 6 }}>
        <span>BUY</span>
        <span>SELL</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.white, fontFamily: FONT_MONO, marginBottom: 6 }}>
        <span>{buyPct}%</span>
        <span>{sellPct}%</span>
      </div>
      <div style={{ height: 5, width: "100%", background: C.red, borderRadius: 4, overflow: "hidden", display: "flex", marginBottom: 14 }}>
        <div style={{ width: `${buyPct}%`, background: C.green, height: "100%", transition: "width 0.3s ease" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${C.proBorder}`, borderBottom: `1px solid ${C.proBorder}` }}>
        <div style={{ borderRight: `1px solid ${C.proBorder}`, paddingRight: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.proBorder}`, fontSize: 11, color: C.textSub, fontWeight: 600 }}>
            <span>Qty</span>
            <span>Bid</span>
          </div>
          {rows.map((r, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, fontFamily: FONT_MONO }}>
              <span style={{ color: C.white }}>{r.bidQty}</span>
              <span style={{ color: C.green, fontWeight: 600 }}>{r.bidPrice.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div style={{ paddingLeft: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.proBorder}`, fontSize: 11, color: C.textSub, fontWeight: 600 }}>
            <span>Offer</span>
            <span>Qty</span>
          </div>
          {rows.map((r, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, fontFamily: FONT_MONO }}>
              <span style={{ color: C.red, fontWeight: 600 }}>{r.offerPrice.toFixed(2)}</span>
              <span style={{ color: C.white }}>{r.offerQty}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.proBorder}`, fontFamily: FONT_MONO, fontSize: 12, fontWeight: 700 }}>
        <span style={{ color: C.white }}>{totalBidQty.toLocaleString("en-IN")}</span>
        <span style={{ fontSize: 10.5, color: C.textSub, fontWeight: 600 }}>TOTAL</span>
        <span style={{ color: C.white }}>{totalOfferQty.toLocaleString("en-IN")}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, fontSize: 11 }}>
        <span style={{ color: C.textMuted }}>
          Powered by <strong style={{ color: C.green }}>GrandlineDepth+</strong>
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: "transparent", border: "none", color: C.textSub, textDecoration: "underline", fontSize: 11, cursor: "pointer", padding: 0 }}
        >
          {expanded ? "Show 5 Levels ▴" : "View 20 More ▾"}
        </button>
      </div>
    </div>
  );
}

// ─── INDSTOCKS-STYLE EXPLORE HUB (ROUTER FOR ALL SECONDARY TABS) ─────────────
function ExploreStocksHub({
  prices,
  positions,
  orders,
  watchlist,
  setWatchlist,
  cashBalance,
  userTier,
  activeHubTab,
  setActiveHubTab,
  onOpenStockInTerminal,
  onExecuteOrder,
  onAddCash,
  onWithdrawCash,
}: {
  prices: any[];
  positions: Position[];
  orders: OrderRecord[];
  watchlist: any[];
  setWatchlist: (fn: any) => void;
  cashBalance: number;
  userTier: UserTier;
  activeHubTab: HubTab;
  setActiveHubTab: (t: HubTab) => void;
  onOpenStockInTerminal: (sym: string, name: string, cat: string) => void;
  onExecuteOrder: (order: ExecuteOrderPayload) => void;
  onAddCash: (amt: number, method: string) => void;
  onWithdrawCash: (amt: number) => void;
}) {
  const [gainerCap, setGainerCap] = useState("Large Cap");
  const [loserCap, setLoserCap] = useState("Large Cap");

  const gainers = useMemo(() => {
    const list = prices.filter((p) => (p.pct ?? 0) >= 0);
    return (list.length > 0 ? list : prices).slice(0, 6);
  }, [prices]);

  const losers = useMemo(() => {
    const list = prices.filter((p) => (p.pct ?? 0) < 0);
    return (list.length > 0 ? list : prices.slice().reverse()).slice(0, 5);
  }, [prices]);

  if (activeHubTab === "PortfolioDetail") {
    return (
      <FullPortfolioAndAIView
        positions={positions}
        prices={prices}
        cashBalance={cashBalance}
        userTier={userTier}
        stocksOnly={false}
        onOpenStockInTerminal={onOpenStockInTerminal}
        onExecuteOrder={onExecuteOrder}
      />
    );
  }

  if (activeHubTab === "My Stocks") {
    return (
      <FullPortfolioAndAIView
        positions={positions}
        prices={prices}
        cashBalance={cashBalance}
        userTier={userTier}
        stocksOnly={true}
        onOpenStockInTerminal={onOpenStockInTerminal}
        onExecuteOrder={onExecuteOrder}
      />
    );
  }

  if (activeHubTab === "Watchlist") {
    return (
      <WatchlistManagerView
        prices={prices}
        watchlist={watchlist}
        setWatchlist={setWatchlist}
        onOpenStockInTerminal={onOpenStockInTerminal}
        onExecuteOrder={onExecuteOrder}
      />
    );
  }

  if (activeHubTab === "Screeners") {
    return <StockScreenersView prices={prices} onOpenStockInTerminal={onOpenStockInTerminal} />;
  }

  if (activeHubTab === "P&L Calendar") {
    return <PnLCalendarView orders={orders} />;
  }

  if (activeHubTab === "Wallet") {
    return (
      <DetailedWalletView
        cashBalance={cashBalance}
        positions={positions}
        prices={prices}
        onAddCash={onAddCash}
        onWithdrawCash={onWithdrawCash}
      />
    );
  }

  if (activeHubTab === "IPOs") {
    return <IPODeskView cashBalance={cashBalance} onExecuteOrder={onExecuteOrder} />;
  }

  if (activeHubTab === "Orders") {
    return (
      <div style={{ padding: "28px 4%", background: C.bg, minHeight: "82vh", color: C.text }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700, color: C.white, marginBottom: 16 }}>Executed Order &amp; ASBA Book ({orders.length})</h2>
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", fontFamily: FONT_MONO }}>
          {orders.map((o) => (
            <div key={o.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr 1fr 1.2fr 1fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
              <span style={{ color: C.proBlueLight }}>{o.id}</span>
              <span>{o.time}</span>
              <strong style={{ color: C.white }}>{o.sym}</strong>
              <span style={{ color: o.side === "BUY" ? C.green : C.red, fontWeight: 700 }}>{o.side} ({o.type})</span>
              <span>{o.qty} @ ₹{o.price}</span>
              <span style={{ color: C.green, textAlign: "right" }}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 4% 48px", background: C.bg, minHeight: "85vh", color: C.text, fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ fontSize: 14, color: C.textSub, marginBottom: 18 }}>
        INDstocks / <strong style={{ color: C.white }}>{activeHubTab}</strong>
      </div>

      <div style={{ marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: C.white, margin: 0 }}>Top Gainers today</h2>
          <span onClick={() => setActiveHubTab("Terminal")} style={{ fontSize: 12.5, color: C.proBlueLight, cursor: "pointer", fontWeight: 600 }}>Open Full Terminal →</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Large Cap", "Mid Cap", "Small Cap", "Nifty 500"].map((cap) => {
            const active = gainerCap === cap;
            return (
              <button
                key={cap}
                onClick={() => setGainerCap(cap)}
                style={{
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? C.white : C.textSub,
                  border: `1px solid ${active ? C.white : C.border}`,
                  borderRadius: 20,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {cap}
              </button>
            );
          })}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.3fr 1.2fr 1.2fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11.5, color: C.textSub, fontWeight: 500 }}>
            <span>Stock Name</span>
            <span>Trend</span>
            <span>Price / 1D Change</span>
            <span>⇅ 52W High</span>
            <span style={{ textAlign: "right" }}>Market Volume</span>
          </div>

          {gainers.map((stock, i) => {
            const isUp = (stock.pct ?? 0) >= 0;
            const high52 = stock.high52 || +(stock.price * 1.14).toFixed(2);
            const vol = stock.vol || "2,12,29,985.00";
            return (
              <div
                key={stock.sym}
                onClick={() => onOpenStockInTerminal(stock.sym, stock.name || stock.sym, stock.cat || "EQUITY")}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1.3fr 1.2fr 1.2fr",
                  padding: "14px 20px",
                  borderBottom: i < gainers.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.bgCardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(37, 99, 235, 0.18)", border: `1px solid ${C.proBlue}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: C.proBlueLight, fontFamily: FONT_MONO }}>
                    {stock.sym.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.white }}>{stock.name || stock.sym}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: FONT_MONO }}>{stock.sym.replace(".NS", "")}</div>
                  </div>
                </div>

                <div><MiniSparkline up={isUp} /></div>

                <div style={{ fontFamily: FONT_MONO }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.white }}>₹{Number(stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11.5, color: isUp ? C.green : C.red, marginTop: 2 }}>
                    {isUp ? "+" : ""}{Number(stock.change || 12.4).toFixed(2)} ({isUp ? "▲" : "▼"}{Math.abs(Number(stock.pct || 2.1)).toFixed(2)}%)
                  </div>
                </div>

                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text }}>
                  ₹{Number(high52).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>

                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, textAlign: "right" }}>
                  {vol}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 700, color: C.white, margin: 0 }}>Top Losers today</h2>
          <span onClick={() => setActiveHubTab("Terminal")} style={{ fontSize: 12.5, color: C.proBlueLight, cursor: "pointer", fontWeight: 600 }}>View All →</span>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["Large Cap", "Mid Cap", "Small Cap", "Nifty 500"].map((cap) => {
            const active = loserCap === cap;
            return (
              <button
                key={cap}
                onClick={() => setLoserCap(cap)}
                style={{
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? C.white : C.textSub,
                  border: `1px solid ${active ? C.white : C.border}`,
                  borderRadius: 20,
                  padding: "6px 16px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  cursor: "pointer",
                }}
              >
                {cap}
              </button>
            );
          })}
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1.3fr 1.2fr 1.2fr", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, fontSize: 11.5, color: C.textSub, fontWeight: 500 }}>
            <span>Stock Name</span>
            <span>Trend</span>
            <span>Price / 1D Change</span>
            <span>⇅ 52W High</span>
            <span style={{ textAlign: "right" }}>Market Volume</span>
          </div>

          {losers.map((stock, i) => {
            const high52 = stock.high52 || +(stock.price * 1.18).toFixed(2);
            const vol = stock.vol || "54,74,207.00";
            return (
              <div
                key={`${stock.sym}-loser`}
                onClick={() => onOpenStockInTerminal(stock.sym, stock.name || stock.sym, stock.cat || "EQUITY")}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2.2fr 1fr 1.3fr 1.2fr 1.2fr",
                  padding: "14px 20px",
                  borderBottom: i < losers.length - 1 ? `1px solid ${C.border}` : "none",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = C.bgCardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(239, 68, 68, 0.14)", border: `1px solid ${C.red}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: C.red, fontFamily: FONT_MONO }}>
                    {stock.sym.slice(0, 3)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.white }}>{stock.name || stock.sym}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, fontFamily: FONT_MONO }}>{stock.sym.replace(".NS", "")}</div>
                  </div>
                </div>

                <div><MiniSparkline up={false} /></div>

                <div style={{ fontFamily: FONT_MONO }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: C.white }}>₹{Number(stock.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
                  <div style={{ fontSize: 11.5, color: C.red, marginTop: 2 }}>
                    -{Math.abs(Number(stock.change || 9.4)).toFixed(2)} (▼{Math.abs(Number(stock.pct || 0.84)).toFixed(2)}%)
                  </div>
                </div>

                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text }}>
                  ₹{Number(high52).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </div>

                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: C.text, textAlign: "right" }}>
                  {vol}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PRO TERMINAL TOP SCROLLING FINANCIAL NEWS RIBBON (SLOWER 95s SPEED) ──────
function ProNewsTickerTape({ news, regionFilter, setRegionFilter }: { news: NewsItem[]; regionFilter: "ALL" | "INDIA" | "US"; setRegionFilter: (r: "ALL" | "INDIA" | "US") => void }) {
  const filtered = regionFilter === "ALL" ? news : news.filter((n) => n.region === regionFilter);
  const items = filtered.length > 0 ? filtered : news;

  return (
    <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, marginBottom: 10, display: "flex", alignItems: "center", overflow: "hidden", height: 36 }}>
      <div style={{ background: C.proBlueDark, color: C.white, padding: "0 12px", height: "100%", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, borderRight: `1px solid ${C.proBorder}`, zIndex: 2 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em" }}>LIVE WIRE</span>
      </div>

      <div style={{ display: "flex", gap: 3, padding: "0 8px", flexShrink: 0, borderRight: `1px solid ${C.proBorder}`, height: "100%", alignItems: "center", background: "#06090F", zIndex: 2 }}>
        {(["ALL", "INDIA", "US"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            style={{
              background: regionFilter === r ? C.proBlue : "transparent",
              color: regionFilter === r ? C.white : C.textSub,
              border: "none",
              borderRadius: 3,
              padding: "2px 7px",
              fontSize: 9.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: FONT_MONO,
            }}
          >
            {r}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", position: "relative" }}>
        <div className="pro-news-marquee" style={{ display: "inline-flex", gap: 48, paddingLeft: 16 }}>
          {items.concat(items).map((item, idx) => (
            <a
              key={`${item.id}-${idx}`}
              href={item.link}
              target="_blank"
              rel="noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", fontSize: 11.5, color: C.text }}
            >
              <span style={{
                background: item.region === "INDIA" ? "rgba(16, 185, 129, 0.15)" : "rgba(59, 130, 246, 0.18)",
                color: item.region === "INDIA" ? C.green : C.proBlueLight,
                border: `1px solid ${item.region === "INDIA" ? C.green : C.proBlueLight}`,
                padding: "1px 5px",
                borderRadius: 3,
                fontSize: 9,
                fontWeight: 700,
              }}>
                {item.region === "INDIA" ? "IND" : "USA"}
              </span>
              <span style={{ color: C.white, fontWeight: 500 }}>{item.title}</span>
              <span style={{ color: C.textMuted, fontSize: 10 }}>({item.publisher} · {item.time})</span>
            </a>
          ))}
        </div>
      </div>
      <style>{`
        .pro-news-marquee { animation: proNewsScroll 95s linear infinite; }
        .pro-news-marquee:hover { animation-play-state: paused; }
        @keyframes proNewsScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
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
        placeholder="Search India/US stock (e.g. RELIANCE, AAPL)..."
        style={{ width: "100%", background: isPro ? "#05070B" : "#07080C", border: `1px solid ${isPro ? C.proBorder : C.border}`, borderRadius: 6, padding: "7px 10px", color: C.text, fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: FONT_MONO }}
      />
      {query.trim().length >= 2 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: isPro ? C.proPanel : C.bgCard, border: `1px solid ${isPro ? C.proBorder : C.borderGlow}`, borderRadius: 6, maxHeight: 260, overflowY: "auto", zIndex: 80, boxShadow: "0 12px 28px rgba(0,0,0,0.65)" }}>
          {searching && <div style={{ padding: 10, fontSize: 11, color: C.textSub, fontFamily: FONT_MONO }}>SEARCHING GLOBAL DIRECTORY...</div>}
          {!searching && results.length === 0 && (
            <div
              onClick={() => { onSelect(query.toUpperCase().trim(), query.toUpperCase().trim(), "EQUITY"); setQuery(""); }}
              style={{ padding: 10, fontSize: 11, color: C.proBlueLight, fontFamily: FONT_MONO, cursor: "pointer" }}
            >
              + Add &quot;{query.toUpperCase().trim()}&quot; directly
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

// ─── GLASSMORPHIC NAVIGATION BAR ──────────────────────────────────────────────
function Nav({ page, isLoggedIn, userTier, onToggleTier, onNavigate, onLogout, onOpenHubTab }: any) {
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

  const dropdowns: Record<string, { label: string; target: string; hubTab?: HubTab }[]> = {
    Markets: [
      { label: "Stocks & Explore Hub", target: "Hub", hubTab: "Explore" },
      { label: "Quant Stock Screeners", target: "Hub", hubTab: "Screeners" },
      { label: "Primary Market IPO Desk", target: "Hub", hubTab: "IPOs" },
      { label: "Indian Equities (NSE/BSE)", target: "IndStocks" },
      { label: "US Stocks (NYSE/NASDAQ)", target: "USStocks" },
      { label: "Direct Mutual Funds", target: "MutualFund" },
    ],
    Resources: [
      { label: "Full Portfolio & Grandline AI", target: "Hub", hubTab: "PortfolioDetail" },
      { label: "P&L Calendar & Journal", target: "Hub", hubTab: "P&L Calendar" },
      { label: "Grandline AI Advisor", target: "AI Advisor" },
    ],
  };

  const productsMenu = [
    {
      label: "Broking & Distribution",
      columns: [
        {
          title: "Invest",
          items: [
            { label: "Explore Stocks Hub", target: "Hub", hubTab: "Explore" as HubTab },
            { label: "Mainboard & SME IPOs", target: "Hub", hubTab: "IPOs" as HubTab },
            { label: "Direct Mutual Funds & SIPs", target: "MutualFund" },
            { label: "US Equities (NYSE/NASDAQ)", target: "USStocks" },
          ],
        },
        {
          title: "Trade & Analytics",
          items: [
            { label: "Full Portfolio & Grandline AI", target: "Hub", hubTab: "PortfolioDetail" as HubTab },
            { label: "Quant Stock Screeners", target: "Hub", hubTab: "Screeners" as HubTab },
            { label: "P&L Calendar Heatmap", target: "Hub", hubTab: "P&L Calendar" as HubTab },
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
            { label: "Market Depth & L2 Terminal", target: "Hub", hubTab: "Terminal" as HubTab },
            { label: "Maestro 6-Agent Parallel Grid", target: "Hub", hubTab: "Terminal" as HubTab },
            { label: "Grandline AI Pro Desk", target: "AI Advisor" },
          ],
        },
      ],
    },
  ];

  function go(target: string, hubTab?: HubTab) {
    setOpenMenu(null);
    setOpenSub(0);
    if (hubTab && onOpenHubTab) {
      onOpenHubTab(hubTab);
    } else {
      onNavigate(target);
    }
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
      <div onClick={() => go(isLoggedIn ? "Hub" : "Home")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
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
        <button onClick={() => go("Hub", "Explore")} style={navBtnStyle(page === "Hub")}>Stocks</button>

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
                          onClick={() => go(item.target, (item as any).hubTab)}
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
                    onClick={() => go(item.target, item.hubTab)}
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

        <button onClick={() => go("Hub", "IPOs")} style={navBtnStyle(false)}>IPOs</button>
        <button onClick={() => go("MutualFund")} style={navBtnStyle(page === "MutualFund")}>Mutual Funds</button>
        <button onClick={() => go("AI Advisor")} style={navBtnStyle(page === "AI Advisor")}>Grandline AI</button>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {isLoggedIn ? (
          <>
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.04)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 8, padding: 2 }}>
              <button onClick={() => onToggleTier("standard")} style={{ background: !isPro ? C.accent : "transparent", color: !isPro ? C.white : C.textSub, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT_MONO }}>STANDARD</button>
              <button onClick={() => onToggleTier("premium")} style={{ background: isPro ? C.proBlueMid : "transparent", color: isPro ? C.white : C.proBlueLight, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 10.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}>PRO</button>
            </div>
            <button
              onClick={() => go("Hub", "PortfolioDetail")}
              title="Open Full Portfolio & Grandline AI Analysis"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isPro ? C.proBlue : "rgba(255, 255, 255, 0.16)"}`,
                color: C.white,
                padding: "6px 13px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <PortfolioBriefcaseIcon size={15} color="#A78BFA" />
              <span>Portfolio</span>
            </button>
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
          Unified multi-asset execution across Indian equities (NSE/BSE), US equities (NYSE/NASDAQ), Mainboard &amp; SME IPOs, Direct Mutual Funds, and Grandline AI Portfolio Diagnostics.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setPage("Login")} style={{ background: C.white, color: "#07080C", border: "none", padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Sign In to Stocks &amp; Portfolio Hub</button>
          <button onClick={() => setPage("MutualFund")} style={{ background: C.bgCard, color: C.text, border: `1px solid ${C.borderGlow}`, padding: "13px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Explore 0% Commission Mutual Funds</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, maxWidth: 780, margin: "56px auto 0", overflow: "hidden" }}>
          {[
            { label: "ASSET CLASSES", val: "6" },
            { label: "GLOBAL INSTRUMENTS", val: "15,000+" },
            { label: "EXECUTION TIERS", val: "Standard / Pro" },
            { label: "PORTFOLIO ENGINE", val: "Grandline AI" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "20px 14px", textAlign: "center", borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 19, fontWeight: 700, color: C.white }}>{s.val}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10.5, color: C.textSub, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── DUAL-TIER LOGIN PAGE ─────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (tier: UserTier) => void }) {
  const [selectedTier, setSelectedTier] = useState<UserTier>("standard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 5%" }}>
      <div style={{ width: "100%", maxWidth: 840, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: "0 0 6px" }}>Select Execution Environment</h1>
          <p style={{ color: C.textSub, fontSize: 13.5, margin: 0 }}>Logging in opens your Stocks &amp; Portfolio Hub with Explore, Grandline AI Portfolio Doctor, P&amp;L Calendar, Screeners, and IPOs.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div onClick={() => setSelectedTier("standard")} style={{ background: C.bgCard, border: `2px solid ${selectedTier === "standard" ? C.accentLight : C.border}`, borderRadius: 8, padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Tag color={C.accentLight}>STANDARD TIER</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.textSub }}>RETAIL EXECUTION</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 12px" }}>Standard Stocks &amp; Terminal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: C.textSub, lineHeight: 1.5 }}>
              <div>- INDstocks-Style Explore Hub &amp; Multi-List Watchlists</div>
              <div>- Full Portfolio Breakdown &amp; Grandline AI Risk Doctor</div>
              <div>- P&amp;L Heatmap Calendar, Quant Screeners &amp; IPO ASBA Desk</div>
              <div>- 0% Commission Direct Mutual Funds &amp; SIP Calculator</div>
            </div>
          </div>

          <div onClick={() => setSelectedTier("premium")} style={{ background: selectedTier === "premium" ? "#080D1A" : C.bgCard, border: `2px solid ${selectedTier === "premium" ? C.proBlueLight : C.border}`, borderRadius: 8, padding: 24, cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Tag color={C.proBlueLight}>PRO INSTITUTIONAL</Tag>
              <span style={{ fontFamily: FONT_MONO, fontSize: 11.5, color: C.proBlueLight }}>QUANT DESK</span>
            </div>
            <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 700, color: C.white, margin: "0 0 12px" }}>Pro Institutional Suite</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
              <div><strong style={{ color: C.proBlueLight }}>[MARKET DEPTH] Live NSE/US Ladder:</strong> Buy/Sell % Bar &amp; 20-Level Bid/Offer</div>
              <div><strong style={{ color: C.proBlueLight }}>[GRANDLINE AI PRO] Quant Audit:</strong> Beta, VaR &amp; Hedging Diagnostics</div>
              <div><strong style={{ color: C.proBlueLight }}>[F2] Maestro 6-Agent Grid:</strong> 6 Parallel Quant Sessions in Isolated Worktrees</div>
              <div><strong style={{ color: C.proBlueLight }}>[F3] MCP Protocol Bus:</strong> 12 Financial Model Context Protocol Tools</div>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onLogin(selectedTier); }} style={{ background: C.bgCard, border: `1px solid ${selectedTier === "premium" ? C.proBlue : C.border}`, borderRadius: 8, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (optional for demo)" style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }} />
          </div>
          <button type="submit" style={{ background: selectedTier === "premium" ? C.proBlueMid : C.accent, color: C.white, border: "none", padding: "13px", borderRadius: 6, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            {selectedTier === "premium" ? "Login to Pro Institutional Hub" : "Login to Standard Stocks Hub"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── STANDARD NORMAL TERMINAL ─────────────────────────────────────────────────
function StandardTerminalPage({ prices, watchlist, setWatchlist, positions, selectedSym, setSelectedSym, onExecuteOrder, onUpgrade }: any) {
  const [chartRange, setChartRange] = useState("1d");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [productType, setProductType] = useState<"CNC" | "MIS">("CNC");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [qty, setQty] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const activeAsset = prices.find((p: any) => p.sym === selectedSym) || prices[0] || { sym: selectedSym, price: 1390.7, change: 0, pct: 0, cat: "EQUITY" };
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
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr 320px", gap: 14 }}>
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
                <div style={{ fontSize: 24, fontWeight: 700, color: C.white }}>₹{Number(activeAsset.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
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
              <span>ACTIVE HOLDING: <strong>{userPos.qty} Qty @ Avg ₹{userPos.avg.toFixed(2)}</strong></span>
              <span style={{ color: (activeAsset.price - userPos.avg) >= 0 ? C.green : C.red, fontWeight: 700 }}>
                P&amp;L: ₹{((activeAsset.price - userPos.avg) * userPos.qty).toFixed(2)}
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
              ].map((item) => (
                <div key={item.label} style={{ background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "9px 11px" }}>
                  <div style={{ fontSize: 9.5, color: C.textMuted, fontFamily: FONT_MONO }}>{item.label}</div>
                  <div style={{ fontFamily: FONT_MONO, fontWeight: 600, fontSize: 12.5, color: C.white, marginTop: 3 }}>₹{item.val}</div>
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
              <strong style={{ color: C.white }}>₹{(Number(qty || 0) * execPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
            </div>
            <button
              onClick={() => {
                onExecuteOrder({ sym: activeAsset.sym, side, qty: Math.max(1, Number(qty) || 1), price: execPrice, type: `${productType}_${orderType}`, assetType: "STOCK" });
                setToast(`ORDER FILLED: ${side} ${qty} ${activeAsset.sym} @ ₹${execPrice}`);
                setTimeout(() => setToast(null), 3500);
              }}
              style={{ width: "100%", background: side === "BUY" ? C.green : C.red, color: "#07080C", border: "none", padding: "11px", borderRadius: 6, fontWeight: 700, fontSize: 12.5, cursor: "pointer", fontFamily: FONT_MONO }}
            >
              SUBMIT {side} ORDER
            </button>
            {toast && <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(16,185,129,0.12)", border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 11, fontFamily: FONT_MONO }}>{toast}</div>}
          </div>

          <button onClick={onUpgrade} style={{ background: C.proBlueMid, color: C.white, border: "none", padding: "10px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Switch to Pro Market Depth Terminal
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PRO INSTITUTIONAL TERMINAL (WITH REAL MARKET DEPTH WIDGET) ──────────────
function ProTerminalPage({ prices, watchlist, setWatchlist, orders, news, selectedSym, setSelectedSym, onExecuteOrder, onDowngrade }: any) {
  const [workspace, setWorkspace] = useState<ProWorkspace>("L2_DESK");
  const [chartRange, setChartRange] = useState("1d");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [algoType, setAlgoType] = useState("VWAP");
  const [qty, setQty] = useState("250");
  const [cmdInput, setCmdInput] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [newsRegionFilter, setNewsRegionFilter] = useState<"ALL" | "INDIA" | "US">("ALL");

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
  const activeAsset = prices.find((p: any) => p.sym === selectedSym) || prices[0] || { sym: selectedSym, price: 1390.7, change: 0, pct: 0, cat: "EQUITY" };

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

  const baseP = Number(activeAsset.price) || 1390.7;

  return (
    <div style={{ background: C.proBg, minHeight: "100vh", color: C.text, padding: "12px 1.5%", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
      <ProNewsTickerTape news={news} regionFilter={newsRegionFilter} setRegionFilter={setNewsRegionFilter} />

      <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap", background: C.proPanel, border: `1px solid ${C.proBorder}`, padding: 5, borderRadius: 6 }}>
        {[
          { id: "L2_DESK", key: "F1", label: "MARKET DEPTH & OPTIONS" },
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
        <input value={cmdInput} onChange={(e) => setCmdInput(e.target.value)} placeholder="Type symbol (e.g. RELIANCE.NS, AAPL) or F1-F6 + Enter..." style={{ flex: 1, background: "transparent", border: "none", color: C.proBlueLight, fontSize: 12, fontFamily: FONT_MONO, outline: "none" }} />
        <button type="button" onClick={onDowngrade} style={{ background: "transparent", border: `1px solid ${C.proBorder}`, color: C.textSub, padding: "4px 10px", borderRadius: 4, fontSize: 10, cursor: "pointer", fontFamily: FONT_MONO }}>STANDARD VIEW</button>
      </form>

      {workspace === "L2_DESK" && (
        <div style={{ display: "grid", gridTemplateColumns: "255px 1fr 330px", gap: 10 }}>
          <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, overflow: "hidden" }}>
            <div style={{ padding: 10, borderBottom: `1px solid ${C.proBorder}` }}>
              <GlobalSearch onSelect={handleAddSymbol} isPro={true} />
            </div>
            <div style={{ maxHeight: 550, overflowY: "auto" }}>
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
                  <Tag color={C.proBlueLight}>DMA MARKET DEPTH FEED</Tag>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.white }}>₹{Number(activeAsset.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                {[{ l: "1D", r: "1d" }, { l: "5D", r: "5d" }, { l: "1M", r: "1mo" }, { l: "6M", r: "6mo" }, { l: "1Y", r: "1y" }].map((tf) => (
                  <button key={tf.r} onClick={() => setChartRange(tf.r)} style={{ background: chartRange === tf.r ? C.proBlue : "transparent", color: chartRange === tf.r ? C.white : C.textSub, border: `1px solid ${C.proBorder}`, borderRadius: 3, padding: "3px 9px", fontSize: 10, cursor: "pointer", fontFamily: FONT_MONO }}>{tf.l}</button>
                ))}
              </div>
              <InteractiveStockChart symbol={activeAsset.sym} currentPrice={activeAsset.price} range={chartRange} isPro={true} height={240} />
            </div>

            <div style={{ background: C.proPanel, border: `1px solid ${C.proBorder}`, borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: C.proBlueLight, marginBottom: 8 }}>OPTIONS CHAIN &amp; GREEKS MATRIX ({activeAsset.sym})</div>
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
            <MarketDepthWidget symbol={activeAsset.sym} ltp={baseP} exchange="NSE" />

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
                  onExecuteOrder({ sym: activeAsset.sym, side: orderSide, qty: Math.max(1, Number(qty) || 1), price: baseP, type: `ALGO_${algoType}`, assetType: "STOCK" });
                  setToast(`ROUTED [${algoType}]: ${orderSide} ${qty} ${activeAsset.sym} @ ₹${baseP}`);
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
              {maestroRunning ? "RUNNING 6 WORKTREES..." : "DISPATCH TO GRANDLINE AI AGENTS"}
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
          <div style={{ fontSize: 12, fontWeight: 700, color: C.proBlueLight, marginBottom: 12 }}>SOVEREIGN 10Y YIELDS &amp; MARITIME CHOKEPOINTS</div>
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
              <span style={{ color: o.side === "BUY" ? C.green : C.red }}>{o.side}</span><span>{o.qty} @ ₹{o.price}</span><span style={{ color: C.green }}>{o.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── INDMONEY-STYLE DIRECT MUTUAL FUNDS PAGE ──────────────────────────────────
const MUTUAL_FUNDS_DATA = [
  { id: "mf-1", name: "Quant Small Cap Fund Direct Plan - Growth", amc: "Quant Mutual Fund", category: "Small Cap", risk: "Very High", rating: 5, nav: 284.65, aumCr: 26420, expenseDirect: 0.64, expenseRegular: 1.72, minSip: 1000, cagr1Y: 42.8, cagr3Y: 34.2, cagr5Y: 44.6 },
  { id: "mf-2", name: "Parag Parikh Flexi Cap Fund Direct - Growth", amc: "PPFAS Mutual Fund", category: "Flexi Cap", risk: "High", rating: 5, nav: 86.42, aumCr: 84150, expenseDirect: 0.63, expenseRegular: 1.38, minSip: 1000, cagr1Y: 28.4, cagr3Y: 22.9, cagr5Y: 26.1 },
  { id: "mf-3", name: "Motilal Oswal Midcap Fund Direct - Growth", amc: "Motilal Oswal AMC", category: "Mid Cap", risk: "Very High", rating: 5, nav: 104.18, aumCr: 18940, expenseDirect: 0.65, expenseRegular: 1.68, minSip: 500, cagr1Y: 51.2, cagr3Y: 33.8, cagr5Y: 32.4 },
  { id: "mf-4", name: "Nippon India Small Cap Fund Direct - Growth", amc: "Nippon India Mutual Fund", category: "Small Cap", risk: "Very High", rating: 5, nav: 182.90, aumCr: 61200, expenseDirect: 0.68, expenseRegular: 1.54, minSip: 500, cagr1Y: 36.5, cagr3Y: 30.1, cagr5Y: 37.8 },
  { id: "mf-5", name: "HDFC Mid-Cap Opportunities Direct - Growth", amc: "HDFC Mutual Fund", category: "Mid Cap", risk: "Very High", rating: 4, nav: 196.34, aumCr: 74800, expenseDirect: 0.76, expenseRegular: 1.52, minSip: 500, cagr1Y: 34.9, cagr3Y: 28.7, cagr5Y: 29.5 },
  { id: "mf-6", name: "SBI ELSS Tax Saver Fund Direct Plan - Growth", amc: "SBI Mutual Fund", category: "ELSS Tax Saver", risk: "High", rating: 5, nav: 438.20, aumCr: 27650, expenseDirect: 0.92, expenseRegular: 1.68, minSip: 500, cagr1Y: 33.1, cagr3Y: 25.4, cagr5Y: 26.9 },
];

function MutualFundPage({ cashBalance, onExecuteOrder }: { cashBalance: number; onExecuteOrder: (order: ExecuteOrderPayload) => void }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFund, setSelectedFund] = useState(MUTUAL_FUNDS_DATA[0]);
  const [investMode, setInvestMode] = useState<"SIP" | "LUMPSUM">("SIP");
  const [investAmount, setInvestAmount] = useState("5000");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = MUTUAL_FUNDS_DATA.filter((f) => selectedCategory === "All" || f.category === selectedCategory);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "28px 4%", fontFamily: FONT_BODY, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ background: "linear-gradient(135deg, #0C101D 0%, #0F291E 100%)", border: `1px solid ${C.borderGlow}`, borderRadius: 10, padding: "22px 26px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Tag color={C.green}>0% COMMISSION DIRECT MUTUAL FUNDS</Tag>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 800, color: C.white, margin: "8px 0 4px" }}>Direct Mutual Funds &amp; Systematic SIP Desk</h1>
          <p style={{ color: C.textSub, fontSize: 13, margin: 0 }}>Earn up to 1.5% extra annual returns with zero distributor trail commissions.</p>
        </div>
        <div style={{ fontFamily: FONT_MONO, textAlign: "right" }}>
          <div style={{ fontSize: 10.5, color: C.textSub }}>AVAILABLE WALLET</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.white }}>₹{cashBalance.toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 18 }}>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["All", "Small Cap", "Mid Cap", "Flexi Cap", "ELSS Tax Saver"].map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)} style={{ background: selectedCategory === c ? C.accent : C.bgCard, color: C.white, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>{c}</button>
            ))}
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
            {filtered.map((f) => (
              <div key={f.id} onClick={() => setSelectedFund(f)} style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr", padding: "14px 18px", borderBottom: `1px solid ${C.border}`, background: selectedFund.id === f.id ? "rgba(109,40,217,0.14)" : "transparent", cursor: "pointer", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.white, fontSize: 13.5 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: C.textSub }}>{f.amc} · {f.category}</div>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12 }}>NAV: ₹{f.nav}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: C.green }}>Exp: {f.expenseDirect}%</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: C.green, textAlign: "right" }}>+{f.cagr3Y}% (3Y)</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 8, padding: 20 }}>
          <Tag color={C.green}>DIRECT PLAN · 0% COMMISSION</Tag>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: C.white, margin: "10px 0" }}>{selectedFund.name}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
            {(["SIP", "LUMPSUM"] as const).map((m) => (
              <button key={m} onClick={() => setInvestMode(m)} style={{ background: investMode === m ? C.accent : "#07080C", color: C.white, border: `1px solid ${C.border}`, padding: "8px", borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: "pointer", fontFamily: FONT_MONO }}>{m}</button>
            ))}
          </div>
          <input type="number" value={investAmount} onChange={(e) => setInvestAmount(e.target.value)} style={{ width: "100%", background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px", color: C.white, fontFamily: FONT_MONO, fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
          <button
            onClick={() => {
              const amt = Number(investAmount) || 5000;
              const units = +(amt / selectedFund.nav).toFixed(3);
              onExecuteOrder({ sym: selectedFund.name.split(" Direct")[0].toUpperCase(), side: "BUY", qty: units, price: selectedFund.nav, type: `DIRECT_${investMode}`, assetType: "MF" });
              setToast(`${investMode} ACTIVE: ₹${amt.toLocaleString("en-IN")} (${units} units)`);
              setTimeout(() => setToast(null), 4000);
            }}
            style={{ width: "100%", background: C.green, color: "#05070B", border: "none", padding: "12px", borderRadius: 6, fontWeight: 800, fontFamily: FONT_MONO, cursor: "pointer" }}
          >
            CONFIRM {investMode} ORDER
          </button>
          {toast && <div style={{ marginTop: 10, padding: 8, background: "rgba(16,185,129,0.14)", border: `1px solid ${C.green}`, borderRadius: 6, color: C.green, fontSize: 11, fontFamily: FONT_MONO }}>{toast}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── GRANDLINE AI ADVISOR & MARKETS PAGES ─────────────────────────────────────
function AIAdvisorPage({ prices, userTier }: { prices: any[]; userTier: UserTier }) {
  const isPro = userTier === "premium";
  const [messages, setMessages] = useState([
    { role: "ai", text: isPro ? "Grandline AI Pro initialized. Ask about Market Depth imbalance, Options Greeks, or portfolio hedging." : "Grandline AI initialized. Ask about any Indian or US stock, IPO GMP, market trend, or SIP strategy." },
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
      setMessages((m) => [...m, { role: "ai", text: "Network error connecting to Grandline AI endpoint." }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, padding: "28px 6%" }}>
      <Tag color={isPro ? C.proBlueLight : C.green}>{isPro ? "GRANDLINE AI PRO" : "GRANDLINE AI ADVISORY"}</Tag>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 700, color: C.white, margin: "8px 0 18px" }}>
        {isPro ? "Grandline AI Pro Quantitative Desk" : "Grandline AI Investment Advisor"}
      </h1>
      <div style={{ background: C.bgCard, border: `1px solid ${isPro ? C.proBlue : C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: 20, maxHeight: "52vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", background: m.role === "user" ? C.borderGlow : "#07080C", border: `1px solid ${C.border}`, padding: "10px 14px", borderRadius: 6, maxWidth: "75%", fontSize: 13.5, lineHeight: 1.6 }}>
              {m.text}
            </div>
          ))}
          {loading && <div style={{ fontSize: 12, color: C.textSub, fontFamily: FONT_MONO }}>GRANDLINE AI PROCESSING MARKET TELEMETRY...</div>}
        </div>
        <div style={{ padding: 14, borderTop: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Ask Grandline AI about NIFTY 50, RELIANCE.NS, AAPL, or portfolio strategy..." style={{ flex: 1, background: "#07080C", border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", color: C.text, fontSize: 13.5, outline: "none" }} />
          <button onClick={() => send(input)} style={{ background: isPro ? C.proBlueMid : C.accent, color: C.white, border: "none", borderRadius: 6, padding: "10px 20px", fontWeight: 600, cursor: "pointer" }}>Transmit</button>
        </div>
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
            <div style={{ fontWeight: 600 }}>₹{Number(p.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
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
  const [hubTab, setHubTab] = useState<HubTab>("Explore");
  const [watchlist, setWatchlist] = useState(defaultWatchlist);
  const [selectedSym, setSelectedSym] = useState("RELIANCE.NS");

  const prices = useLivePrices(watchlist);
  const news = useLiveNews();

  const [positions, setPositions] = useState<Position[]>([
    { sym: "RELIANCE.NS", qty: 25, avg: 1310.0, ltp: 1390.7, assetType: "STOCK" },
    { sym: "HAL.NS", qty: 15, avg: 4100.0, ltp: 4300.0, assetType: "STOCK" },
    { sym: "TCS.NS", qty: 10, avg: 3690.0, ltp: 3816.2, assetType: "STOCK" },
    { sym: "HDFCBANK.NS", qty: 20, avg: 1580.0, ltp: 1646.25, assetType: "STOCK" },
    { sym: "NVDA", qty: 12, avg: 124.5, ltp: 138.84, assetType: "STOCK" },
  ]);
  const [cashBalance, setCashBalance] = useState(245000);
  const [orders, setOrders] = useState<OrderRecord[]>([
    { id: "ORD-9021", sym: "HAL.NS", side: "BUY", qty: 15, price: 4100, type: "CNC", time: "10:14:22", status: "FILLED" },
    { id: "ORD-9018", sym: "RELIANCE.NS", side: "BUY", qty: 25, price: 1310, type: "CNC", time: "09:42:01", status: "FILLED" },
  ]);

  function handleExecuteOrder(order: ExecuteOrderPayload) {
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
        return [...prev, { sym: order.sym, qty: order.qty, avg: order.price, ltp: order.price, assetType: order.assetType || "STOCK" }];
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
    setPage("Hub");
    setHubTab("Explore");
  }

  function handleOpenStockInTerminal(sym: string, name: string, cat: string) {
    if (!watchlist.find((w) => w.sym === sym)) {
      setWatchlist((prev) => [{ sym, name, cat, base: 1000, cap: "Large Cap", low52: 850, high52: 1500, vol: "1,24,00,000", pe: 24.5, roe: 21.0, rsi: 56.0, delivery: 64, group: "Core India" }, ...prev]);
    }
    setSelectedSym(sym);
    setPage("Hub");
    setHubTab("Terminal");
  }

  const renderPage = () => {
    switch (page) {
      case "Home":
        return <HomePage setPage={setPage} />;
      case "Hub":
        return (
          <div>
            <CompactPortfolioAndSecondaryNav
              activeTab={hubTab}
              setActiveTab={setHubTab}
              positions={positions}
              prices={prices}
              cashBalance={cashBalance}
              ordersCount={orders.length}
              userTier={userTier}
              onSelectSymbol={handleOpenStockInTerminal}
            />
            {hubTab === "Terminal" ? (
              userTier === "premium" ? (
                <ProTerminalPage
                  prices={prices}
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  orders={orders}
                  news={news}
                  selectedSym={selectedSym}
                  setSelectedSym={setSelectedSym}
                  onExecuteOrder={handleExecuteOrder}
                  onDowngrade={() => setUserTier("standard")}
                />
              ) : (
                <StandardTerminalPage
                  prices={prices}
                  watchlist={watchlist}
                  setWatchlist={setWatchlist}
                  positions={positions}
                  selectedSym={selectedSym}
                  setSelectedSym={setSelectedSym}
                  onExecuteOrder={handleExecuteOrder}
                  onUpgrade={() => setUserTier("premium")}
                />
              )
            ) : (
              <ExploreStocksHub
                prices={prices}
                positions={positions}
                orders={orders}
                watchlist={watchlist}
                setWatchlist={setWatchlist}
                cashBalance={cashBalance}
                userTier={userTier}
                activeHubTab={hubTab}
                setActiveHubTab={setHubTab}
                onOpenStockInTerminal={handleOpenStockInTerminal}
                onExecuteOrder={handleExecuteOrder}
                onAddCash={(amt) => setCashBalance((c) => c + amt)}
                onWithdrawCash={(amt) => setCashBalance((c) => Math.max(0, c - amt))}
              />
            )}
          </div>
        );
      case "MutualFund":
        return <MutualFundPage cashBalance={cashBalance} onExecuteOrder={handleExecuteOrder} />;
      case "AI Advisor":
        return <AIAdvisorPage prices={prices} userTier={userTier} />;
      case "Markets":
        return <MarketsPage prices={prices} title="Global Multi-Asset Markets" />;
      case "IndStocks":
        return <MarketsPage prices={prices.filter((p) => p.cat !== "US_EQUITY")} title="Indian Equities (NSE / BSE)" />;
      case "USStocks":
        return <MarketsPage prices={prices.filter((p) => p.cat === "US_EQUITY")} title="US Equities (NYSE / NASDAQ)" />;
      case "Research":
        return <MarketsPage prices={prices} title="Institutional Research & Telemetry" />;
      case "Login":
        return <LoginPage onLogin={handleLogin} />;
      default:
        return <HomePage setPage={setPage} />;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <Nav
        page={page}
        isLoggedIn={isLoggedIn}
        userTier={userTier}
        onToggleTier={(t: UserTier) => { setUserTier(t); setIsLoggedIn(true); setPage("Hub"); }}
        onNavigate={setPage}
        onOpenHubTab={(tab: HubTab) => { setIsLoggedIn(true); setPage("Hub"); setHubTab(tab); }}
        onLogout={() => { setIsLoggedIn(false); setPage("Login"); }}
      />
      <div style={{ paddingTop: 60 }}>
        <LiveMarketBar prices={prices} />
        {renderPage()}
      </div>
    </div>
  );
}