
           // exe(Electron)에서는 Service Worker 사용 안 함 → 옛 캐시가 최신 코드를 가로채는 문제 방지
      if (window.cubelink && 'serviceWorker' in navigator) {
        // exe에서는 기존에 등록된 SW를 모두 해제하고 캐시도 비움
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((r) => r.unregister());
          console.log('[PWA] exe 환경 → Service Worker 해제 완료');
        });
        if (window.caches) {
          caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
        }
      } else if (!window.cubelink && 'serviceWorker' in navigator) {

        window.addEventListener('load', () => {
                 // v2.9.2: 새 버전 SW가 제어권을 잡으면 자동 1회 새로고침 (강사 기기 깔끔 유지)
          // controller가 이미 있을 때(=재방문 강사)만 새로고침 → 학생 첫 접속은 깜빡임 없음
          if (navigator.serviceWorker.controller) {
            let _swRefreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              if (_swRefreshing) return;        // 무한 새로고침 방지 가드 (필수)
              _swRefreshing = true;
              window.location.reload();
            });
          }

          navigator.serviceWorker.register('./sw.js')
            .then((reg) => {
              console.log('[PWA] Service Worker 등록 성공:', reg.scope);

              // 페이지 로드할 때마다 새 버전 확인
              reg.update().catch(() => {});

              // 새 sw.js 감지 시 설치 진행 추적
              reg.addEventListener('updatefound', () => {
                const newSW = reg.installing;
                if (!newSW) return;
                newSW.addEventListener('statechange', () => {
                  if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('[PWA] 새 버전이 설치되었습니다. 다음 새로고침 시 적용됩니다.');
                  }
                });
              });
            })
            .catch((err) => {
              console.warn('[PWA] Service Worker 등록 실패:', err);
            });

          // 주기적 업데이트 확인 (10분마다) - 장시간 켜두는 학생 대비
          setInterval(() => {
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg) reg.update().catch(() => {});
            });
          }, 10 * 60 * 1000);
        });
      } else {
        console.log('[PWA] 이 브라우저는 Service Worker를 지원하지 않습니다.');
      }
    
