# 앱 아이콘 한 장으로 모두 적용하기

**이미지 하나**만 있으면 iOS·Android 앱 아이콘을 한 번에 모두 만들 수 있습니다.

## 1. 준비

- **한 장의 정사각형 이미지**를 준비하세요.  
  - 권장: **1024×1024 픽셀** (작으면 키우고, 크면 줄어듦)
  - 형식: PNG (투명 배경 가능)

## 2. 사용 방법

**방법 A – 기본 경로 사용**

1. 이미지 파일 이름을 `AppIcon-Source.png` 로 하고  
2. 이 프로젝트의 `assets` 폴더에 넣습니다.  
   - 경로: `ChecklistApp/assets/AppIcon-Source.png`
3. 터미널에서 프로젝트 루트로 이동한 뒤:
   ```bash
   chmod +x scripts/generate-app-icons.sh
   ./scripts/generate-app-icons.sh
   ```

**방법 B – 원하는 경로 지정**

```bash
./scripts/generate-app-icons.sh 경로/내아이콘.png
```

예:

```bash
./scripts/generate-app-icons.sh ~/Downloads/ThinkLess-icon.png
```

## 3. 결과

- **iOS**: `ios/.../AppIcon.appiconset` 안의 모든 아이콘 크기가 갱신됩니다.
- **Android**: `android/.../res/mipmap-*/` 의 `ic_launcher.png`, `ic_launcher_round.png` 가 갱신됩니다.

이미지 한 장만 바꾼 뒤 위 스크립트를 다시 실행하면, 그 이미지로 앱 아이콘이 전부 갱신됩니다.
