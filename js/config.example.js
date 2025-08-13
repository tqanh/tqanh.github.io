// Copy this file to js/config.js and fill your Supabase details
// Keep this file in the repo as a reference; config.js will be public on GitHub Pages
// Make sure to configure RLS policies as instructed in README for safe public access
window.LEADERBOARD_CONFIG = {
    supabaseUrl: "https://YOUR_PROJECT_ID.supabase.co",
    supabaseAnonKey: "YOUR_ANON_KEY",
    table: "scores" // table with columns: user(text), game(text), score(int), updated_at(timestamptz)
};
