import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { colors, fonts } from '@/theme';

/** The AppleMike mark — same vector as the website (applemike-store/src/components/brand/logo.tsx). */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Apple Mike">
      <Defs>
        <LinearGradient id="tile" x1="0" y1="0" x2="0.4" y2="1">
          <Stop offset="0" stopColor="#d9262b" />
          <Stop offset="1" stopColor="#a81418" />
        </LinearGradient>
      </Defs>
      <Rect width="64" height="64" rx="15" fill="url(#tile)" />
      <Path d="M34.5 17.5 37.2 10.6c.7-1.8 3.1-1.8 3.8 0l2.4 8.6" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M15.6 43.6c-2.3-3.4-1.2-7.4 1.9-11.3l9.6-11.8c2.9-3.4 7.4-4 10.9-1.4l6.4 4.9c3.1 2.4 4.6 6 4 9.7l-1.7 11.6c-.8 5-4.8 6.4-8.3 3.6-4.2-3.4-9.3-3.6-14.1-1.6-3.7 1.5-6.8.1-8.7-3.7Z"
        fill="#fff"
      />
      <Path d="M17.8 49.6c5.2-3 11.4-3.3 16.6 0 3.3 2.2 7.3 2.4 9.4-.6" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" opacity={0.9} />
      <Path d="M30.6 30.4c1.2 5.2 7.4 6.8 11 2.6" fill="none" stroke="#c8191e" strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function Logo() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }} accessibilityRole="header" accessibilityLabel="Apple Mike, Sure Plug">
      <LogoMark size={34} />
      <View>
        <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink950, lineHeight: 20 }}>apple mike</Text>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 9, letterSpacing: 2.4, color: colors.brand }}>SURE PLUG</Text>
      </View>
    </View>
  );
}
