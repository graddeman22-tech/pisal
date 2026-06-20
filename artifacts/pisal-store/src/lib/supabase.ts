import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gytgnnjxlmvgrltumwwj.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dGdubmp4bG12Z3JsdHVtd3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NTExNDgsImV4cCI6MjA5NzUyNzE0OH0.-TGBTFtkRLE7AYHixMzH4bPVTotg817TKInpwOAMlBg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
