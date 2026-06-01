import { Tabs, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export default function TabsLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading]);

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#f0f0f0' }, tabBarActiveTintColor: '#22c55e', tabBarInactiveTintColor: '#9ca3af' }}>
      <Tabs.Screen name="index" options={{ title: 'Discover' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="post" options={{ title: 'Post' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
