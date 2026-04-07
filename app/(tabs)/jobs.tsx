import { useAuth } from '@/context/AuthContext';
import { ds, dsLabel, dsSecondaryLabel } from '@/lib/design';
import { notifyJobComplete } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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

// ─── Messages section (shared) ────────────────────────────────────────────
function MessagesSection() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
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

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const filtered = conversations.filter((c) => c.other_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ marginTop: 8 }}>
      {/* Section header */}
      <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
        <Text style={{ ...dsSecondaryLabel, marginBottom: 6 }}>Direct</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, letterSpacing: -0.3 }}>Messages</Text>
      </View>

      {/* Search */}
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
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>
            {search ? 'No conversations match.' : 'No messages yet.'}
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
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Applied');
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('applications')
      .select('id, status, created_at, job:jobs(id, title, category, pay_rate, pay_type, date, parent:profiles!parent_id(id, full_name))')
      .eq('teen_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setApps(data as unknown as any[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const applied = apps.filter((a) => a.status === 'pending');
  const active = apps.filter((a) => a.status === 'accepted');
  const completed = apps.filter((a) => a.status === 'completed');
  const current = tab === 'Applied' ? applied : tab === 'Active' ? active : completed;

  const statusBadge = (status: string) => {
    if (status === 'pending') return { bg: '#fef3c7', color: '#92400e', label: 'Pending' };
    if (status === 'accepted') return { bg: '#d1fae5', color: '#065f46', label: 'Active' };
    return { bg: ds.c.surfaceContainerHigh, color: ds.c.onSurfaceVariant, label: 'Completed' };
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 60, marginBottom: 24 }}>
        <Text style={{ ...dsLabel, color: ds.c.secondary, marginBottom: 6 }}>Your Work</Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 38, color: ds.c.primary, lineHeight: 44, letterSpacing: -0.5 }}>My Jobs</Text>
      </View>

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
        <ActivityIndicator color={ds.c.secondary} style={{ marginTop: 32 }} />
      ) : current.length === 0 ? (
        <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="briefcase-outline" size={24} color={ds.c.outlineVariant} />
          </View>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center' }}>
            {tab === 'Applied' ? 'No pending applications yet.' : tab === 'Active' ? 'No active jobs yet.' : 'No completed jobs yet.'}
          </Text>
        </View>
      ) : (
        current.map((a) => {
          const job = a.job;
          if (!job) return null;
          const badge = statusBadge(a.status);
          const pay = `$${job.pay_rate}${job.pay_type === 'hourly' ? '/hr' : ' flat'}`;
          return (
            <View key={a.id} style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>{job.title}</Text>
                <View style={{ backgroundColor: badge.bg, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 12, color: badge.color }}>{badge.label}</Text>
                </View>
              </View>

              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant, marginBottom: 8 }}>
                {job.parent?.full_name ?? 'Unknown parent'}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: a.status === 'accepted' || a.status === 'completed' ? 14 : 0 }}>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{pay}</Text>
                </View>
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

              {a.status === 'completed' && (
                <TouchableOpacity
                  style={{ borderRadius: 9999, backgroundColor: ds.c.primary, paddingVertical: 11, alignItems: 'center' }}
                  onPress={() => router.push(`/review-modal?jobId=${job.id}&revieweeId=${job.parent?.id ?? ''}&jobTitle=${encodeURIComponent(job.title)}` as any)}
                >
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white, letterSpacing: 0.5 }}>Leave Review</Text>
                </TouchableOpacity>
              )}
            </View>
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
  const { user, profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('Active');
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select(`id, title, category, pay_rate, pay_type, status, created_at, applications(count), accepted_teen:profiles!accepted_teen_id(id, full_name)`)
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setListings(data as unknown as any[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const active = listings.filter((l) => l.status === 'open');
  const inProgress = listings.filter((l) => l.status === 'in_progress');
  const completed = listings.filter((l) => l.status === 'completed');
  const current = tab === 'Active' ? active : tab === 'In Progress' ? inProgress : completed;

  async function markComplete(listing: any) {
    Alert.alert('Mark as Complete?', 'This will mark the job done and notify the teen.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark Complete',
        onPress: async () => {
          await supabase.from('jobs').update({ status: 'completed' }).eq('id', listing.id);
          await supabase.from('applications').update({ status: 'completed' }).eq('job_id', listing.id).eq('status', 'accepted');

          const { data: app } = await supabase
            .from('applications')
            .select('teen_id, teen:profiles!teen_id(full_name, jobs_completed)')
            .eq('job_id', listing.id)
            .maybeSingle();

          if (app?.teen_id) {
            const currentCount = (app.teen as any)?.jobs_completed ?? 0;
            await supabase.from('profiles').update({ jobs_completed: currentCount + 1 }).eq('id', app.teen_id);
            await notifyJobComplete(app.teen_id, listing.title, listing.id);
          }

          fetchListings();

          if (app?.teen_id) {
            const teenName = (app.teen as any)?.full_name ?? 'the teen';
            Alert.alert('Job Complete!', `Would you like to leave a review for ${teenName}?`, [
              { text: 'Later', style: 'cancel' },
              { text: 'Leave Review', onPress: () => router.push(`/review-modal?jobId=${listing.id}&revieweeId=${app.teen_id}&jobTitle=${encodeURIComponent(listing.title)}` as any) },
            ]);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: ds.c.bg }} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
        <ActivityIndicator color={ds.c.secondary} style={{ marginTop: 32 }} />
      ) : current.length === 0 ? (
        <View style={{ alignItems: 'center', paddingHorizontal: 40, paddingVertical: 40 }}>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant, textAlign: 'center', marginBottom: 20 }}>
            {tab === 'Active' ? 'No active listings. Post your first job.' : tab === 'In Progress' ? 'No jobs in progress.' : 'No completed jobs yet.'}
          </Text>
          {tab === 'Active' && (
            <TouchableOpacity
              style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24 }}
              onPress={() => router.push('/post-job' as any)}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white }}>Post a Job</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        current.map((listing) => {
          const appCount = listing.applications?.[0]?.count ?? 0;
          const pay = `$${listing.pay_rate}${listing.pay_type === 'hourly' ? '/hr' : ' flat'}`;
          return (
            <View key={listing.id} style={{ marginHorizontal: 24, marginBottom: 12, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 24, padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <Text style={{ fontFamily: ds.f.serifBold, fontSize: 18, color: ds.c.primary, letterSpacing: -0.3, flex: 1, lineHeight: 24 }}>{listing.title}</Text>
                <TouchableOpacity onPress={() => router.push(`/post-job?id=${listing.id}` as any)} style={{ marginLeft: 10 }}>
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.secondary }}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{listing.category}</Text>
                </View>
                <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>{pay}</Text>
                </View>
                <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Posted {formatDate(listing.created_at)}</Text>
              </View>

              {tab === 'Active' && (
                <TouchableOpacity
                  style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.outlineVariant, paddingVertical: 11, alignItems: 'center' }}
                  onPress={() => router.push(`/job-detail?id=${listing.id}` as any)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>
                    View Applications{appCount > 0 ? ` (${appCount})` : ''}
                  </Text>
                </TouchableOpacity>
              )}

              {tab === 'In Progress' && (
                <View style={{ gap: 10 }}>
                  {listing.accepted_teen && (
                    <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>
                      Working with: {listing.accepted_teen.full_name}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={{ borderRadius: 9999, backgroundColor: ds.c.primary, paddingVertical: 13, alignItems: 'center' }}
                    onPress={() => markComplete(listing)}
                  >
                    <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.white, letterSpacing: 0.5 }}>Mark as Complete</Text>
                  </TouchableOpacity>
                </View>
              )}

              {tab === 'Completed' && (
                <TouchableOpacity
                  style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.outlineVariant, paddingVertical: 11, alignItems: 'center' }}
                  onPress={() => router.push(`/review-modal?jobId=${listing.id}&revieweeId=${listing.accepted_teen?.id ?? ''}&jobTitle=${encodeURIComponent(listing.title)}` as any)}
                >
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>Leave a Review</Text>
                </TouchableOpacity>
              )}
            </View>
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

// ─── Export ──────────────────────────────────────────────────────────────────
export default function JobsTab() {
  const { profile } = useAuth();
  return profile?.role === 'parent' ? <ParentJobs /> : <TeenJobs />;
}
