# CubeLink 실물 모델 3D 시뮬레이션

태블릿 시뮬레이터는 Desktop의 `studio/web/models/*.glb` 다섯 부품과
`studio/web/js/simulator3D.js`의 조립 좌표 및 서보 회전 규칙을 사용한다.

- PIN 6: 베이스 Y축, `(angle - 90)°`
- PIN 9: 하단 암 Z축, `(angle - 90)°`
- PIN 10: 상단 암 Z축, `(angle - 90)°`
- PIN 11: 양쪽 집게 Y축, `(angle - 90)° × 1.2`

`robot-arm-safety.ts`는 현재 펌웨어 v1.4.2 개발기와 같은 소프트웨어 제한을
공유한다. PIN 6은 10~170°, PIN 9는 30~170°, PIN 10은 10~160°이며 Blockly
실행 계획은 이 범위를 벗어나면 3D 진입 전에 차단된다. 보관 자세 시각화는
`PARK_90_30_160_90` 프로필을 따른다. 기구 충돌과 물리 판정은 아직 포함하지 않는다.

Android 패키지는 Desktop 설치 경로에 의존할 수 없으므로 동일한 원본 GLB를
`public/models/cubelink-arm/`에 포함한다. 현재 복사본은 Desktop 원본과 SHA-256이
동일하다. Desktop 모델이 승인된 새 버전으로 바뀌면 두 위치의 해시를 비교한 뒤
태블릿 복사본도 함께 갱신한다. Desktop 소스와 모델은 태블릿 개발에서 수정하지 않는다.
