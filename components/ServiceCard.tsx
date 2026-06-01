import { ds } from '@/lib/design';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

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
  if (availability.length === 2) return availability.join(' · ');
  return `${availability[0]} + ${availability.length - 1} more`;
}

type Props = {
  service: ServiceCardData;
};

export default function ServiceCard({ service }: Props) {
  const router = useRouter();
  const initials = getInitials(service.teen.full_name);
  const availability = formatAvailability(service.availability);

  return (
    <TouchableOpacity
      style={{ backgroundColor: ds.c.surfaceContainerLow, borderRadius: 20, padding: 18 }}
      activeOpacity={0.75}
      onPress={() => router.push(`/teen-profile?id=${service.teen.id}` as any)}
    >
      {/* Teen info row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: ds.c.secondaryContainer, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.primary }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: ds.f.sansBold, fontSize: 14, color: ds.c.onSurface }} numberOfLines={1}>
            {service.teen.full_name}{service.teen.age ? `, ${service.teen.age}` : ''}
          </Text>
        </View>
        {service.hourly_rate ? (
          <View style={{ backgroundColor: ds.c.secondaryContainer, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
            <Text style={{ fontFamily: ds.f.sansBold, fontSize: 12, color: ds.c.primary }}>${service.hourly_rate}/hr</Text>
          </View>
        ) : null}
      </View>

      {/* Service title */}
      <Text style={{ fontFamily: ds.f.serifBold, fontSize: 17, color: ds.c.primary, letterSpacing: -0.2, marginBottom: 8 }}>
        {service.title}
      </Text>

      {/* Metadata row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <View style={{ backgroundColor: ds.c.surfaceContainerHigh, borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 12, color: ds.c.onSurfaceVariant }}>{service.category}</Text>
        </View>
        {availability ? (
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>{availability}</Text>
        ) : null}
        {service.travel_distance ? (
          <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: ds.c.onSurfaceVariant }}>Up to {service.travel_distance}</Text>
        ) : null}
      </View>

      {/* View Profile button */}
      <View style={{ borderRadius: 9999, borderWidth: 1.5, borderColor: ds.c.outlineVariant, paddingVertical: 10, alignItems: 'center' }}>
        <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 13, color: ds.c.onSurface }}>View Profile</Text>
      </View>
    </TouchableOpacity>
  );
}
