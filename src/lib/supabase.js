import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wtadwkggfqhofcnvvrqc.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0YWR3a2dnZnFob2ZjbnZ2cnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwNjc4MTQsImV4cCI6MjA5ODY0MzgxNH0.Rc6pIIY_X9I7-OIhx6G2A8pdg9px_CakduSfFmEVmxc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
