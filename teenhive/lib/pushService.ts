import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

const EAS_PROJECT_ID = 'ed541f56-75e5-4750-90f3-9e64e398ee48';

// Show notifications while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Teen Hive',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#22c55e',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  try {
    const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    await supabase.from('profiles').update({ push_token: tokenData }).eq('id', userId);
  } catch (e) {
    console.warn('Push token registration failed:', e);
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    const { data: row } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', userId)
      .single();

    const token = (row as any)?.push_token;
    if (!token) return;

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
      }),
    });
  } catch (e) {
    console.warn('sendPushToUser failed:', e);
  }
}
