import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase/client';
import type { GymSettings } from '../types/database';
interface GymContextType {
  gym: GymSettings | null;
  isConfigured: boolean;
  isLoading: boolean;
  refreshGym: () => Promise<void>;
}
const GymContext = createContext<GymContextType | null>(null);
export function GymProvider({
  children
}: {
  children: ReactNode;
}) {
  const [gym, setGym] = useState<GymSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // locale sync removed
  const fetchGym = useCallback(async () => {
    console.log('[GymContext] fetchGym started');
    try {
      const {
        data
      } = await supabase.from('gym_settings').select('*').limit(1).single();
      console.log('[GymContext] fetchGym resolved', data?.id);
      setGym(data as GymSettings ?? null);
    } catch (error) {
      console.error('[GymContext] fetchGym error', error);
      setGym(null);
    } finally {
      console.log('[GymContext] Setting gymLoading to false');
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGym();
  }, [fetchGym]);
  const refreshGym = async () => {
    setIsLoading(true);
    await fetchGym();
  };
  return <GymContext.Provider value={{
    gym,
    isConfigured: gym?.is_configured ?? false,
    isLoading,
    refreshGym
  }}>
      {children}
    </GymContext.Provider>;
}
export function useGym(): GymContextType {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
}