// ─── Legacy design tokens (used by unredesigned screens: chat, notifications, etc.)
export const colors = {
  ink: '#0a0a0a', body: '#3d3d3d', muted: '#6b7280', placeholder: '#a0a0a0',
  accent: '#22c55e', accentLight: '#f0fdf4', accentBorder: '#bbf7d0',
  surface: '#f5f5f5', white: '#ffffff', border: '#eeeeee', borderStrong: '#e0e0e0',
  error: '#ef4444', errorLight: '#fef2f2', warning: '#f59e0b',
} as const;
export const fonts = {
  display: 'SpaceGrotesk_700Bold', heading: 'SpaceGrotesk_600SemiBold',
  subheading: 'SpaceGrotesk_500Medium', body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium', bodySemiBold: 'Inter_600SemiBold', bodyBold: 'Inter_700Bold',
} as const;
export const type = {
  display: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 42, lineHeight: 46, letterSpacing: -1.5 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  heading: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 20, lineHeight: 24, letterSpacing: -0.3 },
  subheading: { fontFamily: 'SpaceGrotesk_500Medium', fontSize: 17, lineHeight: 22 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  bodySemiBold: { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  captionMedium: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 18 },
} as const;
export const radius = { sm: 6, md: 8, lg: 12, xl: 16, full: 9999 } as const;
export const shadow = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  elevated: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
} as const;
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

// ─── New "Cultivated" design system ──────────────────────────────────────────
export const ds = {
  c: {
    bg:                    '#f3fbf4',
    primary:               '#051b0e',
    secondary:             '#735c00',
    surface:               '#f3fbf4',
    surfaceContainer:      '#e8f0e9',
    surfaceContainerLow:   '#eef6ef',
    surfaceContainerHigh:  '#e2eae3',
    surfaceContainerLowest:'#ffffff',
    secondaryContainer:    '#fed65b',
    primaryContainer:      '#1a3021',
    onSurface:             '#161d19',
    onSurfaceVariant:      '#434843',
    outlineVariant:        '#c3c8c1',
    white:                 '#ffffff',
    error:                 '#ef4444',
  },
  f: {
    serif:        'Newsreader_400Regular_Italic',
    serifBold:    'Newsreader_700Bold_Italic',
    sans:         'Manrope_400Regular',
    sansMedium:   'Manrope_500Medium',
    sansSemiBold: 'Manrope_600SemiBold',
    sansBold:     'Manrope_700Bold',
    sansXBold:    'Manrope_800ExtraBold',
  },
  gradient: ['#051b0e', '#1a3021'] as const,
} as const;

// Reusable style objects
export const dsCard = {
  backgroundColor: '#eef6ef',
  borderRadius: 32,
  padding: 28,
} as const;

export const dsPillBtnText = {
  fontFamily: 'Manrope_700Bold' as const,
  fontSize: 13,
  letterSpacing: 1.5,
  color: '#ffffff',
  textTransform: 'uppercase' as const,
};

export const dsLabel = {
  fontFamily: 'Manrope_600SemiBold' as const,
  fontSize: 11,
  letterSpacing: 2.5,
  textTransform: 'uppercase' as const,
  color: '#434843',
} as const;

export const dsSecondaryLabel = {
  fontFamily: 'Manrope_600SemiBold' as const,
  fontSize: 11,
  letterSpacing: 2.5,
  textTransform: 'uppercase' as const,
  color: '#735c00',
} as const;

export const dsField = {
  backgroundColor: '#eef6ef',
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 14,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 12,
} as const;
