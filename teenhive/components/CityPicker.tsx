import React, { useState, useMemo } from 'react';
import {
  Modal, View, TextInput, FlatList, TouchableOpacity,
  Text, SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ds } from '@/lib/design';
import { US_CITIES } from '@/lib/usCities';

type Props = {
  visible: boolean;
  value: string;
  onSelect: (city: string) => void;
  onClose: () => void;
  placeholder?: string;
};

export default function CityPicker({ visible, value, onSelect, onClose, placeholder = 'Search cities...' }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_CITIES;
    return US_CITIES.filter(c => c.toLowerCase().includes(q));
  }, [query]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (city: string) => {
    setQuery('');
    onSelect(city);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3fbf4' }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 16 : 16,
          paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e8f0e9',
        }}>
          <Text style={{ flex: 1, fontFamily: ds.f.serifBold, fontSize: 22, color: '#051b0e' }}>Select your city</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color="#051b0e" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#eef6ef', borderRadius: 14, paddingHorizontal: 14, gap: 10,
          }}>
            <Ionicons name="search-outline" size={16} color="#737972" />
            <TextInput
              style={{ flex: 1, fontFamily: ds.f.sans, fontSize: 15, color: '#051b0e', paddingVertical: 13 }}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
          </View>
          {query.length === 0 && (
            <Text style={{ fontFamily: ds.f.sans, fontSize: 12, color: '#9ca3af', marginTop: 8, marginLeft: 2 }}>
              Showing all {US_CITIES.length} cities — type to filter
            </Text>
          )}
        </View>

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isSelected = item === value;
            return (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 20, paddingVertical: 15,
                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                  borderBottomWidth: 1, borderBottomColor: '#f0f4f0',
                }}
              >
                <Ionicons
                  name={isSelected ? 'location' : 'location-outline'}
                  size={16}
                  color={isSelected ? '#22c55e' : '#9ca3af'}
                />
                <Text style={{
                  flex: 1, fontFamily: isSelected ? ds.f.sansSemiBold : ds.f.sans,
                  fontSize: 15, color: isSelected ? '#051b0e' : '#374151',
                }}>
                  {item}
                </Text>
                {isSelected && <Ionicons name="checkmark" size={18} color="#22c55e" />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={() => (
            <View style={{ padding: 48, alignItems: 'center' }}>
              <Ionicons name="search-outline" size={32} color="#c3c8c1" />
              <Text style={{ fontFamily: ds.f.sansMedium, fontSize: 15, color: '#737972', marginTop: 16, textAlign: 'center' }}>
                No cities found for "{query}"
              </Text>
              <Text style={{ fontFamily: ds.f.sans, fontSize: 13, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
                Try searching by city or state (e.g. "Austin" or "TX")
              </Text>
              {query.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSelect(query.trim())}
                  activeOpacity={0.7}
                  style={{
                    marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 10,
                    backgroundColor: '#f0fdf4', borderRadius: 14, borderWidth: 1,
                    borderColor: '#bbf7d0', paddingHorizontal: 20, paddingVertical: 14,
                  }}
                >
                  <Ionicons name="location-outline" size={18} color="#16a34a" />
                  <Text style={{ fontFamily: ds.f.sansSemiBold, fontSize: 14, color: '#16a34a' }}>
                    Use "{query.trim()}" as my location
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}
