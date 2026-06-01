import { useAuth } from '@/context/AuthContext';
import { ds } from '@/lib/design';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

const TAB_BAR_HEIGHT = 84;

const tabBarStyle = {
  backgroundColor: 'rgba(243, 251, 244, 0.96)',
  borderTopWidth: 0,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  paddingBottom: 24,
  paddingTop: 12,
  height: TAB_BAR_HEIGHT,
  position: 'absolute' as const,
  bottom: 0,
  left: 0,
  right: 0,
  elevation: 12,
  shadowColor: '#051b0e',
  shadowOffset: { width: 0, height: -4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
};

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: ds.c.secondary,
  tabBarInactiveTintColor: 'rgba(5,27,14,0.45)',
  tabBarStyle,
  tabBarLabelStyle: {
    fontFamily: ds.f.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
};

function TabIcon({ name, focused, focusedName }: { name: any; focused: boolean; focusedName?: any }) {
  return (
    <View style={focused ? { backgroundColor: ds.c.secondaryContainer, borderRadius: 12, padding: 4 } : undefined}>
      <Ionicons name={focused ? (focusedName ?? name) : name} size={22} color={focused ? ds.c.secondary : 'rgba(5,27,14,0.45)'} />
    </View>
  );
}

export default function TabLayout() {
  const { user, profile } = useAuth();
  const [jobsBadge, setJobsBadge] = useState<number>(0);

  useEffect(() => {
    if (!user || !profile) return;
    async function fetchBadge() {
      if (profile?.role === 'teen') {
        // Count pending invites for teen
        const { count } = await supabase
          .from('applications')
          .select('id', { count: 'exact', head: true })
          .eq('teen_id', user!.id)
          .eq('status', 'invited');
        setJobsBadge(count ?? 0);
      } else if (profile?.role === 'parent') {
        // Count pending applications on parent's jobs
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
