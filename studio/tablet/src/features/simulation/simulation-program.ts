import type * as Blockly from 'blockly/core';
import { jointSafetyError, type ServoPin } from './robot-arm-safety';

export type SimulationCommand =
  | { kind: 'servo'; pin: ServoPin; angle: number; durationMs: number; blockId: string; label: string }
  | { kind: 'gripper'; action: 'OPEN' | 'CLOSE'; durationMs: number; blockId: string; label: string }
  | { kind: 'wait'; durationMs: number; blockId: string; label: string }
  | { kind: 'wait-distance'; distanceCm: number; durationMs: number; blockId: string; label: string }
  | { kind: 'storage'; durationMs: number; blockId: string; label: string };

export interface SimulationPlan {
  version: 1;
  projectId: string;
  projectName: string;
  missionId?: string;
  commands: SimulationCommand[];
  warnings: string[];
  createdAt: string;
}

export interface SimulationPlanResult {
  plan?: SimulationPlan;
  errors: string[];
}

const numberField = (block: Blockly.Block, name: string, fallback: number): number => {
  const value = Number(block.getFieldValue(name));
  return Number.isFinite(value) ? value : fallback;
};

function collectChain(first: Blockly.Block | null, commands: SimulationCommand[], warnings: string[], depth = 0): void {
  if (depth > 8) {
    warnings.push('반복 블록이 너무 깊어 일부 동작을 생략했습니다.');
    return;
  }
  let block = first;
  while (block) {
    const blockId = block.id;
    switch (block.type) {
      case 'cubelink_servo_smooth_simple': {
        const pin = numberField(block, 'PIN', 6) as ServoPin;
        const angle = numberField(block, 'ANGLE', 90);
        const durationMs = Math.max(100, numberField(block, 'SEC', 1) * 1000);
        commands.push({ kind: 'servo', pin, angle, durationMs, blockId, label: `${jointObject(pin)} ${angle}°로 부드럽게` });
        break;
      }
      case 'cubelink_servo_set': {
        const pin = numberField(block, 'PIN', 6) as ServoPin;
        const angle = numberField(block, 'ANGLE', 90);
        commands.push({ kind: 'servo', pin, angle, durationMs: 500, blockId, label: `${jointObject(pin)} ${angle}°로 이동` });
        break;
      }
      case 'cubelink_gripper': {
        const action = block.getFieldValue('ACTION') === 'CLOSE' ? 'CLOSE' : 'OPEN';
        commands.push({ kind: 'gripper', action, durationMs: 650, blockId, label: `집게 ${action === 'OPEN' ? '열기' : '닫기'}` });
        break;
      }
      case 'cubelink_delay': {
        const durationMs = Math.max(0, numberField(block, 'MS', 500));
        commands.push({ kind: 'wait', durationMs, blockId, label: `${durationMs}ms 기다리기` });
        break;
      }
      case 'cubelink_delay_sec': {
        const seconds = Math.max(0, numberField(block, 'SEC', 1));
        commands.push({ kind: 'wait', durationMs: seconds * 1000, blockId, label: `${seconds}초 기다리기` });
        break;
      }
      case 'cubelink_repeat_n': {
        const times = Math.min(10, Math.max(1, numberField(block, 'TIMES', 1)));
        const nested: SimulationCommand[] = [];
        collectChain(block.getInputTargetBlock('DO'), nested, warnings, depth + 1);
        for (let index = 0; index < times; index += 1) commands.push(...nested.map((command) => ({ ...command })));
        break;
      }
      case 'cubelink_wait_until_distance': {
        const distanceCm = numberField(block, 'DISTANCE', 10);
        commands.push({ kind: 'wait-distance', distanceCm, durationMs: 850, blockId, label: `${distanceCm}cm 물체 감지 기다리기` });
        break;
      }
      case 'cubelink_if_distance': {
        const distanceCm = numberField(block, 'DISTANCE', 10);
        commands.push({ kind: 'wait-distance', distanceCm, durationMs: 650, blockId, label: `${distanceCm}cm 거리 조건 확인` });
        collectChain(block.getInputTargetBlock('DO'), commands, warnings, depth + 1);
        break;
      }
      case 'cubelink_storage_pose':
        commands.push({ kind: 'storage', durationMs: 900, blockId, label: '안전한 보관 자세' });
        break;
      default:
        warnings.push(`‘${block.type}’ 블록은 아직 3D 실행을 지원하지 않습니다.`);
    }
    block = block.getNextBlock();
  }
}

function jointName(pin: number): string {
  return ({ 6: '회전판', 9: '아래팔', 10: '위팔', 11: '집게' } as Record<number, string>)[pin] ?? `핀 ${pin}`;
}

function jointObject(pin: number): string {
  const name = jointName(pin);
  return `${name}${name === '집게' || name === '아래팔' || name === '위팔' ? '를' : '을'}`;
}

export function createSimulationPlan(
  workspace: Blockly.WorkspaceSvg,
  project: { id: string; name: string; missionId?: string },
): SimulationPlanResult {
  const starts = workspace.getTopBlocks(true).filter((block) => block.type === 'cubelink_start');
  if (!starts.length) return { errors: ['▶ 시작하기 블록이 필요합니다.'] };
  if (starts.length > 1) return { errors: ['시작하기 블록은 하나만 사용할 수 있습니다.'] };
  const first = starts[0].getNextBlock();
  if (!first) return { errors: ['시작하기 블록 아래에 실행할 블록을 연결해 주세요.'] };

  const commands: SimulationCommand[] = [];
  const warnings: string[] = [];
  collectChain(first, commands, warnings);
  if (!commands.length) return { errors: ['3D로 실행할 수 있는 동작 블록이 없습니다.'] };
  const safetyErrors = commands.flatMap((command) => {
    if (command.kind !== 'servo') return [];
    const error = jointSafetyError(command.pin, command.angle);
    return error ? [error] : [];
  });
  if (safetyErrors.length) return { errors: [...new Set(safetyErrors)] };
  const disconnected = workspace.getTopBlocks(true).filter((block) => block !== starts[0]);
  if (disconnected.length) warnings.push(`시작하기에 연결되지 않은 블록 ${disconnected.length}개는 실행하지 않습니다.`);

  return {
    errors: [],
    plan: {
      version: 1,
      projectId: project.id,
      projectName: project.name,
      missionId: project.missionId,
      commands,
      warnings,
      createdAt: new Date().toISOString(),
    },
  };
}

export interface MissionCheckResult {
  success: boolean;
  title: string;
  message: string;
  missing: string[];
}

const indexOf = (commands: SimulationCommand[], predicate: (command: SimulationCommand) => boolean, after = -1) =>
  commands.findIndex((command, index) => index > after && predicate(command));

const opensGripper = (command: SimulationCommand) =>
  (command.kind === 'gripper' && command.action === 'OPEN')
  || (command.kind === 'servo' && command.pin === 11 && command.angle >= 90);

const closesGripper = (command: SimulationCommand) =>
  (command.kind === 'gripper' && command.action === 'CLOSE')
  || (command.kind === 'servo' && command.pin === 11 && command.angle < 90);

export function checkMissionProgram(missionId: string | undefined, commands: SimulationCommand[]): MissionCheckResult | undefined {
  if (!missionId) return undefined;
  const missing: string[] = [];
  if (missionId === 'hello-arm') {
    const move = indexOf(commands, (command) => command.kind === 'servo' && command.pin === 6 && Math.abs(command.angle - 60) <= 5);
    if (move < 0) missing.push('회전판을 60도로 움직이기');
    const wait = indexOf(commands, (command) => command.kind === 'wait' && command.durationMs >= 1000, move);
    if (wait < 0) missing.push('회전판 다음에 1초 기다리기');
    const open = indexOf(commands, opensGripper, wait);
    if (open < 0) missing.push('집게 열기');
    const close = indexOf(commands, closesGripper, open);
    if (close < 0) missing.push('집게를 연 다음 다시 닫기');
  } else if (missionId === 'pick-and-place') {
    if (indexOf(commands, (command) => command.kind === 'servo' && command.pin === 9) < 0) missing.push('아래팔 움직이기');
    if (indexOf(commands, (command) => command.kind === 'servo' && command.pin === 10) < 0) missing.push('위팔 움직이기');
    const close = indexOf(commands, closesGripper);
    if (close < 0) missing.push('물건을 잡도록 집게 닫기');
    if (indexOf(commands, opensGripper, close) < 0) missing.push('옮긴 뒤 집게 열기');
  } else if (missionId === 'distance-guard') {
    const sensor = indexOf(commands, (command) => command.kind === 'wait-distance' && command.distanceCm <= 10);
    if (sensor < 0) missing.push('10cm 거리 감지 또는 기다리기');
    if (indexOf(commands, (command) => command.kind === 'servo' || command.kind === 'gripper', sensor) < 0) missing.push('감지한 뒤 로봇팔 반응 동작');
  }
  return missing.length
    ? { success: false, title: '조금만 더 완성해 볼까요?', message: '실행은 잘 되었지만 미션 조건이 아직 남아 있어요.', missing }
    : { success: true, title: '미션 완료!', message: '블록 순서와 3D 동작이 미션 목표와 모두 맞습니다.', missing: [] };
}
