import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutProvider } from '@/context/WorkoutContext';

export default function RootLayout() {
  return (
    <WorkoutProvider>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#0284c7',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e2e8f0',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Daily Log',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'barbell' : 'barbell-outline'}
                size={22}
                color={color as string}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Past Workouts',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={color as string}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: 'AI Report',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'sparkles' : 'sparkles-outline'}
                size={22}
                color={color as string}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'list' : 'list-outline'}
                size={22}
                color={color as string}
              />
            ),
          }}
        />
      </Tabs>
    </WorkoutProvider>
  );
}
