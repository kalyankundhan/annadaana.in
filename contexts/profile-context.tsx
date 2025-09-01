"use client"

import { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/components/auth-provider';

type ProfileData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type ProfileContextType = {
  profile: ProfileData | null;
  isLoading: boolean;
  error: any;
  mutate: () => Promise<any>;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, getIdToken } = useAuth();
  
  const fetcher = useCallback(async (url: string) => {
    const token = await getIdToken();
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch profile');
    }
    return res.json();
  }, [getIdToken]);

  const { data, error, mutate, isLoading } = useSWR<{ data: ProfileData }>(
    // Only fetch when user is authenticated and not loading
    user && !authLoading ? '/api/profile' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: true,
      errorRetryCount: 2,
      errorRetryInterval: 1000,
    }
  );

  return (
    <ProfileContext.Provider
      value={{
        profile: data?.data || null,
        isLoading,
        error,
        mutate,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
