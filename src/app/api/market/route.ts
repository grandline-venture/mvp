import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 👇 PASTE YOUR AQ... API KEY HERE INSIDE THE QUOTES
const GEMINI_API_KEY = "PASTE_YOUR_KEY_HERE"; 

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
};

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

export async function GET() {
  try {
    const entries = Object.entries(YAHOO_SYMBOLS);
    const [yahooResults, cryptoRes, forexRes] = await Promise.all([
      Promise.all(entries.map(([name, sym]) => fetchYahooQuote(name, sym))),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr,usd&include_24hr_change=true", { cache: "no-store" }).catch(() => null),
      fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" }).catch(() => null),
    ]);

    const quotes: Record<string, { price: number; change: number; pct: number }> = {};
    for (const r of yahooResults) {
      if (r) quotes[r.sym] = { price: r.price, change: r.change, pct: r.pct };
    }

    if (!quotes["USD/INR"] && forexRes && forexRes.ok) {
      const fxData = await forexRes.json();
      const inrRate = fxData?.rates?.INR;
      if (inrRate) quotes["USD/INR"] = { price: +Number(inrRate).toFixed(2), change: 0.05, pct: 0.06 };
    }

    const usdInr = quotes["USD/INR"]?.price || 86.5;

    if (cryptoRes && cryptoRes.ok) {
      const cryptoData = await cryptoRes.json();
      if (cryptoData?.bitcoin?.inr) {
        const btcPrice = Math.round(Number(cryptoData.bitcoin.inr));
        const btcPct = +Number(cryptoData.bitcoin.inr_24h_change || 0).toFixed(2);
        const btcChange = Math.round(btcPrice - btcPrice / (1 + btcPct / 100));
        quotes["BITCOIN"] = { price: btcPrice, change: btcChange, pct: btcPct };
      }
      if (cryptoData?.ethereum?.inr) {
        const ethPrice = Math.round(Number(cryptoData.ethereum.inr));
        const ethPct = +Number(cryptoData.ethereum.inr_24h_change || 0).toFixed(2);
        const ethChange = Math.round(ethPrice - ethPrice / (1 + ethPct / 100));
        quotes["ETHEREUM"] = { price: ethPrice, change: ethChange, pct: ethPct };
      }
    }

    if (quotes["GOLD"]) {
      const goldInr10g = Math.round((quotes["GOLD"].price / 31.1035) * 10 * usdInr);
      const goldChgInr = Math.round((quotes["GOLD"].change / 31.1035) * 10 * usdInr);
      quotes["GOLD"] = { price: goldInr10g, change: goldChgInr, pct: quotes["GOLD"].pct };
    }
    if (quotes["CRUDE OIL"]) {
      const crudeInr = Math.round(quotes["CRUDE OIL"].price * usdInr);
      const crudeChgInr = Math.round(quotes["CRUDE OIL"].change * usdInr);
      quotes["CRUDE OIL"] = { price: crudeInr, change: crudeChgInr, pct: quotes["CRUDE OIL"].pct };
    }

    return NextResponse.json({ success: true, quotes, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to fetch market data" }, { status: 500 });
  }
}

// ─── AI ADVISOR CHAT HANDLER (POST /api/market) ───────────────────────────────
export async function POST(req: Request) {
  try {
    const { messages, prices } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || GEMINI_API_KEY;

    if (!apiKey || apiKey === "PASTE_YOUR_KEY_HERE" || apiKey === "") {
      return NextResponse.json({
        reply: "⚠️ Setup Needed: Open `src/app/api/market/route.ts` in VS Code and paste your AQ... key on Line 6!",
      });
    }

    const marketSnapshot = Array.isArray(prices)
      ? prices.map((p: any) => `${p.sym}: ${p.price} (${p.pct >= 0 ? "+" : ""}${p.pct}%)`).join(", ")
      : "Live market feed active.";

    const systemInstruction = `You are Grandline AI Advisor, the proprietary institutional-grade investment intelligence engine built by Grandline Capital.
Never mention Google, Gemini, or being an external language model.
Specialize in Indian equities (NSE/BSE, NIFTY 50, SENSEX, HAL, Reliance, TCS, HDFC Bank, Infosys), US stocks (NYSE/NASDAQ), commodities (Gold, Crude Oil), forex (USD/INR), crypto (Bitcoin, Ethereum), mutual funds, and private markets.
Current live prices on the platform right now: ${marketSnapshot}.
Answer the user's specific question directly using real numbers and financial analysis in 2 to 4 concise sentences. Always end with a brief note that insights are for informational purposes.`;

    const contents = (messages || []).map((m: any) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    // Updated to gemini-3.8-flash with the required x-goog-api-key header
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim()
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        reply: `⚠️ Gemini API Error: ${data?.error?.message || "Invalid API Key or blocked request."}`,
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I couldn't generate a response for that query. Please try asking again.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({
      reply: `⚠️ Server Error: ${error?.message || "Failed to connect to AI engine."}`,
    });
  }
}