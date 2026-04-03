/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, loginWithCredentials, logoutSession } from '../lib/authApi';

const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'cf_auth_token';
const AUTH_USER_KEY = 'cf_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [isChecking, setIsChecking] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setIsChecking(false);
      return;
    }

    let isActive = true;

    fetchCurrentUser(token)
      .then((payload) => {
        if (!isActive) {
          return;
        }
        setUser(payload.user);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
      })
      .catch(() => {
        if (!isActive) {
          return;
        }
        setToken(null);
        setUser(null);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      })
      .finally(() => {
        if (isActive) {
          setIsChecking(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  const login = useCallback(async (credentials) => {
    const payload = await loginWithCredentials(credentials);
    setToken(payload.token);
    setUser(payload.user);
    localStorage.setItem(AUTH_TOKEN_KEY, payload.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(payload.user));
    return payload.user;
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutSession(token);
      } catch {
        // Ignore network/logout errors and clear local state.
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isChecking,
      login,
      logout,
    }),
    [token, user, isChecking, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }
  return context;
}
