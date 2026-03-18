import { supabase } from "@/integrations/supabase/client";

// Track if auth is ready (session fully loaded)
let authReadyPromise: Promise<boolean> | null = null;
let authReadyResolve: ((value: boolean) => void) | null = null;

// Initialize auth ready tracking
const initAuthReady = () => {
  if (!authReadyPromise) {
    authReadyPromise = new Promise<boolean>((resolve) => {
      authReadyResolve = resolve;
    });
    
    // Listen for auth state changes to know when auth is ready
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        authReadyResolve?.(!!session);
      }
    });
    
    // Fallback timeout for Capacitor cold start (max 3 seconds)
    setTimeout(() => {
      authReadyResolve?.(false);
    }, 3000);
  }
  return authReadyPromise;
};

// Start tracking immediately
initAuthReady();

/**
 * Waits for auth to be ready (session fully loaded).
 * Essential for Capacitor/mobile where auth loads asynchronously.
 */
export async function waitForAuthReady(timeoutMs: number = 3000): Promise<boolean> {
  try {
    const result = await Promise.race([
      initAuthReady(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs))
    ]);
    return result;
  } catch {
    return false;
  }
}

/**
 * Invokes a Supabase Edge Function with proper authentication.
 * On mobile (Capacitor), the SDK doesn't automatically attach auth headers,
 * so we must explicitly get the session and pass the Bearer token.
 * 
 * @param silentOn401 - If true, returns null data without error for 401 responses (useful during boot)
 */
export async function invokeWithAuth<T = unknown>(
  functionName: string,
  options?: {
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    silentOn401?: boolean;
  }
): Promise<{ data: T | null; error: Error | null }> {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      if (options?.silentOn401) {
        // Silent mode: don't log or return error for auth issues
        return { data: null, error: null };
      }
      console.error('[invokeWithAuth] Session error:', sessionError);
      return { data: null, error: new Error('Failed to get session') };
    }
    
    if (!session?.access_token) {
      if (options?.silentOn401) {
        // Silent mode: treat missing session as expected during boot
        return { data: null, error: null };
      }
      console.error('[invokeWithAuth] No active session for:', functionName);
      return { data: null, error: new Error('Authentication required - please log in') };
    }

    // Merge auth headers with any custom headers
    const headers = {
      ...options?.headers,
      Authorization: `Bearer ${session.access_token}`,
    };

    const { data, error } = await supabase.functions.invoke<T>(functionName, {
      body: options?.body,
      headers,
    });

    if (error) {
      // Check for 401/auth errors and handle silently if requested
      const errorMessage = error.message?.toLowerCase() || '';
      const is401 = errorMessage.includes('401') || 
                    errorMessage.includes('unauthorized') ||
                    errorMessage.includes('auth session missing');
      
      if (is401 && options?.silentOn401) {
        return { data: null, error: null };
      }
      
      console.error('[invokeWithAuth] Function error:', functionName, error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    // Handle network/unexpected errors silently if requested
    if (options?.silentOn401) {
      return { data: null, error: null };
    }
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
