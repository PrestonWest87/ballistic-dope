import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f23' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#0f0f23' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ballistic Dope' }} />
      <Stack.Screen name="quick" options={{ title: 'Quick Dirty' }} />
      <Stack.Screen name="advanced" options={{ title: 'Advanced' }} />
      <Stack.Screen name="long-range" options={{ title: 'Long Range' }} />
      <Stack.Screen name="extreme" options={{ title: 'Extreme Range' }} />
    </Stack>
  );
}