/**
 * CultureSquared - Supabase Client Configuration
 * 
 * IMPORTANT SECURITY INSTRUCTION:
 * - Only use the public SUPABASE_URL and SUPABASE_ANON_KEY (public/anon key).
 * - NEVER use or expose the service_role key or database password.
 */

const SUPABASE_URL = 'https://cbvlwafuobvtwfvhlpoi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidmx3YWZ1b2J2dHdmdmhscG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzI5NzIsImV4cCI6MjEwNjQ0ODk3Mn0.d94GXxW_7RNzLm_w3825QDrajytoUp8whQHZsAdL4sk';
let supabaseClient = null;

if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.warn('[CultureSquared] Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js.');
    }
} else {
    console.error('[CultureSquared] Supabase JS SDK not detected. Ensure the Supabase CDN script is loaded before supabaseClient.js.');
}

window.supabaseClient = supabaseClient;
