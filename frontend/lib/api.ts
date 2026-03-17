// Centralized Axios API client
// All FastAPI calls go through this instance.
// Attaches Authorization: Bearer <token> from the NextAuth session automatically.

import axios from "axios";
import { getSession, signOut } from "next-auth/react";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach Bearer token ─────────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  // getSession() works on both client and server components
  const session = await getSession();
  const token = (session as any)?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor — handle 401 ────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — sign the user out.
      // Token refresh will be implemented in Phase 8.
      await signOut({ redirect: true, callbackUrl: "/login" });
    }
    return Promise.reject(error);
  }
);

export default apiClient;
