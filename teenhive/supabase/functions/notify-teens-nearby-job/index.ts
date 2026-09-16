import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Called right after a parent posts a job (see post-job.tsx).
// Body: { job_id: string }
serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let job_id: string | undefined;
  try {
    const json = await req.json();
    job_id = json.job_id;
  } catch (_) {}

  if (!job_id) {
    return new Response(JSON.stringify({ error: 'job_id is required' }), { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, category, location_area, parent_id')
    .eq('id', job_id)
    .single();

  if (jobError || !job) {
    return new Response(JSON.stringify({ error: jobError?.message ?? 'Job not found' }), { status: 404 });
  }
  if (!job.location_area) {
    return new Response(JSON.stringify({ sent: 0, message: 'Job has no location set' }), { status: 200 });
  }

  const { data: teens, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .eq('role', 'teen')
    .eq('neighborhood', job.location_area)
    .not('push_token', 'is', null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const title = 'New job near you 🌱';
  const body = `"${job.title}" (${job.category}) just posted in ${job.location_area}`;

  // In-app notification rows for every matching teen, whether or not they have a push token
  const { data: allTeens } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'teen')
    .eq('neighborhood', job.location_area);

  if (allTeens && allTeens.length > 0) {
    await supabase.from('notifications').insert(
      allTeens.map((t: any) => ({
        user_id: t.id,
        type: 'job_nearby',
        title,
        body,
        data: { job_id: job.id, screen: 'job-detail' },
        read: false,
      }))
    );
  }

  const tokens = (teens ?? []).map((t: any) => t.push_token).filter(Boolean);
  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, notified: allTeens?.length ?? 0 }), { status: 200 });
  }

  const batches = [];
  for (let i = 0; i < tokens.length; i += 100) batches.push(tokens.slice(i, i + 100));

  let sent = 0;
  for (const batch of batches) {
    const messages = batch.map((token: string) => ({
      to: token,
      title,
      body,
      sound: 'default',
      priority: 'high',
      channelId: 'default',
      data: { job_id: job.id, screen: 'job-detail' },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (res.ok) sent += batch.length;
  }

  return new Response(JSON.stringify({ sent, total: tokens.length, notified: allTeens?.length ?? 0 }), { status: 200 });
});
