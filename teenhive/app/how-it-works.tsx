import { ds } from '@/lib/design';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type Step = { icon: string; title: string; body: string };

const TEEN_STEPS: Step[] = [
  {
    icon: 'add-circle-outline',
    title: 'Post your services',
    body: 'Tap the Post button at the bottom to list what you can do — babysitting, tutoring, yard work, and more.',
  },
  {
    icon: 'search-outline',
    title: 'Find jobs nearby',
    body: 'Browse jobs posted by parents in your neighbourhood and find ones that are a great fit for you.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Apply & get paid',
    body: 'Apply for jobs or wait for parents to invite you. Once connected, chat to agree on details and get the job done.',
  },
];

const PARENT_STEPS: Step[] = [
  {
    icon: 'add-circle-outline',
    title: 'Post a job',
    body: 'Tap the Post button at the bottom to describe the job you need — what it is, when, and how much you\'ll pay.',
  },
  {
    icon: 'people-outline',
    title: 'Browse & invite teens',
    body: 'Browse teens in your area or invite them directly to your job listing. They can also apply on their own.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Chat & coordinate',
    body: 'Once they accept, chat to plan the details — where to meet, when to start, and whatever else you need.',
  },
];

export default function HowItWorks() {
  const router = useRouter();
  const { role, email } = useLocalSearchParams<{ role: string; email: string }>();
  const isTeen = role !== 'parent';
  const steps = isTeen ? TEEN_STEPS : PARENT_STEPS;
  const [step, setStep] = useState(0);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const advance = () => {
    if (isLast) {
      if (email) {
        router.replace({ pathname: '/verify-email', params: { email } } as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const skip = () => {
    if (email) {
      router.replace({ pathname: '/verify-email', params: { email } } as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      {/* Skip button top-right */}
      <View style={{ paddingTop: 56, paddingHorizontal: 24, alignItems: 'flex-end' }}>
        {!isLast && (
          <TouchableOpacity onPress={skip}>
            <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.onSurfaceVariant }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
        {/* Icon */}
        <View style={{
          width: 120, height: 120, borderRadius: 60,
          backgroundColor: ds.c.primaryContainer,
          justifyContent: 'center', alignItems: 'center',
          marginBottom: 40,
        }}>
          <Ionicons name={current.icon as any} size={52} color={ds.c.secondary} />
        </View>

        {/* Step dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{
                height: 6,
                width: i === step ? 28 : 8,
                borderRadius: 3,
                backgroundColor: i === step ? ds.c.secondary : ds.c.outlineVariant,
              }}
            />
          ))}
        </View>

        <Text style={{
          fontFamily: ds.f.serifBold, fontSize: 34, color: ds.c.primary,
          textAlign: 'center', letterSpacing: -0.5, marginBottom: 16, lineHeight: 40,
        }}>
          {current.title}
        </Text>

        <Text style={{
          fontFamily: ds.f.sans, fontSize: 16, color: ds.c.onSurfaceVariant,
          textAlign: 'center', lineHeight: 25,
        }}>
          {current.body}
        </Text>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 52 }}>
        <TouchableOpacity
          style={{
            backgroundColor: ds.c.primary, borderRadius: 9999,
            paddingVertical: 18, alignItems: 'center',
          }}
          onPress={advance}
        >
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white, letterSpacing: 0.5 }}>
            {isLast ? (email ? 'Verify my email →' : 'Get started →') : 'Next →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
