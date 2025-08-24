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
    // Fetch stock logo from TwelveData
    const response = await fetch(
      `https://api.twelvedata.com/logo?symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`TwelveData API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      return NextResponse.json({ error: data.message || 'Failed to fetch logo' }, { status: 400 });
    }

    return NextResponse.json({
      symbol: symbol.toUpperCase(),
      logo_url: data.url || null,
      name: data.name || null
    });

  } catch (error) {
    console.error('Error fetching stock logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock information' },
      { status: 500 }
    );
  }
} 