import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMfaVerified, setIsMfaVerified] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
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

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const needsAal2 = profile?.mfa_enabled === true;
    const aal2Satisfied = assurance?.currentLevel === 'aal2';
    setIsMfaVerified(!needsAal2 || aal2Satisfied);

    setIsAuthenticated(true);
  }, []);

  // Re-reads the profile row for the signed-in user. Kept identity-stable and
  // independent of the user state so callers can refresh straight after a write
  // (profile saves go to the database directly, not through this context).
  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await loadProfile(session.user.id);
  }, [loadProfile]);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setIsAuthenticated(false);
        setIsMfaVerified(true);
      }
    } catch {
      setAuthError({ type: 'auth_required', message: 'Auth required' });
    } finally {
      setIsLoadingAuth(false);
    }
  }, [loadProfile]);

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
          setIsMfaVerified(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [checkUser, loadProfile]);

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
    setIsMfaVerified(true);
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isMfaVerified,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      login,
      register,
      logout,
      navigateToLogin,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
