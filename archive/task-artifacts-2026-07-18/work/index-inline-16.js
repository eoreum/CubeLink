
(function() {
  'use strict';

  function updateRealtimeButtonState() {
    const btn = document.getElementById('btnRunRealtime');

    // 연결 상태 계산 (영점 조절 버튼도 여기서 함께 처리)
    const connected = !!(window._serialPort && window._serialPort.writable);

    // 🎯 영점 조절 버튼: 연결됐을 때만 표시
    const calBtn = document.getElementById('calStartBtn');
    if (calBtn) calBtn.style.display = connected ? '' : 'none';

    if (!btn) return;
    if (connected) {
      btn.classList.remove('disconnected');
      btn.removeAttribute('disabled');
      btn.title = '블록 코드를 OTG로 연결된 로봇팔에서 실시간 실행합니다.';
    } else {
      btn.classList.add('disconnected');
      btn.setAttribute('disabled', 'disabled');
      btn.title = '로봇이 연결되지 않았습니다. 먼저 [연결] 버튼을 눌러주세요.';
    }
  }

  window.updateRealtimeButtonState = updateRealtimeButtonState;

  // 페이지 로드 후 첫 상태 적용 + 0.5초마다 안전망 갱신
  window.addEventListener('load', () => {
    updateRealtimeButtonState();
    setInterval(updateRealtimeButtonState, 500);
  });
})();

