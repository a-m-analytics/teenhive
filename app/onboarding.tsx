import Logo from '@/components/Logo';
import { ds } from '@/lib/design';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    headline: "Work you'll\nactually want\nto do.",
    sub: 'Find jobs in your neighborhood or hire someone you can trust.',
  },
  {
    headline: 'Safe\nby design.',
    sub: 'All communication stays in-app. Every user is verified. Parents and teens both reviewed.',
  },
  {
    headline: 'Your\nneighborhood.\nYour opportunity.',
    sub: 'Babysitting, tutoring, yard work, pet care and more — all within walking distance.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIdx(idx);
  };

  const goNext = () => {
    const next = currentIdx + 1;
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
    setCurrentIdx(next);
  };

  const finish = async () => {
    await AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/welcome' as any);
  };

  const isLast = currentIdx === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.primary }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={{ width, flex: 1, paddingHorizontal: 32, justifyContent: 'center', paddingBottom: 220 }}>
            <View style={{ marginBottom: 36 }}>
              <Logo variant="light" size="md" />
            </View>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 44, color: ds.c.white, lineHeight: 50, letterSpacing: -0.5, marginBottom: 20 }}>
              {slide.headline}
            </Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 17, color: 'rgba(243,251,244,0.6)', lineHeight: 26 }}>
              {slide.sub}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 32, paddingBottom: 56 }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 32 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: i === currentIdx ? ds.c.white : 'rgba(255,255,255,0.25)',
                width: i === currentIdx ? 24 : 8,
              }}
            />
          ))}
        </View>

        {isLast ? (
          <TouchableOpacity
            style={{ backgroundColor: ds.c.white, borderRadius: 9999, paddingVertical: 18, alignItems: 'center' }}
            onPress={finish}
          >
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 15, color: ds.c.primary, letterSpacing: 1 }}>GET STARTED</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={finish}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: 'rgba(243,251,244,0.5)' }}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32 }}
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
