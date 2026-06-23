// auth-sync.js
const SYNC_URL = 'https://xcbklpgkunxvolgfjcto.supabase.co';
const SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjYmtscGdrdW54dm9sZ2ZqY3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTAxOTQsImV4cCI6MjA5NzcyNjE5NH0.nkVvJUQBtHg5xobypgjMq9Qh6MeZ8ncv8JfB6S4gvgI';

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.supabase !== 'undefined') {
        const syncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);

        // Kuhanin ang kasalukuyang session mula sa LocalStorage
        const { data: { session } } = await syncClient.auth.getSession();
        
        const label = document.querySelector('.login-btn-label');
        if (label) {
            if (session && session.user) {
                // Ipakita ang username/email kapag naka-login
                label.textContent = session.user.email.split('@')[0];
            } else {
                label.textContent = 'Login / Signup';
            }
        }

        // Pakinggan kung magbago ang auth state (gaya ng log out o log in)
        syncClient.auth.onAuthStateChange((event, currentSession) => {
            if (label) {
                label.textContent = currentSession ? currentSession.user.email.split('@')[0] : 'Login / Signup';
            }
        });
    }
});