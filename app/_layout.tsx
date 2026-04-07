import { AuthProvider } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Newsreader_400Regular_Italic, Newsreader_700Bold_Italic } from '@expo-google-fonts/newsreader';
import { SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import * as Linking from 'expo-linking';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    SpaceGrotesk_500Medium, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
    Newsreader_400Regular_Italic, Newsreader_700Bold_Italic,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    const processUrl = async (url: string) => {
      if (!url.includes('reset-password')) return;

      // PKCE flow: teenhive://reset-password?code=xxxx
      const codeMatch = url.match(/[?&]code=([^&#]+)/);
      if (codeMatch) {
        await supabase.auth.exchangeCodeForSession(decodeURIComponent(codeMatch[1]));
        router.push('/reset-password' as any);
        return;
      }

      // Implicit flow: teenhive://reset-password#access_token=...&refresh_token=...&type=recovery
      const hashMatch = url.match(/#(.+)/);
      if (hashMatch) {
        const params = new URLSearchParams(hashMatch[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        if (accessToken && refreshToken && type === 'recovery') {
          await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          router.push('/reset-password' as any);
        }
      }
    };

    // Cold start — app opened via deep link
    Linking.getInitialURL().then((url) => { if (url) processUrl(url); });

    // App already open — received deep link
    const sub = Linking.addEventListener('url', (e) => processUrl(e.url));
    return () => sub.remove();
  }, [router]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
