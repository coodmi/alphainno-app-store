import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find and validate OTP
    const { data: otpData, error: fetchError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .single();

    if (fetchError || !otpData) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 400 });
    }

    if (new Date() > new Date(otpData.expires_at)) {
      return NextResponse.json({ error: 'OTP code has expired' }, { status: 400 });
    }

    // 2. Mark OTP as used
    await supabaseAdmin.from('otp_codes').update({ verified: true }).eq('id', otpData.id);

    // 3. Find or create user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    let user = users.find((u: any) => u.email === email);

    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }
      user = newUser.user;
    }

    // 4. Generate a magic link — client will use token_hash to establish session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      return NextResponse.json({ error: linkError?.message || 'Failed to generate session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token_hash: linkData.properties.hashed_token,
      user,
    });
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: error.message || 'Invalid or expired OTP' }, { status: 500 });
  }
}
