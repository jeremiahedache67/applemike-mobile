import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from '@/components/text';

import { imageUrl } from '@/lib/config';
import { colors, fonts } from '@/theme';
import { LogoMark } from './logo';

/** Product photo, or the same flat "photo on request" card the website uses when there is none. */
export function ProductImage({ src, name, dimmed, style }: { src?: string | null; name: string; dimmed?: boolean; style?: ViewStyle }) {
  const uri = imageUrl(src);
  return (
    <View style={[{ backgroundColor: uri ? colors.ink100 : colors.ink950, overflow: 'hidden' }, style]}>
      {uri ? (
        <Image source={uri} style={[StyleSheet.absoluteFill, dimmed && { opacity: 0.5 }]} contentFit="cover" transition={150} cachePolicy="memory-disk" accessibilityLabel={name} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6 }]} accessibilityLabel={`${name} — photo on request`}>
          <LogoMark size={36} />
          <Text style={{ color: colors.white, fontFamily: fonts.displaySemi, fontSize: 12, textAlign: 'center' }} numberOfLines={2}>
            {name}
          </Text>
          <Text style={{ color: colors.ink400, fontSize: 10 }}>Photo on request</Text>
        </View>
      )}
    </View>
  );
}
