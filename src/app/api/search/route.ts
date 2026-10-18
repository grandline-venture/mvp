import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Ping Yahoo Finance's internal autocomplete directory
    const res = await fetch(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
        q
      )}&quotesCount=10&newsCount=0`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
      }
    );

    const data = await res.json();

    // Filter to only allow Equities and ETFs from Indian and US Exchanges
    const allowedExchanges = ["NSI", "BSE", "NMS", "NYQ", "NGM", "PCX"];
    
    const results = (data.quotes || [])
      .filter(
        (item: any) =>
          allowedExchanges.includes(item.exchange) &&
          (item.quoteType === "EQUITY" || item.quoteType === "ETF")
      )
      .map((item: any) => ({
        symbol: item.symbol,
        name: item.shortname || item.longname || item.symbol,
        exchange: item.exchDisp,
        type: item.typeDisp,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}