const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(express.json());

// Home Route
app.get('/', (req, res) => {
  res.send('Madden Mobile Stats API');
});

// OAuth Callback Route
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    // Exchange the authorization code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error during OAuth callback:', error.message);
      return res.status(400).send('Authentication failed');
    }

    // Redirect to the dashboard or handle successful login
    return res.redirect(
      `https://lvl-machine-storikobanes-projects.vercel.app/dashboard?user=${encodeURIComponent(data.user.email)}`
    );
  } catch (err) {
    console.error('Unexpected error during OAuth callback:', err.message);
    return res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
