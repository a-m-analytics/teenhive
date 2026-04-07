import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Save to Supabase
  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);

  return token;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>,
) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: expoPushToken, title, body, data: data ?? {} }),
  });
}

/** Fetch a user's push token and send them a notification */
async function notifyUser(userId: string, title: string, body: string, data?: Record<string, any>) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('push_token')
    .eq('id', userId)
    .single();
  if (profile?.push_token) {
    await sendPushNotification(profile.push_token, title, body, data);
  }
}

export const notify = {
  newMessage: (toUserId: string, fromName: string) =>
    notifyUser(toUserId, 'New message', `New message from ${fromName}`),

  applicationAccepted: (teenId: string, jobTitle: string) =>
    notifyUser(teenId, 'Application accepted!', `You were accepted for "${jobTitle}"`),

  newApplication: (parentId: string, teenName: string, jobTitle: string) =>
    notifyUser(parentId, 'New application', `${teenName} applied to "${jobTitle}"`),

  jobComplete: (teenId: string, jobTitle: string) =>
    notifyUser(teenId, 'Job complete!', `"${jobTitle}" was marked complete. Leave a review!`),

  newReview: (teenId: string) =>
    notifyUser(teenId, 'New review!', 'You received a new star rating from a parent.'),
};
