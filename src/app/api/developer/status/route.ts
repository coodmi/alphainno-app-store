import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) return NextResponse.json({ status: null });

    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('developer_requests')
      .select('status, developer_name, created_at')
      .eq('user_id', user_id)
      .single();

    return NextResponse.json({ status: data?.status ?? null, data });
  } catch {
    return NextResponse.json({ status: null });
  }
}
