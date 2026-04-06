import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // This project is a scaffold — redirect or add screens here
  }, []);

  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}
