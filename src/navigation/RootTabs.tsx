import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../theme';
import { HomeStack } from './HomeStack';
import { GroupsStack } from './GroupsStack';
import { NewRecordStack } from './NewRecordStack';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICON_SIZE = 22;

export function RootTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: '기록',
          tabBarLabel: '기록',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="clipboard" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="NewRecord"
        component={NewRecordStack}
        options={{
          title: '새 기록',
          tabBarLabel: '새 기록',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="plus-circle" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStack}
        options={{
          title: '그룹 관리',
          tabBarLabel: '그룹',
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="folder" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
