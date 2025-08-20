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

// Helper function to calculate actual cash balance
export const calculateActualCash = (deposits: Deposit[], conversions: Conversion[]) => {
  const totals = { ILS: 0, USD: 0 }
  
  // Add deposits
  deposits.forEach(deposit => {
    totals[deposit.currency] += deposit.amount
  })
  
  // Account for conversions
  conversions.forEach(conversion => {
    totals[conversion.source_currency] -= conversion.source_amount
    const targetAmount = conversion.source_amount * conversion.exchange_rate
    totals[conversion.target_currency] += targetAmount
  })
  
  return totals
} 