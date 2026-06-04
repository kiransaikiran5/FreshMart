import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginUser, registerUser } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const parseToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.sub, role: payload.role, username: payload.username };
    } catch { return null; }
  };

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const userData = parseToken(token);
      if (userData) setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await loginUser(credentials.username, credentials.password);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    setUser(parseToken(data.access_token));
  };

  const register = async (userData) => {
    await registerUser(userData);
    await login({ username: userData.email, password: userData.password });
  };

  // ✅ NEW – for Google / external token login
  const loginWithToken = (accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(parseToken(accessToken));
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginWithToken, isAdmin: user?.role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);