import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setDestination('/(tabs)'); return; }
      const hasOnboarded = await AsyncStorage.getItem('hasOnboarded');
      setDestination(hasOnboarded ? '/welcome' : '/onboarding');
    };
    check();
  }, []);

  if (destination) return <Redirect href={destination as any} />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#051b0e' }}>
      <ActivityIndicator size="large" color="#735c00" />
    </View>
  );
}
