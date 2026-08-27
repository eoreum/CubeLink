import type { RouteDefinition, RouteId } from './types';

export const routes: RouteDefinition[] = [
  { id: 'home', label: '홈', shortLabel: '홈', icon: '⌂', description: '오늘 할 활동을 선택해요' },
  { id: 'missions', label: '미션', shortLabel: '미션', icon: '★', description: '단계별 로봇 미션을 연습해요' },
  { id: 'coding', label: '코딩', shortLabel: '코딩', icon: '◇', description: '블록으로 로봇을 움직여요' },
  { id: 'connection', label: '로봇 연결', shortLabel: '연결', icon: '⌁', description: 'CubeLink를 찾아 연결해요' },
  { id: 'simulation', label: '시뮬레이션', shortLabel: '모의실행', icon: '△', description: '로봇 동작을 미리 확인해요' },
  { id: 'manual', label: '수동 제어', shortLabel: '수동', icon: '✣', description: '관절을 하나씩 안전하게 움직여요' },
  { id: 'projects', label: '프로젝트', shortLabel: '보관함', icon: '▱', description: '저장한 프로젝트를 열어요' },
  { id: 'settings', label: '설정', shortLabel: '설정', icon: '⚙', description: '앱과 수업 환경을 설정해요' },
];

export const visibleBottomRoutes: RouteId[] = ['home', 'coding', 'connection', 'projects'];

export function parseRoute(hash: string): RouteId {
  const candidate = hash.replace(/^#\/?/, '') as RouteId;
  return routes.some((route) => route.id === candidate) ? candidate : 'home';
}
