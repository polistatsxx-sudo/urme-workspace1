import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check current session
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
      }
    } catch (err) {
      setAuthError({ type: 'auth_required', message: 'Auth required' });
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadProfile = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    setUser({
      id: userId,
      email: authUser?.email,
      full_name: profile?.full_name || '',
      ...profile,
    });
    setIsAuthenticated(true);
  };

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      login,
      register,
      logout,
      navigateToLogin,
      refreshProfile: () => user?.id && loadProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);