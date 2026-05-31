/* ═══════════════════════════════════════════
   SUPABASE CLIENT
   Anon key is safe to expose — it's a public
   key. Security comes from the database, not
   from keeping this secret.
═══════════════════════════════════════════ */

const SUPABASE_URL = 'https://absdbhasbcxfskapwzer.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFic2RiaGFzYmN4ZnNrYXB3emVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMzQ1MzYsImV4cCI6MjA5NTgxMDUzNn0.PNtYU2RQRtqWWNHlhCcpfF58a3ffQS-iXwAEm1smElg';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
