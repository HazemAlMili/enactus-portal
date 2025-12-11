// Import clsx for conditional class joining and ClassValue type
import { clsx, type ClassValue } from "clsx"
// Import twMerge to handle Tailwind CSS class conflicts
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes conditionally.
 * Combines clsx (for conditional logic) and twMerge (for resolving conflicts).
 * 
 * @param inputs - List of class names or conditional class objects
 * @returns A single merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
