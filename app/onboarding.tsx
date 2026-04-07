import Logo from '@/components/Logo';
import { ds } from '@/lib/design';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    headline: 'Welcome to\nTeen Hive.',
    sub: 'Good work starts here.',
    body: 'Find local jobs or hire someone you can trust — right in your neighborhood.',
    illustration: { height: 260, colors: [ds.c.primaryContainer, ds.c.primary] as const },
  },
  {
    headline: 'Work that fits\nyour life.',
    sub: 'Real work. Real neighbors.',
    body: 'Browse jobs posted by parents nearby. Get paid for what you\'re good at, on your own schedule.',
    illustration: { height: 260, colors: [ds.c.secondary, '#4a3a00'] as const },
  },
  {
    headline: 'Safe &\nstraightforward.',
    sub: 'Help from someone you can trust.',
    body: 'Keep all communication in-app. Meet in public first. Everyone on Teen Hive agrees to our community guidelines.',
    illustration: { height: 260, colors: ['#1a3021', ds.c.primaryContainer] as const },
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const goNext = () => {
    if (currentIdx < SLIDES.length - 1) {
      const next = currentIdx + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIdx(next);
    }
  };

  const finish = async () => {
    await AsyncStorage.setItem('onboarded', 'true');
    router.replace('/');
  };

  const isLast = currentIdx === SLIDES.length - 1;
  const slide = SLIDES[currentIdx];

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.bg }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={{ width, flex: 1 }}>
            {/* Illustration placeholder */}
            <LinearGradient colors={s.illustration.colors} style={{ height: s.illustration.height, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}>
              <View style={{ flex: 1, justifyContent: 'flex-end', padding: 32 }}>
                <Logo variant="light" size="lg" />
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Content panel */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 32, paddingTop: 32, paddingBottom: 52 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <View key={i} style={{ height: 4, borderRadius: 2, backgroundColor: i === currentIdx ? ds.c.secondary : ds.c.outlineVariant, width: i === currentIdx ? 20 : 6 }} />
          ))}
        </View>

        <Text style={{ fontFamily: ds.f.serifBold, fontSize: 36, color: ds.c.primary, lineHeight: 42, letterSpacing: -0.5, marginBottom: 8 }}>
          {slide.headline}
        </Text>
        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: ds.c.secondary, marginBottom: 12 }}>
          {slide.sub}
        </Text>
        <Text style={{ fontFamily: ds.f.sans, fontSize: 15, color: ds.c.onSurfaceVariant, lineHeight: 23, marginBottom: 32 }}>
          {slide.body}
        </Text>

        {isLast ? (
          <TouchableOpacity
            style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 17, alignItems: 'center' }}
            onPress={finish}
          >
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.white, letterSpacing: 1 }}>GET STARTED</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={finish}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: ds.c.primary, borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32 }}
              onPress={goNext}
            >
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.white }}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
