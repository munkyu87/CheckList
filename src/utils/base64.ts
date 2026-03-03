/**
 * UTF-8 문자열을 Base64로 인코딩 (한글 등 지원)
 * react-native-share의 iOS/Android는 file:// 대신 base64 data URL을 권장함.
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
