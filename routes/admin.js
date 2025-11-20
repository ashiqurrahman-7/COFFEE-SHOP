const express = require('express');
const router = express.Router();

// POST /api/admin/login - simple admin auth using env vars
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const ADMIN_USER = process.env.ADMIN_USER || 'admin';
  const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

  // Debug logging for login attempts (do not enable verbose logs in production)
  console.log('[admin/login] attempt:', { username });
  if(process.env.ADMIN_USER) console.log('[admin/login] ADMIN_USER is set in environment');

  if(username === ADMIN_USER && password === ADMIN_PASS){
    console.log('[admin/login] success for user:', username);
    // For demo we return a simple success token. In production use JWT and secure storage.
    return res.json({ success: true, token: 'demo-admin-token' });
  }

  console.log('[admin/login] failed login for user:', username);
  return res.status(401).json({ success: false, message: 'Invalid credentials' });
});

module.exports = router;
