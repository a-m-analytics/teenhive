import OfflineBanner from '@/components/OfflineBanner';
import { useAuth } from '@/context/AuthContext';
import { trackMessageSent } from '@/lib/analytics';
import { ds } from '@/lib/design';
import { type Message } from '@/lib/messageService';
import { sendPushToUser } from '@/lib/pushService';
import { blockUser, reportUser, type ReportReason } from '@/lib/safetyService';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
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
  const { user, profile } = useAuth();
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
          setMessages((prev) => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
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
    const { data } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      content,
      read: false,
    }).select().single();
    // Optimistically append — realtime may not fire for the sender
    if (data) {
      setMessages(prev => prev.some(m => m.id === (data as Message).id) ? prev : [...prev, data as Message]);
    }
    trackMessageSent(user.id, otherUserId);
    const senderName = profile?.full_name ?? 'Someone';
    sendPushToUser(
      otherUserId,
      senderName,
      content,
      { chat_user_id: user.id, chat_name: encodeURIComponent(senderName) }
    );
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
      style={{ flex: 1, backgroundColor: '#f7faf8' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <OfflineBanner />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: 56, paddingHorizontal: 16, paddingBottom: 12,
        backgroundColor: '#fff',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3fbf4', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={ds.c.primary} />
        </TouchableOpacity>

        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: ds.c.secondary,
          justifyContent: 'center', alignItems: 'center', marginRight: 12,
        }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: '#fff' }}>
            {getInitials(otherName)}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 16, color: ds.c.primary, letterSpacing: -0.2 }}>
            {otherName}
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.secondary, marginTop: 1 }}>
            Teen Hive Chat
          </Text>
        </View>

        <TouchableOpacity
          onPress={openMoreMenu}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f3fbf4', justifyContent: 'center', alignItems: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={ds.c.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Safety banner */}
      {!bannerDismissed && (
        <View style={{
          backgroundColor: '#f0fdf4',
          paddingHorizontal: 16, paddingVertical: 9,
          flexDirection: 'row', alignItems: 'center',
          borderBottomWidth: 1, borderBottomColor: '#d1fae5',
        }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="shield-checkmark" size={13} color={ds.c.secondary} />
          </View>
          <Text style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 12, color: '#065f46', lineHeight: 17 }}>
            Keep all communication here until you're both comfortable.
          </Text>
          <TouchableOpacity onPress={() => setBannerDismissed(true)} style={{ marginLeft: 10, padding: 2 }}>
            <Ionicons name="close" size={15} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={ds.c.secondary} />
          <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 80, gap: 10 }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#e6f9ee', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="chatbubbles-outline" size={28} color={ds.c.secondary} />
              </View>
              <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 15, color: ds.c.primary }}>
                Start the conversation
              </Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: ds.c.onSurfaceVariant }}>
                Say hi to {otherName}!
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isMe = item.sender_id === user?.id;
            const prevItem = index > 0 ? messages[index - 1] : null;
            const nextItem = index < messages.length - 1 ? messages[index + 1] : null;
            const showTime = !prevItem || (new Date(item.created_at).getTime() - new Date(prevItem.created_at).getTime()) > 5 * 60 * 1000;
            const isFirstInGroup = !prevItem || prevItem.sender_id !== item.sender_id || showTime;
            const isLastInGroup = !nextItem || nextItem.sender_id !== item.sender_id;
            const isLastFromMe = isMe && isLastInGroup;

            const topRadius = isFirstInGroup ? 20 : 6;
            const bottomRadius = isLastInGroup ? 20 : 6;

            return (
              <View style={{ marginBottom: isLastInGroup ? 10 : 2 }}>
                {showTime && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                    <Text style={{ fontFamily: ds.f.sans, fontSize: 11, color: '#9ca3af' }}>
                      {formatTime(item.created_at)}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
                  </View>
                )}
                <View style={{ alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <View style={{
                    maxWidth: '75%',
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderRadius: 20,
                    borderTopLeftRadius: isMe ? 20 : topRadius,
                    borderTopRightRadius: isMe ? topRadius : 20,
                    borderBottomRightRadius: isMe ? bottomRadius : 20,
                    borderBottomLeftRadius: isMe ? 20 : bottomRadius,
                    backgroundColor: isMe ? ds.c.secondary : '#ffffff',
                    shadowColor: isMe ? ds.c.secondary : '#000',
                    shadowOffset: { width: 0, height: isMe ? 2 : 1 },
                    shadowOpacity: isMe ? 0.25 : 0.07,
                    shadowRadius: isMe ? 6 : 4,
                    elevation: isMe ? 4 : 2,
                  }}>
                    <Text style={{
                      fontFamily: ds.f.sans, fontSize: 15, lineHeight: 22,
                      color: isMe ? '#fff' : ds.c.primary,
                    }}>
                      {item.content}
                    </Text>
                  </View>
                  {isLastFromMe && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginRight: 4, gap: 2 }}>
                      <Ionicons
                        name={item.read ? 'checkmark-done' : 'checkmark'}
                        size={13}
                        color={item.read ? ds.c.secondary : '#9ca3af'}
                      />
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
        paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 20,
        backgroundColor: '#fff',
        borderTopWidth: 1, borderTopColor: '#f3f4f6',
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04, shadowRadius: 8, elevation: 8,
        gap: 10,
      }}>
        <View style={{
          flex: 1,
          backgroundColor: '#f7faf8',
          borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
          maxHeight: 120,
          borderWidth: 1.5, borderColor: input.trim() ? ds.c.secondary : '#e5e7eb',
        }}>
          <TextInput
            style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.primary }}
            placeholder="Message..."
            placeholderTextColor="#9ca3af"
            value={input}
            onChangeText={setInput}
            returnKeyType="send"
            onSubmitEditing={send}
            multiline
          />
        </View>
        <TouchableOpacity
          style={{
            width: 46, height: 46, borderRadius: 23,
            backgroundColor: input.trim() ? ds.c.secondary : '#e5e7eb',
            justifyContent: 'center', alignItems: 'center',
            shadowColor: ds.c.secondary,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: input.trim() ? 0.35 : 0,
            shadowRadius: 8, elevation: input.trim() ? 6 : 0,
          }}
          onPress={send}
          disabled={!input.trim()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color={input.trim() ? '#fff' : '#9ca3af'} />
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
