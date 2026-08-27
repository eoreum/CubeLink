import './styles.css';
import { quickBlocks, type QuickBlockId } from './core/blocks/quick-blocks';
import { createProject, IndexedDbProjectStore } from './core/storage/indexed-db-project-store';
import type { TabletProjectRecord } from './core/storage/project-store';
import type { CodingWorkspaceSession } from './features/coding/coding-workspace';
import { getMission, tabletMissions } from './features/missions/mission-data';
import { ensureStartBlockXml, missionWorkspaceXml } from './features/missions/mission-workspaces';
import type { RobotArm3DSimulator, RobotArmPose } from './features/simulation/robot-arm-3d';
import { JOINT_SAFETY_PROFILES, STORAGE_POSE } from './features/simulation/robot-arm-safety';
import type { SimulationCommand, SimulationPlan } from './features/simulation/simulation-program';
import { parseRoute, routes, visibleBottomRoutes } from './routes';
import type { RouteId } from './types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found.');
}

const appRoot = app;
const projectStore = new IndexedDbProjectStore();
const ACTIVE_PROJECT_KEY = 'cubelink.tablet.activeProjectId';
const ACTIVE_MISSION_KEY = 'cubelink.tablet.activeMissionId';
const SIMULATION_PLAN_KEY = 'cubelink.tablet.simulationPlan';
const COMPLETED_MISSIONS_KEY = 'cubelink.tablet.completedMissionIds';
let codingSession: CodingWorkspaceSession | undefined;
let simulation3D: RobotArm3DSimulator | undefined;
let simulationTimer: number | undefined;
let simulationRunToken = 0;
let renderVersion = 0;

function pendingSimulationPlan(): SimulationPlan | undefined {
  try {
    const value = JSON.parse(sessionStorage.getItem(SIMULATION_PLAN_KEY) ?? 'null') as SimulationPlan | null;
    return value?.version === 1 && Array.isArray(value.commands) ? value : undefined;
  } catch {
    return undefined;
  }
}

function completedMissions(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(COMPLETED_MISSIONS_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

async function ensureProjectStartBlock(project: TabletProjectRecord): Promise<TabletProjectRecord> {
  const migratedXml = ensureStartBlockXml(project.workspaceXml);
  if (migratedXml === project.workspaceXml) return project;
  project.workspaceXml = migratedXml;
  project.updatedAt = new Date().toISOString();
  await projectStore.save(project);
  return project;
}

async function activeProject(): Promise<TabletProjectRecord> {
  const projects = await projectStore.list();
  const activeMissionId = localStorage.getItem(ACTIVE_MISSION_KEY);
  if (activeMissionId) {
    const mission = getMission(activeMissionId);
    let missionProject = projects.find((project) => project.missionId === mission.id);
    if (!missionProject) {
      missionProject = createProject(
        `미션 ${mission.number} · ${mission.title}`,
        missionWorkspaceXml(mission.id),
        mission.id,
      );
      await projectStore.save(missionProject);
    }
    localStorage.setItem(ACTIVE_PROJECT_KEY, missionProject.id);
    return ensureProjectStartBlock(missionProject);
  }

  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (activeId) {
    const project = await projectStore.get(activeId);
    if (project) return ensureProjectStartBlock(project);
  }

  const project = projects.find((item) => !item.missionId) ?? createProject('나의 첫 CubeLink');
  if (!projects.length) await projectStore.save(project);
  localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
  return ensureProjectStartBlock(project);
}

const icon = (name: 'bolt' | 'robot' | 'blocks' | 'arrow' | 'usb') => {
  const paths = {
    bolt: '<path d="m13 2-8 11h6l-1 9 8-12h-6l1-8Z"/>',
    robot: '<rect x="4" y="7" width="16" height="12" rx="4"/><path d="M9 11h.01M15 11h.01M9 15h6M12 7V4M10 4h4"/>',
    blocks: '<rect x="3" y="4" width="8" height="7" rx="2"/><rect x="13" y="4" width="8" height="7" rx="2"/><rect x="8" y="13" width="8" height="7" rx="2"/>',
    arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
    usb: '<path d="M12 3v13M9 6l3-3 3 3M12 11l-4 4M8 15H5v4h4v-4M12 13l4 3M16 16h3M19 14v4"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
};

function navItem(routeId: RouteId, current: RouteId, compact = false): string {
  const route = routes.find(({ id }) => id === routeId)!;
  const selected = route.id === current;
  return `
    <a class="nav-item${selected ? ' is-active' : ''}" href="#/${route.id}"
       aria-current="${selected ? 'page' : 'false'}" data-route="${route.id}">
      <span class="nav-icon" aria-hidden="true">${route.icon}</span>
      <span>${compact ? route.shortLabel : route.label}</span>
    </a>`;
}

function header(current: RouteId): string {
  const route = routes.find(({ id }) => id === current)!;
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">CubeLink Studio Tablet</p>
        <h1>${route.label}</h1>
      </div>
      <button class="profile-button" type="button" aria-label="학생 프로필">
        <span aria-hidden="true">학</span><span class="profile-copy">학생 모드</span>
      </button>
    </header>`;
}

function homeScreen(): string {
  const done = completedMissions();
  const nextMission = tabletMissions.find((mission) => !done.has(mission.id));
  const progress = Math.round((done.size / tabletMissions.length) * 100);
  return `
    <section class="screen home-screen" aria-labelledby="welcome-title">
      <article class="hero-card">
        <div class="hero-copy">
          <span class="status-chip"><i></i> 오늘의 미션</span>
          <h2 id="welcome-title">안녕하세요!<br />로봇팔을 움직여 볼까요?</h2>
          <p>블록을 순서대로 연결하고 3D 시뮬레이션에서 확인해요.</p>
          <a class="primary-button" href="#/missions">미션 시작 ${icon('arrow')}</a>
        </div>
        <div class="hero-visual" aria-hidden="true">
          <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
          <div class="robot-mark">${icon('robot')}</div>
          <span class="floating-block block-a"></span><span class="floating-block block-b"></span>
        </div>
      </article>

      <div class="section-heading">
        <div><p class="eyebrow">바로 시작하기</p><h2>무엇을 해볼까요?</h2></div>
      </div>
      <div class="action-grid">
        <a class="action-card card-coding" href="#/coding">
          <span class="action-icon">${icon('blocks')}</span>
          <span><strong>코딩하기</strong><small>블록을 조립해요</small></span><b>→</b>
        </a>
        <a class="action-card card-connect" href="#/connection">
          <span class="action-icon">${icon('usb')}</span>
          <span><strong>로봇 연결</strong><small>USB-C로 연결해요</small></span><b>→</b>
        </a>
        <a class="action-card card-sim" href="#/simulation">
          <span class="action-icon">${icon('robot')}</span>
          <span><strong>미리 움직이기</strong><small>안전하게 확인해요</small></span><b>→</b>
        </a>
      </div>

      <article class="progress-card">
        <div class="progress-ring"><span>${done.size}</span><small>/ ${tabletMissions.length}</small></div>
        <div><p class="eyebrow">나의 진행</p><h3>${done.size === tabletMissions.length ? '모든 미션 완료!' : '로봇팔 기초 탐험'}</h3><p>${nextMission ? `다음: ${nextMission.title}` : '자유 코딩에 도전해 보세요'}</p></div>
        <div class="progress-bar" aria-label="진행률 ${progress}%"><i style="width:${progress}%"></i></div>
      </article>
    </section>`;
}

function codingScreen(): string {
  const activeMissionId = localStorage.getItem(ACTIVE_MISSION_KEY);
  const selectedMission = getMission(activeMissionId);
  const missionLabel = activeMissionId ? `미션 ${selectedMission.number}` : '자유 코딩';
  const practiceLabel = activeMissionId ? `${selectedMission.title} 연습` : '나만의 동작 만들기';
  const paletteBlocks = activeMissionId
    ? quickBlocks.filter((block) => selectedMission.quickBlockIds.includes(block.id))
    : quickBlocks;
  return `
    <section class="screen coding-screen" aria-labelledby="coding-title">
      <div class="page-intro">
        <div><span class="status-chip soft">${missionLabel}</span><h2 id="coding-title">블록으로 로봇을 움직여요</h2><p><strong id="coding-project-name">프로젝트 준비 중</strong> · ${practiceLabel}</p></div>
        <div class="coding-actions"><span class="save-status" id="save-status" data-state="saving">불러오는 중</span>${activeMissionId ? '<button class="mission-reset-button" id="mission-reset" type="button">↺ 미션 처음부터</button>' : ''}<button class="save-button" id="save-now" type="button">지금 저장</button><button class="simulate-button" id="simulate-program" type="button">◇ 3D로 실행</button><button class="run-button" type="button" disabled title="실제 로봇 실행은 안전 연결 구현 후 활성화됩니다">▶ 실제 로봇</button></div>
      </div>
      <div class="coding-notice" id="coding-notice" hidden></div>
      ${activeMissionId ? `<aside class="mission-coding-guide" aria-label="현재 미션 성공 조건"><div><span class="mission-guide-number">MISSION ${selectedMission.number}</span><strong>${selectedMission.title}</strong><small>${selectedMission.goal}</small></div><ol>${selectedMission.steps.map((step) => `<li>${step}</li>`).join('')}</ol><span class="mission-guide-run">블록을 연결한 뒤<br /><b>◇ 3D로 실행</b></span></aside>` : ''}
      <div class="coding-layout">
        <aside class="block-palette quick-palette" aria-label="빠른 블록 추가">
          <p class="eyebrow">빠른 블록</p><h3>눌러서 추가</h3>
          ${paletteBlocks.map((block) => `<button class="quick-block ${block.tone}" type="button" data-quick-block="${block.id}"><span>${block.label}</span><small>${block.description}</small><b>＋</b></button>`).join('')}
        </aside>
        <div class="blockly-host" id="blockly-host" aria-label="Blockly 작업 공간"></div>
      </div>
    </section>`;
}

function missionsScreen(): string {
  const selected = getMission(localStorage.getItem(ACTIVE_MISSION_KEY));
  const done = completedMissions();
  return `
    <section class="screen missions-screen" aria-labelledby="missions-title">
      <div class="page-intro"><div><span class="status-chip soft">연습 교실</span><h2 id="missions-title">하나씩 따라 해봐요</h2><p>설명을 읽고 블록을 연결한 뒤 시뮬레이션으로 확인합니다.</p></div></div>
      <div class="mission-layout">
        <div class="mission-list" role="list" aria-label="미션 목록">
          ${tabletMissions.map((mission) => `<button class="mission-card ${mission.accent}${mission.id === selected.id ? ' is-selected' : ''}${done.has(mission.id) ? ' is-done' : ''}" type="button" data-mission="${mission.id}"><b>${done.has(mission.id) ? '✓' : mission.number}</b><span><small>${done.has(mission.id) ? '완료 · 다시 연습 가능' : `${mission.level} · ${mission.duration}`}</small><strong>${mission.title}</strong><em>${mission.summary}</em></span><i>→</i></button>`).join('')}
        </div>
        <article class="mission-detail" id="mission-detail">${missionDetail(selected.id)}</article>
      </div>
    </section>`;
}

function missionDetail(id: string): string {
  const mission = getMission(id);
  const completed = completedMissions().has(id);
  return `
    <div class="mission-detail-head"><span class="mission-number">MISSION ${mission.number}</span><span class="status-chip ${completed ? 'soft' : 'neutral'}">${completed ? '✓ 완료' : mission.level}</span></div>
    <h2>${mission.title}</h2><p class="mission-goal">${mission.goal}</p>
    <h3>사용할 블록</h3><div class="mission-blocks">${mission.blocks.map((block) => `<span>◇ ${block}</span>`).join('')}</div>
    <h3>연습 순서</h3><ol class="mission-steps">${mission.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
    <div class="mission-detail-actions"><button class="secondary-button" type="button" data-preview-mission="${mission.id}">시뮬레이션 보기</button><button class="primary-button" type="button" data-start-mission="${mission.id}">블록 연습 시작 ${icon('arrow')}</button></div>`;
}

function simulationScreen(): string {
  const plan = pendingSimulationPlan();
  return `
    <section class="screen simulation-screen" aria-labelledby="simulation-title">
      <div class="page-intro"><div><span class="status-chip soft">${plan?.missionId ? `${getMission(plan.missionId).title} 확인` : 'Desktop 실물 모델 연동'}</span><h2 id="simulation-title">CubeLink 3D 시뮬레이션</h2><p>${plan ? `‘${escapeHtml(plan.projectName)}’의 블록 ${plan.commands.length}개를 시작부터 순서대로 실행합니다.` : 'Studio와 동일한 5개 부품 모델과 관절 좌표로 실제 로봇팔의 자세를 확인하세요.'}</p></div><div class="simulation-actions">${plan ? '<a class="secondary-button simulation-back" href="#/coding">← 블록 수정</a>' : ''}<button class="secondary-button" id="sim-reset" type="button">처음 자세</button><button class="primary-button" id="sim-play" type="button" disabled>${plan ? '▶ 블록 실행' : '▶ 자동 시연'}</button></div></div>
      <div class="simulation-layout">
        <div class="simulation-stage">
          <div class="sim-status"><i></i><span id="sim-message">3D 엔진을 준비하는 중…</span></div>
          <div class="sim-model-badge"><b>5 PART GLB</b><span>Desktop Studio 원본</span></div>
          <button class="sim-camera-reset" id="sim-camera-reset" type="button">⌂ 시점 복귀</button>
          <div class="robot-3d-host" id="robot-3d-host" aria-label="CubeLink 실물 3D 모델 영역"></div>
          <div class="sim-gesture-hint">한 손가락 회전 · 두 손가락 확대/축소</div>
          <div class="mission-result" id="mission-result" hidden></div>
        </div>
        <aside class="simulation-controls" aria-label="로봇팔 관절 조절">
          <p class="eyebrow">관절 조절</p><h3>직접 움직여 보기</h3>
          ${simulationSlider('base', '회전판 · PIN 6', 90, JOINT_SAFETY_PROFILES[6].min, JOINT_SAFETY_PROFILES[6].max)}
          ${simulationSlider('lower', '아래팔 · PIN 9', 90, JOINT_SAFETY_PROFILES[9].min, JOINT_SAFETY_PROFILES[9].max)}
          ${simulationSlider('upper', '위팔 · PIN 10', 90, JOINT_SAFETY_PROFILES[10].min, JOINT_SAFETY_PROFILES[10].max)}
          <div class="sim-control-row"><div><strong>집게</strong><small>물건을 잡고 놓아요</small></div><button class="gripper-toggle" id="gripper-toggle" type="button" data-closed="false">열림</button></div>
          <div class="sim-tip"><b>실물 데이터 기준</b><span>회전판 10~170° · 아래팔 30~170° · 위팔 10~160°. Desktop과 같은 회전축을 사용하며 범위를 벗어난 블록은 실행 전에 멈춥니다.</span></div>
          ${plan ? `<div class="sim-program"><b>실행할 블록</b><ol>${plan.commands.map((command) => `<li>${escapeHtml(command.label)}</li>`).join('')}</ol>${plan.warnings.map((warning) => `<p>⚠ ${escapeHtml(warning)}</p>`).join('')}</div>` : ''}
        </aside>
      </div>
    </section>`;
}

function simulationSlider(id: string, label: string, value: number, min: number, max: number): string {
  return `<label class="sim-slider" for="sim-${id}"><span><strong>${label}</strong><output id="sim-${id}-value">${value}°</output></span><input id="sim-${id}" type="range" min="${min}" max="${max}" value="${value}" /></label>`;
}

function connectionScreen(): string {
  return `
    <section class="screen connection-screen" aria-labelledby="connection-title">
      <div class="connection-panel">
        <div class="connection-illustration"><span>${icon('usb')}</span><i></i><span>${icon('robot')}</span></div>
        <span class="status-chip neutral">연결 안 됨</span>
        <h2 id="connection-title">CubeLink를 태블릿에 연결해 주세요</h2>
        <p>USB-C OTG 어댑터로 CubeLink Nano를 연결하면 앱이 자동으로 장치를 찾습니다.</p>
        <button class="primary-button disabled" type="button" disabled>장치 검색 · 다음 구현</button>
        <div class="connection-steps">
          <span><b>1</b> USB-C 연결</span><em></em><span><b>2</b> 접근 허용</span><em></em><span><b>3</b> 안전 확인</span>
        </div>
        <div class="truth-note"><strong>현재 프로토타입 범위</strong><span>화면과 상태 구조만 동작합니다. Android USB 권한, CH340 드라이버, 펌웨어 검증과 자동 재연결은 다음 구현 항목입니다.</span></div>
      </div>
    </section>`;
}

function projectsScreen(): string {
  return `
    <section class="screen projects-screen" aria-labelledby="projects-title">
      <div class="page-intro">
        <div><span class="status-chip soft">기기에 자동 저장</span><h2 id="projects-title">내 프로젝트</h2><p>인터넷 없이도 이 태블릿에 안전하게 저장됩니다.</p></div>
        <button class="primary-button" id="new-project" type="button">＋ 새 프로젝트</button>
      </div>
      <div class="project-list" id="project-list"><div class="project-loading">프로젝트를 불러오는 중입니다.</div></div>
    </section>`;
}

function placeholderScreen(routeId: RouteId): string {
  const route = routes.find(({ id }) => id === routeId)!;
  return `
    <section class="screen placeholder-screen">
      <div class="placeholder-icon">${route.icon}</div>
      <p class="eyebrow">V1 화면 구조</p><h2>${route.label}</h2><p>${route.description}</p>
      <span class="status-chip neutral">후속 구현 예정</span>
    </section>`;
}

function content(current: RouteId): string {
  if (current === 'home') return homeScreen();
  if (current === 'missions') return missionsScreen();
  if (current === 'coding') return codingScreen();
  if (current === 'connection') return connectionScreen();
  if (current === 'simulation') return simulationScreen();
  if (current === 'projects') return projectsScreen();
  return placeholderScreen(current);
}

function updateSaveStatus(status: 'editing' | 'saving' | 'saved' | 'error'): void {
  const element = document.querySelector<HTMLElement>('#save-status');
  if (!element) return;
  const labels = { editing: '편집 중', saving: '저장 중', saved: '저장됨', error: '저장 확인 필요' };
  element.dataset.state = status;
  element.textContent = labels[status];
}

async function mountCoding(version: number): Promise<void> {
  try {
    sessionStorage.removeItem(SIMULATION_PLAN_KEY);
    const project = await activeProject();
    if (version !== renderVersion || parseRoute(window.location.hash) !== 'coding') return;
    const host = document.querySelector<HTMLElement>('#blockly-host');
    const name = document.querySelector<HTMLElement>('#coding-project-name');
    if (!host || !name) return;
    name.textContent = project.name;
    const { mountCodingWorkspace } = await import('./features/coding/coding-workspace');
    if (version !== renderVersion || parseRoute(window.location.hash) !== 'coding') return;
    codingSession = mountCodingWorkspace(host, project, projectStore, updateSaveStatus);
    updateSaveStatus('saved');
    document.querySelectorAll<HTMLButtonElement>('[data-quick-block]').forEach((button) => {
      button.addEventListener('click', () => codingSession?.insertQuickBlock(button.dataset.quickBlock as QuickBlockId));
    });
    document.querySelector('#save-now')?.addEventListener('click', () => void codingSession?.saveNow());
    document.querySelector('#simulate-program')?.addEventListener('click', async () => {
      if (!codingSession) return;
      const result = codingSession.createSimulationPlan();
      const notice = document.querySelector<HTMLElement>('#coding-notice');
      if (result.errors.length || !result.plan) {
        if (notice) {
          notice.hidden = false;
          notice.dataset.tone = 'error';
          notice.textContent = result.errors.join(' ');
        }
        return;
      }
      if (notice) {
        notice.hidden = false;
        notice.dataset.tone = 'info';
        notice.textContent = `시작하기에 연결된 블록 ${result.plan.commands.length}개를 3D로 준비합니다.`;
      }
      await codingSession.saveNow();
      sessionStorage.setItem(SIMULATION_PLAN_KEY, JSON.stringify(result.plan));
      window.location.hash = '#/simulation';
    });
    const resetButton = document.querySelector<HTMLButtonElement>('#mission-reset');
    let resetArmed = false;
    let resetArmTimer: number | undefined;
    resetButton?.addEventListener('click', async () => {
      if (!project.missionId || !codingSession) return;
      if (!resetArmed) {
        resetArmed = true;
        resetButton.dataset.armed = 'true';
        resetButton.textContent = '한 번 더 눌러 처음부터';
        window.clearTimeout(resetArmTimer);
        resetArmTimer = window.setTimeout(() => {
          resetArmed = false;
          resetButton.dataset.armed = 'false';
          resetButton.textContent = '↺ 미션 처음부터';
        }, 3500);
        return;
      }
      window.clearTimeout(resetArmTimer);
      resetArmed = false;
      await codingSession.resetWorkspace(missionWorkspaceXml(project.missionId));
      resetButton.dataset.armed = 'false';
      resetButton.textContent = '✓ 처음 상태로 준비됨';
      window.setTimeout(() => { if (resetButton.isConnected) resetButton.textContent = '↺ 미션 처음부터'; }, 1400);
    });
  } catch (error) {
    console.error('[tablet] coding workspace failed', error);
    const host = document.querySelector<HTMLElement>('#blockly-host');
    if (host) host.innerHTML = '<div class="workspace-error"><strong>작업 공간을 열 수 없습니다.</strong><span>앱을 다시 시작해 주세요.</span></div>';
    updateSaveStatus('error');
  }
}

async function hydrateProjects(version: number): Promise<void> {
  const list = document.querySelector<HTMLElement>('#project-list');
  if (!list) return;
  try {
    const projects = await projectStore.list();
    if (version !== renderVersion) return;
    const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    list.innerHTML = projects.length
      ? projects.map((project) => `
          <article class="project-card${project.id === activeId ? ' is-current' : ''}">
            <div class="project-symbol">◇</div>
            <div><span class="status-chip ${project.id === activeId ? 'soft' : 'neutral'}">${project.id === activeId ? '현재 프로젝트' : project.missionId ? '미션 연습' : '저장됨'}</span><h3>${escapeHtml(project.name)}</h3><p>${formatProjectDate(project.updatedAt)} · ${project.missionId ? '학습 기록' : '자유 코딩'} · CubeLink ARM</p></div>
            <button class="open-project" type="button" data-open-project="${project.id}" data-project-mission="${project.missionId ?? ''}">열기</button>
          </article>`).join('')
      : '<div class="project-empty">아직 저장된 프로젝트가 없습니다.</div>';
    list.querySelectorAll<HTMLButtonElement>('[data-open-project]').forEach((button) => {
      button.addEventListener('click', () => {
        localStorage.setItem(ACTIVE_PROJECT_KEY, button.dataset.openProject!);
        const missionId = button.dataset.projectMission;
        if (missionId) localStorage.setItem(ACTIVE_MISSION_KEY, missionId);
        else localStorage.removeItem(ACTIVE_MISSION_KEY);
        window.location.hash = '#/coding';
      });
    });
  } catch (error) {
    console.error('[tablet] project list failed', error);
    list.innerHTML = '<div class="project-empty">프로젝트 목록을 불러오지 못했습니다.</div>';
  }
}

function escapeHtml(value: string): string {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function mountMissions(): void {
  const detail = document.querySelector<HTMLElement>('#mission-detail');
  const cards = document.querySelectorAll<HTMLButtonElement>('[data-mission]');
  const bindDetailActions = () => {
    detail?.querySelector<HTMLButtonElement>('[data-preview-mission]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.previewMission!;
      localStorage.setItem(ACTIVE_MISSION_KEY, id);
      sessionStorage.removeItem(SIMULATION_PLAN_KEY);
      window.location.hash = '#/simulation';
    });
    detail?.querySelector<HTMLButtonElement>('[data-start-mission]')?.addEventListener('click', (event) => {
      const id = (event.currentTarget as HTMLButtonElement).dataset.startMission!;
      localStorage.setItem(ACTIVE_MISSION_KEY, id);
      window.location.hash = '#/coding';
    });
  };
  cards.forEach((card) => card.addEventListener('click', () => {
    const id = card.dataset.mission!;
    localStorage.setItem(ACTIVE_MISSION_KEY, id);
    cards.forEach((item) => item.classList.toggle('is-selected', item === card));
    if (detail) detail.innerHTML = missionDetail(id);
    bindDetailActions();
  }));
  bindDetailActions();
}

async function mountSimulation(version: number): Promise<void> {
  const plan = pendingSimulationPlan();
  const inputs = {
    base: document.querySelector<HTMLInputElement>('#sim-base'),
    lower: document.querySelector<HTMLInputElement>('#sim-lower'),
    upper: document.querySelector<HTMLInputElement>('#sim-upper'),
  };
  if (!inputs.base || !inputs.lower || !inputs.upper) return;
  const { base, lower, upper } = inputs;
  const message = document.querySelector<HTMLElement>('#sim-message');
  const gripperButton = document.querySelector<HTMLButtonElement>('#gripper-toggle');
  const playButton = document.querySelector<HTMLButtonElement>('#sim-play');
  const resultPanel = document.querySelector<HTMLElement>('#mission-result');
  let gripperAngle = 180;

  const currentPose = (): RobotArmPose => ({
    base: Number(base.value),
    lower: Number(lower.value),
    upper: Number(upper.value),
    gripper: gripperAngle,
  });
  const update = () => {
    for (const [id, input] of Object.entries({ base, lower, upper })) document.querySelector<HTMLOutputElement>(`#sim-${id}-value`)!.textContent = `${input.value}°`;
    simulation3D?.setPose(currentPose());
  };

  [base, lower, upper].forEach((input) => input.addEventListener('input', () => { update(); if (message) message.textContent = '관절을 직접 움직이는 중'; }));
  gripperButton?.addEventListener('click', () => {
    const closed = gripperButton.dataset.closed !== 'true';
    gripperAngle = closed ? 0 : 180;
    gripperButton.dataset.closed = String(closed);
    gripperButton.textContent = closed ? '닫힘' : '열림';
    update();
  });

  const reset = () => {
    simulationRunToken += 1;
    window.clearInterval(simulationTimer);
    base.value = '90'; lower.value = '90'; upper.value = '90';
    gripperAngle = 180;
    if (gripperButton) { gripperButton.dataset.closed = 'false'; gripperButton.textContent = '열림'; }
    if (message) message.textContent = '90° 기준 자세로 돌아왔습니다';
    update();
    simulation3D?.resetCamera();
    if (resultPanel) resultPanel.hidden = true;
  };
  document.querySelector('#sim-reset')?.addEventListener('click', reset);

  const runDefaultDemo = () => {
    window.clearInterval(simulationTimer);
    const poses = [
      { base: 70, lower: 72, upper: 112, closed: false, text: '1단계 · 물건을 향해 이동해요' },
      { base: 70, lower: 55, upper: 135, closed: false, text: '2단계 · 팔을 천천히 내려요' },
      { base: 70, lower: 55, upper: 135, closed: true, text: '3단계 · 집게로 물건을 잡아요' },
      { base: 125, lower: 90, upper: 88, closed: true, text: '4단계 · 물건을 옮겨요' },
      { base: 125, lower: 78, upper: 105, closed: false, text: '완료 · 물건을 내려놓았어요!' },
    ];
    let index = 0;
    const showPose = () => {
      const pose = poses[index];
      base.value = String(pose.base); lower.value = String(pose.lower); upper.value = String(pose.upper);
      if (gripperButton) { gripperButton.dataset.closed = String(pose.closed); gripperButton.textContent = pose.closed ? '닫힘' : '열림'; }
      if (message) message.textContent = pose.text;
      update();
      index += 1;
      if (index >= poses.length) window.clearInterval(simulationTimer);
    };
    showPose();
    simulationTimer = window.setInterval(showPose, 1150);
  };

  const setGripper = (closed: boolean) => {
    if (!gripperButton) return;
    gripperAngle = closed ? 0 : 180;
    gripperButton.dataset.closed = String(closed);
    gripperButton.textContent = closed ? '닫힘' : '열림';
  };

  const applyCommand = (command: SimulationCommand) => {
    if (command.kind === 'servo') {
      if (command.pin === 6) base.value = String(command.angle);
      if (command.pin === 9) lower.value = String(command.angle);
      if (command.pin === 10) upper.value = String(command.angle);
      if (command.pin === 11) setGripper(command.angle < 90);
    } else if (command.kind === 'gripper') {
      setGripper(command.action === 'CLOSE');
    } else if (command.kind === 'storage') {
      base.value = String(STORAGE_POSE.base);
      lower.value = String(STORAGE_POSE.lower);
      upper.value = String(STORAGE_POSE.upper);
      gripperAngle = STORAGE_POSE.gripper;
      if (gripperButton) {
        gripperButton.dataset.closed = 'false';
        gripperButton.textContent = '보관';
      }
    }
    update();
  };

  const showMissionResult = async (executed: SimulationCommand[]) => {
    if (!plan?.missionId || !resultPanel) return;
    const { checkMissionProgram } = await import('./features/simulation/simulation-program');
    const check = checkMissionProgram(plan.missionId, executed);
    if (!check || !resultPanel.isConnected) return;
    resultPanel.hidden = false;
    resultPanel.dataset.success = String(check.success);
    resultPanel.innerHTML = `<h3>${check.success ? '🎉 ' : '💡 '}${escapeHtml(check.title)}</h3><p>${escapeHtml(check.message)}</p>${check.missing.length ? `<ul>${check.missing.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}`;
    if (check.success) {
      const done = completedMissions();
      done.add(plan.missionId);
      localStorage.setItem(COMPLETED_MISSIONS_KEY, JSON.stringify([...done]));
    }
  };

  const runBlockProgram = async () => {
    if (!plan || !playButton) return;
    const token = ++simulationRunToken;
    playButton.disabled = true;
    if (resultPanel) resultPanel.hidden = true;
    const executed: SimulationCommand[] = [];
    for (let index = 0; index < plan.commands.length; index += 1) {
      if (token !== simulationRunToken || version !== renderVersion) return;
      const command = plan.commands[index];
      if (message) message.textContent = `${index + 1}/${plan.commands.length} · ${command.label}`;
      applyCommand(command);
      executed.push(command);
      const duration = Math.min(2000, Math.max(350, command.durationMs));
      await new Promise((resolve) => window.setTimeout(resolve, duration));
    }
    if (token !== simulationRunToken || version !== renderVersion) return;
    if (message) message.textContent = '블록 실행 완료 · 미션 조건을 확인했어요';
    await showMissionResult(executed);
    if (playButton.isConnected) playButton.disabled = false;
  };

  playButton?.addEventListener('click', () => {
    if (plan) void runBlockProgram();
    else runDefaultDemo();
  });
  document.querySelector('#sim-camera-reset')?.addEventListener('click', () => simulation3D?.resetCamera());
  update();

  const host = document.querySelector<HTMLElement>('#robot-3d-host');
  if (!host) return;
  const { createRobotArm3DSimulator } = await import('./features/simulation/robot-arm-3d');
  const simulator = await createRobotArm3DSimulator(host, (status) => {
    if (message?.isConnected) message.textContent = status;
  });
  if (version !== renderVersion || parseRoute(window.location.hash) !== 'simulation') {
    simulator.dispose();
    return;
  }
  simulation3D = simulator;
  simulator.setPose(currentPose(), true);
  if (playButton) playButton.disabled = false;
}

async function render(): Promise<void> {
  const version = ++renderVersion;
  simulationRunToken += 1;
  window.clearInterval(simulationTimer);
  simulation3D?.dispose();
  simulation3D = undefined;
  if (codingSession) {
    const previousSession = codingSession;
    codingSession = undefined;
    await previousSession.dispose();
  }
  const current = parseRoute(window.location.hash);
  appRoot.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="주요 메뉴">
        <a class="brand" href="#/home" aria-label="CubeLink Studio Tablet 홈">
          <span class="brand-cube"><i></i><i></i><i></i></span>
          <span><strong>CubeLink</strong><small>STUDIO TABLET</small></span>
        </a>
        <nav>${routes.map((route) => navItem(route.id, current)).join('')}</nav>
        <div class="sidebar-status"><i></i><span><strong>로봇 연결 안 됨</strong><small>USB-C를 확인해 주세요</small></span></div>
      </aside>
      <main class="main-area">${header(current)}${content(current)}</main>
      <nav class="bottom-nav" aria-label="빠른 메뉴">
        ${visibleBottomRoutes.map((route) => navItem(route, current, true)).join('')}
        <button class="nav-item more-button" type="button" aria-label="전체 메뉴"><span class="nav-icon">•••</span><span>더보기</span></button>
      </nav>
      <div class="more-sheet" hidden>
        <button class="sheet-backdrop" type="button" aria-label="메뉴 닫기"></button>
        <div class="sheet-panel"><div class="sheet-handle"></div><h2>전체 메뉴</h2>
          ${routes.filter(({ id }) => !visibleBottomRoutes.includes(id)).map((route) => navItem(route.id, current)).join('')}
        </div>
      </div>
    </div>`;

  const sheet = document.querySelector<HTMLElement>('.more-sheet');
  document.querySelector('.more-button')?.addEventListener('click', () => { if (sheet) sheet.hidden = false; });
  document.querySelector('.sheet-backdrop')?.addEventListener('click', () => { if (sheet) sheet.hidden = true; });
  sheet?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { sheet.hidden = true; }));

  if (current === 'coding') void mountCoding(version);
  if (current === 'missions') mountMissions();
  if (current === 'simulation') void mountSimulation(version);
  if (current === 'projects') {
    void hydrateProjects(version);
    document.querySelector('#new-project')?.addEventListener('click', async () => {
      const projects = await projectStore.list();
      const project = createProject(`새 프로젝트 ${projects.length + 1}`);
      await projectStore.save(project);
      localStorage.setItem(ACTIVE_PROJECT_KEY, project.id);
      localStorage.removeItem(ACTIVE_MISSION_KEY);
      window.location.hash = '#/coding';
    });
  }
}

window.addEventListener('hashchange', () => void render());
window.addEventListener('beforeunload', () => void codingSession?.saveNow());
if (!window.location.hash) window.history.replaceState(null, '', '#/home');
void render();
