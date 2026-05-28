import type { User } from "./api-types";

const TOKEN_KEY = "pp.auth.token";
const USER_KEY = "pp.auth.user";

const hasWindow = typeof window !== "undefined";

export const authStorage = {
  getToken(): string | null {
    if (!hasWindow) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  getUser(): User | null {
    if (!hasWindow) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  set(token: string, user: User) {
    if (!hasWindow) return;
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    if (!hasWindow) return;
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};
