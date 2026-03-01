import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { HomeScreen } from '../screens/HomeScreen';
import { RecordDetailScreen } from '../screens/RecordDetailScreen';
import { EditRecordScreen } from '../screens/EditRecordScreen';
import { useTheme } from '../theme';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 18, fontWeight: '600' },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '기록',
          headerRight: () => <ThemeToggleButton />,
        }}
      />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: '기록 상세' }} />
      <Stack.Screen name="EditRecord" component={EditRecordScreen} options={{ title: '기록 수정' }} />
    </Stack.Navigator>
  );
}
