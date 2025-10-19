import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '../types/supabase';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for development when environment variables are missing
const createMockClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    }),
  };
};

export const supabase = (!supabaseUrl || !supabaseAnonKey) 
  ? (() => {
      console.log('🔧 Using mock Supabase client - environment variables missing');
      console.log('Supabase URL:', supabaseUrl);
      console.log('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing');
      return createMockClient() as any;
    })()
  : (() => {
      console.log('✅ Using real Supabase client');
      console.log('Supabase URL:', supabaseUrl);
      return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: require('expo-secure-store').SecureStore,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    })();