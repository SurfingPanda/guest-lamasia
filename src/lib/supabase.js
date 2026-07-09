import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mmvgweevkfthqfneltkt.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdmd3ZWV2a2Z0aHFmbmVsdGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1NzMwOTUsImV4cCI6MjA5OTE0OTA5NX0.niUB20aeZnkR3GLneivLWG6ObfaH4UoFL56LechJlYA'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
