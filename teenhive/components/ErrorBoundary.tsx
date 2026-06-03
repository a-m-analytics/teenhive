import React from 'react';
import { View, Text } from 'react-native';

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3fbf4', padding: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#051b0e', marginBottom: 8 }}>Something went wrong</Text>
          <Text style={{ fontSize: 14, color: '#737972', textAlign: 'center' }}>{this.state.error?.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
