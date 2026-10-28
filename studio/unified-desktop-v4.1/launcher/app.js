'use strict';

const shell = window.studioShell;
const version = document.getElementById('version');
const armButton = document.getElementById('openArm');
const conveyorButton = document.getElementById('openConveyor');
const driverPanel = document.getElementById('driverPanel');
const driverTitle = document.getElementById('driverTitle');
const driverDetail = document.getElementById('driverDetail');
const driverInstall = document.getElementById('driverInstall');
const driverRefresh = document.getElementById('driverRefresh');

if (shell && shell.getVersion) version.textContent = shell.getVersion();

async function open(button, action) {
  armButton.disabled = true;
  conveyorButton.disabled = true;
  const original = button.innerHTML;
  button.textContent = '화면을 준비하고 있습니다…';
  try {
    const result = await action();
    if (!result || !result.ok) throw new Error(result && result.message || '화면을 열 수 없습니다.');
  } catch (error) {
    window.alert(error.message);
    button.innerHTML = original;
    armButton.disabled = false;
    conveyorButton.disabled = false;
  }
}

armButton.addEventListener('click', () => open(armButton, () => shell.openArm()));
conveyorButton.addEventListener('click', () => open(conveyorButton, () => shell.openConveyor()));

function showDriverStatus(result) {
  const state = result && result.state || 'check_failed';
  driverPanel.className = `driverPanel ${state}`;
  driverTitle.textContent = result && result.title || 'CH340 상태를 확인하지 못했습니다.';
  driverDetail.textContent = result && result.detail || ({
    ready: 'Nano 보드를 바로 연결할 수 있습니다.',
    unsupported: '이 기능은 Windows 포터블판에서 사용합니다.',
    check_failed: 'Windows 장치 관리자에서 COM 포트를 확인하세요.'
  }[state] || '보드를 연결한 뒤 다시 점검하세요.');
  driverInstall.hidden = state !== 'driver_required';
}

async function refreshDriverStatus() {
  driverRefresh.disabled = true;
  driverInstall.disabled = true;
  driverPanel.className = 'driverPanel checking';
  driverTitle.textContent = 'USB·CH340 연결 상태를 점검하고 있습니다…';
  driverDetail.textContent = '잠시만 기다려 주세요.';
  try {
    showDriverStatus(await shell.diagnoseCh340());
  } catch (error) {
    showDriverStatus({ state: 'check_failed', title: 'CH340 상태를 확인하지 못했습니다.', detail: error.message });
  } finally {
    driverRefresh.disabled = false;
    driverInstall.disabled = false;
  }
}

driverRefresh.addEventListener('click', refreshDriverStatus);
driverInstall.addEventListener('click', async () => {
  driverInstall.disabled = true;
  driverRefresh.disabled = true;
  driverPanel.className = 'driverPanel installing';
  driverTitle.textContent = 'Windows 관리자 승인을 기다리고 있습니다…';
  driverDetail.textContent = '표시되는 승인 창에서 예를 눌러주세요. 프로그램을 종료하지 마세요.';
  try {
    const result = await shell.installCh340();
    if (!result || !result.ok) {
      showDriverStatus({
        state: result && result.code === 'CANCELLED' ? 'not_connected' : 'check_failed',
        title: result && result.message || '드라이버를 설치하지 못했습니다.',
        detail: '학교 PC에서는 전산 담당자의 관리자 승인이 필요할 수 있습니다.'
      });
      return;
    }
    showDriverStatus(result.diagnosis && result.diagnosis.state === 'ready'
      ? result.diagnosis
      : { state: 'installed', title: 'CH340 드라이버 설치 완료', detail: 'Nano의 USB 케이블을 다시 연결한 뒤 다시 점검을 눌러주세요.' });
  } catch (error) {
    showDriverStatus({ state: 'check_failed', title: '드라이버를 설치하지 못했습니다.', detail: error.message });
  } finally {
    driverRefresh.disabled = false;
    driverInstall.disabled = false;
  }
});

refreshDriverStatus();
