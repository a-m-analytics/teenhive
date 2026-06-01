import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Redirect any unmatched route back to the root instead of showing a broken screen.
export default function NotFound() {
  const router = useRouter();
  useEffect(() => { router.replace('/'); }, []);
  return null;
}
