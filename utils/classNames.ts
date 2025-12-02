/**
 * Utility for merging Tailwind CSS classes safely
 * Combines clsx for conditional classes with tailwind-merge for conflict resolution
 *
 * REQUIRES: npm install clsx tailwind-merge
 *
 * @example
 * classNames("px-4 py-2", "px-6")
 * // Returns: "py-2 px-6" (px-6 overrides px-4)
 *
 * @example
 * classNames("bg-red-500", isActive && "bg-blue-500", className)
 * // Conditionally applies classes, merges safely
 *
 * @example
 * classNames(
 *   "base-class",
 *   condition1 && "conditional-class",
 *   condition2 ? "true-class" : "false-class",
 *   { "object-class": condition3 }
 * )
 * // Supports all clsx patterns
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function classNames(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
