import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const needsDetails = false;
  const role = 'user';
  const email = '';
  const id = '';

  useEffect(() => {
  (async () => {
    try {
      // Method 1: Cookie se lo
      let token = null;
      const match = document.cookie.match(/(^| )auth_token=([^;]+)/);
      token = match ? match[2] : null;

      // Method 2: URL params se lo (fallback)
      if (!token) {
        const params = new URLSearchParams(window.location.search);
        token = params.get('token');
      }

      if (!token) throw new Error('No token found');

      // Token decode karo role ke liye
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role || 'user';

      localStorage.setItem('token', token);
      await login(token, { role }, role);
      navigate('/dashboard', { replace: true });

    } catch (err) {
      console.error('[OAuthCallback] error', err);
      navigate('/login', { replace: true });
    }
  })();
}, []);

  return <div className="loading-spinner" style={{ marginTop: 50 }}>Signing you in…</div>;
}
