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
  const response = await fetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code: token }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Invalid or expired OTP');
  return data;
};

export const signInWithPassword = async (email: string, password: string): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
};

export const createAccount = async (params: {
  email: string;
  password: string;
  name: string;
  username: string;
}): Promise<void> => {
  const response = await fetch('/api/auth/create-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create account');
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};
