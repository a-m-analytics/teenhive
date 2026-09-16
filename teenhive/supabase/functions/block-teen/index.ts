import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const url = new URL(req.url);
  const teenId = url.searchParams.get('token');

  if (!teenId) {
    return htmlResponse('Invalid Link', 'This link is invalid or has already been used.', false);
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('account_status, full_name, guardian_name')
      .eq('id', teenId)
      .single();

    if (fetchErr || !profile) {
      return htmlResponse('Not Found', 'We couldn\'t find this account. It may have already been removed.', false);
    }

    if (profile.account_status === 'suspended') {
      return htmlResponse(
        'Already Blocked',
        `${profile.full_name ?? 'This account'} has already been blocked. No further action needed.`,
        true,
      );
    }

    // Suspend account (soft delete — preserves data for audit trail)
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: 'suspended' })
      .eq('id', teenId);

    if (error) {
      console.error('Update error:', error);
      return htmlResponse('Error', 'Something went wrong. Please contact contactteenhive@gmail.com.', false);
    }

    // Also delete Supabase auth user so they cannot log in
    const { error: deleteErr } = await supabase.auth.admin.deleteUser(teenId);
    if (deleteErr) {
      // Non-fatal — account is suspended even if auth deletion fails
      console.warn('Auth delete failed (account still suspended):', deleteErr.message);
    }

    // Notify admin
    console.log(`BLOCKED: teen ${profile.full_name} (${teenId}) blocked by guardian ${profile.guardian_name}`);

    const teenName = profile.full_name ?? 'The account';
    const guardianName = profile.guardian_name ?? 'Guardian';

    return htmlResponse(
      'Account Blocked',
      `Thank you, ${guardianName}. ${teenName}'s account has been blocked and they will not be able to access Teen Hive. If you have any concerns, please contact us at contactteenhive@gmail.com.`,
      true,
    );
  } catch (e) {
    console.error(e);
    return htmlResponse('Error', 'An unexpected error occurred. Please contact contactteenhive@gmail.com.', false);
  }
});

function htmlResponse(title: string, message: string, success: boolean): Response {
  const icon = success ? '🛡️' : '❌';

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
    .badge { display: inline-block; background: #fee2e220; color: #991b1b; border: 1px solid #fca5a540; border-radius: 9999px; padding: 6px 18px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .footer { color: #9ca3af; font-size: 13px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <span class="badge">Account Blocked</span>
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
