import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.EXCHANGE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 1 hour to avoid excessive API calls
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.result === 'success') {
      return NextResponse.json({
        success: true,
        rate: data.conversion_rates.ILS,
        lastUpdate: data.time_last_update_utc,
        nextUpdate: data.time_next_update_utc
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'API returned error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Exchange rate API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exchange rate',
        fallbackRate: 3.41 // Current approximate rate
      },
      { status: 500 }
    );
  }
}