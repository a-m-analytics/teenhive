import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (session) { setDestination('/(tabs)'); return; }
      } catch (e) {
        console.warn('Session check failed:', e);
      }

      try {
        const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
        setDestination(hasOnboarded ? '/welcome' : '/onboarding');
      } catch (e) {
        console.warn('AsyncStorage check failed:', e);
        setDestination('/welcome');
      }
    };
    check();
  }, []);

  if (destination) return <Redirect href={destination as any} />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#051b0e' }}>
      <ActivityIndicator size="large" color="#22c55e" />
    </View>
  );
}
