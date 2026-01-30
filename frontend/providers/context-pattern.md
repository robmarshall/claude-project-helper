# Context/Provider Pattern Guide

## Quick Reference Rules

1. **Create context with undefined default** - `createContext<T | undefined>(undefined)`
2. **Always create a custom hook** - Wrap `useContext` with error checking
3. **Use TypeScript interfaces** - Define types for context value
4. **Wrap methods in useCallback** - Stabilize function references
5. **Use useReducer for complex state** - Better than multiple useState for related state
6. **Separate concerns** - One provider per domain (auth, theme, modals, etc.)

---

## Dependencies

No additional dependencies required - uses React built-ins.

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
```

---

## Basic Provider Pattern

### Step 1: Define the Context Type

```tsx
interface MyContextValue {
  // State
  data: SomeType | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchData: () => Promise<void>;
  clearData: () => void;
}
```

### Step 2: Create Context with Undefined Default

```tsx
const MyContext = createContext<MyContextValue | undefined>(undefined);
```

### Step 3: Create Custom Hook with Error Check

```tsx
export function useMyContext() {
  const context = useContext(MyContext);
  if (context === undefined) {
    throw new Error("useMyContext must be used within a MyProvider");
  }
  return context;
}
```

### Step 4: Create Provider Component

```tsx
interface MyProviderProps {
  children: ReactNode;
}

export function MyProvider({ children }: MyProviderProps) {
  const [data, setData] = useState<SomeType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getData();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const value: MyContextValue = {
    data,
    isLoading,
    error,
    fetchData,
    clearData,
  };

  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}
```

---

## Pattern with useReducer (Complex State)

Use `useReducer` when you have multiple related state values or complex state transitions.

### Define Types

```tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### Create Reducer

```tsx
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case "LOGOUT":
      return initialState;
    default:
      return state;
  }
}
```

### Create Provider with Reducer

```tsx
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });
    try {
      const user = await api.login(email, password);
      dispatch({ type: "AUTH_SUCCESS", payload: user });
    } catch (e) {
      dispatch({
        type: "AUTH_FAILURE",
        payload: e instanceof Error ? e.message : "Login failed",
      });
    }
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "LOGOUT" });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
```

---

## Provider Composition Pattern

### Root Provider Hierarchy

```tsx
// providers/AppProviders.tsx
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// main.tsx
ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppProviders>
    <App />
  </AppProviders>
);
```

### Nested Provider Access

```tsx
// Child providers can access parent providers
function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Access AuthProvider
  const [theme, setTheme] = useState(user?.preferences?.theme ?? "light");
  // ...
}
```

---

## Common Provider Types

### Theme Provider

```tsx
interface ThemeContextValue {
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
}
```

### Modal/Drawer Provider

```tsx
interface ModalContextValue {
  isOpen: boolean;
  modalContent: ReactNode | null;
  openModal: (content: ReactNode) => void;
  closeModal: () => void;
}
```

### Toast/Notification Provider

```tsx
interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
}
```

### Feature Flag Provider

```tsx
interface FeatureFlagContextValue {
  flags: Record<string, boolean>;
  isEnabled: (flag: string) => boolean;
  isLoading: boolean;
}
```

---

## Performance Optimization

### Split Context for Frequent Updates

```tsx
// Separate contexts for state vs actions (actions never change)
const StateContext = createContext<State | undefined>(undefined);
const ActionsContext = createContext<Actions | undefined>(undefined);

export function useMyState() {
  const context = useContext(StateContext);
  if (!context) throw new Error("...");
  return context;
}

export function useMyActions() {
  const context = useContext(ActionsContext);
  if (!context) throw new Error("...");
  return context;
}

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);

  // Actions object is stable (never changes reference)
  const actions = useMemo<Actions>(
    () => ({
      doSomething: () => setState((s) => ({ ...s, /* changes */ })),
      doSomethingElse: () => setState((s) => ({ ...s, /* changes */ })),
    }),
    []
  );

  return (
    <StateContext.Provider value={state}>
      <ActionsContext.Provider value={actions}>
        {children}
      </ActionsContext.Provider>
    </StateContext.Provider>
  );
}
```

### Use Refs to Avoid Re-renders

```tsx
// Store values that don't need to trigger re-renders in refs
function MyProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const userRef = useRef<User | null>(null); // Won't cause re-renders

  const login = useCallback(async (credentials: Credentials) => {
    const user = await api.login(credentials);
    userRef.current = user; // Store in ref
    setIsAuthenticated(true); // Only this triggers re-render
  }, []);

  // ...
}
```

---

## Template

See [BaseProvider.tsx](./templates/BaseProvider.tsx) for a complete, copy-paste ready template.

---

## See Also

- [React Hook Form Guide](../forms/react-hook-form.md) - Form state management
- [Atomic Design](../components/atomic-design.md) - Component organization
