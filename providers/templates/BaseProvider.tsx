import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// =============================================================================
// 1. DEFINE TYPES
// =============================================================================

interface ExampleState {
  data: string | null;
  isLoading: boolean;
  error: string | null;
}

interface ExampleContextValue extends ExampleState {
  // Actions
  fetchData: () => Promise<void>;
  setData: (data: string) => void;
  clearData: () => void;
  clearError: () => void;
}

// =============================================================================
// 2. CREATE CONTEXT
// =============================================================================

const ExampleContext = createContext<ExampleContextValue | undefined>(undefined);

// =============================================================================
// 3. CREATE CUSTOM HOOK
// =============================================================================

export function useExample() {
  const context = useContext(ExampleContext);
  if (context === undefined) {
    throw new Error("useExample must be used within an ExampleProvider");
  }
  return context;
}

// =============================================================================
// 4. CREATE PROVIDER
// =============================================================================

interface ExampleProviderProps {
  children: ReactNode;
}

export function ExampleProvider({ children }: ExampleProviderProps) {
  // State
  const [data, setDataState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Actions (wrapped in useCallback for stable references)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Replace with actual API call
      const response = await fetch("/api/data");
      const result = await response.json();
      setDataState(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setData = useCallback((newData: string) => {
    setDataState(newData);
  }, []);

  const clearData = useCallback(() => {
    setDataState(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Context value
  const value: ExampleContextValue = {
    // State
    data,
    isLoading,
    error,
    // Actions
    fetchData,
    setData,
    clearData,
    clearError,
  };

  return (
    <ExampleContext.Provider value={value}>{children}</ExampleContext.Provider>
  );
}

// =============================================================================
// USAGE EXAMPLE
// =============================================================================
//
// // In your app root or layout:
// function App() {
//   return (
//     <ExampleProvider>
//       <MyComponent />
//     </ExampleProvider>
//   );
// }
//
// // In any child component:
// function MyComponent() {
//   const { data, isLoading, error, fetchData } = useExample();
//
//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);
//
//   if (isLoading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;
//   return <div>Data: {data}</div>;
// }
