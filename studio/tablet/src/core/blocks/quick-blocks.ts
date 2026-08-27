export type QuickBlockId = 'servo' | 'gripper' | 'delay' | 'repeat' | 'distance' | 'storage';

export const quickBlocks: Array<{
  id: QuickBlockId;
  type: string;
  label: string;
  description: string;
  tone: string;
}> = [
  { id: 'servo', type: 'cubelink_servo_smooth_simple', label: '관절 움직이기', description: '각도와 시간을 정해요', tone: 'purple' },
  { id: 'gripper', type: 'cubelink_gripper', label: '집게 움직이기', description: '집게를 열거나 닫아요', tone: 'coral' },
  { id: 'delay', type: 'cubelink_delay', label: '기다리기', description: '다음 동작을 잠시 멈춰요', tone: 'mint' },
  { id: 'repeat', type: 'cubelink_repeat_n', label: '반복하기', description: '안쪽 동작을 여러 번 해요', tone: 'mint' },
  { id: 'distance', type: 'cubelink_wait_until_distance', label: '거리 기다리기', description: '물체가 가까워질 때까지 기다려요', tone: 'yellow' },
  { id: 'storage', type: 'cubelink_storage_pose', label: '보관 자세', description: '안전한 자세로 돌아가요', tone: 'purple' },
];
