import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#a80f5c', // Aktif ikon mor olacak
        tabBarInactiveTintColor: '#616161', // Pasif ikonlar gri
        headerShown: false, // Üstteki beyaz başlığı kapatır
        tabBarStyle: {
          height: 70, // Menüyü biraz daha belirgin ve yüksek yapar
          paddingBottom: 10,
          backgroundColor: '#FFFFFF',
        }
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ev',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home-variant" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="products" // Dosya adın explore.tsx olduğu için name böyle kalmalı
        options={{
          title: 'Ürünlerim',
          tabBarIcon: ({ color }) => <FontAwesome5 name="shopping-bag" size={24} color={color} />,
        }}
      />

      {/* PROFİL (Bunu daha sonra app/(tabs)/profile.tsx oluşturunca aktif edersin) */}
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