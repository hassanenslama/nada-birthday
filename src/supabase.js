import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper
export const auth = supabase.auth;

// Export for backwards compatibility (will update incrementally)
export default supabase;
