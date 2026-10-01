import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: 'investor' | 'admin';
  risk_tolerance?: 'Conservative' | 'Moderate' | 'Aggressive';
  experience_level?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
}
