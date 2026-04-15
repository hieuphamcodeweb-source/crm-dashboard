import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AUTH_API_URL = 'http://localhost:3001/users';
const STORAGE_KEY = 'client_auth_user';
const TOKEN_STORAGE_KEY = 'client_auth_token';
const AUTH_DEBUG = true;

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStoredToken() {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function createFakeToken(userLike) {
  const seed = `${userLike.id || 'u'}:${userLike.email}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return `mock_${btoa(seed)}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(readStoredToken);

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      async register(payload) {
        const email = payload.email.trim().toLowerCase();
        const existingRes = await fetch(`${AUTH_API_URL}?email=${encodeURIComponent(email)}`);
        if (!existingRes.ok) {
          throw new Error('Không thể kiểm tra tài khoản. Vui lòng thử lại.');
        }
        const existingUsers = await existingRes.json();
        if (Array.isArray(existingUsers) && existingUsers.length > 0) {
          throw new Error('Email này đã được đăng ký.');
        }

        const now = new Date().toISOString();
        const newUser = {
          name: payload.name.trim(),
          email,
          password: payload.password,
          created_at: now,
          updated_at: now,
        };

        const registerRes = await fetch(AUTH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser),
        });

        if (!registerRes.ok) {
          throw new Error('Không thể tạo tài khoản mới.');
        }

        const savedUser = await registerRes.json();
        const safeUser = {
          id: savedUser.id,
          name: savedUser.name,
          email: savedUser.email,
        };
        const newToken = createFakeToken(safeUser);
        setUser(safeUser);
        setToken(newToken);
        return safeUser;
      },
      async login(payload) {
        const email = payload.email.trim().toLowerCase();
        if (AUTH_DEBUG) {
          // eslint-disable-next-line no-console
          console.log('[AUTH-DEBUG] Login start', {
            email,
            passwordLength: String(payload.password || '').length,
          });
        }
        const res = await fetch(`${AUTH_API_URL}?email=${encodeURIComponent(email)}`);
        if (!res.ok) {
          if (AUTH_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[AUTH-DEBUG] Login API failed', {
              status: res.status,
              statusText: res.statusText,
            });
          }
          throw new Error('Không thể đăng nhập lúc này.');
        }
        const users = await res.json();
        if (AUTH_DEBUG) {
          // eslint-disable-next-line no-console
          console.log('[AUTH-DEBUG] Login query result', {
            usersCount: Array.isArray(users) ? users.length : -1,
            users,
          });
        }
        if (!Array.isArray(users) || users.length === 0) {
          if (AUTH_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[AUTH-DEBUG] Login fail: no user found by email');
          }
          throw new Error('Email hoặc mật khẩu không đúng.');
        }
        const matched = users[0];
        // json-server có thể không filter được password bằng query param.
        // So sánh password ở client để đảm bảo login đúng.
        if (String(matched.password) !== String(payload.password)) {
          if (AUTH_DEBUG) {
            // eslint-disable-next-line no-console
            console.log('[AUTH-DEBUG] Login fail: password mismatch', {
              dbPassword: matched.password,
              inputPassword: payload.password,
            });
          }
          throw new Error('Email hoặc mật khẩu không đúng.');
        }
        const safeUser = {
          id: matched.id,
          name: matched.name,
          email: matched.email,
        };
        const newToken = createFakeToken(safeUser);
        setUser(safeUser);
        setToken(newToken);
        if (AUTH_DEBUG) {
          // eslint-disable-next-line no-console
          console.log('[AUTH-DEBUG] Login success', {
            user: safeUser,
            tokenPreview: `${newToken.slice(0, 18)}...`,
          });
        }
        return safeUser;
      },
      logout() {
        setUser(null);
        setToken('');
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
