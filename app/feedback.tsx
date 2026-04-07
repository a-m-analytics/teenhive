import GradientButton from '@/components/GradientButton';
import { useAuth } from '@/context/AuthContext';
import { ds, dsField, dsLabel } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const TYPES = [
  { key: 'bug', label: 'Report a Bug', icon: 'bug-outline' as const },
  { key: 'feature', label: 'Feature Request', icon: 'bulb-outline' as const },
  { key: 'general', label: 'General Feedback', icon: 'chatbubble-outline' as const },
  { key: 'report', label: 'Report a User', icon: 'flag-outline' as const },
];

export default function Feedback() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!selectedType || !description.trim()) {
      Alert.alert('Missing info', 'Please select a type and add a description.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user?.id ?? null,
      type: selectedType,
      description: description.trim(),
      email: email.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: ds.c.bg, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
          <Ionicons name="checkmark" size={40} color={ds.c.primary} />
        </View>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, textAlign: 'center', marginBottom: 12, letterSpacing: -0.3, lineHeight: 38 }}>
          Thanks for your feedback!
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, textAlign: 'center', lineHeight: 23, marginBottom: 36 }}>
          We'll get back to you within 48 hours.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 16, paddingHorizontal: 40 }}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.white, letterSpacing: 0.5 }}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: ds.c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingTop: 56, paddingHorizontal: 24, marginBottom: 28 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chevron-back" size={18} color={ds.c.secondary} />
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary }}>Back</Text>
          </TouchableOpacity>
          <Text style={{ fontFamily: ds.f.serifBold, fontSize: 32, color: ds.c.primary, lineHeight: 38, letterSpacing: -0.3, marginBottom: 8 }}>
            Help & Feedback
          </Text>
          <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant }}>
            We read every message.
          </Text>
        </View>

        <View style={{ marginHorizontal: 24, gap: 20 }}>

          {/* Type selector — 2x2 grid */}
          <View>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 12 }}>What's this about?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {TYPES.map((t) => {
                const active = selectedType === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={{
                      width: '47%',
                      borderRadius: 20,
                      padding: 18,
                      backgroundColor: active ? '#0d2b18' : ds.c.surfaceContainerLow,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? ds.c.primary : ds.c.outlineVariant,
                    }}
                    onPress={() => setSelectedType(t.key)}
                    activeOpacity={0.75}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 10,
                      backgroundColor: active ? 'rgba(255,255,255,0.12)' : ds.c.surfaceContainerHigh,
                      justifyContent: 'center', alignItems: 'center', marginBottom: 10,
                    }}>
                      <Ionicons name={t.icon} size={18} color={active ? ds.c.secondaryContainer : ds.c.onSurfaceVariant} />
                    </View>
                    <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: active ? ds.c.white : ds.c.onSurface, lineHeight: 18 }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant }}>Description</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: description.length > 450 ? ds.c.error : ds.c.outlineVariant }}>
                {description.length}/500
              </Text>
            </View>
            <View style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: ds.c.outlineVariant }}>
              <TextInput
                style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface, minHeight: 110, textAlignVertical: 'top' }}
                placeholder="Tell us more..."
                placeholderTextColor={ds.c.outlineVariant}
                value={description}
                onChangeText={(t) => setDescription(t.slice(0, 500))}
                multiline
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text style={{ ...dsLabel, color: ds.c.onSurfaceVariant, marginBottom: 10 }}>Email</Text>
            <View style={{ ...dsField, borderWidth: 1, borderColor: ds.c.outlineVariant }}>
              <Ionicons name="mail-outline" size={18} color={ds.c.onSurfaceVariant} />
              <TextInput
                style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurface }}
                placeholder="your@email.com"
                placeholderTextColor={ds.c.outlineVariant}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <GradientButton label="Submit Feedback" onPress={submit} loading={submitting} fullWidth />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
