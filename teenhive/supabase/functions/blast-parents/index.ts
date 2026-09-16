import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Optional: pass custom title/body in request body
  let title = 'Teens near you are ready to help 🌱';
  let body = 'Post a job on Teen Hive — babysitting, yard work, tutoring and more. Takes 2 minutes.';

  try {
    const json = await req.json();
    if (json.title) title = json.title;
    if (json.body) body = json.body;
  } catch (_) {}

  // Fetch all parents with a push token
  const { data: parents, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .eq('role', 'parent')
    .not('push_token', 'is', null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const tokens = (parents ?? []).map((p: any) => p.push_token).filter(Boolean);

  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No parents with push tokens found' }), { status: 200 });
  }

  // Send in batches of 100 (Expo limit)
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
      data: { screen: 'post-job' },
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
