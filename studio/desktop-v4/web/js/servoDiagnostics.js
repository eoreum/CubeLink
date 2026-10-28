(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.CubeLinkServoDiagnostics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  const PROFILES = Object.freeze({
    6:  Object.freeze({ pin: 6,  name: '베이스', home: 90, min: 60, max: 120, target: 105 }),
    9:  Object.freeze({ pin: 9,  name: '하관절', home: 90, min: 60, max: 105, target: 75 }),
    10: Object.freeze({ pin: 10, name: '상관절', home: 90, min: 90, max: 135, target: 120 }),
    11: Object.freeze({ pin: 11, name: '집게',   home: 90, min: 70, max: 105, target: 100 })
  });

  class DiagnosticStoppedError extends Error {
    constructor(message) {
      super(message || '사용자가 검사를 중지했습니다.');
      this.name = 'DiagnosticStoppedError';
      this.code = 'STOPPED';
    }
  }

  class DiagnosticTimeoutError extends Error {
    constructor(message) {
      super(message || '서보 명령 응답 시간이 초과되었습니다.');
      this.name = 'DiagnosticTimeoutError';
      this.code = 'TIMEOUT';
    }
  }

  function getProfile(pin) {
    const profile = PROFILES[Number(pin)];
    if (!profile) throw new Error('지원하지 않는 서보입니다.');
    return profile;
  }

  function clampAngle(pin, angle) {
    const profile = getProfile(pin);
    const value = Number(angle);
    if (!Number.isFinite(value)) throw new Error('각도를 숫자로 입력하세요.');
    return Math.round(Math.max(profile.min, Math.min(profile.max, value)));
  }

  function buildRoundTrip(pin, target, cycles) {
    const profile = getProfile(pin);
    const safeTarget = clampAngle(pin, target);
    const count = Math.max(1, Math.min(3, Math.round(Number(cycles) || 1)));
    const sequence = [profile.home];
    for (let i = 0; i < count; i += 1) sequence.push(safeTarget, profile.home);
    return sequence;
  }

  function createController(options) {
    options = options || {};
    if (typeof options.send !== 'function') throw new Error('send 함수가 필요합니다.');
    const delay = typeof options.delay === 'function'
      ? options.delay
      : (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const onState = typeof options.onState === 'function' ? options.onState : function() {};
    let activeRun = null;
    let nextId = 1;

    function assertCurrent(run) {
      if (run && run.failure) throw run.failure;
      if (!run || run.cancelled || activeRun !== run) throw new DiagnosticStoppedError();
    }

    function waitWithStop(ms, run) {
      if (ms <= 0) return Promise.resolve();
      return Promise.race([
        Promise.resolve(delay(ms)),
        run.interrupted
      ]).then(() => assertCurrent(run));
    }

    async function runCommand(run, pin, angle, timeoutMs) {
      assertCurrent(run);
      let timer = null;
      const timeout = new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new DiagnosticTimeoutError(
          `D${pin} 명령이 ${Math.ceil(timeoutMs / 1000)}초 안에 완료되지 않았습니다.`
        )), timeoutMs);
      });
      try {
        await Promise.race([options.send(pin, angle, run), timeout, run.interrupted]);
        assertCurrent(run);
      } finally {
        clearTimeout(timer);
      }
    }

    async function start(config) {
      if (activeRun) throw new Error('다른 서보 검사가 진행 중입니다.');
      config = config || {};
      const pin = Number(config.pin);
      const profile = getProfile(pin);
      const sequence = config.mode === 'move'
        ? [clampAngle(pin, config.target)]
        : buildRoundTrip(pin, config.target, config.cycles);
      const dwellMs = Math.max(250, Math.min(3000, Number(config.dwellMs) || 800));
      const timeoutMs = Math.max(500, Math.min(10000, Number(config.timeoutMs) || 3000));
      const run = { id: nextId++, pin, cancelled: false, failure: null, interrupt: null };
      run.interrupted = new Promise((resolve, reject) => { run.interrupt = reject; });
      activeRun = run;
      onState({ state: 'running', pin, profile, step: 0, total: sequence.length });
      try {
        for (let index = 0; index < sequence.length; index += 1) {
          const angle = sequence[index];
          onState({ state: 'moving', pin, profile, angle, step: index + 1, total: sequence.length });
          await runCommand(run, pin, angle, timeoutMs);
          if (index < sequence.length - 1) await waitWithStop(dwellMs, run);
        }
        onState({ state: 'complete', pin, profile, angle: sequence.at(-1), total: sequence.length });
        return { ok: true, pin, sequence: sequence.slice() };
      } catch (error) {
        if (error && error.code === 'STOPPED') {
          onState({ state: 'stopped', pin, profile, error });
        } else {
          onState({ state: 'failed', pin, profile, error });
        }
        throw error;
      } finally {
        if (activeRun === run) activeRun = null;
        run.interrupt = null;
      }
    }

    function stop() {
      if (!activeRun) return false;
      const run = activeRun;
      run.cancelled = true;
      if (run.interrupt) run.interrupt(new DiagnosticStoppedError());
      return true;
    }

    function fail(error) {
      if (!activeRun) return false;
      const run = activeRun;
      run.failure = error instanceof Error ? error : new Error(String(error || '서보 검사 실패'));
      run.cancelled = true;
      if (run.interrupt) run.interrupt(run.failure);
      return true;
    }

    return {
      start,
      stop,
      fail,
      isActive: () => !!activeRun,
      getActivePin: () => activeRun ? activeRun.pin : null
    };
  }

  return {
    PROFILES,
    DiagnosticStoppedError,
    DiagnosticTimeoutError,
    getProfile,
    clampAngle,
    buildRoundTrip,
    createController
  };
});
