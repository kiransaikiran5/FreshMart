import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken && refreshToken) {
      loginWithToken(accessToken, refreshToken);
      navigate('/products', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate, searchParams, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg text-gray-600">Signing you in…</p>
    </div>
  );
}