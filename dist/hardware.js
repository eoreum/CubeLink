// Physical execution is intentionally unavailable until a supported-arm bench test.
// Confirmed reference: CubeLinkBridge.ino S,pin,angle; R/I/K safety lifecycle,
// INIT_OK and PARK_90_30_160_90. A serial-open event is not initialization.
export const hardwareStatus={enabled:false,protocolReviewed:true,physicalTested:false,reason:'실물 연동 검증 대기 · 이 웹앱에서는 USB 명령을 전송하지 않습니다. 수업 시작자세·관절 방향·정지·전원 안정성을 실물에서 확인해야 합니다.'};
export function executePhysical(){throw Error(hardwareStatus.reason);}
