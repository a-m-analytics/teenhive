import { ds } from '@/lib/design';
import { Text, View } from 'react-native';

type Props = {
  /** 'light' = white Teen + amber Hive (for dark backgrounds), 'dark' = primary color (for light backgrounds) */
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
};

const sizes = { sm: 18, md: 22, lg: 28 };
const dotSizes = { sm: 4, md: 5, lg: 7 };
const hexSizes = { sm: 5, md: 6, lg: 9 };

export default function Logo({ variant = 'dark', size = 'md' }: Props) {
  const fontSize = sizes[size];
  const dotSize = dotSizes[size];
  const hexSize = hexSizes[size];
  const teenColor = variant === 'light' ? '#ffffff' : ds.c.primary;
  const hiveColor = ds.c.secondary; // always amber

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {/* Three small hex dots */}
      <View style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: hexSize,
              height: hexSize,
              borderRadius: hexSize * 0.3,
              backgroundColor: i === 1 ? hiveColor : (variant === 'light' ? 'rgba(255,255,255,0.5)' : ds.c.surfaceContainerHigh),
              transform: [{ rotate: '45deg' }],
            }}
          />
        ))}
      </View>

      {/* Wordmark */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize, color: teenColor, lineHeight: fontSize * 1.2 }}>
          Teen
        </Text>
        <Text style={{ fontFamily: ds.f.serifBold, fontSize, color: hiveColor, lineHeight: fontSize * 1.2 }}>
          Hive
        </Text>
      </View>

      {/* Accent dot */}
      <View style={{ width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: hiveColor, marginBottom: 2 }} />
    </View>
  );
}
