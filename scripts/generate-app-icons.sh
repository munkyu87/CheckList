#!/usr/bin/env bash
# 앱 아이콘 소스 이미지 하나(권장 1024x1024)로 iOS·Android 모든 크기 생성
# 사용법: ./scripts/generate-app-icons.sh [소스이미지경로]
# 예:     ./scripts/generate-app-icons.sh assets/MyIcon.png
#        소스 생략 시 assets/AppIcon-Source.png 사용

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$ROOT/assets/AppIcon-Source.png}"

if [[ ! -f "$SRC" ]]; then
  echo "소스 이미지를 찾을 수 없습니다: $SRC"
  echo "사용법: $0 [이미지경로]"
  echo "예: $0 assets/AppIcon-Source.png"
  exit 1
fi

# 1024로 맞춤 (비율 유지, 잘라내기 없음)
TMP1024=$(mktemp).png
/usr/bin/sips -z 1024 1024 "$SRC" --out "$TMP1024"

IOS="$ROOT/ios/ChecklistApp/Images.xcassets/AppIcon.appiconset"
echo "iOS 아이콘 생성 중..."
/usr/bin/sips -z 1024 1024 "$TMP1024" --out "$IOS/Icon-App-1024x1024@1x.png"
/usr/bin/sips -z 40 40   "$TMP1024" --out "$IOS/Icon-App-20x20@2x.png"
/usr/bin/sips -z 60 60   "$TMP1024" --out "$IOS/Icon-App-20x20@3x.png"
/usr/bin/sips -z 58 58   "$TMP1024" --out "$IOS/Icon-App-29x29@2x.png"
/usr/bin/sips -z 87 87   "$TMP1024" --out "$IOS/Icon-App-29x29@3x.png"
/usr/bin/sips -z 80 80   "$TMP1024" --out "$IOS/Icon-App-40x40@2x.png"
/usr/bin/sips -z 120 120 "$TMP1024" --out "$IOS/Icon-App-40x40@3x.png"
/usr/bin/sips -z 120 120 "$TMP1024" --out "$IOS/Icon-App-60x60@2x.png"
/usr/bin/sips -z 180 180 "$TMP1024" --out "$IOS/Icon-App-60x60@3x.png"

ANDROID="$ROOT/android/app/src/main/res"
echo "Android 아이콘 생성 중..."
for size in 48:mdpi 72:hdpi 96:xhdpi 144:xxhdpi 192:xxxhdpi; do
  px="${size%%:*}"
  name="${size##*:}"
  /usr/bin/sips -z $px $px "$TMP1024" --out "$ANDROID/mipmap-$name/ic_launcher.png"
  /usr/bin/sips -z $px $px "$TMP1024" --out "$ANDROID/mipmap-$name/ic_launcher_round.png"
done

rm -f "$TMP1024"
echo "완료. iOS + Android 앱 아이콘이 한 번에 적용되었습니다."
