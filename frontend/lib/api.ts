import axios, { AxiosError } from 'axios';
import { clearSession, getAccessToken, refreshAccessToken } from './auth';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export const api = axios.create();

// Configure baseURL at runtime in the browser so SSR / container hostnames don't break
if (typeof window !== 'undefined') {
  const runtimeBase = process.env.NEXT_PUBLIC_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000/api`;
  api.defaults.baseURL = runtimeBase;
} else {
  api.defaults.baseURL = API_BASE;
}

export const setAuthToken = (token?: string) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

const existingAccessToken = getAccessToken();
if (existingAccessToken) {
  setAuthToken(existingAccessToken);
}

const formatApiFieldValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(' ');
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

export const parseApiError = (error: unknown) => {
  const fields: Record<string, string> = {};
  let message = 'Something went wrong. Please try again.';

  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return { message: error.message, fields };
    }
    return { message, fields };
  }

  const data = error.response?.data;
  if (!data) {
    return { message: error.message || message, fields };
  }

  if (typeof data === 'string') {
    return { message: data, fields };
  }

  if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      const text = formatApiFieldValue(value);
      if (text) {
        fields[key] = text;
      }
    }

    if (fields.detail) {
      message = fields.detail;
    } else if (fields.non_field_errors) {
      message = fields.non_field_errors;
    } else if (Object.keys(fields).length) {
      message = Object.values(fields).join(' ');
    }

    return { message, fields };
  }

  return { message, fields };
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh/')) {
      originalRequest._retry = true;
      try {
        const newAccess = await refreshAccessToken();
        setAuthToken(newAccess);
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccess}`,
        };
        return api(originalRequest);
      } catch (refreshError) {
        clearSession();
        setAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);
