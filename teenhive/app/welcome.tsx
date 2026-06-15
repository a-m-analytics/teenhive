import Logo from '@/components/Logo';
import { ds } from '@/lib/design';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';

const { height } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const [browseModal, setBrowseModal] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: ds.c.primary }}>
      {/* Hero content */}
      <View style={{ position: 'absolute', top: height * 0.12, left: 28, right: 28 }}>
        <Logo variant="light" size="lg" />
        <View style={{ height: 32 }} />
        <Text style={{
          fontFamily: ds.f.serifBold, fontSize: 44, color: ds.c.white,
          lineHeight: 50, letterSpacing: -0.5, marginBottom: 16,
        }}>
          Good work{'\n'}starts here.
        </Text>
        <Text style={{
          fontFamily: ds.f.sans, fontSize: 16, color: 'rgba(243,251,244,0.55)',
          lineHeight: 24,
        }}>
          Find work you'll love or hire someone you can trust.
        </Text>
      </View>

      {/* Bottom panel */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: ds.c.bg,
        borderTopLeftRadius: 36, borderTopRightRadius: 36,
        paddingHorizontal: 24, paddingTop: 32, paddingBottom: 52,
      }}>
        <Text style={{
          fontFamily: ds.f.sansSemiBold, fontSize: 12, color: ds.c.onSurfaceVariant,
          marginBottom: 16, textAlign: 'center', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Create an account as a...
        </Text>

        {/* Role cards */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity
            style={{ flex: 1, borderRadius: 24, padding: 22, backgroundColor: ds.c.primaryContainer }}
            onPress={() => router.push({ pathname: '/signup', params: { role: 'teen' } } as any)}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: ds.f.sans, fontSize: 10, color: 'rgba(243,251,244,0.45)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>I'm a</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 30, color: ds.c.white, lineHeight: 34, marginBottom: 8 }}>Teen</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.6)', lineHeight: 18, marginBottom: 16 }}>Find jobs near you</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.white }}>Get started →</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1, borderRadius: 24, padding: 22, backgroundColor: ds.c.secondaryContainer }}
            onPress={() => router.push({ pathname: '/signup', params: { role: 'parent' } } as any)}
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: ds.f.sans, fontSize: 10, color: 'rgba(5,27,14,0.35)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>I'm a</Text>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 30, color: ds.c.primary, lineHeight: 34, marginBottom: 8 }}>Parent</Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(5,27,14,0.5)', lineHeight: 18, marginBottom: 16 }}>Post jobs in minutes</Text>
            <View style={{ backgroundColor: 'rgba(5,27,14,0.08)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' }}>
              <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>Get started →</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/login' as any)}
          style={{ alignItems: 'center', paddingVertical: 16, backgroundColor: ds.c.surfaceContainerLow, borderRadius: 9999, marginTop: 4 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>
            Already have an account?{' '}
            <Text style={{ fontFamily: ds.f.sansBold, color: ds.c.secondary }}>Sign In</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setBrowseModal(true)}
          style={{ alignItems: 'center', paddingVertical: 14 }}
          activeOpacity={0.7}
        >
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 13, color: ds.c.onSurfaceVariant }}>
            Browse without an account →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Browse mode picker */}
      <Modal visible={browseModal} transparent animationType="slide">
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setBrowseModal(false)}
        >
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: ds.c.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 52 }}>
            <Text style={{ fontFamily: ds.f.serifBold, fontSize: 28, color: ds.c.primary, marginBottom: 6, letterSpacing: -0.3 }}>
              I'm looking for...
            </Text>
            <Text style={{ fontFamily: ds.f.sans, fontSize: 14, color: ds.c.onSurfaceVariant, marginBottom: 24 }}>
              Choose what to browse
            </Text>

            <TouchableOpacity
              style={{ backgroundColor: ds.c.primaryContainer, borderRadius: 24, padding: 22, marginBottom: 12 }}
              activeOpacity={0.8}
              onPress={() => { setBrowseModal(false); router.push('/browse-guest?mode=jobs' as any); }}
            >
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 24, color: ds.c.white, lineHeight: 30, marginBottom: 4 }}>Jobs near me</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(243,251,244,0.6)' }}>Browse open local jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 24, padding: 22, marginBottom: 20 }}
              activeOpacity={0.8}
              onPress={() => { setBrowseModal(false); router.push('/browse-guest?mode=teens' as any); }}
            >
              <Text style={{ fontFamily: ds.f.serifBold, fontSize: 24, color: ds.c.primary, lineHeight: 30, marginBottom: 4 }}>Teens to hire</Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: 'rgba(5,27,14,0.5)' }}>Browse teens offering services</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setBrowseModal(false)} style={{ alignItems: 'center', paddingVertical: 10 }}>
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 14, color: ds.c.onSurfaceVariant }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
