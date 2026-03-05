import { Platform, Vibration } from 'react-native';

// 체크 / 해제 등에 사용할 짧은 햅틱
export function triggerLightHaptic() {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // 너무 강하지 않도록 아주 짧게 진동
    Vibration.vibrate(10);
  }
}

