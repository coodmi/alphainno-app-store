import { supabase } from './supabase';

// Send OTP to email
export const sendOTP = async (email: string): Promise<void> => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to send OTP');
  }
};

// Verify OTP and establish Supabase session
export const verifyOTP = async (email: string, token: string): Promise<any> => {
  // 1. Verify the OTP code via our API (checks DB, creates/finds user, returns magic link)
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: token }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Invalid or expired OTP');
  }

  // 2. Use the magic link token to establish a real Supabase session
  if (data.redirectUrl) {
    const url = new URL(data.redirectUrl);
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');

    if (tokenHash && type) {
      const { data: sessionData, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any,
      });

      if (error) throw new Error(error.message);
      return sessionData;
    }
  }

  return data;
};

// Sign out
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

// Get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user || null);
  });
};
