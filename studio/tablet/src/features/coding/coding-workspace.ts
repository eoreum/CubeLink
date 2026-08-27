import * as Blockly from 'blockly/core';
import 'blockly/blocks';
import * as Ko from 'blockly/msg/ko';
import { type QuickBlockId, quickBlocks } from '../../core/blocks/quick-blocks';
import { registerTabletBlocks } from '../../core/blocks/tablet-blocks';
import type { TabletProjectRecord } from '../../core/storage/project-store';
import type { IndexedDbProjectStore } from '../../core/storage/indexed-db-project-store';
import { createSimulationPlan, type SimulationPlanResult } from '../simulation/simulation-program';

Blockly.setLocale(Ko);
registerTabletBlocks();

const toolbox: Blockly.utils.toolbox.ToolboxDefinition = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: '움직임',
      colour: '#6556D9',
      contents: [
        { kind: 'block', type: 'cubelink_start' },
        { kind: 'block', type: 'cubelink_servo_smooth_simple' },
        { kind: 'block', type: 'cubelink_servo_set' },
        { kind: 'block', type: 'cubelink_servo_read' },
        { kind: 'block', type: 'cubelink_gripper' },
        { kind: 'block', type: 'cubelink_storage_pose' },
      ],
    },
    {
      kind: 'category',
      name: '제어',
      colour: '#54A995',
      contents: [
        { kind: 'block', type: 'cubelink_delay' },
        { kind: 'block', type: 'cubelink_delay_sec' },
        { kind: 'block', type: 'cubelink_repeat_n' },
      ],
    },
    {
      kind: 'category',
      name: '센서',
      colour: '#D09B2A',
      contents: [
        { kind: 'block', type: 'cubelink_ultrasonic' },
        { kind: 'block', type: 'cubelink_wait_until_distance' },
        { kind: 'block', type: 'cubelink_if_distance' },
      ],
    },
    {
      kind: 'category',
      name: '숫자',
      colour: '#6F7585',
      contents: [{ kind: 'block', type: 'math_number' }],
    },
  ],
};

function workspaceXml(workspace: Blockly.Workspace): string {
  return Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace));
}

function seedWorkspace(workspace: Blockly.WorkspaceSvg): void {
  const start = workspace.newBlock('cubelink_start');
  start.initSvg();
  start.render();
  start.moveBy(70, 55);

  const first = workspace.newBlock('cubelink_servo_smooth_simple');
  first.setFieldValue('6', 'PIN');
  first.setFieldValue(45, 'ANGLE');
  first.initSvg();
  first.render();
  first.moveBy(70, 105);
  start.nextConnection?.connect(first.previousConnection!);

  const delay = workspace.newBlock('cubelink_delay');
  delay.initSvg();
  delay.render();
  delay.moveBy(70, 145);
  first.nextConnection?.connect(delay.previousConnection!);

  const arm = workspace.newBlock('cubelink_servo_smooth_simple');
  arm.setFieldValue('9', 'PIN');
  arm.setFieldValue(110, 'ANGLE');
  arm.initSvg();
  arm.render();
  arm.moveBy(70, 220);
  delay.nextConnection?.connect(arm.previousConnection!);

  const gripper = workspace.newBlock('cubelink_gripper');
  gripper.setFieldValue('CLOSE', 'ACTION');
  gripper.initSvg();
  gripper.render();
  gripper.moveBy(70, 295);
  arm.nextConnection?.connect(gripper.previousConnection!);
}

function loadXml(workspace: Blockly.WorkspaceSvg, xmlText: string): void {
  if (!xmlText.trim()) {
    seedWorkspace(workspace);
    return;
  }
  const xml = Blockly.utils.xml.textToDom(xmlText);
  Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
}

export interface CodingWorkspaceSession {
  dispose(): Promise<void>;
  insertQuickBlock(id: QuickBlockId): void;
  createSimulationPlan(): SimulationPlanResult;
  resetWorkspace(xmlText: string): Promise<void>;
  saveNow(): Promise<void>;
}

export function mountCodingWorkspace(
  container: HTMLElement,
  project: TabletProjectRecord,
  store: IndexedDbProjectStore,
  onStatus: (status: 'editing' | 'saving' | 'saved' | 'error') => void,
): CodingWorkspaceSession {
  const workspace = Blockly.inject(container, {
    toolbox,
    renderer: 'zelos',
    trashcan: true,
    scrollbars: true,
    move: { scrollbars: true, drag: true, wheel: true },
    zoom: { controls: true, wheel: true, startScale: 0.9, minScale: 0.55, maxScale: 1.5, scaleSpeed: 1.15 },
    sounds: false,
    grid: { spacing: 24, length: 2, colour: '#d8d4ca', snap: false },
  });

  loadXml(workspace, project.workspaceXml);
  const protectMissionStart = () => {
    if (!project.missionId) return;
    workspace.getBlocksByType('cubelink_start', false).forEach((block) => block.setDeletable(false));
  };
  protectMissionStart();
  let timer: number | undefined;
  let disposed = false;

  const save = async () => {
    if (disposed) return;
    onStatus('saving');
    try {
      project.workspaceXml = workspaceXml(workspace);
      project.updatedAt = new Date().toISOString();
      await store.save(project);
      onStatus('saved');
    } catch (error) {
      console.error('[tablet] project save failed', error);
      onStatus('error');
    }
  };

  workspace.addChangeListener((event) => {
    if (event.isUiEvent || event.type === Blockly.Events.FINISHED_LOADING) return;
    onStatus('editing');
    window.clearTimeout(timer);
    timer = window.setTimeout(() => void save(), 650);
  });

  const insertQuickBlock = (id: QuickBlockId) => {
    const definition = quickBlocks.find((block) => block.id === id);
    if (!definition) return;
    Blockly.Events.setGroup(true);
    const block = workspace.newBlock(definition.type);
    block.initSvg();
    block.render();
    const starts = workspace.getTopBlocks(true).filter((candidate) => candidate.type === 'cubelink_start');
    let appended = false;
    if (starts.length === 1 && block.previousConnection) {
      let tail = starts[0];
      while (tail.getNextBlock()) tail = tail.getNextBlock()!;
      if (tail.nextConnection && !tail.nextConnection.isConnected()) {
        tail.nextConnection.connect(block.previousConnection);
        appended = true;
      }
    }
    if (!appended) {
      const metrics = workspace.getMetrics();
      const existing = workspace.getTopBlocks(true);
      block.moveBy(metrics.viewLeft + 70, metrics.viewTop + 70 + existing.length * 58);
    }
    block.select();
    Blockly.Events.setGroup(false);
  };

  const resize = () => Blockly.svgResize(workspace);
  window.addEventListener('resize', resize);
  window.setTimeout(resize, 0);

  return {
    insertQuickBlock,
    createSimulationPlan: () => createSimulationPlan(workspace, project),
    async resetWorkspace(xmlText) {
      Blockly.Events.setGroup(true);
      try {
        const xml = Blockly.utils.xml.textToDom(xmlText);
        Blockly.Xml.clearWorkspaceAndLoadFromXml(xml, workspace);
        protectMissionStart();
        workspace.getTopBlocks(true)[0]?.select();
        workspace.scrollCenter();
      } finally {
        Blockly.Events.setGroup(false);
      }
      await save();
    },
    saveNow: save,
    async dispose() {
      window.clearTimeout(timer);
      await save();
      disposed = true;
      window.removeEventListener('resize', resize);
      workspace.dispose();
    },
  };
}
