import Logo from '@/components/Logo';
import { ds, dsLabel } from '@/lib/design';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, StatusBar, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem('onboarded').then((val) => {
      if (!val) router.replace('/onboarding' as any);
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.primary }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={ds.gradient} style={{ flex: 1 }}>

        {/* Hero — centered logo + headline */}
        <View style={{ position: 'absolute', top: height * 0.14, left: 28, right: 28, alignItems: 'flex-start' }}>
          <Logo variant="light" size="lg" />
          <View style={{ height: 28 }} />
          <Text style={{
            fontFamily: ds.f.serifBold, fontSize: 44, color: ds.c.white,
            lineHeight: 50, letterSpacing: -0.5, marginBottom: 14,
          }}>
            Good work{'\n'}starts here.
          </Text>
          <Text style={{
            fontFamily: ds.f.sans, fontSize: 16, color: 'rgba(243,251,244,0.65)',
            lineHeight: 24,
          }}>
            Jobs done by people you can trust, right in your neighborhood.
          </Text>
        </View>

        {/* Bottom panel */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: ds.c.bg,
          borderTopLeftRadius: 36, borderTopRightRadius: 36,
          paddingHorizontal: 24, paddingTop: 28, paddingBottom: 52,
        }}>
          <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurfaceVariant, marginBottom: 14, textAlign: 'center', letterSpacing: 0.3 }}>
            Create an account as a...
          </Text>

          {/* Role cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={{
                flex: 1, borderRadius: 20, padding: 20,
                backgroundColor: ds.c.primaryContainer,
              }}
              onPress={() => router.push({ pathname: '/signup', params: { role: 'teen' } } as any)}
              activeOpacity={0.75}
            >
              <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: 'rgba(243,251,244,0.5)', marginBottom: 6, letterSpacing: 0.5 }}>I AM A</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.white, lineHeight: 30, marginBottom: 8 }}>Teen</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.6)', lineHeight: 18 }}>I want to find jobs and earn money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1, borderRadius: 20, padding: 20,
                backgroundColor: ds.c.secondaryContainer,
              }}
              onPress={() => router.push({ pathname: '/signup', params: { role: 'parent' } } as any)}
              activeOpacity={0.75}
            >
              <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: 'rgba(5,27,14,0.4)', marginBottom: 6, letterSpacing: 0.5 }}>I AM A</Text>
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 26, color: ds.c.primary, lineHeight: 30, marginBottom: 8 }}>Parent</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(5,27,14,0.55)', lineHeight: 18 }}>I want to hire trusted teens nearby</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/login' as any)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant }}>
              Already have an account?{' '}
              <Text style={{ fontFamily: ds.f.sansSemiBold, color: ds.c.secondary }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}
