import { supabase } from './supabase';

export const sendOTP = async (email: string): Promise<void> => {
  const response = await fetch('/api/auth/send-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
};

export const verifyOTP = async (email: string, token: string): Promise<any> => {
  // 1. Verify OTP via API — returns hashed_token for session creation
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: token }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Invalid or expired OTP');

  // 2. Use the hashed token to establish a real browser session
  const { error } = await supabase.auth.verifyOtp({
    token_hash: data.token_hash,
    type: 'magiclink',
  });

  if (error) throw new Error(error.message);

  return data;
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
