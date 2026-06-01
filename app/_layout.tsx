import { AuthProvider, useAuth } from '@/context/AuthContext';
import posthog from '@/lib/analytics';
import { PostHogProvider } from 'posthog-react-native';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Newsreader_400Regular_Italic, Newsreader_700Bold_Italic } from '@expo-google-fonts/newsreader';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Handles all auth-based redirects in one place.
// Runs at the root so it only fires once regardless of which screen is mounted.
function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabs = segments[0] === '(tabs)';

    if (!user && inTabs) {
      // Signed out while inside tabs — go to welcome page
      router.replace('/welcome');
    }
    // Signed-in → tabs is handled by index.tsx which reads session directly
  }, [user, loading, segments]);

  return null;
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="review-modal" options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    Newsreader_400Regular_Italic, Newsreader_700Bold_Italic,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
  });

  return (
    <PostHogProvider client={posthog}>
      <AuthProvider>
        <RootLayoutNav fontsLoaded={fontsLoaded} />
      </AuthProvider>
    </PostHogProvider>
  );
}
