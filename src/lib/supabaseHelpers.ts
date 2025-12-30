import { supabase } from "@/integrations/supabase/client";

/**
 * Invokes a Supabase Edge Function with proper authentication.
 * On mobile (Capacitor), the SDK doesn't automatically attach auth headers,
 * so we must explicitly get the session and pass the Bearer token.
 */
export async function invokeWithAuth<T = unknown>(
  functionName: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[invokeWithAuth] Session error:', sessionError);
      return { data: null, error: new Error('Failed to get session') };
    }
    
    if (!session?.access_token) {
      console.error('[invokeWithAuth] No active session for:', functionName);
      return { data: null, error: new Error('Authentication required - please log in') };
    }

    // Merge auth headers with any custom headers
    const headers = {
      ...options?.headers,
      Authorization: `Bearer ${session.access_token}`,
    };

    console.log('[invokeWithAuth] Calling:', functionName, 'with auth');

    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: options?.body,
      headers,
    });

    if (error) {
      console.error('[invokeWithAuth] Function error:', functionName, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('[invokeWithAuth] Unexpected error:', err);
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Unknown error') 
    };
  }
}

/**
 * Checks if user is authenticated before proceeding.
 * Returns true if authenticated, false otherwise.
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.access_token;
}

/**
 * Gets the current user ID or null if not authenticated.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}
