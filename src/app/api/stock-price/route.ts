import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Fetch real-time stock price from TwelveData
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      return NextResponse.json({ error: data.message || 'Failed to fetch price' }, { status: 400 });
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      price: parseFloat(data.price) || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching stock price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}