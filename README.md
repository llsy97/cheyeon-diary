# 하루한줄

한 줄 일기와 이번 달 목표를 기록하는 데일리 달력 다이어리입니다. React Native + Expo SDK 58(TypeScript, Expo Router)로 만들었습니다. 모든 데이터는 기기 안(AsyncStorage)에만 저장되고, 서버는 쓰지 않습니다.

## 실행

```bash
npm install
npx expo start        # 휴대폰 Expo Go 앱으로 QR 스캔 (a = 안드로이드 에뮬레이터, w = 웹)
```

> 알림은 휴대폰에서만 동작합니다. 웹 미리보기에서는 화면만 확인할 수 있습니다.
> 로컬 알림은 Expo Go에서도 동작합니다.

검사: `npx tsc --noEmit`, `npx eslint src`

## 폴더 구조

```
src/
  app/                    # Expo Router 화면
    _layout.tsx           # 폰트, 데이터/알림 Provider, 월초 선택 화면 띄우기
    (tabs)/_layout.tsx    # 하단 탭 5개
    (tabs)/index.tsx      # 오늘
    (tabs)/calendar.tsx   # 달력
    (tabs)/stats.tsx      # 통계
    (tabs)/goals.tsx      # 목표
    (tabs)/notifications.tsx  # 알림
    month-setup.tsx       # 지난달 목표 이어가기 / 새로 정하기
  lib/
    types.ts              # 데이터 모델 (DiaryEntry, MonthlyGoal, GoalCheck, Settings)
    storage.ts            # AsyncStorage 읽기/쓰기
    date.ts               # 날짜 유틸
    stats.ts              # 연속 기록, 히트맵 단계, 월 통계 (순수 함수)
    notifications.ts      # 알림 권한, 예약 로직
  store/
    DataContext.tsx       # 앱 상태 + 훅 (useAppData, useMonthGoals, useSettings)
    NotificationContext.tsx  # 권한 상태, 첫 실행 권한 요청, 자동 재예약
  components/             # 공통 UI, 목표 아이콘, 타임피커, SVG 차트
```

## 단계별 확인 방법

개발 모드에서는 **알림** 탭 맨 아래에 **"개발용 도구"** 카드가 나옵니다.

1. **데이터/저장소**: 오늘 탭에서 한 줄을 쓰고 저장한 뒤 앱을 완전히 껐다 켜서, 기록이 남아 있는지 확인합니다.
2. **오늘 화면**: 60자 제한, 목표 탭으로 완료/해제, 진행률 바를 확인합니다.
3. **목표 화면**: 추천 칩을 탭해서 바로 추가하고, 6개가 넘으면 더 추가되지 않는지 봅니다. 휴지통을 누른 뒤 "삭제"를 한 번 더 눌러 지웁니다.
   "월초 선택 화면 열기"로 월초 화면을 확인합니다.
4. **달력**: "샘플 데이터 채우기"를 누른 뒤 히트맵 색, 날짜를 눌렀을 때 나오는 카드, 미래 날짜 비활성을 확인합니다.
5. **통계**: 샘플 데이터 상태에서 도넛, 최장 연속 목표, 가로/세로 막대를 확인합니다.
6. **알림 예약**: 설정을 바꾸면 "예약된 알림" 목록이 바로 다시 채워집니다.
   오늘 일기를 쓰면 23시 리마인드 목록에서 오늘 날짜가 빠집니다.
   "5초 뒤 테스트 알림"으로 실제 알림이 오는지 확인합니다.

## 알림 동작

| 종류 | 예약 방식 |
|---|---|
| 매일 기록 알림 | 7일 모두 선택하면 DAILY, 아니면 선택한 요일마다 WEEKLY |
| 목표별 알림 | 알림 시간을 정한 목표마다 DAILY |
| 23시 리마인드 | 앞으로 14일치를 날짜별 1회(DATE)로 예약. 반복 요일에만, 이미 일기를 쓴 날은 제외 |

- 설정, 목표, 일기가 바뀔 때마다 `cancelAllScheduledNotificationsAsync()`로 모두 취소한 뒤 다시 예약합니다.
- 로컬 알림은 울리는 순간 조건을 검사할 수 없습니다. 그래서 일기를 저장하면 전체를 다시 예약해서 그날의 23시 알림을 뺍니다.
- 처음 실행할 때 한 번 알림 권한을 묻습니다. 거부하면 알림 탭에 안내 문구와 "설정 열기" 버튼이 나옵니다.
