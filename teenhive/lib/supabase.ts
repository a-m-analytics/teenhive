import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// SecureStore has a 2048-byte limit per key.
// Supabase session tokens can exceed this, so we chunk large values.
const CHUNK_SIZE = 1800;

const ChunkedSecureStore = {
  getItem: async (key: string): Promise<string | null> => {
    // Try reading as a single value first (backwards compat)
    const single = await SecureStore.getItemAsync(key);
    if (single !== null) return single;

    // Try reading chunks
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (!countStr) return null;
    const count = parseInt(countStr, 10);
    let result = '';
    for (let i = 0; i < count; i++) {
      const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
      if (chunk === null) return null;
      result += chunk;
    }
    return result;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      // Clean up any previous chunks
      await ChunkedSecureStore.removeItem(key);
      await SecureStore.setItemAsync(key, value);
      return;
    }

    // Remove any previous single-key value
    try { await SecureStore.deleteItemAsync(key); } catch {}

    const chunks = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      await SecureStore.setItemAsync(
        `${key}_chunk_${i}`,
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
    await SecureStore.setItemAsync(`${key}_count`, String(chunks));
  },

  removeItem: async (key: string): Promise<void> => {
    try { await SecureStore.deleteItemAsync(key); } catch {}
    const countStr = await SecureStore.getItemAsync(`${key}_count`);
    if (countStr) {
      const count = parseInt(countStr, 10);
      for (let i = 0; i < count; i++) {
        try { await SecureStore.deleteItemAsync(`${key}_chunk_${i}`); } catch {}
      }
      try { await SecureStore.deleteItemAsync(`${key}_count`); } catch {}
    }
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aeuegnnwagxjaqnpouxu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFldWVnbm53YWd4amFxbnBvdXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNzUxNDMsImV4cCI6MjA5MDc1MTE0M30.nMlM0TckGarOODNq-TIXGGom_8hUycL1Bk0a8CSiLSo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ChunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
