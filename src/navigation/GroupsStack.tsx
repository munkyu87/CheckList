import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupListScreen } from '../screens/GroupListScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { useTheme } from '../theme';
import type { GroupsStackParamList } from './types';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStack() {
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
      <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: '체크리스트 관리' }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: '그룹 상세' }} />
    </Stack.Navigator>
  );
}
