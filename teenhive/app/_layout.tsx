global.ErrorUtils?.setGlobalHandler((error: any, isFatal: boolean) => {
  console.log('Global error caught:', error?.message, 'Fatal:', isFatal);
});

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import posthog from '@/lib/analytics';
import { registerForPushNotifications } from '@/lib/pushService';
import { supabase } from '@/lib/supabase';
import { PostHogProvider } from 'posthog-react-native';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Newsreader_400Regular_Italic, Newsreader_700Bold_Italic } from '@expo-google-fonts/newsreader';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

// Handles all auth-based redirects in one place.
// Runs at the root so it only fires once regardless of which screen is mounted.
const SKIP_AVATAR_SCREENS = new Set(['welcome', 'login', 'signup', 'verify-email', 'how-it-works', 'complete-profile', 'onboarding', 'terms', 'privacy']);

function AuthGate() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inTabs = segments[0] === '(tabs)';
    const currentScreen = segments[0] as string;

    if (!user && inTabs) {
      router.replace('/welcome');
      return;
    }

    // Require profile pic before accessing the app
    if (user && profile && !profile.avatar_url && !SKIP_AVATAR_SCREENS.has(currentScreen)) {
      router.replace('/complete-profile');
      return;
    }
  }, [user, profile, loading, segments]);

  useEffect(() => {
    if (user) registerForPushNotifications(user.id);
  }, [user?.id]);

  // Handle email verification deep links (teenhive://verify-email?code=... or #access_token=...)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      try {
        if (url.includes('code=')) {
          await supabase.auth.exchangeCodeForSession(url);
        } else {
          const hash = url.split('#')[1] ?? '';
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          }
        }
      } catch (e) {
        console.warn('Auth deep link handling failed:', e);
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const subscription = Linking.addEventListener('url', event => handleUrl(event.url));
    return () => subscription.remove();
  }, []);

  return null;
}

function RootLayoutNav({ fontsLoaded }: { fontsLoaded: boolean }) {
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Fallback: hide splash after 5s even if fonts fail to load
  useEffect(() => {
    const timer = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AuthGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
        <Stack.Screen name="verify-email" />
        <Stack.Screen name="how-it-works" />
        <Stack.Screen name="complete-profile" />
        <Stack.Screen name="review-modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="browse-guest" />
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
    <ErrorBoundary>
      <PostHogProvider client={posthog}>
        <AuthProvider>
          <RootLayoutNav fontsLoaded={fontsLoaded ?? false} />
        </AuthProvider>
      </PostHogProvider>
    </ErrorBoundary>
  );
}
