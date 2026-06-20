import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gytgnnjxlmvgrltumwwj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8lrQR9HyTKlbRITYYMiRRg_XXzzYGJA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
