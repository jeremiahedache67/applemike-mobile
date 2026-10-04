import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NIGERIAN_STATES } from '@/lib/checkout';
import { colors, fonts, PAGE } from '@/theme';
import { s } from './ui';

/** Tappable field that opens a full list of Nigerian states (same list as the website). */
export function StatePicker({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>State</Text>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`State: ${value || 'not selected'}`} style={[s.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, error ? s.inputError : null]}>
        <Text style={{ fontSize: 16, color: value ? colors.ink950 : colors.ink400 }}>{value || 'Select state'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.ink500} />
      </Pressable>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, paddingTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: PAGE, paddingBottom: 8 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 20 }}>Choose state</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={26} color={colors.ink950} />
            </Pressable>
          </View>
          <FlatList
            data={NIGERIAN_STATES as readonly string[]}
            keyExtractor={(x) => x}
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: item === value }}
                style={({ pressed }) => ({ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: PAGE, paddingVertical: 15, backgroundColor: pressed ? colors.ink50 : undefined })}>
                <Text style={{ fontSize: 16, color: colors.ink950, fontWeight: item === value ? '700' : '400' }}>{item}</Text>
                {item === value && <Ionicons name="checkmark" size={20} color={colors.brand} />}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
