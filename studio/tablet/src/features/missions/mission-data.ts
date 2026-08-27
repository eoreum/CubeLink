import type { QuickBlockId } from '../../core/blocks/quick-blocks';

export interface TabletMission {
  id: string;
  number: number;
  title: string;
  summary: string;
  duration: string;
  level: '첫걸음' | '기초' | '도전';
  accent: string;
  goal: string;
  blocks: string[];
  quickBlockIds: QuickBlockId[];
  steps: string[];
}

export const tabletMissions: TabletMission[] = [
  {
    id: 'hello-arm',
    number: 1,
    title: '로봇팔과 인사하기',
    summary: '회전판과 집게를 움직여 인사 동작을 만들어요.',
    duration: '약 10분',
    level: '첫걸음',
    accent: 'purple',
    goal: '관절과 각도의 의미를 이해하고 블록을 순서대로 연결합니다.',
    blocks: ['관절 움직이기', '기다리기', '집게 움직이기'],
    quickBlockIds: ['servo', 'delay', 'gripper'],
    steps: ['회전판을 60도로 움직이기', '1초 기다리기', '집게를 열고 다시 닫기'],
  },
  {
    id: 'pick-and-place',
    number: 2,
    title: '물건 옮기기',
    summary: '물건을 집어서 오른쪽 작업 구역으로 옮겨요.',
    duration: '약 20분',
    level: '기초',
    accent: 'mint',
    goal: '여러 관절과 집게를 안전한 순서로 제어합니다.',
    blocks: ['아래팔 움직이기', '위팔 움직이기', '집게 닫기', '반복하기'],
    quickBlockIds: ['servo', 'gripper', 'delay', 'repeat', 'storage'],
    steps: ['물건 앞으로 팔 내리기', '집게로 물건 잡기', '팔을 들어 옮기기', '집게 열기'],
  },
  {
    id: 'distance-guard',
    number: 3,
    title: '거리 센서 경비원',
    summary: '물체가 가까워지면 로봇팔이 반응하게 만들어요.',
    duration: '약 25분',
    level: '도전',
    accent: 'yellow',
    goal: '센서 값과 조건에 따라 다른 행동을 실행합니다.',
    blocks: ['거리 기다리기', '거리 조건', '관절 움직이기'],
    quickBlockIds: ['distance', 'servo', 'gripper', 'storage'],
    steps: ['10cm 거리 조건 만들기', '가까워질 때까지 기다리기', '집게를 열어 신호 보내기'],
  },
];

export function getMission(id: string | null): TabletMission {
  return tabletMissions.find((mission) => mission.id === id) ?? tabletMissions[0];
}
