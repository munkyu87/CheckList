import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { NewRecordScreen } from '../screens/NewRecordScreen';
import { RecordDetailScreen } from '../screens/RecordDetailScreen';
import { EditRecordScreen } from '../screens/EditRecordScreen';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  const { theme } = useTheme();
  const { t } = useLanguage();
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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Stack.Screen name="NewRecord" component={NewRecordScreen} options={{ title: t('newRecord') }} />
      <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: t('recordDetail') }} />
      <Stack.Screen name="EditRecord" component={EditRecordScreen} options={{ title: t('editRecord') }} />
    </Stack.Navigator>
  );
}
