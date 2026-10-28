import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Set your Google Gemini API Key here or in .env.local (GEMINI_API_KEY)
const GEMINI_API_KEY = "AQ.Ab8RN6LvMZ2mUzcdbrIVxOFyaRsNg0K2HE61EhoG_sp9qyDBWg";

const YAHOO_SYMBOLS: Record<string, string> = {
  "NIFTY 50": "^NSEI",
  "SENSEX": "^BSESN",
  "INDIA VIX": "^INDIAVIX",
  "S&P 500": "^GSPC",
  "NASDAQ": "^IXIC",
  "DOW JONES": "^DJI",
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "HDFC BANK": "HDFCBANK.NS",
  "INFOSYS": "INFY.NS",
  "HAL": "HAL.NS",
  "ZOMATO": "ZOMATO.NS",
  "SBI": "SBIN.NS",
  "GOLD": "GC=F",
  "CRUDE OIL": "CL=F",
  "USD/INR": "INR=X",
  "AAPL": "AAPL",
  "MSFT": "MSFT",
  "GOOGL": "GOOGL",
  "AMZN": "AMZN",
  "NVDA": "NVDA",
  "META": "META",
  "TSLA": "TSLA",
  "BRK.B": "BRK-B",
  "BITCOIN": "BTC-USD",
  "ETHEREUM": "ETH-USD",
};

interface OHLCPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  link: string;
  time: string;
  region: "INDIA" | "US";
  tag: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  { id: "in-1", title: "NSE NIFTY 50 institutional desk sees strong DII inflows across private banking and defence heavies", publisher: "Grandline India Wire", link: "#", time: "2m ago", region: "INDIA", tag: "NSE / FLOWS" },
  { id: "us-1", title: "US Treasury 10Y yields stabilize ahead of Federal Reserve liquidity commentary; semiconductor complex leads NASDAQ volume", publisher: "Grandline US Desk", link: "#", time: "5m ago", region: "US", tag: "NYSE / MACRO" },
  { id: "in-2", title: "RBI maintains systemic liquidity stance; INR spot volatility remains compressed near institutional support bands", publisher: "Mumbai FX Desk", link: "#", time: "9m ago", region: "INDIA", tag: "RBI / FX" },
  { id: "us-2", title: "Mega-cap AI infrastructure capex guidance drives institutional call-option block prints on NVDA and MSFT", publisher: "Wall Street Derivatives", link: "#", time: "14m ago", region: "US", tag: "NASDAQ / OPTIONS" },
  { id: "in-3", title: "HAL & Bharat Electronics record elevated delivery percentages on NSE cash tape amid defence order book expansion", publisher: "Equities Research India", link: "#", time: "19m ago", region: "INDIA", tag: "BSE / EQUITIES" },
  { id: "us-3", title: "S&P 500 dark-pool block volume registers +14% above 30-day moving average into afternoon New York session", publisher: "US Institutional Tape", link: "#", time: "24m ago", region: "US", tag: "S&P 500 / DMA" },
  { id: "in-4", title: "SEBI circular on institutional algorithmic execution efficiency and T+0 settlement liquidity enters next phase", publisher: "Regulatory Wire India", link: "#", time: "31m ago", region: "INDIA", tag: "SEBI / POLICY" },
  { id: "us-4", title: "Apple and Alphabet institutional rebalancing flows tracked across primary NYSE and NASDAQ crossing networks", publisher: "Global Equities Desk", link: "#", time: "38m ago", region: "US", tag: "US TECH" },
];

async function fetchLiveFinancialNews(): Promise<NewsItem[]> {
  try {
    const [indiaRes, usRes] = await Promise.all([
      fetch("https://query2.finance.yahoo.com/v1/finance/search?q=NSE%20India%20Sensex%20Nifty&quotesCount=0&newsCount=8", {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      }).catch(() => null),
      fetch("https://query2.finance.yahoo.com/v1/finance/search?q=Wall%20Street%20NASDAQ%20NYSE%20Fed&quotesCount=0&newsCount=8", {
        headers: { "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
      }).catch(() => null),
    ]);

    const items: NewsItem[] = [];

    if (indiaRes && indiaRes.ok) {
      const data = await indiaRes.json();
      for (const n of data?.news || []) {
        if (n?.title) {
          const mins = n.providerPublishTime
            ? Math.max(1, Math.floor((Date.now() / 1000 - n.providerPublishTime) / 60))
            : 10;
          items.push({
            id: n.uuid || `in-${Math.random()}`,
            title: n.title,
            publisher: n.publisher || "India Market Wire",
            link: n.link || "#",
            time: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
            region: "INDIA",
            tag: "NSE / BSE",
          });
        }
      }
    }

    if (usRes && usRes.ok) {
      const data = await usRes.json();
      for (const n of data?.news || []) {
        if (n?.title) {
          const mins = n.providerPublishTime
            ? Math.max(1, Math.floor((Date.now() / 1000 - n.providerPublishTime) / 60))
            : 12;
          items.push({
            id: n.uuid || `us-${Math.random()}`,
            title: n.title,
            publisher: n.publisher || "US Market Wire",
            link: n.link || "#",
            time: mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`,
            region: "US",
            tag: "NYSE / NASDAQ",
          });
        }
      }
    }

    if (items.length === 0) return FALLBACK_NEWS;

    // Interleave India and US news for balanced scrolling
    const merged: NewsItem[] = [];
    const ind = items.filter((i) => i.region === "INDIA");
    const us = items.filter((i) => i.region === "US");
    const maxLen = Math.max(ind.length, us.length);
    for (let i = 0; i < maxLen; i++) {
      if (ind[i]) merged.push(ind[i]);
      if (us[i]) merged.push(us[i]);
    }
    return merged.slice(0, 14);
  } catch {
    return FALLBACK_NEWS;
  }
}

async function fetchYahooQuote(name: string, yahooSym: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || meta.regularMarketPrice == null) return null;

    const price = Number(meta.regularMarketPrice);
    const rawCloses: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
    const closes = rawCloses.filter((c): c is number => typeof c === "number" && !isNaN(c));

    let prevClose = Number(meta.regularMarketPreviousClose || meta.previousClose || 0);
    if (!prevClose && closes.length >= 2) prevClose = closes[closes.length - 2];
    else if (!prevClose) prevClose = Number(meta.chartPreviousClose || price);

    if (Math.abs(price - prevClose) < 0.0001 && closes.length >= 2) prevClose = closes[closes.length - 2];

    const change = +(price - prevClose).toFixed(2);
    const pct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;

    return { sym: name, price: +price.toFixed(2), change, pct };
  } catch {
    return null;
  }
}

async function fetchYahooChart(yahooSym: string, range: string): Promise<OHLCPoint[] | null> {
  try {
    let interval = "5m";
    if (range === "1d") interval = "5m";
    else if (range === "5d") interval = "15m";
    else if (range === "1mo" || range === "1m") interval = "1d";
    else if (range === "6mo" || range === "6m") interval = "1d";
    else if (range === "1y") interval = "1wk";
    else interval = "1d";

    const normalizedRange = range === "1m" ? "1mo" : range === "6m" ? "6mo" : range.toLowerCase();
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?range=${normalizedRange}&interval=${interval}`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp) return null;

    const timestamps: number[] = result.timestamp;
    const quotes = result.indicators?.quote?.[0];
    const opens: (number | null)[] = quotes?.open || [];
    const highs: (number | null)[] = quotes?.high || [];
    const lows: (number | null)[] = quotes?.low || [];
    const closes: (number | null)[] = quotes?.close || [];
    const volumes: (number | null)[] = quotes?.volume || [];

    const points: OHLCPoint[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c === "number" && !isNaN(c) && c > 0) {
        const o = typeof opens[i] === "number" && !isNaN(opens[i]!) ? opens[i]! : c;
        const h = typeof highs[i] === "number" && !isNaN(highs[i]!) ? Math.max(highs[i]!, o, c) : Math.max(o, c);
        const l = typeof lows[i] === "number" && !isNaN(lows[i]!) ? Math.min(lows[i]!, o, c) : Math.min(o, c);

        const d = new Date(timestamps[i] * 1000);
        let timeLabel = "";
        if (normalizedRange === "1d" || normalizedRange === "5d") {
          timeLabel = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
        } else {
          timeLabel = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        }

        points.push({
          time: timeLabel,
          open: +o.toFixed(2),
          high: +h.toFixed(2),
          low: +l.toFixed(2),
          close: +c.toFixed(2),
          volume: volumes[i] || 0,
        });
      }
    }

    return points.length > 0 ? points : null;
  } catch {
    return null;
  }
}

function generateSyntheticChart(basePrice: number, range: string): OHLCPoint[] {
  const count = range === "1d" ? 42 : range === "5d" ? 35 : 28;
  const points: OHLCPoint[] = [];
  let prevClose = basePrice * 0.985;
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const delta = (Math.random() - 0.485) * (basePrice * 0.007);
    const open = +prevClose.toFixed(2);
    const close = +(open + delta).toFixed(2);
    const high = +(Math.max(open, close) + Math.random() * (basePrice * 0.004)).toFixed(2);
    const low = +(Math.min(open, close) - Math.random() * (basePrice * 0.004)).toFixed(2);
    prevClose = close;

    const pointDate = new Date(now.getTime() - (count - i) * (range === "1d" ? 5 * 60 * 1000 : 24 * 3600 * 1000));
    points.push({
      time: range === "1d"
        ? pointDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
        : pointDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 45000 + 5000),
    });
  }

  if (points.length > 0) {
    points[points.length - 1].close = basePrice;
    points[points.length - 1].high = Math.max(points[points.length - 1].high, basePrice);
    points[points.length - 1].low = Math.min(points[points.length - 1].low, basePrice);
  }

  return points;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolQuery = searchParams.get("symbol");
    const rangeQuery = searchParams.get("range") || "1d";
    const batchSymbols = searchParams.get("symbols");
    const newsQuery = searchParams.get("news");

    // 1. Live Financial News Wire Request (India + US)
    if (newsQuery === "true") {
      const news = await fetchLiveFinancialNews();
      return NextResponse.json({ success: true, news, timestamp: new Date().toISOString() });
    }

    // 2. Single Chart Request
    if (symbolQuery) {
      const yahooSym = YAHOO_SYMBOLS[symbolQuery] || symbolQuery;
      let chartPoints = await fetchYahooChart(yahooSym, rangeQuery);

      if (!chartPoints) {
        const quote = await fetchYahooQuote(symbolQuery, yahooSym);
        const base = quote?.price || 1000;
        chartPoints = generateSyntheticChart(base, rangeQuery);
      }

      return NextResponse.json({
        success: true,
        symbol: symbolQuery,
        range: rangeQuery,
        points: chartPoints,
      });
    }

    // 3. Batch Market Data Request
    let targetSymbols: string[] = [];
    if (batchSymbols) {
      targetSymbols = batchSymbols.split(",").filter(Boolean);
    } else {
      targetSymbols = ["NIFTY 50", "RELIANCE.NS", "HDFCBANK.NS", "AAPL", "MSFT"];
    }

    const quotes: Record<string, { price: number; change: number; pct: number }> = {};

    const results = await Promise.all(
      targetSymbols.map((sym) => {
        const lookup = YAHOO_SYMBOLS[sym] || sym;
        return fetchYahooQuote(sym, lookup);
      })
    );

    for (const r of results) {
      if (r) quotes[r.sym] = { price: r.price, change: r.change, pct: r.pct };
    }

    return NextResponse.json({ success: true, quotes, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch market data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { messages, prices, tier } = await req.json();
    const apiKey = (process.env.GEMINI_API_KEY || GEMINI_API_KEY).trim();

    if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE") {
      return NextResponse.json({
        reply: "System Notice: GEMINI_API_KEY is missing. Configure GEMINI_API_KEY in .env.local or route.ts.",
      });
    }

    const marketSnapshot = Array.isArray(prices)
      ? prices.map((p: any) => `${p.sym}: ${p.price} (${p.pct >= 0 ? "+" : ""}${p.pct}%)`).join(", ")
      : "Live market feed active.";

    const isPremium = tier === "premium";

    const systemInstruction = isPremium
      ? `You are Grandline Quant AI Pro, an institutional quantitative research engine.
Never mention Google or third-party brands.
Live market prices: ${marketSnapshot}.
Deliver precise, structured quantitative analysis including:
1. Volume-Weighted Average Price (VWAP) positioning and key support/resistance zones
2. Institutional order flow and derivatives hedging perspective
3. Quantitative risk metrics and volatility parameters.
Keep answers concise, direct, and professional without emojis.`
      : `You are Grandline AI Advisor for standard retail investors.
Never mention Google or third-party brands.
Live market prices: ${marketSnapshot}.
Answer questions directly with professional market commentary in 2 to 4 concise sentences without emojis.`;

    const contents = (messages || []).map((m: any) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: isPremium ? 0.55 : 0.7,
            maxOutputTokens: isPremium ? 1200 : 600,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({
        reply: `API Notice: ${data?.error?.message || "Execution request failed."}`,
      });
    }

    const candidate = data?.candidates?.[0];
    let reply = candidate?.content?.parts?.[0]?.text || "Unable to process query. Please submit again.";

    if (candidate?.finishReason === "RECITATION") {
      reply += "\n\n[Data Note: Historical parameters summarized due to safety constraints.]";
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({
      reply: `Server Error: ${error?.message || "Internal processing error."}`,
    });
  }
}