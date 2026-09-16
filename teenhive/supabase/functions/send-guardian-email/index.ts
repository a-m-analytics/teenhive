import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

// Base URL where Edge Functions are deployed
const FUNCTION_BASE_URL = `${SUPABASE_URL}/functions/v1`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
  }

  try {
    const { teen_id, teen_name, teen_age, guardian_name, guardian_email } = await req.json();

    if (!teen_id || !guardian_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const approveUrl = `${FUNCTION_BASE_URL}/approve-teen?token=${teen_id}`;
    const blockUrl = `${FUNCTION_BASE_URL}/block-teen?token=${teen_id}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teen Hive – Guardian Approval Required</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3fbf4; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #051b0e; padding: 32px 40px; text-align: center; }
    .header h1 { color: #22c55e; font-size: 24px; margin: 0 0 4px; }
    .header p { color: #737972; font-size: 14px; margin: 0; }
    .body { padding: 40px; }
    .body h2 { color: #051b0e; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px; }
    .info-box { background: #f3fbf4; border: 1px solid #d1fae5; border-radius: 12px; padding: 20px; margin: 24px 0; }
    .info-box p { margin: 4px 0; font-size: 15px; color: #051b0e; }
    .info-box strong { color: #22c55e; }
    .btn { display: block; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; text-decoration: none; margin: 12px 0; }
    .btn-approve { background: #22c55e; color: white; }
    .btn-block { background: #fee2e2; color: #991b1b; }
    .footer { padding: 24px 40px; border-top: 1px solid #f0f0f0; text-align: center; }
    .footer p { color: #9ca3af; font-size: 13px; margin: 0; }
    .warning { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 14px; color: #92400e; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Teen Hive</h1>
      <p>Neighbourhood Jobs for Teens</p>
    </div>
    <div class="body">
      <h2>Hi ${guardian_name ?? 'there'},</h2>
      <p>
        <strong>${teen_name}</strong> (age ${teen_age}) has signed up for Teen Hive, a platform that connects teens with parents in their neighbourhood for local jobs like babysitting, lawn care, and more.
      </p>
      <p>
        As their parent or guardian, your approval is required before they can access the platform. Please review the details below and choose an action.
      </p>

      <div class="info-box">
        <p><strong>Teen:</strong> ${teen_name}, age ${teen_age}</p>
        <p><strong>Platform:</strong> Teen Hive – hyperlocal job marketplace</p>
        <p><strong>Your role:</strong> Parent / Guardian approval</p>
      </div>

      <div class="warning">
        ⚠️ <strong>Only click Approve if you are ${teen_name}'s parent or guardian</strong> and you consent to them using this platform. Teen Hive is designed for teens 13 and older to find neighbourhood jobs with families nearby.
      </div>

      <a href="${approveUrl}" class="btn btn-approve">✓ Yes, I approve – activate their account</a>
      <a href="${blockUrl}" class="btn btn-block">✗ No, do not activate this account</a>

      <p style="font-size:14px;color:#6b7280;margin-top:24px;">
        If you did not expect this email or believe it was sent in error, click the block button above or contact us at <a href="mailto:contactteenhive@gmail.com">contactteenhive@gmail.com</a>.
      </p>
    </div>
    <div class="footer">
      <p>Teen Hive · contactteenhive@gmail.com</p>
      <p style="margin-top:6px;">This email was sent because someone used your email address as a guardian contact during signup.</p>
    </div>
  </div>
</body>
</html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Teen Hive <noreply@teenhive.app>',
        to: [guardian_email],
        bcc: ['contactteenhive@gmail.com'],
        subject: `Action Required: ${teen_name} needs your approval to join Teen Hive`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send email', detail: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
