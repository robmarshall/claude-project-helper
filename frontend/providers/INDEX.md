# Providers Quick Reference

## BEFORE YOU START

Check user's project:
1. Does a provider for this domain exist? → Extend it
2. What's the provider naming convention? → Follow it
3. Where are providers located? → Put new one there

## NEW PROVIDER

Copy templates/BaseProvider.tsx, then:
1. Rename "Example" to your domain (Auth, Theme, Modal)
2. Define state interface
3. Define actions
4. Update the custom hook name

## EXTENDING EXISTING PROVIDER

1. Add new state to the interface
2. Add new useState/useReducer
3. Add new useCallback for actions
4. Add to provider value

## PATTERN

```tsx
const MyContext = createContext<Value | undefined>(undefined);

export function useMyContext() {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error("useMyContext must be within MyProvider");
  return ctx;
}

export function MyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initial);
  const action = useCallback(() => {}, []);
  return <MyContext.Provider value={{ state, action }}>{children}</MyContext.Provider>;
}
```

## CORE RULES

1. Context with undefined default
2. Custom hook with error check
3. useCallback for all actions
4. One provider per domain

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Purpose | Pattern |
|------|---------|---------|
| BaseProvider.tsx | Generic starting point | useState |
| AuthProvider.tsx | Login/logout, token management | useReducer |
| ThemeProvider.tsx | Dark/light mode, system preference | useState |
| ToastProvider.tsx | Notifications with auto-dismiss | useState |

### Which template to use?
- **Need custom domain provider?** → Start with BaseProvider.tsx
- **Need authentication?** → Use AuthProvider.tsx
- **Need dark mode?** → Use ThemeProvider.tsx
- **Need notifications?** → Use ToastProvider.tsx

## DEEP DIVE

- useReducer patterns → context-pattern.md
- Provider composition → context-pattern.md
