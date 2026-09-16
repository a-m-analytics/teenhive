import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const url = new URL(req.url);
  const teenId = url.searchParams.get('token');

  if (!teenId) {
    return htmlResponse('Invalid Link', 'This approval link is invalid or has already been used.', false);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Check current status first
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('account_status, parent_consent, full_name, guardian_name')
      .eq('id', teenId)
      .single();

    if (fetchErr || !profile) {
      return htmlResponse('Not Found', 'We couldn\'t find this account. It may have already been removed.', false);
    }

    if (profile.account_status === 'active' && profile.parent_consent === true) {
      return htmlResponse(
        'Already Approved',
        `${profile.full_name ?? 'This teen'}'s account is already active. No further action needed.`,
        true,
      );
    }

    if (profile.account_status === 'suspended') {
      return htmlResponse(
        'Account Blocked',
        'This account has already been blocked and cannot be approved.',
        false,
      );
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        parent_consent: true,
        parent_consent_at: new Date().toISOString(),
        account_status: 'active',
      })
      .eq('id', teenId);

    if (error) {
      console.error('Update error:', error);
      return htmlResponse('Error', 'Something went wrong. Please try again or contact contactteenhive@gmail.com.', false);
    }

    // Send push notification to teen if they have an expo_push_token
    const { data: tokenRow } = await supabase
      .from('profiles')
      .select('expo_push_token, full_name')
      .eq('id', teenId)
      .single();

    if (tokenRow?.expo_push_token) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: tokenRow.expo_push_token,
          title: '🎉 You\'re approved!',
          body: 'Your parent or guardian has approved your Teen Hive account. You\'re ready to start finding jobs!',
          data: { type: 'account_approved' },
        }),
      }).catch(() => {});
    }

    const teenName = profile.full_name ?? 'The teen';
    const guardianName = profile.guardian_name ?? 'Guardian';

    return htmlResponse(
      'Account Approved!',
      `Thank you, ${guardianName}! ${teenName}'s Teen Hive account is now active. They will be notified and can start browsing neighbourhood jobs.`,
      true,
    );
  } catch (e) {
    console.error(e);
    return htmlResponse('Error', 'An unexpected error occurred. Please contact contactteenhive@gmail.com.', false);
  }
});

function htmlResponse(title: string, message: string, success: boolean): Response {
  const icon = success ? '✅' : '❌';
  const color = success ? '#22c55e' : '#ef4444';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teen Hive – ${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3fbf4; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; box-sizing: border-box; }
    .card { background: white; border-radius: 20px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .icon { font-size: 56px; margin-bottom: 24px; }
    h1 { color: #051b0e; font-size: 24px; margin: 0 0 16px; }
    p { color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px; }
    .badge { display: inline-block; background: ${color}20; color: ${color}; border: 1px solid ${color}40; border-radius: 9999px; padding: 6px 18px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .footer { color: #9ca3af; font-size: 13px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <span class="badge">Teen Hive</span>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="footer">Questions? Email <a href="mailto:contactteenhive@gmail.com" style="color:#22c55e;">contactteenhive@gmail.com</a></div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
