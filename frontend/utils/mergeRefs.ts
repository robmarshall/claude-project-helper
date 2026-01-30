import type { Ref, RefCallback, RefObject } from "react";

/**
 * Merges multiple refs into a single ref callback.
 *
 * Essential for components that need to handle both:
 * - React Hook Form's internal ref (from register)
 * - A forwarded ref from the parent component
 *
 * Works with React 19's ref-as-prop pattern.
 *
 * @example
 * ```tsx
 * // With React Hook Form + forwarded ref
 * interface InputProps {
 *   name: string;
 *   ref?: Ref<HTMLInputElement>;
 * }
 *
 * function Input({ name, ref, ...props }: InputProps) {
 *   const { register } = useFormContext();
 *   const { ref: rhfRef, ...rhfRest } = register(name);
 *
 *   return (
 *     <input
 *       {...rhfRest}
 *       {...props}
 *       ref={mergeRefs(rhfRef, ref)}
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Multiple refs from different sources
 * function FocusableInput({ ref }: { ref?: Ref<HTMLInputElement> }) {
 *   const internalRef = useRef<HTMLInputElement>(null);
 *
 *   const focusInput = () => {
 *     internalRef.current?.focus();
 *   };
 *
 *   return (
 *     <input ref={mergeRefs(internalRef, ref)} />
 *   );
 * }
 * ```
 *
 * @param refs - Variable number of refs to merge (callback refs or RefObjects)
 * @returns A single ref callback that updates all provided refs
 */
export function mergeRefs<T = any>(
  ...refs: Array<Ref<T> | undefined>
): RefCallback<T> {
  return (value: T) => {
    refs.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        // Callback ref - call it with the value
        ref(value);
      } else {
        // RefObject - set its current property
        (ref as RefObject<T>).current = value;
      }
    });
  };
}

export default mergeRefs;
