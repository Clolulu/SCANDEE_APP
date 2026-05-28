import axios from 'axios';

const API_BASE = (typeof window !== 'undefined')
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000/api`)
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api');
const ACCESS_TOKEN_KEY = 'scandee_token';
const REFRESH_TOKEN_KEY = 'scandee_refresh';
const USER_KEY = 'scandee_user';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  full_name: string;
}

export interface AuthSession {
  access: string;
  refresh: string;
  user: AuthUser;
}

export const getStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
  const access = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  const refresh = window.localStorage.getItem(REFRESH_TOKEN_KEY);
  const userString = window.localStorage.getItem(USER_KEY);
  if (!access || !refresh || !userString) return null;
  try {
    const user = JSON.parse(userString) as AuthUser;
    return { access, refresh, user };
  } catch {
    return null;
  }
};

export const saveSession = (access: string, refresh: string, user: AuthUser) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  const userString = window.localStorage.getItem(USER_KEY);
  if (!userString) return null;
  try {
    return JSON.parse(userString) as AuthUser;
  } catch {
    return null;
  }
};

export const parseJwt = (token: string) => {
  try {
    const [, payload] = token.split('.');
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(
      decoded
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    ));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string) => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return true;
  return payload.exp * 1000 < Date.now();
};

export const refreshAccessToken = async (): Promise<string> => {
  const refresh = getRefreshToken();
  if (!refresh) {
    throw new Error('No refresh token available');
  }
  const response = await axios.post(`${API_BASE}/auth/refresh/`, { refresh }, {
    headers: { 'Content-Type': 'application/json' },
  });
  const access = response.data.access;
  if (!access) {
    throw new Error('Unable to refresh access token');
  }
  saveSession(access, refresh, getStoredUser() as AuthUser);
  return access;
};
