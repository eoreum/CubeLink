export type ServoPin = 6 | 9 | 10 | 11;

export interface JointSafetyProfile {
  pin: ServoPin;
  name: string;
  min: number;
  max: number;
}

// CubeLink firmware v1.4.2의 현재 개발기 소프트웨어 제한과 같은 값이다.
// 실제 기구 끝점 측정이 끝나기 전까지 이 범위를 넓히지 않는다.
export const JOINT_SAFETY_PROFILES: Record<ServoPin, JointSafetyProfile> = {
  6: { pin: 6, name: '회전판', min: 10, max: 170 },
  9: { pin: 9, name: '아래팔', min: 30, max: 170 },
  10: { pin: 10, name: '위팔', min: 10, max: 160 },
  11: { pin: 11, name: '집게', min: 0, max: 180 },
};

export const STORAGE_POSE = {
  base: 90,
  lower: 30,
  upper: 160,
  gripper: 90,
} as const;

export function jointSafetyError(pin: ServoPin, angle: number): string | undefined {
  const profile = JOINT_SAFETY_PROFILES[pin];
  if (angle >= profile.min && angle <= profile.max) return undefined;
  return `${profile.name}(핀 ${pin}) ${angle}°는 안전 범위 ${profile.min}~${profile.max}°를 벗어납니다.`;
}
