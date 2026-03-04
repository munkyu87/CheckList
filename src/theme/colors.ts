/**
 * 라이트 / 다크 테마 색상
 * 깔끔한 요즘 스타일 UI
 */

export type ThemeMode = 'light' | 'dark' | 'sakura';

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

export const darkTheme: ThemeColors = {
  background: '#0f172a',
  backgroundSecondary: '#1e293b',
  surface: '#1e293b',
  surfaceVariant: '#334155',
  text: '#f8fafc',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  primary: '#3b82f6',
  primaryPressed: '#60a5fa',
  border: '#334155',
  borderLight: '#475569',
  danger: '#ef4444',
  dangerPressed: '#f87171',
  tabBar: '#1e293b',
  tabBarBorder: '#334155',
  tabBarActive: '#60a5fa',
  tabBarInactive: '#94a3b8',
  inputBackground: '#334155',
  inputBorder: '#475569',
  placeholder: '#64748b',
  buttonSecondary: '#334155',
  buttonSecondaryText: '#cbd5e1',
  orderButton: '#334155',
  orderButtonDisabled: '#1e293b',
  orderButtonText: '#cbd5e1',
  orderButtonTextDisabled: '#64748b',
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
