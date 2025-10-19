import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { Child, AuthState } from '../types';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createChild: (childData: { name: string; age: number; world_theme: string }) => Promise<{ error: string | null }>;
  switchChild: (childId: string) => void;
  refreshChildren: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    children: [],
    currentChild: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    console.log('🔐 AuthContext: Initializing auth state...');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      console.log('🔐 AuthContext: Initial session check:', { hasSession: !!session, userId: session?.user?.id });
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('🔐 AuthContext: Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
        if (session) {
          await loadUserProfile(session.user.id);
        } else {
          setAuthState({
            user: null,
            children: [],
            currentChild: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔐 AuthContext: Loading profile for user:', userId);
      
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('🔐 AuthContext: Profile loaded:', { profile, profileError });

      if (profileError) {
        console.error('Error loading profile:', profileError);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Load children if user is a parent
      let children: Child[] = [];
      if (profile.role === 'parent') {
        const { data: childrenData, error: childrenError } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', userId)
          .order('created_at', { ascending: true });

        if (!childrenError && childrenData) {
          children = childrenData;
        }
      }

      setAuthState({
        user: profile,
        children,
        currentChild: children.length > 0 ? children[0] : null,
        isLoading: false,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        console.log('🔐 AuthContext: User created successfully!');
        console.log('🔐 AuthContext: Profile will be auto-created by database trigger');
        
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to load the user profile (created by database trigger)
        const profileResult = await loadUserProfile(data.user.id);
        
        // If profile loading failed, try to create it manually
        if (!profileResult) {
          console.log('🔐 AuthContext: Profile not found, creating manually...');
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email,
              name,
              role: 'parent',
            });

          if (profileError) {
            console.error('🔐 AuthContext: Manual profile creation failed:', profileError);
            return { error: 'Failed to create user profile. Please try again.' };
          }

          console.log('🔐 AuthContext: Manual profile created, loading...');
          await loadUserProfile(data.user.id);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('🔐 AuthContext: Signup error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        console.log('🔐 AuthContext: Sign in successful, loading user profile...');
        // Manually trigger profile loading
        await loadUserProfile(data.user.id);
      }

      return { error: null };
    } catch (error) {
      console.error('🔐 AuthContext: Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const createChild = async (childData: { name: string; age: number; world_theme: string }) => {
    if (!authState.user || authState.user.role !== 'parent') {
      return { error: 'Only parents can create child profiles' };
    }

    try {
      const ageBracket = childData.age <= 6 ? '4-6' : childData.age <= 8 ? '7-8' : '9-10';

      const { error } = await supabase
        .from('children')
        .insert({
          name: childData.name,
          age: childData.age,
          age_bracket: ageBracket,
          world_theme: childData.world_theme,
          parent_id: authState.user.id,
          current_streak: 0,
          total_points: 0,
        })
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Refresh children list
      await refreshChildren();

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const switchChild = (childId: string) => {
    const child = authState.children.find(c => c.id === childId);
    if (child) {
      setAuthState(prev => ({ ...prev, currentChild: child }));
    }
  };

  const refreshChildren = async () => {
    if (!authState.user || authState.user.role !== 'parent') {
      return;
    }

    try {
      const { data: childrenData, error } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', authState.user.id)
        .order('created_at', { ascending: true });

      if (!error && childrenData) {
        setAuthState(prev => ({
          ...prev,
          children: childrenData,
          currentChild: childrenData.length > 0 ? childrenData[0] : null,
        }));
      }
    } catch (error) {
      console.error('Error refreshing children:', error);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    signUp,
    signIn,
    signOut,
    createChild,
    switchChild,
    refreshChildren,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
