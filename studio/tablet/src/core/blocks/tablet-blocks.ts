import * as Blockly from 'blockly/core';

const SERVO_PINS = [
  ['회전판 (핀 6)', '6'],
  ['아래팔 (핀 9)', '9'],
  ['위팔 (핀 10)', '10'],
  ['집게 (핀 11)', '11'],
];

let registered = false;

export function registerTabletBlocks(): void {
  if (registered) return;

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'cubelink_start',
      message0: '▶ 시작하기',
      nextStatement: null,
      colour: '#4739B3',
      hat: 'cap',
      tooltip: '이 블록에 연결된 순서대로 프로그램을 실행합니다.',
    },
    {
      type: 'cubelink_servo_smooth_simple',
      message0: '서보 핀 %1 을 %2 도로 %3 초 동안 부드럽게',
      args0: [
        { type: 'field_dropdown', name: 'PIN', options: SERVO_PINS },
        { type: 'field_number', name: 'ANGLE', value: 90, min: 0, max: 180 },
        { type: 'field_number', name: 'SEC', value: 1, min: 0.1, max: 30 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#6556D9',
      tooltip: '선택한 관절을 목표 각도로 부드럽게 움직입니다.',
    },
    {
      type: 'cubelink_servo_read',
      message0: '%1 현재 각도',
      args0: [{ type: 'field_dropdown', name: 'PIN', options: SERVO_PINS }],
      output: 'Number',
      colour: '#6556D9',
      tooltip: 'Studio가 기억하는 현재 서보 각도를 사용합니다.',
    },
    {
      type: 'cubelink_servo_set',
      message0: '%1 을 %2 도로 움직이기',
      args0: [
        { type: 'field_dropdown', name: 'PIN', options: SERVO_PINS },
        { type: 'field_number', name: 'ANGLE', value: 90, min: 0, max: 180 },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#6556D9',
      tooltip: '선택한 관절을 지정 각도로 움직입니다.',
    },
    {
      type: 'cubelink_gripper',
      message0: '집게 %1',
      args0: [{ type: 'field_dropdown', name: 'ACTION', options: [['열기', 'OPEN'], ['닫기', 'CLOSE']] }],
      previousStatement: null,
      nextStatement: null,
      colour: '#E47D68',
      tooltip: 'CubeLink 집게를 열거나 닫습니다.',
    },
    {
      type: 'cubelink_storage_pose',
      message0: '안전한 보관 자세로 돌아가기',
      previousStatement: null,
      nextStatement: null,
      colour: '#6556D9',
      tooltip: '펌웨어가 소유한 안전 주차 순서로 이동합니다.',
    },
    {
      type: 'cubelink_delay',
      message0: '%1 ms 기다리기',
      args0: [{ type: 'field_number', name: 'MS', value: 500, min: 0, max: 600000 }],
      previousStatement: null,
      nextStatement: null,
      colour: '#54A995',
      tooltip: '다음 동작 전까지 지정한 시간 동안 기다립니다.',
    },
    {
      type: 'cubelink_delay_sec',
      message0: '%1 초 기다리기',
      args0: [{ type: 'field_number', name: 'SEC', value: 1, min: 0, max: 600 }],
      previousStatement: null,
      nextStatement: null,
      colour: '#54A995',
      tooltip: '다음 동작 전까지 초 단위로 기다립니다.',
    },
    {
      type: 'cubelink_repeat_n',
      message0: '%1 번 반복하기 %2 %3',
      args0: [
        { type: 'field_number', name: 'TIMES', value: 3, min: 1, max: 100 },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#54A995',
      tooltip: '안쪽 블록을 정해진 횟수만큼 반복합니다.',
    },
    {
      type: 'cubelink_ultrasonic',
      message0: '초음파 거리 (cm)',
      output: 'Number',
      colour: '#D09B2A',
      tooltip: 'CubeLink의 초음파 센서 거리를 센티미터로 읽습니다.',
    },
    {
      type: 'cubelink_wait_until_distance',
      message0: '거리가 %1 cm 보다 가까울 때까지 기다리기',
      args0: [{ type: 'field_number', name: 'DISTANCE', value: 10, min: 1, max: 400 }],
      previousStatement: null,
      nextStatement: null,
      colour: '#D09B2A',
      tooltip: '초음파 센서가 물체를 감지할 때까지 기다립니다.',
    },
    {
      type: 'cubelink_if_distance',
      message0: '거리가 %1 cm 보다 가까우면 %2 %3',
      args0: [
        { type: 'field_number', name: 'DISTANCE', value: 10, min: 1, max: 400 },
        { type: 'input_dummy' },
        { type: 'input_statement', name: 'DO' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: '#D09B2A',
      tooltip: '물체가 가까이 있을 때만 안쪽 블록을 실행합니다.',
    },
  ]);

  registered = true;
}
