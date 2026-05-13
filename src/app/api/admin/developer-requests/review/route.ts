import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { request_id, action, admin_email } = await request.json();

    if (!request_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get the request details
    const { data: devRequest, error: fetchError } = await supabase
      .from('developer_requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !devRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Update status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const { error: updateError } = await supabase
      .from('developer_requests')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin_email ?? null,
      })
      .eq('id', request_id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    // Send email notification
    if (action === 'approve') {
      await transporter.sendMail({
        from: `"Alphainno App Store" <${process.env.GMAIL_USER}>`,
        to: devRequest.email,
        subject: 'Your Developer Account Has Been Approved!',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="width: 64px; height: 64px; background: #dcfce7; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                    <span style="font-size: 32px;">✅</span>
                  </div>
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">Developer Account Approved!</h1>
                </div>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${devRequest.developer_name}</strong>,</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Great news! Your developer account application has been <strong style="color: #16a34a;">approved</strong>.
                  You can now access the Developer Portal and start uploading your apps to the Alphainno App Store.
                </p>
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0;">
                  <h3 style="margin: 0 0 12px 0; color: #15803d; font-size: 16px;">What you can do now:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px; line-height: 2;">
                    <li>Upload and publish your apps</li>
                    <li>Access developer analytics</li>
                    <li>Manage your app listings</li>
                    <li>Track downloads and revenue</li>
                  </ul>
                </div>
                <div style="text-align: center; margin-top: 32px;">
                  <a href="https://apps.alphainno.com/user-dashboard/developer"
                     style="background: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                    Go to Developer Portal
                  </a>
                </div>
                <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px;">
                  Alphainno App Store · apps.alphainno.com
                </p>
              </div>
            </body>
          </html>
        `,
      });
    } else {
      await transporter.sendMail({
        from: `"Alphainno App Store" <${process.env.GMAIL_USER}>`,
        to: devRequest.email,
        subject: 'Developer Account Application Update',
        html: `
          <!DOCTYPE html>
          <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e5e7eb;">
                <h1 style="font-size: 24px; font-weight: 700; color: #111827;">Developer Application Update</h1>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${devRequest.developer_name}</strong>,</p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Thank you for your interest in becoming a developer on the Alphainno App Store.
                  Unfortunately, your application was not approved at this time.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  You are welcome to reapply in the future. If you have questions, please contact our support team.
                </p>
                <p style="color: #9ca3af; font-size: 14px; text-align: center; margin-top: 32px;">
                  Alphainno App Store · apps.alphainno.com
                </p>
              </div>
            </body>
          </html>
        `,
      });
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (err: unknown) {
    console.error('Review error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
