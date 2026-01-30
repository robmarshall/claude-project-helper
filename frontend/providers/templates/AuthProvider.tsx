/**
 * Authentication provider with login/logout and token management
 *
 * Uses useReducer for complex state transitions (loading, error, user data)
 *
 * @example
 * // Wrap your app:
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <Router />
 *     </AuthProvider>
 *   );
 * }
 *
 * @example
 * // Use in components:
 * function LoginPage() {
 *   const { login, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (data: LoginForm) => {
 *     await login(data.email, data.password);
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 *
 * @example
 * // Protected route check:
 * function ProtectedRoute({ children }) {
 *   const { isAuthenticated, isLoading } = useAuth();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return <Navigate to="/login" />;
 *   return children;
 * }
 *
 * @example
 * // Access user data:
 * function UserProfile() {
 *   const { user, logout } = useAuth();
 *   return (
 *     <div>
 *       <p>Welcome, {user?.name}</p>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   );
 * }
 */
import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

// =============================================================================
// 1. DEFINE TYPES
// =============================================================================

interface User {
  id: string;
  email: string;
  name: string;
  // Add more user fields as needed
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// =============================================================================
// 2. REDUCER (for complex state transitions)
// =============================================================================

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start true to check for existing session
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return { ...initialState, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

// =============================================================================
// 3. CREATE CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// =============================================================================
// 4. CREATE CUSTOM HOOK
// =============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// =============================================================================
// 5. TOKEN STORAGE HELPERS
// =============================================================================

const TOKEN_KEY = "auth_token";

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// =============================================================================
// 6. CREATE PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        dispatch({ type: "AUTH_FAILURE", payload: "" });
        return;
      }

      try {
        // TODO: Replace with your API endpoint
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Session expired");

        const user = await response.json();
        dispatch({ type: "AUTH_SUCCESS", payload: user });
      } catch {
        removeStoredToken();
        dispatch({ type: "AUTH_FAILURE", payload: "" });
      }
    };

    checkAuth();
  }, []);

  // Login action
  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      // TODO: Replace with your API endpoint
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const { user, token } = await response.json();
      setStoredToken(token);
      dispatch({ type: "AUTH_SUCCESS", payload: user });
    } catch (e) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: e instanceof Error ? e.message : "Login failed",
      });
    }
  }, []);

  // Logout action
  const logout = useCallback(() => {
    removeStoredToken();
    dispatch({ type: "LOGOUT" });
  }, []);

  // Clear error action
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Context value
  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
