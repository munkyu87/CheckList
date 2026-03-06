import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useLanguage } from '../i18n';
import { useTheme } from '../theme';
import { HomeStack } from './HomeStack';
import { GroupsStack } from './GroupsStack';
import { SettingsStack } from './SettingsStack';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICON_SIZE = 22;
const INDICATOR_HEIGHT = 3;
const INDICATOR_WIDTH = 24;

export function RootTabs() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const activeColor = theme.tabBarActive;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
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
          title: t('tabRecords'),
          tabBarLabel: t('tabRecords'),
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -10,
                    width: INDICATOR_WIDTH,
                    height: INDICATOR_HEIGHT,
                    borderRadius: INDICATOR_HEIGHT / 2,
                    backgroundColor: activeColor,
                  }}
                />
              )}
              <Feather name="clipboard" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="GroupsTab"
        component={GroupsStack}
        options={{
          title: t('groupManagement'),
          tabBarLabel: t('tabGroups'),
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -10,
                    width: INDICATOR_WIDTH,
                    height: INDICATOR_HEIGHT,
                    borderRadius: INDICATOR_HEIGHT / 2,
                    backgroundColor: activeColor,
                  }}
                />
              )}
              <Feather name="folder" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsStack}
        options={{
          title: t('tabSettings'),
          tabBarLabel: t('tabSettings'),
          tabBarIcon: ({ focused, color }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    top: -10,
                    width: INDICATOR_WIDTH,
                    height: INDICATOR_HEIGHT,
                    borderRadius: INDICATOR_HEIGHT / 2,
                    backgroundColor: activeColor,
                  }}
                />
              )}
              <Feather name="settings" size={ICON_SIZE} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}
