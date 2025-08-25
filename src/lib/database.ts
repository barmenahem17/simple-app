import { supabase } from './supabase'

// Test Supabase connection
console.log('Supabase client initialized');

export interface Deposit {
  id: string
  platform: string
  date: string
  amount: number
  currency: 'ILS' | 'USD'
}

export interface Conversion {
  id: string
  platform: string
  date: string
  source_amount: number
  source_currency: 'ILS' | 'USD'
  exchange_rate: number
  target_currency: 'ILS' | 'USD'
}

export interface Transaction {
  id: string
  platform: string
  symbol: string
  logo_url?: string
  buy_date: string
  quantity: number
  buy_price: number
  buy_fee: number
  buy_fee_currency: 'ILS' | 'USD'
  sell_date?: string
  sell_quantity?: number
  sell_price_per_unit?: number
  sell_price?: number // This will be calculated: sell_quantity * sell_price_per_unit
  sell_fee?: number
  sell_fee_currency?: 'ILS' | 'USD'
  status: 'open' | 'closed' // open = לא נמכר, closed = נמכר
}

// Database Functions for Deposits
export const getDeposits = async (platform: string): Promise<Deposit[]> => {
  console.log(`Fetching deposits for platform: ${platform}`);
  
  try {
    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('platform', platform)
      .order('date', { ascending: false })
    
    if (error) {
      console.error(`Error fetching deposits for ${platform}:`, error);
      return []
    }
    
    console.log(`Deposits for ${platform}:`, data);
    return data || []
  } catch (error) {
    console.error(`Exception fetching deposits for ${platform}:`, error);
    return []
  }
}

export const addDeposit = async (deposit: Omit<Deposit, 'id'>): Promise<Deposit | null> => {
  const { data, error } = await supabase
    .from('deposits')
    .insert(deposit)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding deposit:', error)
    return null
  }
  return data
}

export const updateDeposit = async (id: string, deposit: Partial<Omit<Deposit, 'id'>>): Promise<Deposit | null> => {
  const { data, error } = await supabase
    .from('deposits')
    .update(deposit)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating deposit:', error)
    return null
  }
  return data
}

export const deleteDeposit = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('deposits')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting deposit:', error)
    return false
  }
  return true
}

// Database Functions for Conversions
export const getConversions = async (platform: string): Promise<Conversion[]> => {
  const { data, error } = await supabase
    .from('conversions')
    .select('*')
    .eq('platform', platform)
    .order('date', { ascending: false })
  
  if (error) {
    console.error('Error fetching conversions:', error)
    return []
  }
  return data || []
}

export const addConversion = async (conversion: Omit<Conversion, 'id'>): Promise<Conversion | null> => {
  const { data, error } = await supabase
    .from('conversions')
    .insert(conversion)
    .select()
    .single()
  
  if (error) {
    console.error('Error adding conversion:', error)
    return null
  }
  return data
}

export const updateConversion = async (id: string, conversion: Partial<Omit<Conversion, 'id'>>): Promise<Conversion | null> => {
  const { data, error } = await supabase
    .from('conversions')
    .update(conversion)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating conversion:', error)
    return null
  }
  return data
}

export const deleteConversion = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('conversions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting conversion:', error)
    return false
  }
  return true
}

// Database Functions for Transactions
export const getTransactions = async (platform: string): Promise<Transaction[]> => {
  console.log(`Fetching transactions for platform: ${platform}`);
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('platform', platform)
      .order('created_at', { ascending: false }) // הוספה אחרונה קודם
    
    if (error) {
      console.error(`Error fetching transactions for ${platform}:`, error);
      return []
    }
    
    console.log(`Transactions for ${platform}:`, data);
    return data || []
  } catch (error) {
    console.error(`Exception fetching transactions for ${platform}:`, error);
    return []
  }
}

export const addTransaction = async (transaction: Omit<Transaction, 'id' | 'status'>): Promise<Transaction | null> => {
  // Try to fetch logo for the symbol
  let logo_url = null;
  if (transaction.symbol) {
    try {
      const response = await fetch(`/api/stock-info?symbol=${transaction.symbol}`);
      if (response.ok) {
        const stockInfo = await response.json();
        logo_url = stockInfo.logo_url;
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({ ...transaction, status: 'open', logo_url })
    .select()
    .single()
  
  if (error) {
    console.error('Error adding transaction:', error)
    return null
  }
  return data
}

export const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id'>>): Promise<Transaction | null> => {
  // Try to fetch logo for the symbol if it changed
  let logo_url = transaction.logo_url;
  if (transaction.symbol && !logo_url) {
    try {
      const response = await fetch(`/api/stock-info?symbol=${transaction.symbol}`);
      if (response.ok) {
        const stockInfo = await response.json();
        logo_url = stockInfo.logo_url;
      }
    } catch (error) {
      console.error('Error fetching logo:', error);
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({ ...transaction, logo_url })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating transaction:', error)
    return null
  }
  return data
}

export const deleteTransaction = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Error deleting transaction:', error)
    return false
  }
  return true
}

export const sellTransaction = async (
  id: string, 
  sell_date: string, 
  sell_quantity: number,
  sell_price_per_unit: number,
  sell_fee: number, 
  sell_fee_currency: 'ILS' | 'USD' = 'USD'
): Promise<Transaction | null> => {
  const sell_price = sell_quantity * sell_price_per_unit
  
  const { data, error } = await supabase
    .from('transactions')
    .update({
      sell_date,
      sell_quantity,
      sell_price_per_unit,
      sell_price,
      sell_fee,
      sell_fee_currency,
      status: 'closed'
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error selling transaction:', error)
    return null
  }
  return data
}

// Helper function to calculate actual cash balance
export const calculateActualCash = (deposits: Deposit[], conversions: Conversion[]) => {
  return calculateCurrentCash(deposits, conversions, [])
}

// Calculate current cash balance considering deposits, conversions, and transactions
export const calculateCurrentCash = (
  deposits: Deposit[], 
  conversions: Conversion[], 
  transactions: Transaction[],
  platformSettings?: PlatformSettings
): { ILS: number, USD: number } => {
  let totalILS = 0
  let totalUSD = 0

  // Add deposits
  deposits.forEach(deposit => {
    if (deposit.currency === 'ILS') {
      totalILS += deposit.amount
    } else {
      totalUSD += deposit.amount
    }
  })

  // Apply conversions
  conversions.forEach(conversion => {
    if (conversion.source_currency === 'ILS' && conversion.target_currency === 'USD') {
      // Convert ILS to USD
      const convertedAmount = conversion.source_amount / conversion.exchange_rate
      totalILS -= conversion.source_amount
      totalUSD += convertedAmount
    } else if (conversion.source_currency === 'USD' && conversion.target_currency === 'ILS') {
      // Convert USD to ILS
      const convertedAmount = conversion.source_amount * conversion.exchange_rate
      totalUSD -= conversion.source_amount
      totalILS += convertedAmount
    }
  })

  // Handle transactions - deduct buy costs and add sell proceeds
  transactions.forEach(transaction => {
    const buyFee = platformSettings ? calculateBuyFee('extrade', platformSettings) : transaction.buy_fee
    const sellFee = platformSettings ? calculateSellFee('extrade', platformSettings) : (transaction.sell_fee || 0)
    
    // Deduct buy costs (always in USD)
    totalUSD -= (transaction.quantity * transaction.buy_price) + buyFee
    
    // Add sell proceeds for closed transactions (always in USD)
    if (transaction.status === 'closed' && transaction.sell_quantity && transaction.sell_price_per_unit) {
      totalUSD += (transaction.sell_quantity * transaction.sell_price_per_unit) - sellFee
    }
  })

  return { ILS: totalILS, USD: totalUSD }
}

// Calculate total portfolio value (cash + investments)
export const calculateTotalPortfolioValue = (
  deposits: Deposit[], 
  conversions: Conversion[], 
  transactions: Transaction[],
  platformSettings?: PlatformSettings,
  exchangeRate: number = 3.5 // Default ILS to USD rate
): { totalILS: number, totalUSD: number, investmentsUSD: number } => {
  const cash = calculateCurrentCash(deposits, conversions, transactions, platformSettings)
  
  // Calculate value of open transactions (investments)
  const investmentsUSD = transactions
    .filter(t => t.status === 'open')
    .reduce((total, transaction) => {
      // For open transactions, use buy price as current value
      return total + (transaction.quantity * transaction.buy_price)
    }, 0)
  
  return {
    totalILS: cash.ILS,
    totalUSD: cash.USD + investmentsUSD,
    investmentsUSD
  }
}

// Calculate overall profit/loss based on transactions only (not conversions)
export const calculateOverallProfitLoss = (
  deposits: Deposit[], 
  conversions: Conversion[], 
  transactions: Transaction[],
  platformSettings?: PlatformSettings,
  exchangeRate: number = 3.5
): { amount: number, percentage: number } => {
  // Calculate total money invested in transactions (buy costs)
  const totalInvestedInTransactions = transactions.reduce((total, transaction) => {
    const buyFee = platformSettings ? calculateBuyFee('extrade', platformSettings) : transaction.buy_fee
    const totalBuyCost = (transaction.quantity * transaction.buy_price) + buyFee
    return total + totalBuyCost
  }, 0)
  
  // Calculate total money received from sold transactions
  const totalReceivedFromSales = transactions
    .filter(t => t.status === 'closed' && t.sell_quantity && t.sell_price_per_unit)
    .reduce((total, transaction) => {
      const sellFee = platformSettings ? calculateSellFee('extrade', platformSettings) : (transaction.sell_fee || 0)
      const sellProceeds = (transaction.sell_quantity! * transaction.sell_price_per_unit!) - sellFee
      return total + sellProceeds
    }, 0)
  
  // Calculate current value of open positions (unsold transactions)
  const currentValueOfOpenPositions = transactions
    .filter(t => t.status === 'open')
    .reduce((total, transaction) => {
      // For open positions, we use the buy price as current value
      return total + (transaction.quantity * transaction.buy_price)
    }, 0)
  
  // Total current value = money from sales + current value of open positions
  const totalCurrentValue = totalReceivedFromSales + currentValueOfOpenPositions
  
  // Calculate profit/loss amount
  const profitLossAmount = totalCurrentValue - totalInvestedInTransactions
  
  // Calculate total portfolio value for percentage calculation
  const portfolioValue = calculateTotalPortfolioValue(deposits, conversions, transactions, platformSettings, exchangeRate)
  const totalPortfolioValue = portfolioValue.totalUSD + (portfolioValue.totalILS / exchangeRate)
  
  // Calculate profit/loss percentage relative to total portfolio value
  const profitLossPercentage = totalPortfolioValue > 0 ? (profitLossAmount / totalPortfolioValue) * 100 : 0
  
  return {
    amount: profitLossAmount,
    percentage: profitLossPercentage
  }
}

// Helper functions for transaction calculations
export const calculateInvestmentAmount = (quantity: number, price: number, fee: number): number => {
  return (quantity * price) + fee
}

export const calculateProfitLoss = (
  buyQuantity: number, 
  buyPrice: number, 
  buyFee: number,
  sellQuantity: number,
  sellPricePerUnit: number, 
  sellFee: number
): { amount: number, percentage: number } => {
  // Calculate investment for sold quantity only
  const soldPortionInvestment = (sellQuantity / buyQuantity) * ((buyQuantity * buyPrice) + buyFee)
  const sellAmount = (sellQuantity * sellPricePerUnit) - sellFee
  const profitLossAmount = sellAmount - soldPortionInvestment
  const profitLossPercentage = (profitLossAmount / soldPortionInvestment) * 100
  
  return {
    amount: profitLossAmount,
    percentage: profitLossPercentage
  }
}

// Helper function to format currency display
export const formatCurrency = (amount: number, currency: 'ILS' | 'USD'): string => {
  const symbol = currency === 'USD' ? '$' : '₪'
  return `${symbol}${amount.toLocaleString()}`
}

// Platform Settings Interface
export interface PlatformSettings {
  id: string
  platform: string
  display_name: string
  buy_fee_usd: number
  sell_fee_usd: number
  created_at: string
  updated_at: string
}

// Database Functions for Platform Settings
export const getPlatformSettings = async (platform: string): Promise<PlatformSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('platform', platform)
      .single()
    
    if (error) {
      console.error(`Error fetching platform settings for ${platform}:`, error)
      return null
    }
    
    return data
  } catch (error) {
    console.error(`Exception fetching platform settings for ${platform}:`, error)
    return null
  }
}

export const getAllPlatformSettings = async (): Promise<PlatformSettings[]> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('platform')
    
    if (error) {
      console.error('Error fetching all platform settings:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Exception fetching all platform settings:', error)
    return []
  }
}

export const upsertPlatformSettings = async (settings: Omit<PlatformSettings, 'id' | 'created_at' | 'updated_at'>): Promise<PlatformSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(settings, { onConflict: 'platform' })
      .select()
      .single()
    
    if (error) {
      console.error('Error upserting platform settings:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Exception upserting platform settings:', error)
    return null
  }
}

export const initializeDefaultSettings = async (): Promise<void> => {
  const platforms = ['kraken', 'ibkr', 'extrade']
  const defaultNames = {
    kraken: 'Kraken',
    ibkr: 'IBKR',
    extrade: 'Extrade'
  }
  
  for (const platform of platforms) {
    const existingSettings = await getPlatformSettings(platform)
    if (!existingSettings) {
      await upsertPlatformSettings({
        platform,
        display_name: defaultNames[platform as keyof typeof defaultNames],
        buy_fee_usd: 1.00, // $1 default
        sell_fee_usd: 1.00  // $1 default
      })
    }
  }
}

// Helper function to calculate fees based on settings
export const calculateBuyFee = (platform: string, settings?: PlatformSettings): number => {
  if (settings) {
    return settings.buy_fee_usd;
  }
  // Default $1 if no settings
  return 1.00;
}

export const calculateSellFee = (platform: string, settings?: PlatformSettings): number => {
  if (settings) {
    return settings.sell_fee_usd;
  }
  // Default $1 if no settings
  return 1.00;
} 