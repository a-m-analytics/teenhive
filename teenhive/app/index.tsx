import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/(tabs)');
        } else {
          const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
          router.replace(hasOnboarded ? '/welcome' : '/onboarding');
        }
      } catch (error) {
        console.error('Launch error:', error);
        router.replace('/welcome');
      }
    };
    check();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#051b0e' }}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}
