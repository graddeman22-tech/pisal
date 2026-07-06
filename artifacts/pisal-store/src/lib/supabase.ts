import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uzdickqardsvqzsqnmnc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ZGlja3FhcmRzdnF6c3FubW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NjYwODMsImV4cCI6MjA5NDA0MjA4M30.mBp_G7ekDuNTK0H4Xry6rfaagZ-rtIU2TlcvJnLzNJA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
