import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, email, developer_name, website, about, country, phone } = await request.json();

    if (!user_id || !email || !developer_name || !about || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if already applied
    const { data: existing } = await supabase
      .from('developer_requests')
      .select('id, status')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a developer request', status: existing.status },
        { status: 409 }
      );
    }

    const { error } = await supabase.from('developer_requests').insert({
      user_id,
      email,
      developer_name,
      website,
      about,
      country,
      phone,
      status: 'pending',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
