import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aafgptxzavrpraehaexa.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kRWphSBHk0VILRq0ZlIONA_Uu2ML9F6_fXN23N'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
