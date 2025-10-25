import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../services/supabase';
import { Child, AuthState, ProfileSelectionState } from '../types';
import { Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthContextType extends AuthState, ProfileSelectionState {
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  createChild: (childData: { name: string; age: number; world_theme: string }) => Promise<{ error: string | null }>;
  switchChild: (childId: string) => void;
  refreshChildren: () => Promise<void>;
  
  // Profile selection methods
  selectProfile: (profile: 'parent' | Child) => void;
  selectProfileWithPin: (pin: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  verifyPassword: (password: string) => Promise<boolean>;
  setParentPin: (pin: string) => Promise<boolean>;
  checkPinTimeout: () => boolean;
  clearPinVerification: () => void;
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

  const [profileSelection, setProfileSelection] = useState<ProfileSelectionState>({
    selectedProfile: null,
    isPinVerified: false,
    pinVerifiedAt: null,
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
          // Clear profile selection on sign out
          setProfileSelection({
            selectedProfile: null,
            isPinVerified: false,
            pinVerifiedAt: null,
          });
        }
      }
    );

    // Listen for app state changes to clear PIN verification
    const handleAppStateChange = (nextAppState: string) => {
      console.log('🔐 AuthContext: App state changed to:', nextAppState);
      // Only clear PIN verification when app goes to background, not inactive
      if (nextAppState === 'background') {
        console.log('🔐 AuthContext: App went to background, clearing PIN verification');
        clearPinVerification();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.unsubscribe();
      appStateSubscription?.remove();
    };
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

  // Profile selection methods
  const selectProfileWithPin = async (pin: string): Promise<boolean> => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      setProfileSelection(prev => ({
        ...prev,
        selectedProfile: 'parent',
        isPinVerified: true,
        pinVerifiedAt: new Date(),
      }));
    }
    return isValid;
  };

  const selectProfile = (profile: 'parent' | Child) => {
    console.log('🔐 AuthContext: Selecting profile:', profile);
    console.log('🔐 AuthContext: Current profileSelection state:', profileSelection);
    
    setProfileSelection(prev => {
      const newState = {
        ...prev,
        selectedProfile: profile,
        // For children, clear PIN verification for security
        // For parents, preserve PIN verification state (will be handled by ProfileSwitcher)
        isPinVerified: profile !== 'parent' ? false : prev.isPinVerified,
        pinVerifiedAt: profile !== 'parent' ? null : prev.pinVerifiedAt,
      };
      console.log('🔐 AuthContext: New profileSelection state:', newState);
      return newState;
    });
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!authState.user?.parent_pin) {
      return false;
    }

    try {
      // Simple comparison - in production, you'd want to hash the PIN
      const isValid = authState.user.parent_pin === pin;
      
      if (isValid) {
        const now = new Date();
        setProfileSelection(prev => ({
          ...prev,
          isPinVerified: true,
          pinVerifiedAt: now,
        }));

        // Update database with verification timestamp
        await supabase
          .from('profiles')
          .update({ pin_last_verified: now.toISOString() })
          .eq('id', authState.user!.id);
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!authState.user?.email) {
      return false;
    }

    try {
      // Create a temporary client to verify password without affecting current session
      const { createClient } = await import('@supabase/supabase-js');
      const tempSupabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Attempt to sign in with the provided password
      const { error } = await tempSupabase.auth.signInWithPassword({
        email: authState.user.email,
        password: password,
      });

      if (error) {
        console.error('Password verification failed:', error);
        return false;
      }

      // Password is correct, set PIN verification state
      const now = new Date();
      console.log('🔐 AuthContext: Password verified, setting PIN verification state');
      setProfileSelection(prev => {
        const newState = {
          ...prev,
          isPinVerified: true,
          pinVerifiedAt: now,
        };
        console.log('🔐 AuthContext: Updated profileSelection with PIN verification:', newState);
        return newState;
      });

      // Update database with verification timestamp
      await supabase
        .from('profiles')
        .update({ pin_last_verified: now.toISOString() })
        .eq('id', authState.user!.id);

      // Sign out the temporary client to avoid session conflicts
      await tempSupabase.auth.signOut();

      return true;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const setParentPin = async (pin: string): Promise<boolean> => {
    if (!authState.user || authState.user.role !== 'parent') {
      return false;
    }

    try {
      // In production, you'd want to hash the PIN before storing
      const { error } = await supabase
        .from('profiles')
        .update({ 
          parent_pin: pin,
          pin_last_verified: new Date().toISOString()
        })
        .eq('id', authState.user.id);

      if (error) {
        console.error('Error setting PIN:', error);
        return false;
      }

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, parent_pin: pin } : null,
      }));

      return true;
    } catch (error) {
      console.error('Error setting PIN:', error);
      return false;
    }
  };

  const checkPinTimeout = (): boolean => {
    console.log('🔐 AuthContext: Checking PIN timeout...');
    console.log('🔐 AuthContext: pinVerifiedAt:', profileSelection.pinVerifiedAt);
    
    if (!profileSelection.pinVerifiedAt) {
      console.log('🔐 AuthContext: No pinVerifiedAt timestamp, returning false');
      return false;
    }

    const now = new Date();
    const verifiedAt = new Date(profileSelection.pinVerifiedAt);
    const diffInMinutes = (now.getTime() - verifiedAt.getTime()) / (1000 * 60);

    console.log('🔐 AuthContext: PIN timeout check - diffInMinutes:', diffInMinutes, 'isValid:', diffInMinutes < 15);
    return diffInMinutes < 15; // 15 minute timeout
  };

  const clearPinVerification = () => {
    console.log('🔐 AuthContext: Clearing PIN verification');
    setProfileSelection(prev => ({
      ...prev,
      isPinVerified: false,
      pinVerifiedAt: null,
    }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    ...profileSelection,
    signUp,
    signIn,
    signOut,
    createChild,
    switchChild,
    refreshChildren,
    selectProfile,
    selectProfileWithPin,
    verifyPin,
    verifyPassword,
    setParentPin,
    checkPinTimeout,
    clearPinVerification,
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
