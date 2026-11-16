import React, { useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/authStore.js';
import { authService } from '../../features/auth/services/authService.js';
import { Loader2 } from 'lucide-react';

export const AuthProvider = ({ children }) => {
  const { isLoading, setAuth, setLoading, logout } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Attempt refreshing access token via HttpOnly cookie
        const refreshData = await authService.refreshToken();
        if (refreshData?.accessToken && mounted) {
          useAuthStore.getState().setAccessToken(refreshData.accessToken);
          // Fetch user profile with new access token
          const profileData = await authService.getProfile();
          if (profileData?.user && mounted) {
            setAuth({
              user: profileData.user,
              accessToken: refreshData.accessToken,
            });
            return;
          }
        }
      } catch (err) {
        // Not authenticated
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0E14] flex flex-col items-center justify-center gap-4 text-[#F8FAFC]">
        <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shadow-glow-primary">
          <Loader2 className="w-7 h-7 text-[#A78BFA] animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#94A3B8] tracking-wide animate-pulse">Initializing Chat Karo...</p>
      </div>
    );
  }

  return children;
};

export default AuthProvider;
