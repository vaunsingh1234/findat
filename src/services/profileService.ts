import { supabase } from './authService';
import type { UserProfile } from '../types/auth';

export const profileService = {
  // Get user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    const localKey = `findat_profile_${userId}`;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        localStorage.setItem(localKey, JSON.stringify(data));
        return data;
      }
    } catch {
      // Fallback to local
    }

    try {
      const cached = localStorage.getItem(localKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }

    return null;
  },

  // Update profile
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const localKey = `findat_profile_${userId}`;
    let updatedData: UserProfile = {
      id: userId,
      email: '',
      full_name: updates.full_name || '',
      role: updates.role || 'investor',
      risk_tolerance: updates.risk_tolerance || 'Moderate',
      experience_level: updates.experience_level || 'Intermediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates,
    };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) {
        updatedData = data;
      }
    } catch (e) {
      console.warn('Supabase profile update warning:', e);
    }

    localStorage.setItem(localKey, JSON.stringify(updatedData));
    return updatedData;
  },

  // Check if user has admin role
  async isAdmin(userId: string): Promise<boolean> {
    const profile = await this.getProfile(userId);
    return profile?.role === 'admin';
  },

  // Admin: Get all profiles
  async getAllProfiles(): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // fallback
    }

    // Merge registered local users if any
    const baseProfiles: UserProfile[] = [
      {
        id: 'usr-admin-1',
        email: 'admin@findat.internal',
        full_name: 'Lead Quantitative Analyst',
        role: 'admin',
        risk_tolerance: 'Moderate',
        experience_level: 'Advanced',
        created_at: '2026-08-15T10:00:00Z',
        updated_at: '2026-09-30T10:00:00Z',
      },
      {
        id: 'usr-investor-2',
        email: 'investor.mumbai@findat.io',
        full_name: 'Rajeev Singh',
        role: 'investor',
        risk_tolerance: 'Moderate',
        experience_level: 'Intermediate',
        created_at: '2026-09-01T12:30:00Z',
        updated_at: '2026-10-01T01:00:00Z',
      },
    ];

    try {
      const storedUsers = localStorage.getItem('findat_registered_users');
      if (storedUsers) {
        const parsed = JSON.parse(storedUsers);
        const registeredList: UserProfile[] = parsed.map((item: any) => ({
          id: item.user.id,
          email: item.user.email,
          full_name: item.user.user_metadata?.full_name || 'Investor',
          role: item.user.user_metadata?.role || 'investor',
          risk_tolerance: item.user.user_metadata?.risk_tolerance || 'Moderate',
          experience_level: item.user.user_metadata?.experience_level || 'Intermediate',
          created_at: item.user.created_at,
          updated_at: item.user.created_at,
        }));
        return [...registeredList, ...baseProfiles];
      }
    } catch {}

    return baseProfiles;
  },
};
