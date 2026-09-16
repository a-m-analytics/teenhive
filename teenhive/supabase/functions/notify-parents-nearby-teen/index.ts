import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Called right after a teen posts a service (see post-service.tsx).
// Body: { teen_id: string }
serve(async (req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let teen_id: string | undefined;
  try {
    const json = await req.json();
    teen_id = json.teen_id;
  } catch (_) {}

  if (!teen_id) {
    return new Response(JSON.stringify({ error: 'teen_id is required' }), { status: 400 });
  }

  const { data: teen, error: teenError } = await supabase
    .from('profiles')
    .select('id, full_name, neighborhood')
    .eq('id', teen_id)
    .single();

  if (teenError || !teen) {
    return new Response(JSON.stringify({ error: teenError?.message ?? 'Teen not found' }), { status: 404 });
  }
  if (!teen.neighborhood) {
    return new Response(JSON.stringify({ sent: 0, message: 'Teen has no location set' }), { status: 200 });
  }

  const { data: parents, error } = await supabase
    .from('profiles')
    .select('id, push_token')
    .eq('role', 'parent')
    .eq('neighborhood', teen.neighborhood)
    .not('push_token', 'is', null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const title = 'A teen near you is available 🌱';
  const body = `${teen.full_name} just started offering help in ${teen.neighborhood}`;

  const { data: allParents } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'parent')
    .eq('neighborhood', teen.neighborhood);

  if (allParents && allParents.length > 0) {
    await supabase.from('notifications').insert(
      allParents.map((p: any) => ({
        user_id: p.id,
        type: 'teen_nearby',
        title,
        body,
        data: { teen_id: teen.id, screen: 'teen-profile' },
        read: false,
      }))
    );
  }

  const tokens = (parents ?? []).map((p: any) => p.push_token).filter(Boolean);
  if (tokens.length === 0) {
    return new Response(JSON.stringify({ sent: 0, notified: allParents?.length ?? 0 }), { status: 200 });
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
      data: { teen_id: teen.id, screen: 'teen-profile' },
    }));

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    if (res.ok) sent += batch.length;
  }

  return new Response(JSON.stringify({ sent, total: tokens.length, notified: allParents?.length ?? 0 }), { status: 200 });
});
