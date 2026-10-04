import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import { createContext, useContext } from 'react';
import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

// Brand fonts, as on the website: Inter for text, Space Grotesk for headings and prices.
// Using our own <Text> means the app looks the same on every phone, even when the phone has a
// custom system font set (e.g. Samsung font styles).

export const brandFonts = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
};

const FontsReady = createContext(false);

/** Loads the brand fonts; text re-renders in the brand font as soon as they're available. */
export function FontsProvider({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts(brandFonts);
  return <FontsReady.Provider value={loaded && !error}>{children}</FontsReady.Provider>;
}

export const useFontsReady = () => useContext(FontsReady);

// Android needs a separate font family per weight.
const interFor = (weight: TextStyle['fontWeight']) => {
  const w = String(weight ?? '400');
  if (w === 'bold' || Number(w) >= 700) return 'Inter_700Bold';
  if (Number(w) >= 600) return 'Inter_600SemiBold';
  if (Number(w) >= 500) return 'Inter_500Medium';
  return 'Inter_400Regular';
};

export function Text({ style, ...props }: TextProps) {
  const ready = useFontsReady();
  if (!ready) return <RNText style={style} {...props} />;
  const flat = StyleSheet.flatten(style) ?? {};
  // Respect explicit families (e.g. Space Grotesk headings); otherwise use Inter at the right weight.
  const family = flat.fontFamily ?? interFor(flat.fontWeight);
  return <RNText style={[style, { fontFamily: family, fontWeight: flat.fontFamily ? flat.fontWeight : undefined }]} {...props} />;
}
