import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GroupListScreen } from '../screens/GroupListScreen';
import { GroupDetailScreen } from '../screens/GroupDetailScreen';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import type { GroupsStackParamList } from './types';

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export function GroupsStack() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      <Stack.Screen name="GroupList" component={GroupListScreen} options={{ title: t('groupManagement') }} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} options={{ title: t('groupDetail') }} />
    </Stack.Navigator>
  );
}
