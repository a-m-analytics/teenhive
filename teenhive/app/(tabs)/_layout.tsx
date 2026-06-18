import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

const tabBarStyle = {
  backgroundColor: ds.c.primary,
  borderTopWidth: 0,
  borderRadius: 26,
  paddingBottom: 12,
  paddingTop: 10,
  height: 70,
  position: 'absolute' as const,
  bottom: 28,
  left: 16,
  right: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.22,
  shadowRadius: 20,
  elevation: 24,
};

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: ds.c.secondaryContainer,
  tabBarInactiveTintColor: 'rgba(243,251,244,0.35)',
  tabBarStyle,
  tabBarLabelStyle: {
    fontFamily: ds.f.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
    marginTop: 2,
  },
};

function TabIcon({ name, focused, focusedName }: { name: any; focused: boolean; focusedName?: any }) {
  return (
    <Ionicons
      name={focused ? (focusedName ?? name) : name}
      size={focused ? 24 : 22}
      color={focused ? ds.c.secondaryContainer : 'rgba(243,251,244,0.35)'}
    />
  );
}

export default function TabLayout() {
  const { user, profile } = useAuth();
  const [jobsBadge, setJobsBadge] = useState<number>(0);

  useEffect(() => {
    if (!user || !profile) return;
    async function fetchBadge() {
      if (profile?.role === 'teen') {
        const { count } = await supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('teen_id', user!.id)
          .eq('status', 'invited');
        setJobsBadge(count ?? 0);
      } else if (profile?.role === 'parent') {
        const { data: jobs } = await supabase
          .from('jobs')
          .select('id')
          .eq('parent_id', user!.id)
          .eq('status', 'open');
        if (jobs && jobs.length > 0) {
          const jobIds = jobs.map((j: any) => j.id);
          const { count } = await supabase
            .from('applications')
            .select('id', { count: 'exact', head: true })
            .in('job_id', jobIds)
            .eq('status', 'pending');
          setJobsBadge(count ?? 0);
        } else {
          setJobsBadge(0);
        }
      }
    }
    fetchBadge();
  }, [user, profile]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => <TabIcon name="compass-outline" focusedName="compass" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: profile?.role === 'parent' ? 'Listings' : 'Jobs',
          tabBarIcon: ({ focused }) => <TabIcon name="briefcase-outline" focusedName="briefcase" focused={focused} />,
          tabBarBadge: jobsBadge > 0 ? jobsBadge : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 10, minWidth: 16, height: 16, borderRadius: 8 },
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ focused }) => <TabIcon name="add-circle-outline" focusedName="add-circle" focused={focused} />,
        }}
      />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="person-outline" focusedName="person" focused={focused} />,
        }}
      />
      {/* Hidden screens */}
      <Tabs.Screen name="my-jobs" options={{ href: null }} />
      <Tabs.Screen name="my-listings" options={{ href: null }} />
    </Tabs>
  );
}
