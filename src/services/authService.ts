import { createClient, type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://findat-demo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'findat-anon-demo-key-12345';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const USERS_STORAGE_KEY = 'findat_registered_users';
const SESSION_STORAGE_KEY = 'findat_auth_session';

const isDemoSupabase = !supabaseUrl || supabaseUrl.includes('findat-demo') || !supabaseAnonKey || supabaseAnonKey.includes('demo');

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  riskTolerance?: 'Conservative' | 'Moderate' | 'Aggressive';
  experienceLevel?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;
const subscribers = new Set<AuthCallback>();

const notifySubscribers = (event: AuthChangeEvent, session: Session | null) => {
  subscribers.forEach((cb) => {
    try {
      cb(event, session);
    } catch (e) {
      console.warn('Auth callback error:', e);
    }
  });
};

interface StoredUserCredential {
  user: User;
  password: string;
}

const getStoredUsers = (): StoredUserCredential[] => {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredUsers = (users: StoredUserCredential[]) => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn('Failed saving users to localStorage:', e);
  }
};

export const authService = {
  // Register a new user
  async register({
    email,
    password,
    fullName,
    riskTolerance = 'Moderate',
    experienceLevel = 'Intermediate',
  }: SignUpData): Promise<{ user: User | null; session: Session | null }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // Attempt Supabase if real credentials provided
    if (!isDemoSupabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'investor',
              risk_tolerance: riskTolerance,
              experience_level: experienceLevel,
            },
          },
        });
        if (!error && data?.user) {
          if (data.session) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
            notifySubscribers('SIGNED_IN', data.session);
          }
          return { user: data.user, session: data.session };
        }
        if (error) {
          console.warn('Supabase register error, using resilient local storage:', error.message);
        }
      } catch (err) {
        console.warn('Supabase register unreachable, fallback to local registration:', err);
      }
    }

    // Local user registration fallback
    const users = getStoredUsers();
    const existing = users.find((u) => u.user.email?.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userDisplayName = fullName?.trim() || cleanEmail.split('@')[0];

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      user_metadata: {
        full_name: userDisplayName,
        role: 'investor',
        risk_tolerance: riskTolerance,
        experience_level: experienceLevel,
      },
      app_metadata: { provider: 'email' },
      created_at: new Date().toISOString(),
      aud: 'authenticated',
    };

    users.push({ user: newUser, password });
    saveStoredUsers(users);

    // Save profile record
    const profile = {
      id: userId,
      email: cleanEmail,
      full_name: userDisplayName,
      role: 'investor',
      risk_tolerance: riskTolerance,
      experience_level: experienceLevel,
      created_at: newUser.created_at,
      updated_at: newUser.created_at,
    };
    localStorage.setItem(`findat_profile_${userId}`, JSON.stringify(profile));

    // Create session
    const session: Session = {
      access_token: `findat_token_${userId}_${Date.now()}`,
      refresh_token: `findat_refresh_${userId}_${Date.now()}`,
      expires_in: 604800, // 7 days
      token_type: 'bearer',
      user: newUser,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    notifySubscribers('SIGNED_IN', session);

    return { user: newUser, session };
  },

  // Log in existing user
  async login({ email, password }: SignInData): Promise<{ user: User | null; session: Session | null }> {
    const cleanEmail = email.trim().toLowerCase();

    // Quick Demo Account shortcut
    if (cleanEmail === 'demo@findat.io' || cleanEmail === 'demo') {
      const demoUser: User = {
        id: 'usr_demo_investor',
        email: 'demo@findat.io',
        user_metadata: {
          full_name: 'Lead Quantitative Analyst',
          role: 'investor',
          risk_tolerance: 'Moderate',
          experience_level: 'Advanced',
        },
        app_metadata: { provider: 'email' },
        created_at: '2026-01-01T00:00:00Z',
        aud: 'authenticated',
      };

      const demoSession: Session = {
        access_token: 'demo_token_valid',
        refresh_token: 'demo_refresh_valid',
        expires_in: 604800,
        token_type: 'bearer',
        user: demoUser,
      };

      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(demoSession));
      notifySubscribers('SIGNED_IN', demoSession);
      return { user: demoUser, session: demoSession };
    }

    if (!isDemoSupabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data?.session) {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
          notifySubscribers('SIGNED_IN', data.session);
          return { user: data.user, session: data.session };
        }
        if (error) {
          console.warn('Supabase signInWithPassword returned error, checking local store:', error.message);
        }
      } catch (err) {
        console.warn('Supabase unreachable, checking local store:', err);
      }
    }

    // Local user verification
    const users = getStoredUsers();
    const match = users.find((u) => u.user.email?.toLowerCase() === cleanEmail);

    if (!match) {
      throw new Error('No account found with this email. Please create an account.');
    }

    if (match.password !== password) {
      throw new Error('Incorrect password. Please verify your credentials and try again.');
    }

    const session: Session = {
      access_token: `findat_token_${match.user.id}_${Date.now()}`,
      refresh_token: `findat_refresh_${match.user.id}_${Date.now()}`,
      expires_in: 604800,
      token_type: 'bearer',
      user: match.user,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    notifySubscribers('SIGNED_IN', session);

    return { user: match.user, session };
  },

  // Log out
  async logout() {
    try {
      if (!isDemoSupabase) {
        await supabase.auth.signOut();
      }
    } catch {}

    localStorage.removeItem(SESSION_STORAGE_KEY);
    notifySubscribers('SIGNED_OUT', null);
  },

  // Request password reset email
  async resetPassword(email: string) {
    const cleanEmail = email.trim().toLowerCase();
    if (!isDemoSupabase) {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (!error) return data;
      } catch {}
    }
    return { success: true };
  },

  // Update password
  async updatePassword(newPassword: string) {
    if (!isDemoSupabase) {
      try {
        const { data, error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (!error) return data;
      } catch {}
    }
    return { success: true };
  },

  // Get current user
  async getUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  },

  // Get current session
  async getSession(): Promise<Session | null> {
    if (!isDemoSupabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session) return session;
      } catch {}
    }

    try {
      const local = localStorage.getItem(SESSION_STORAGE_KEY);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed?.user?.id) return parsed;
      }
    } catch {}

    return null;
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    subscribers.add(callback);

    // Also register Supabase listener if not demo
    let supabaseSub: { unsubscribe: () => void } | null = null;
    if (!isDemoSupabase) {
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
        supabaseSub = subscription;
      } catch {}
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            subscribers.delete(callback);
            if (supabaseSub) supabaseSub.unsubscribe();
          },
        },
      },
    };
  },
};
