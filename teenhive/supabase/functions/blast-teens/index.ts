import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let title = 'Jobs are waiting for you 🌱';
  let body = 'Teens in your area are getting hired on Teen Hive. Browse jobs and apply today!';

  try {
    const json = await req.json();
    if (json.title) title = json.title;
    if (json.body) body = json.body;
  } catch (_) {}

  const { data: teens, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .eq('role', 'teen')
    .not('push_token', 'is', null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const tokens = (teens ?? []).map((t: any) => t.push_token).filter(Boolean);

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No teens with push tokens found' }), { status: 200 });
  }

  const batches = [];
  for (let i = 0; i < tokens.length; i += 100) {
    batches.push(tokens.slice(i, i + 100));
  }

  let sent = 0;
  for (const batch of batches) {
    const messages = batch.map((token: string) => ({
      to: token,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: { screen: 'browse-jobs' },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (res.ok) sent += batch.length;
  }

  return new Response(JSON.stringify({ sent, total: tokens.length }), { status: 200 });
});
