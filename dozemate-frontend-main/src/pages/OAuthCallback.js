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

        const match = document.cookie.match(/(^| )auth_token=([^;]+)/);
        const token = match ? match[2] : null;
        if (!token) throw new Error('OAuth login failed (no cookie)');
        localStorage.setItem('token', token);  // persist for axios
        await login(token, { role, email, id }, role);

        navigate('/dashboard', { replace: true });

      } catch (err) {
        console.error('[OAuthCallback] error', err);
        navigate('/login', { replace: true, state: { flash: err.message } });
      }
    })();
  }, []);

  return <div className="loading-spinner" style={{ marginTop: 50 }}>Signing you in…</div>;
}
