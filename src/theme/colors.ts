/**
 * 라이트 / 다크 테마 색상
 * 깔끔한 요즘 스타일 UI
 */

export type ThemeMode = 'light' | 'sakura' | 'ocean' | 'midnight' | 'forest';

export interface ThemeColors {
  // 배경
  background: string;
  backgroundSecondary: string;
  // 카드·패널
  surface: string;
  surfaceVariant: string;
  // 텍스트
  text: string;
  textSecondary: string;
  textTertiary: string;
  // 강조
  primary: string;
  primaryPressed: string;
  // 구분선·테두리
  border: string;
  borderLight: string;
  // 기능
  danger: string;
  dangerPressed: string;
  // 탭바
  tabBar: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
  // 입력
  inputBackground: string;
  inputBorder: string;
  placeholder: string;
  // 버튼 보조 (취소 등)
  buttonSecondary: string;
  buttonSecondaryText: string;
  // 순서 버튼
  orderButton: string;
  orderButtonDisabled: string;
  orderButtonText: string;
  orderButtonTextDisabled: string;
}

export const lightTheme: ThemeColors = {
  background: '#f8fafc',
  backgroundSecondary: '#f1f5f9',
  surface: '#ffffff',
  surfaceVariant: '#f1f5f9',
  text: '#0f172a',
  textSecondary: '#475569',
  textTertiary: '#64748b',
  primary: '#2563eb',
  primaryPressed: '#1d4ed8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  danger: '#dc2626',
  dangerPressed: '#b91c1c',
  tabBar: '#ffffff',
  tabBarBorder: '#e2e8f0',
  tabBarActive: '#2563eb',
  tabBarInactive: '#64748b',
  inputBackground: '#ffffff',
  inputBorder: '#e2e8f0',
  placeholder: '#94a3b8',
  buttonSecondary: '#f1f5f9',
  buttonSecondaryText: '#334155',
  orderButton: '#f1f5f9',
  orderButtonDisabled: '#f8fafc',
  orderButtonText: '#475569',
  orderButtonTextDisabled: '#94a3b8',
};

export const sakuraTheme: ThemeColors = {
  background: '#fff7fb',
  backgroundSecondary: '#ffeef7',
  surface: '#ffffff',
  surfaceVariant: '#ffe4f1',
  text: '#311b1f',
  textSecondary: '#6b4b57',
  textTertiary: '#9d6b7c',
  primary: '#ec4899',
  primaryPressed: '#db2777',
  border: '#fed7e2',
  borderLight: '#ffe4f1',
  danger: '#f97373',
  dangerPressed: '#fb4f4f',
  tabBar: '#ffffff',
  tabBarBorder: '#fed7e2',
  tabBarActive: '#ec4899',
  tabBarInactive: '#9d6b7c',
  inputBackground: '#fffafa',
  inputBorder: '#fed7e2',
  placeholder: '#c08497',
  buttonSecondary: '#ffe4f1',
  buttonSecondaryText: '#6b4b57',
  orderButton: '#ffe4f1',
  orderButtonDisabled: '#fff7fb',
  orderButtonText: '#6b4b57',
  orderButtonTextDisabled: '#c08497',
};

export const oceanTheme: ThemeColors = {
  background: '#f0f9ff',
  backgroundSecondary: '#e0f2fe',
  surface: '#ffffff',
  surfaceVariant: '#e0f2fe',
  text: '#0c4a6e',
  textSecondary: '#0369a1',
  textTertiary: '#0284c7',
  primary: '#0ea5e9',
  primaryPressed: '#0284c7',
  border: '#bae6fd',
  borderLight: '#e0f2fe',
  danger: '#ef4444',
  dangerPressed: '#dc2626',
  tabBar: '#ffffff',
  tabBarBorder: '#bae6fd',
  tabBarActive: '#0ea5e9',
  tabBarInactive: '#7dd3fc',
  inputBackground: '#f8fcff',
  inputBorder: '#bae6fd',
  placeholder: '#38bdf8',
  buttonSecondary: '#e0f2fe',
  buttonSecondaryText: '#0369a1',
  orderButton: '#e0f2fe',
  orderButtonDisabled: '#f0f9ff',
  orderButtonText: '#0369a1',
  orderButtonTextDisabled: '#7dd3fc',
};

/** 미드나잇: 진한 인디고/보라 밤하늘 (다크와 구분) */
export const midnightTheme: ThemeColors = {
  background: '#0f0a1a',
  backgroundSecondary: '#1a1225',
  surface: '#1e1a2e',
  surfaceVariant: '#2a2438',
  text: '#f5f3ff',
  textSecondary: '#c4b5fd',
  textTertiary: '#a78bfa',
  primary: '#a78bfa',
  primaryPressed: '#8b5cf6',
  border: '#3730a3',
  borderLight: '#4c1d95',
  danger: '#f87171',
  dangerPressed: '#fb7185',
  tabBar: '#1e1a2e',
  tabBarBorder: '#3730a3',
  tabBarActive: '#a78bfa',
  tabBarInactive: '#6d28d9',
  inputBackground: '#2a2438',
  inputBorder: '#4c1d95',
  placeholder: '#7c3aed',
  buttonSecondary: '#2a2438',
  buttonSecondaryText: '#c4b5fd',
  orderButton: '#2a2438',
  orderButtonDisabled: '#1e1a2e',
  orderButtonText: '#c4b5fd',
  orderButtonTextDisabled: '#6d28d9',
};

/** 포레스트 그린: 숲/잎사귀 느낌의 초록 계열 */
export const forestTheme: ThemeColors = {
  background: '#f0fdf4',
  backgroundSecondary: '#dcfce7',
  surface: '#ffffff',
  surfaceVariant: '#dcfce7',
  text: '#14532d',
  textSecondary: '#166534',
  textTertiary: '#15803d',
  primary: '#16a34a',
  primaryPressed: '#15803d',
  border: '#bbf7d0',
  borderLight: '#dcfce7',
  danger: '#dc2626',
  dangerPressed: '#b91c1c',
  tabBar: '#ffffff',
  tabBarBorder: '#bbf7d0',
  tabBarActive: '#16a34a',
  tabBarInactive: '#4ade80',
  inputBackground: '#f8fff9',
  inputBorder: '#bbf7d0',
  placeholder: '#22c55e',
  buttonSecondary: '#dcfce7',
  buttonSecondaryText: '#166534',
  orderButton: '#dcfce7',
  orderButtonDisabled: '#f0fdf4',
  orderButtonText: '#166534',
  orderButtonTextDisabled: '#4ade80',
};
