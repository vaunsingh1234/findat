import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { UserProfile } from '../types/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshProfile: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string) => {
    try {
      const p = await profileService.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // Initial session check
    authService.getSession().then((session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        fetchProfile(currentUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser?.id) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };

