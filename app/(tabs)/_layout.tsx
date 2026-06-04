import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#a80f5c',
        tabBarInactiveTintColor: '#616161',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'android' ? 58 + bottomInset : 54 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ev',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="products" 
        options={{
          title: 'Ürünlerim',
          tabBarIcon: ({ color }) => <FontAwesome5 name="shopping-bag" size={24} color={color} />,
        }}
      />

      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forum"
        options={{
          title: 'Forum',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-analysis"
        options={{
          title: 'AI Analiz',
          tabBarIcon: ({ color }) => <Ionicons name="analytics" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}