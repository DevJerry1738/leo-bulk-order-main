import type { PostgrestError } from "@supabase/supabase-js";

export function getErrorMessage(error: unknown): string {
  if (!error) return "An unknown error occurred.";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const typed = error as { message?: string; error?: string; cause?: unknown };
    if (typed.message) return typed.message;
    if (typed.error) return typed.error;
  }
  return "An unexpected error occurred.";
}

export function handleSupabaseError(error: PostgrestError | null | undefined): string | null {
  if (!error) return null;
  return error.message || error.details || error.hint || "A database error occurred.";
}

export function errorToast(error: unknown, fallback = "Something went wrong.") {
  const message = getErrorMessage(error) || fallback;
  return message;
}
