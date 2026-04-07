import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { type Message } from '@/lib/messageService';
import { blockUser, reportUser, type ReportReason } from '@/lib/safetyService';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getInitials(name: string) {
  return (name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}

const REPORT_REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harassment or bullying' },
  { key: 'inappropriate_content', label: 'Inappropriate content' },
  { key: 'spam', label: 'Spam or scam' },
  { key: 'fake_profile', label: 'Fake profile' },
  { key: 'underage', label: 'Underage user' },
  { key: 'other', label: 'Other' },
];

export default function Chat() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason | ''>('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const otherName = decodeURIComponent(name ?? 'User');
  const otherUserId = id ?? '';

  useEffect(() => {
    if (!user || !otherUserId) return;

    // Fetch existing messages
    supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, created_at, read, job_id')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as Message[]);
        setLoading(false);
      });

    // Mark incoming messages as read
    supabase.from('messages').update({ read: true }).eq('sender_id', otherUserId).eq('receiver_id', user.id);

    // Real-time subscription — listen for all new messages in this conversation
    const channel = supabase
      .channel(`chat-${user.id}-${otherUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === user.id)
        ) {
          setMessages((prev) => [...prev, msg]);
          // Mark as read if incoming
          if (msg.sender_id === otherUserId) {
            supabase.from('messages').update({ read: true }).eq('id', msg.id);
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !otherUserId) return;
    const content = input.trim();
    setInput('');
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
      read: false,
    });
    // The realtime subscription will pick it up; no need to manually append
  };

  const openMoreMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Report User', 'Block User'], cancelButtonIndex: 0, destructiveButtonIndex: 2 },
        (idx) => {
          if (idx === 1) setReportModal(true);
          if (idx === 2) handleBlock();
        },
      );
    } else {
      Alert.alert('Options', undefined, [
        { text: 'Report User', onPress: () => setReportModal(true) },
        { text: 'Block User', style: 'destructive', onPress: handleBlock },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleBlock = () => {
    Alert.alert('Block User', `Block ${otherName}? They won't be able to message you.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block', style: 'destructive', onPress: async () => {
          if (!user) return;
          await blockUser(user.id, otherUserId);
          router.back();
        },
      },
    ]);
  };

  const submitReport = async () => {
    if (!reportReason || !user) return;
    setReporting(true);
    const { error } = await reportUser(user.id, otherUserId, reportReason, reportDescription);
    setReporting(false);
    if (error) {
      Alert.alert('Error', 'Could not submit report. Please try again.');
      return;
    }
    setReportModal(false);
    setReportReason('');
    setReportDescription('');
    Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: ds.c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: ds.c.surfaceContainerHigh,
        backgroundColor: ds.c.bg,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={ds.c.primary} />
        </TouchableOpacity>
        <View style={{
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: ds.c.secondaryContainer,
          justifyContent: 'center', alignItems: 'center', marginRight: 10,
        }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 13, color: ds.c.primary }}>
            {getInitials(otherName)}
          </Text>
        </View>
        <Text style={{ flex: 1, fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary }}>
          {otherName}
        </Text>
        <TouchableOpacity onPress={openMoreMenu} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={22} color={ds.c.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Safety banner */}
      {!bannerDismissed && (
        <View style={{
          backgroundColor: ds.c.surfaceContainerLow,
          paddingHorizontal: 20, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center',
          borderBottomWidth: 1, borderBottomColor: ds.c.outlineVariant,
        }}>
          <Ionicons name="shield-checkmark-outline" size={14} color={ds.c.secondary} style={{ marginRight: 8 }} />
          <Text style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant, lineHeight: 17 }}>
            Keep it professional until you're both comfortable meeting in person.
          </Text>
          <TouchableOpacity onPress={() => setBannerDismissed(true)} style={{ marginLeft: 10 }}>
            <Ionicons name="close" size={16} color={ds.c.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: ds.c.surfaceContainerLow, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="chatbubbles-outline" size={18} color={ds.c.onSurfaceVariant} />
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 6, paddingBottom: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>
                No messages yet. Say hi!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe = item.sender_id === user?.id;
            const prevItem = index > 0 ? messages[index - 1] : null;
            const showTime = !prevItem || (new Date(item.created_at).getTime() - new Date(prevItem.created_at).getTime()) > 5 * 60 * 1000;
            const isLastFromMe = isMe && (index === messages.length - 1 || messages[index + 1]?.sender_id !== user?.id);

            return (
              <View>
                {showTime && (
                  <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: ds.c.outlineVariant, textAlign: 'center', marginVertical: 8 }}>
                    {formatTime(item.created_at)}
                  </Text>
                )}
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth: '78%',
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 20,
                    borderBottomRightRadius: isMe ? 4 : 20,
                    borderBottomLeftRadius: isMe ? 20 : 4,
                    backgroundColor: isMe ? ds.c.primaryContainer : ds.c.surfaceContainerLow,
                  }}>
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: isMe ? ds.c.white : ds.c.onSurface, lineHeight: 21 }}>
                      {item.content}
                    </Text>
                  </View>
                  {/* Read receipt for last sent message */}
                  {isLastFromMe && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginRight: 2, gap: 2 }}>
                      <Text style={{ fontFamily: ds.f.sans, fontSize: 10, color: item.read ? ds.c.secondary : ds.c.outlineVariant }}>
                        {item.read ? '✓✓' : '✓'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Input bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-end',
        paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: 1, borderTopColor: ds.c.surfaceContainerHigh,
        backgroundColor: ds.c.bg, gap: 10,
      }}>
        <View style={{
          flex: 1,
          backgroundColor: ds.c.surfaceContainerLow,
          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
          maxHeight: 120,
        }}>
          <TextInput
            style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
            placeholder="Message..."
            placeholderTextColor={ds.c.outlineVariant}
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={send}
            multiline
          />
        </View>
        <TouchableOpacity
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: input.trim() ? ds.c.primaryContainer : ds.c.surfaceContainerHigh,
            justifyContent: 'center', alignItems: 'center',
          }}
          onPress={send}
          disabled={!input.trim()}
        >
          <Ionicons name="arrow-up" size={20} color={input.trim() ? ds.c.white : ds.c.outlineVariant} />
        </TouchableOpacity>
      </View>

      {/* Report modal */}
      <Modal visible={reportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
          <View style={{ paddingTop: 28, paddingHorizontal: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: ds.c.surfaceContainerHigh, flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontFamily: ds.f.sansBold, fontSize: 18, color: ds.c.primary }}>Report User</Text>
            <TouchableOpacity onPress={() => { setReportModal(false); setReportReason(''); setReportDescription(''); }}>
              <Ionicons name="close" size={24} color={ds.c.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 24, gap: 20 }}>
            <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>
              Select a reason:
            </Text>
            <View style={{ gap: 10 }}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 16, borderRadius: 16,
                    backgroundColor: reportReason === r.key ? ds.c.primaryContainer : ds.c.surfaceContainerLow,
                    borderWidth: 1, borderColor: reportReason === r.key ? ds.c.primary : 'transparent',
                  }}
                  onPress={() => setReportReason(r.key)}
                >
                  <View style={{
                    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                    borderColor: reportReason === r.key ? ds.c.secondaryContainer : ds.c.outlineVariant,
                    backgroundColor: reportReason === r.key ? ds.c.secondary : 'transparent',
                  }} />
                  <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: reportReason === r.key ? ds.c.white : ds.c.onSurface }}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 16, padding: 14 }}>
              <TextInput
                style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurface, minHeight: 80, textAlignVertical: 'top' }}
                placeholder="Additional details (optional)..."
                placeholderTextColor={ds.c.outlineVariant}
                value={reportDescription}
                onChangeText={(t) => setReportDescription(t.slice(0, 500))}
                multiline
              />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: reportReason ? ds.c.primary : ds.c.surfaceContainerHigh,
                borderRadius: 9999, paddingVertical: 16, alignItems: 'center',
              }}
              onPress={submitReport}
              disabled={!reportReason || reporting}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: reportReason ? ds.c.white : ds.c.outlineVariant }}>
                {reporting ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
