import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { acceptApplication, declineApplication, completeJob } from '@/lib/applicationService';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';

// ─── Shared helpers ─────────────────────────────────────────────────────────
function getInitials(name: string) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 7 ? `${days}d ago` : new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return ''; }
}

// ─── Messages section — only conversations from accepted applications ─────────
function MessagesSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    // Only show chats with accepted-application partners
    const { data: acceptedApps } = await supabase
      .from('applications')
      .select('teen_id, parent_id')
      .or(`teen_id.eq.${user.id},parent_id.eq.${user.id}`)
      .eq('status', 'accepted');

    const acceptedPartners = new Set<string>();
    for (const app of acceptedApps ?? []) {
      const partner = app.teen_id === user.id ? app.parent_id : app.teen_id;
      if (partner) acceptedPartners.add(partner);
    }

    if (acceptedPartners.size === 0) { setConversations([]); setLoading(false); return; }

    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read, sender:profiles!sender_id(full_name), receiver:profiles!receiver_id(full_name)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) { setLoading(false); return; }

    const convMap = new Map<string, any>();
    for (const msg of msgs) {
      const isMe = msg.sender_id === user.id;
      const otherId = isMe ? msg.receiver_id : msg.sender_id;
      if (!acceptedPartners.has(otherId)) continue; // skip non-accepted chats
      const otherName = isMe ? (msg.receiver as any)?.full_name : (msg.sender as any)?.full_name;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { id: otherId, other_name: otherName ?? 'Unknown', last_message: msg.content, last_message_at: msg.created_at, unread_count: !isMe && !msg.read ? 1 : 0 });
      } else {
        if (!isMe && !msg.read) convMap.get(otherId)!.unread_count += 1;
      }
    }
    setConversations(Array.from(convMap.values()));
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchConversations(); }, [fetchConversations]));

  const filtered = conversations.filter((c) => c.other_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Direct</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, letterSpacing: -0.3 }}>Messages</Text>
      </View>

      <View style={{ marginHorizontal: 24, marginBottom: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 }}>
        <Ionicons name="search-outline" size={16} color={ds.c.onSurfaceVariant} />
        <TextInput
          style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface }}
          placeholder="Search conversations..."
          placeholderTextColor={ds.c.outlineVariant}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={ds.c.secondary} style={{ marginTop: 16 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 40 }}>
          <Ionicons name="chatbubbles-outline" size={32} color={ds.c.outlineVariant} style={{ marginBottom: 10 }} />
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center' }}>
            {search ? 'No conversations match.' : 'Messages unlock after an application is accepted.'}
          </Text>
        </View>
      ) : (
        filtered.map((conv) => (
          <TouchableOpacity
            key={conv.id}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: ds.c.surfaceContainerLow }}
            onPress={() => router.push(`/chat?id=${conv.id}&name=${encodeURIComponent(conv.other_name)}` as any)}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary }}>{getInitials(conv.other_name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                <Text style={{ fontFamily: conv.unread_count > 0 ? ds.f.sansBold : ds.f.sansMedium, fontSize: 14, color: ds.c.onSurface }}>
                  {conv.other_name}
                </Text>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{timeAgo(conv.last_message_at)}</Text>
              </View>
              <Text numberOfLines={1} style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>{conv.last_message}</Text>
            </View>
            {conv.unread_count > 0 && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: ds.c.secondary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }}>
                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 10, color: ds.c.white }}>{conv.unread_count > 9 ? '9+' : conv.unread_count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── Teen Jobs ───────────────────────────────────────────────────────────────
const TEEN_TABS = ['Applied', 'Active', 'Completed'];

function TeenJobs() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Applied');
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, message, job:jobs(id, title, category, pay_rate, pay_type, date, description, parent_id, parent:profiles!parent_id(id, full_name))')
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setApps(data as unknown as any[]);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchApps(); }, [fetchApps]));

  // Invites are shown separately at the top — not mixed into Applied tab
  const invites = apps.filter((a) => a.status === 'invited');
  const applied = apps.filter((a) => a.status === 'pending');
  const active = apps.filter((a) => a.status === 'accepted');
  const completed = apps.filter((a) => a.status === 'completed');
  const current = tab === 'Applied' ? applied : tab === 'Active' ? active : completed;

  async function handleAcceptInvite(app: any) {
    const job = app.job;
    if (!job || !user) return;
    setActioning(app.id);
    try {
      // Teen accepts: update app + job, send first message, notify parent
      await supabase.from('applications').update({ status: 'accepted' }).eq('id', app.id);
      await supabase.from('jobs').update({ status: 'in_progress' }).eq('id', job.id);
      // Message is from parent to teen (auto system opening message)
      const teenName = profile?.full_name ?? 'the teen';
      await supabase.from('messages').insert({
        sender_id: job.parent_id,
        receiver_id: user.id,
        content: `Hi! Great news — ${teenName} accepted your job invite for "${job.title}". Feel free to chat here!`,
        job_id: job.id,
        read: false,
      });
      await supabase.from('notifications').insert({
        user_id: job.parent_id,
        type: 'invite_accepted',
        title: 'Invite Accepted!',
        body: `${teenName} accepted your invite for "${job.title}"`,
        data: { job_id: job.id },
      });
      await fetchApps();
      Alert.alert('Accepted!', 'Check your messages to chat with the parent.', [
        { text: 'Go to Messages', onPress: () => setTab('Active') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not accept invite.');
    } finally {
      setActioning(null);
    }
  }

  async function handleDeclineInvite(app: any) {
    const job = app.job;
    if (!user) return;
    Alert.alert('Decline Invite', `Decline the invite for "${job?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          setActioning(app.id);
          try {
            await supabase.from('applications').update({ status: 'declined' }).eq('id', app.id);
            // Restore job to open if it hasn't been filled
            if (job?.id) {
              await supabase.from('jobs').update({ status: 'open' }).eq('id', job.id).eq('status', 'in_progress');
            }
            await supabase.from('notifications').insert({
              user_id: job?.parent_id,
              type: 'invite_declined',
              title: 'Invite Declined',
              body: `${profile?.full_name ?? 'A teen'} declined your invite for "${job?.title}"`,
              data: { job_id: job?.id },
            });
            await fetchApps();
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'Could not decline invite.');
          } finally {
            setActioning(null);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 24 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Your Work</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>My Jobs</Text>
      </View>

      {/* ── Invites banner — always shown at top if any ── */}
      {!loading && invites.length > 0 && (
        <View style={{ marginHorizontal: 24, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ds.c.error }} />
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.error, letterSpacing: 0.5 }}>
              YOU'VE BEEN INVITED!
            </Text>
          </View>
          {invites.map((app) => {
            const job = app.job;
            if (!job) return null;
            const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
            const isActioning = actioning === app.id;
            return (
              <View key={app.id} style={{ backgroundColor: '#ede9fe', borderRadius: 24, padding: 20, marginBottom: 10, borderWidth: 1.5, borderColor: '#c4b5fd' }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: '#3b0764', letterSpacing: -0.3, marginBottom: 4 }}>{job.title}</Text>
                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: '#6b21a8', marginBottom: 8 }}>{job.parent?.full_name ?? 'Parent'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: job.description ? 10 : 14 }}>
                  <View style={{ backgroundColor: '#ddd6fe', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: '#5b21b6' }}>{pay}</Text>
                  </View>
                  {job.date ? <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: '#6b21a8' }}>{formatDate(job.date)}</Text> : null}
                  <View style={{ backgroundColor: '#ddd6fe', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: '#5b21b6' }}>{job.category}</Text>
                  </View>
                </View>
                {job.description ? (
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: '#6b21a8', lineHeight: 19, marginBottom: 14 }} numberOfLines={2}>
                    {job.description}
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{ flex: 1, borderWidth: 1.5, borderColor: '#7c3aed', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', opacity: isActioning ? 0.5 : 1 }}
                    onPress={() => handleDeclineInvite(app)}
                    disabled={isActioning}
                  >
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: '#7c3aed' }}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flex: 1, backgroundColor: '#7c3aed', borderRadius: 9999, paddingVertical: 12, alignItems: 'center', opacity: isActioning ? 0.5 : 1 }}
                    onPress={() => handleAcceptInvite(app)}
                    disabled={isActioning}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>{isActioning ? 'Accepting...' : 'Accept Invite'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 4 }}>
        {TEEN_TABS.map((t) => {
          const count = t === 'Applied' ? applied.length : t === 'Active' ? active.length : completed.length;
          return (
            <TouchableOpacity
              key={t}
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13, backgroundColor: tab === t ? ds.c.white : 'transparent' }}
              onPress={() => setTab(t)}
            >
              <Text style={{ fontFamily: tab === t ? ds.f.sansBold : ds.f.sansMedium, fontSize: 13, color: tab === t ? ds.c.primary : ds.c.onSurfaceVariant }}>
                {t}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : current.length === 0 ? (
        <EmptyState
          icon="briefcase-outline"
          title={tab === 'Applied' ? 'No applications yet' : tab === 'Active' ? 'No active jobs' : 'No completed jobs yet'}
          subtitle={tab === 'Applied' ? 'Browse jobs and apply to get started' : tab === 'Active' ? 'Accepted jobs will appear here' : 'Complete your first job to see it here'}
        />
      ) : (
        current.map((a) => {
          const job = a.job;
          if (!job) return null;
          const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
          return (
            <TouchableOpacity
              key={a.id}
              style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}
              activeOpacity={0.75}
              onPress={() => router.push(`/job-detail?id=${job.id}` as any)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>{job.title}</Text>
                {a.status === 'accepted' && (
                  <View style={{ backgroundColor: '#d1fae5', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 }}>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: '#065f46' }}>Active</Text>
                  </View>
                )}
              </View>

              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
                {job.parent?.full_name ?? 'Unknown parent'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{pay}</Text>
                </View>
                {job.date ? <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{formatDate(job.date)}</Text> : null}
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Applied {formatDate(a.created_at)}</Text>
              </View>

              {a.status === 'accepted' && (
                <TouchableOpacity
                  style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.primary, paddingVertical: 11, alignItems: 'center' }}
                  onPress={() => router.push(`/chat?id=${job.parent?.id ?? ''}&name=${encodeURIComponent(job.parent?.full_name ?? '')}` as any)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.primary }}>Message Parent</Text>
                </TouchableOpacity>
              )}

            </TouchableOpacity>
          );
        })
      )}

      {/* Messages section */}
      <View style={{ height: 1, backgroundColor: ds.c.surfaceContainerHigh, marginHorizontal: 24, marginVertical: 24 }} />
      <MessagesSection />
      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

// ─── Parent Jobs ─────────────────────────────────────────────────────────────
const PARENT_TABS = ['Active', 'In Progress', 'Completed'];

function ParentJobs() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Active');
  const [listings, setListings] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [acceptedTeens, setAcceptedTeens] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('id, title, category, pay_rate, pay_type, status, created_at')
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setListings(data);
      const jobIds = data.map((j: any) => j.id);
      if (jobIds.length > 0) {
        const { data: apps } = await supabase
          .from('applications')
          .select('id, job_id, teen_id, status, created_at, message, teen:profiles!teen_id(id, full_name, age, jobs_completed, skills, neighborhood)')
          .in('job_id', jobIds)
          .in('status', ['pending', 'invited', 'accepted', 'completed']);
        if (apps) {
          setApplicants(apps as any[]);
          const map: Record<string, any> = {};
          for (const a of apps as any[]) {
            if ((a.status === 'accepted' || a.status === 'completed') && a.teen) map[a.job_id] = { ...a.teen, appId: a.id };
          }
          setAcceptedTeens(map);
        }
      }
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  const active = listings.filter((l) => l.status === 'open');
  const inProgress = listings.filter((l) => l.status === 'in_progress');
  const completed = listings.filter((l) => l.status === 'completed');
  const current = tab === 'Active' ? active : tab === 'In Progress' ? inProgress : completed;

  async function handleAcceptApplicant(app: any, listing: any) {
    const teenName = app.teen?.full_name ?? 'this teen';
    Alert.alert(
      `Accept ${teenName}?`,
      `Accept ${teenName} for "${listing.title}"? Other applicants will be declined.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptApplication(app.id, listing.id, app.teen_id, user!.id, app.teen?.full_name, listing.title);
              await fetchListings();
              Alert.alert('Accepted!', `You can now chat with ${teenName} in Messages.`);
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not accept.');
            }
          },
        },
      ]
    );
  }

  async function handleDeclineApplicant(app: any, listing: any) {
    try {
      await declineApplication(app.id, app.teen_id, listing.title);
      setApplicants((prev) => prev.filter((a) => a.id !== app.id));
    } catch {}
  }

  async function markComplete(listing: any) {
    Alert.alert('Mark as Complete?', `Mark "${listing.title}" as done?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete',
        onPress: async () => {
          const { data: app } = await supabase
            .from('applications')
            .select('id, teen_id')
            .eq('job_id', listing.id)
            .eq('status', 'accepted')
            .maybeSingle();

          if (app?.teen_id && app?.id) {
            await completeJob(listing.id, app.id, app.teen_id);
          }
          await fetchListings();

          Alert.alert('Job Complete!', 'Great work — the job has been marked as done.');
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 24 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Manage</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>My Listings</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', marginHorizontal: 24, marginBottom: 24, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 4 }}>
        {PARENT_TABS.map((t) => {
          const count = t === 'Active' ? active.length : t === 'In Progress' ? inProgress.length : completed.length;
          return (
            <TouchableOpacity
              key={t}
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13, backgroundColor: tab === t ? ds.c.white : 'transparent' }}
              onPress={() => setTab(t)}
            >
              <Text style={{ fontFamily: tab === t ? ds.f.sansBold : ds.f.sansMedium, fontSize: 12, color: tab === t ? ds.c.primary : ds.c.onSurfaceVariant }}>
                {t}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoadingScreen />
      ) : current.length === 0 ? (
        <EmptyState
          icon="list-outline"
          title={tab === 'Active' ? 'No jobs posted yet' : tab === 'In Progress' ? 'No jobs in progress' : 'No completed jobs yet'}
          subtitle={tab === 'Active' ? 'Post your first job to find local teens' : tab === 'In Progress' ? 'Accepted jobs appear here' : ''}
          buttonText={tab === 'Active' ? 'Post a Job' : undefined}
          onButtonPress={tab === 'Active' ? () => router.push('/post-job' as any) : undefined}
        />
      ) : (
        current.map((listing) => {
          const jobApps = applicants.filter((a) => a.job_id === listing.id && (a.status === 'pending' || a.status === 'invited'));
          const pay = `$${listing.pay_rate}${listing.pay_type === 'hourly' ? '/hr' : ' flat'}`;
          const acceptedTeen = acceptedTeens[listing.id];
          return (
            <View key={listing.id} style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>{listing.title}</Text>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{pay}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{listing.category}</Text>
                </View>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Posted {formatDate(listing.created_at)}</Text>
              </View>

              {/* Active: show applicants — parent can view profile, accept, or decline */}
              {tab === 'Active' && (
                <View>
                  {jobApps.length === 0 ? (
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.outlineVariant, marginBottom: 14 }}>No applications yet</Text>
                  ) : (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 11, color: ds.c.onSurfaceVariant, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>
                        {jobApps.length} Applicant{jobApps.length > 1 ? 's' : ''}
                      </Text>
                      {jobApps.map((app) => (
                        <View key={app.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: ds.c.surfaceContainerHigh }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push(`/teen-profile?id=${app.teen_id}` as any)}>
                              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>
                                {app.teen?.full_name ?? 'Unknown'}{app.teen?.age ? `, ${app.teen.age}` : ''}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                {app.status === 'invited' ? (
                                  <View style={{ backgroundColor: '#ede9fe', borderRadius: 9999, paddingHorizontal: 7, paddingVertical: 2 }}>
                                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 10, color: '#5b21b6' }}>Invited — awaiting response</Text>
                                  </View>
                                ) : null}
                                {(app.teen?.jobs_completed ?? 0) > 0 && (
                                  <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.onSurfaceVariant }}>{app.teen.jobs_completed} jobs done</Text>
                                )}
                              </View>
                            </TouchableOpacity>
                          </View>
                          {app.message ? (
                            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>
                              "{app.message}"
                            </Text>
                          ) : null}
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                              style={{ flex: 1, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }}
                              onPress={() => router.push(`/teen-profile?id=${app.teen_id}` as any)}
                            >
                              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurface }}>View Profile</Text>
                            </TouchableOpacity>
                            {/* Parent cannot accept an invite they sent — only pending (teen-initiated) apps */}
                            {app.status === 'pending' ? (
                              <TouchableOpacity
                                style={{ flex: 1, backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }}
                                onPress={() => handleAcceptApplicant(app, listing)}
                              >
                                <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>Accept</Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={{ flex: 1, backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }}>
                                <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>Awaiting Teen</Text>
                              </View>
                            )}
                            <TouchableOpacity
                              style={{ borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' }}
                              onPress={() => handleDeclineApplicant(app, listing)}
                            >
                              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurfaceVariant }}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.primary, paddingVertical: 12, alignItems: 'center' }}
                    onPress={() => router.push(`/browse-teens?jobId=${listing.id}&jobTitle=${encodeURIComponent(listing.title)}` as any)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>Invite a Teen</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* In Progress: show accepted teen + message + mark complete */}
              {tab === 'In Progress' && (
                <View style={{ gap: 10 }}>
                  {acceptedTeen && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>{getInitials(acceptedTeen.full_name)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurface }}>{acceptedTeen.full_name}</Text>
                        <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Working on this job</Text>
                      </View>
                      <TouchableOpacity onPress={() => router.push(`/teen-profile?id=${acceptedTeen.id}` as any)}>
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.secondary }}>Profile</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {acceptedTeen && (
                      <TouchableOpacity
                        style={{ flex: 1, borderWidth: 1, borderColor: ds.c.outlineVariant, borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                        onPress={() => router.push(`/chat?id=${acceptedTeen.id}&name=${encodeURIComponent(acceptedTeen.full_name)}` as any)}
                      >
                        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>Message</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ flex: 1, borderRadius: 9999, backgroundColor: ds.c.primary, paddingVertical: 13, alignItems: 'center' }}
                      onPress={() => markComplete(listing)}
                    >
                      <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white, letterSpacing: 0.5 }}>Mark Complete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

            </View>
          );
        })
      )}

      {/* Messages */}
      <View style={{ height: 1, backgroundColor: ds.c.surfaceContainerHigh, marginHorizontal: 24, marginVertical: 24 }} />
      <MessagesSection />
      <View style={{ height: 110 }} />
    </ScrollView>
  );
}

// ─── Export ──────────────────────────────────────────────────────────────────
export default function JobsTab() {
  const { profile } = useAuth();
  return profile?.role === 'parent' ? <ParentJobs /> : <TeenJobs />;
}
