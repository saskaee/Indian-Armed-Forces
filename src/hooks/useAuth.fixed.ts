import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import * as React from 'react';

type AuthError = Error | null;
type AuthData = any;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: AuthData; error: AuthError }>;
  signUp: (email: string, password: string, username: string) => Promise<{ data: AuthData; error: AuthError }>;
  signOut: () => Promise<{ error: AuthError }>;
  resetPassword: (email: string) => Promise<{ data: AuthData; error: AuthError }>;
  updateUser: (attributes: { username?: string; email?: string }) => Promise<{ data: AuthData; error: AuthError }>;
  getProfile: () => Promise<{ data: AuthData; error: AuthError }>;
  isAuthenticated: boolean;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => ({ data: null, error: new Error('Not implemented') }),
  signUp: async () => ({ data: null, error: new Error('Not implemented') }),
  signOut: async () => ({ error: new Error('Not implemented') }),
  resetPassword: async () => ({ data: null, error: new Error('Not implemented') }),
  updateUser: async () => ({ data: null, error: new Error('Not implemented') }),
  getProfile: async () => ({ data: null, error: new Error('Not implemented') }),
});

interface AuthProviderProps {
  children: React.ReactNode;
}

// Provider component to wrap your app with
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      // Try to get the session from Supabase client
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      // Try backend API first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // Fall back to Supabase client
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error during sign in:', error);
      // Final fallback to Supabase client
      const result = await supabase.auth.signInWithPassword({ email, password });
      return result;
    }
  };

  // Sign up with email, password, and username
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Try backend API first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        // Fall back to Supabase client
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        return { data, error };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error during sign up:', error);
      // Final fallback to Supabase client
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });
      return result;
    }
  };

  // Sign out from both backend and Supabase
  const signOut = async () => {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error occurred') };
    }
  };

  // Reset password via email
  const resetPassword = async (email: string) => {
    try {
      // Try backend API first
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        // Fall back to Supabase client
        return supabase.auth.resetPasswordForEmail(email);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error during password reset:', error);
      // Final fallback to Supabase client
      return supabase.auth.resetPasswordForEmail(email);
    }
  };

  // Update user profile
  const updateUser = async (attributes: { username?: string; email?: string }) => {
    if (!user) return { data: null, error: new Error('No user logged in') };

    try {
      const { data, error } = await supabase.auth.updateUser({
        email: attributes.email,
        data: { username: attributes.username }
      });

      return { data, error };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  };

  // Get user profile from backend API
  const getProfile = async () => {
    if (!user || !session) return { data: null, error: new Error('No user logged in') };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUser,
    getProfile,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  return context;
}
