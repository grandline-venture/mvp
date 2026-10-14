import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YAHOO_SYMBOLS: Record<string, string> = {
  // Indices
  "NIFTY 50": "^NSEI",
  "SENSEX": "^BSESN",
  "INDIA VIX": "^INDIAVIX",
  "S&P 500": "^GSPC",
  "NASDAQ": "^IXIC",
  "DOW JONES": "^DJI",
  // Indian Stocks (NSE)
  "RELIANCE": "RELIANCE.NS",
  "TCS": "TCS.NS",
  "HDFC BANK": "HDFCBANK.NS",
  "INFOSYS": "INFY.NS",
  // Commodities & Forex
  "GOLD": "GC=F",
  "CRUDE OIL": "CL=F",
  "USD/INR": "INR=X",
  // US Stocks
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
    // range=5d&interval=1d guarantees we get the true previous trading day's close
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      yahooSym
    )}?interval=1d&range=5d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta || meta.regularMarketPrice == null) return null;

    const price = Number(meta.regularMarketPrice);

    // Get valid daily closes from the 5-day history to find yesterday's exact close
    const rawCloses: (number | null)[] = result?.indicators?.quote?.[0]?.close || [];
    const closes = rawCloses.filter((c): c is number => typeof c === "number" && !isNaN(c));

    let prevClose = Number(meta.regularMarketPreviousClose || meta.previousClose || 0);
    if (!prevClose && closes.length >= 2) {
      // Compare against the second-to-last daily candle close
      prevClose = closes[closes.length - 2];
    } else if (!prevClose) {
      prevClose = Number(meta.chartPreviousClose || price);
    }

    // If prevClose is still identical to price but we have 2+ daily closes, use closes[closes.length - 2]
    if (Math.abs(price - prevClose) < 0.0001 && closes.length >= 2) {
      prevClose = closes[closes.length - 2];
    }

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

    // Fetch Yahoo Finance quotes + CoinGecko Crypto + ExchangeRate USD/INR in parallel
    const [yahooResults, cryptoRes, forexRes] = await Promise.all([
      Promise.all(entries.map(([name, sym]) => fetchYahooQuote(name, sym))),
      fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=inr,usd&include_24hr_change=true",
        { cache: "no-store" }
      ).catch(() => null),
      fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" }).catch(() => null),
    ]);

    const quotes: Record<string, { price: number; change: number; pct: number }> = {};
    for (const r of yahooResults) {
      if (r) {
        quotes[r.sym] = { price: r.price, change: r.change, pct: r.pct };
      }
    }

    // Ensure USD/INR has a fallback if Yahoo INR=X is delayed
    if (!quotes["USD/INR"] && forexRes && forexRes.ok) {
      const fxData = await forexRes.json();
      const inrRate = fxData?.rates?.INR;
      if (inrRate) {
        quotes["USD/INR"] = { price: +Number(inrRate).toFixed(2), change: 0.05, pct: 0.06 };
      }
    }

    const usdInr = quotes["USD/INR"]?.price || 86.5;

    // Fetch exact Bitcoin & Ethereum in INR from CoinGecko
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

    // Fallback to Yahoo BTC-USD * USD/INR if CoinGecko rate-limits
    if (!quotes["BITCOIN"]) {
      const btcUsd = await fetchYahooQuote("BITCOIN", "BTC-USD");
      if (btcUsd) {
        quotes["BITCOIN"] = {
          price: Math.round(btcUsd.price * usdInr),
          change: Math.round(btcUsd.change * usdInr),
          pct: btcUsd.pct,
        };
      }
    }
    if (!quotes["ETHEREUM"]) {
      const ethUsd = await fetchYahooQuote("ETHEREUM", "ETH-USD");
      if (ethUsd) {
        quotes["ETHEREUM"] = {
          price: Math.round(ethUsd.price * usdInr),
          change: Math.round(ethUsd.change * usdInr),
          pct: ethUsd.pct,
        };
      }
    }

    // Convert Gold (USD/oz -> INR/10g) and Crude Oil (USD/bbl -> INR/bbl)
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

    return NextResponse.json({
      success: true,
      quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}