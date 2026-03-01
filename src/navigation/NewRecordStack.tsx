import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NewRecordScreen } from '../screens/NewRecordScreen';
import { useTheme } from '../theme';
import type { NewRecordStackParamList } from './types';

const Stack = createNativeStackNavigator<NewRecordStackParamList>();

export function NewRecordStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="NewRecord" component={NewRecordScreen} options={{ title: '새 기록' }} />
    </Stack.Navigator>
  );
}
