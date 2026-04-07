import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-expo';
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1 }}>
      <SignedIn>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Welcome! You're signed in.</Text>
        </View>
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </View>
  );
}
