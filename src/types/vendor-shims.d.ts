declare module "framer-motion" {
  export const motion: any;
  export const AnimatePresence: any;
  export const useScroll: any;
  export const useTransform: any;
  export type PanInfo = any;
}

declare module "canvas-confetti" {
  const confetti: any;
  export default confetti;
}

declare module "@supabase/supabase-js" {
  export interface User {
    id: string;
    [key: string]: any;
  }

  export interface Session {
    access_token?: string;
    user?: User | null;
    [key: string]: any;
  }

  export interface SupabaseAuthClient {
    getSession(): Promise<{ data: { session: Session | null }; error?: any }>;
    onAuthStateChange(
      callback: (event: string, session: Session | null) => void,
    ): { data: { subscription: { unsubscribe: () => void } } };
    signOut(): Promise<any>;
    signInWithPassword(credentials: any): Promise<any>;
    signUp(credentials: any): Promise<any>;
  }
}
