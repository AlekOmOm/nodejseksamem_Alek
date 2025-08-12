import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "svelte-sonner";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any

export async function copyToClipboard(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  } catch (error) {
    toast.error(`Failed to copy ${label.toLowerCase()}`);
  }
}
