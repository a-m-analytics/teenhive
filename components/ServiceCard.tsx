import PressableScale from '@/components/PressableScale';
import Text from '@/components/Text';
import { colors, fonts, radius, shadow, spacing, type as T } from '@/lib/design';
import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';

export type ServiceCardData = {
  id: string;
  title: string;
  category: string;
  hourly_rate: number | null;
  availability: string[] | null;
  travel_distance: string | null;
  teen: {
    id: string;
    full_name: string;
    age: number | null;
  };
};

function getInitials(name: string): string {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatAvailability(availability: string[] | null): string {
  if (!availability || availability.length === 0) return '';
  if (availability.length === 1) return availability[0];
  if (availability.length === 2) return availability.join(' + ');
  return `${availability[0]} + ${availability.length - 1} more`;
}

type Props = {
  service: ServiceCardData;
  onMessage?: () => void;
};

export default function ServiceCard({ service, onMessage }: Props) {
  const router = useRouter();
  const initials = getInitials(service.teen.full_name);
  const availability = formatAvailability(service.availability);

  return (
    <View style={{
      borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg,
      padding: spacing.md, backgroundColor: colors.white, ...shadow.card,
    }}>
      {/* Teen info row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          backgroundColor: colors.accentLight, borderWidth: 1, borderColor: colors.accentBorder,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.accent }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink }} numberOfLines={1}>
            {service.teen.full_name}
          </Text>
          {service.teen.age ? (
            <Text style={{ ...T.caption, color: colors.muted }}>Age {service.teen.age}</Text>
          ) : null}
        </View>
        {service.hourly_rate ? (
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.accent }}>
            ${service.hourly_rate}/hr
          </Text>
        ) : null}
      </View>

      {/* Service title */}
      <Text style={{ fontFamily: fonts.display, fontSize: 16, color: colors.ink, letterSpacing: -0.3, marginBottom: 10 }}>
        {service.title}
      </Text>

      {/* Metadata row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.muted }}>{service.category}</Text>
        </View>
        {availability ? (
          <Text style={{ ...T.caption, color: colors.muted }}>{availability}</Text>
        ) : null}
        {service.travel_distance ? (
          <Text style={{ ...T.caption, color: colors.muted }}>Up to {service.travel_distance}</Text>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <PressableScale
          style={{ flex: 1, height: 38, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }}
          onPress={() => router.push(`/teen-profile?id=${service.teen.id}` as any)}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.ink }}>View Profile</Text>
        </PressableScale>
        <PressableScale
          style={{ flex: 1, height: 38, borderRadius: radius.md, backgroundColor: colors.ink, justifyContent: 'center', alignItems: 'center' }}
          onPress={onMessage ?? (() => router.push(`/chat?id=${service.teen.id}&name=${encodeURIComponent(service.teen.full_name)}` as any))}
        >
          <Text style={{ fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.white }}>Message</Text>
        </PressableScale>
      </View>
    </View>
  );
}
