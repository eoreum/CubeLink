'use strict';

const dgram = require('dgram');
const crypto = require('crypto');

const NAMESPACE = 'CUBELINK_FACTORY_1';
const MULTICAST_ADDRESS = '239.255.67.76';
const MULTICAST_PORT = 45404;
const HEARTBEAT_MS = 1500;
const PEER_TIMEOUT_MS = 5500;
const EVENT_RETRY_DELAYS_MS = Object.freeze([0, 120, 350]);
const ROLES = Object.freeze(['ROBOT', 'CONVEYOR']);
const EVENTS = Object.freeze(['OBJECT_DETECTED', 'OBJECT_ARRIVED', 'ROBOT_WORKING', 'ROBOT_DONE']);

function normalizeId(value, label) {
  const result = String(value || '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,23}$/.test(result)) {
    throw new Error(`${label} must contain 1-24 letters, numbers, _ or -.`);
  }
  return result;
}

function normalizeConfig(input) {
  const role = String(input && input.role || '').trim().toUpperCase();
  if (!ROLES.includes(role)) throw new Error('Role must be ROBOT or CONVEYOR.');
  return Object.freeze({
    role,
    sessionId: normalizeId(input.sessionId, 'Session ID'),
    groupId: normalizeId(input.groupId, 'Group ID')
  });
}

function sanitizeMessage(value) {
  if (!value || value.namespace !== NAMESPACE || value.version !== 1) return null;
  if (!['HELLO', 'HEARTBEAT', 'EVENT'].includes(value.kind)) return null;
  let config;
  try { config = normalizeConfig(value); } catch (_) { return null; }
  const instanceId = String(value.instanceId || '');
  if (!/^[a-f0-9-]{16,64}$/i.test(instanceId)) return null;
  const message = { ...config, namespace: NAMESPACE, version: 1, kind: value.kind, instanceId };
  if (value.kind === 'EVENT') {
    const event = String(value.event || '').toUpperCase();
    const eventId = String(value.eventId || '');
    if (!EVENTS.includes(event) || !/^[a-f0-9-]{16,64}$/i.test(eventId)) return null;
    message.event = event;
    message.eventId = eventId;
  }
  return message;
}

function isMatchingPeer(local, remote) {
  return !!local && !!remote &&
    local.sessionId === remote.sessionId &&
    local.groupId === remote.groupId &&
    local.role !== remote.role;
}

class FactoryNetwork {
  constructor(options = {}) {
    this.address = options.address || MULTICAST_ADDRESS;
    this.port = options.port || MULTICAST_PORT;
    this.sendStatus = options.sendStatus || (() => {});
    this.sendEvent = options.sendEvent || (() => {});
    this.createSocket = options.createSocket || (() => dgram.createSocket({ type: 'udp4', reuseAddr: true }));
    this.now = options.now || Date.now;
    this.instanceId = options.instanceId || crypto.randomUUID();
    this.socket = null;
    this.config = null;
    this.peer = null;
    this.seenEvents = new Map();
    this.heartbeatTimer = null;
    this.peerTimer = null;
  }

  snapshot(state, detail) {
    return {
      state,
      detail: detail || '',
      active: !!this.config,
      paired: !!this.peer,
      role: this.config ? this.config.role : '',
      sessionId: this.config ? this.config.sessionId : '',
      groupId: this.config ? this.config.groupId : ''
    };
  }

  status(state, detail) {
    const value = this.snapshot(state, detail);
    this.sendStatus(value);
    return value;
  }

  makeMessage(kind, extra = {}) {
    return { namespace: NAMESPACE, version: 1, kind, instanceId: this.instanceId, ...this.config, ...extra };
  }

  send(kind, extra) {
    if (!this.socket || !this.config) return false;
    const payload = Buffer.from(JSON.stringify(this.makeMessage(kind, extra)), 'utf8');
    this.socket.send(payload, 0, payload.length, this.port, this.address, () => {});
    return true;
  }

  receive(buffer) {
    let raw;
    try { raw = JSON.parse(Buffer.from(buffer).toString('utf8')); } catch (_) { return; }
    const message = sanitizeMessage(raw);
    if (!message || message.instanceId === this.instanceId || !isMatchingPeer(this.config, message)) return;
    const wasPaired = !!this.peer;
    this.peer = { instanceId: message.instanceId, role: message.role, lastSeen: this.now() };
    if (!wasPaired) this.status('paired', '같은 모둠의 CubeLink Studio와 연결되었습니다.');
    if (message.kind === 'HELLO') this.send('HEARTBEAT');
    if (message.kind !== 'EVENT' || this.seenEvents.has(message.eventId)) return;
    this.seenEvents.set(message.eventId, this.now());
    this.sendEvent({ event: message.event, role: message.role });
  }

  expirePeer() {
    const now = this.now();
    for (const [eventId, seenAt] of this.seenEvents) {
      if (now - seenAt > 60000) this.seenEvents.delete(eventId);
    }
    if (this.peer && now - this.peer.lastSeen > PEER_TIMEOUT_MS) {
      this.peer = null;
      this.status('waiting', 'CubeLink Studio 연결이 끊겼습니다. 컨베이어를 정지 상태로 두고 다시 찾습니다.');
      this.send('HELLO');
    }
  }

  async start(input) {
    await this.stop(false);
    this.config = normalizeConfig(input);
    this.status('starting', '같은 Wi-Fi에서 CubeLink Studio를 찾는 중입니다.');
    return new Promise((resolve, reject) => {
      const socket = this.createSocket();
      this.socket = socket;
      let settled = false;
      socket.on('message', buffer => this.receive(buffer));
      socket.on('error', error => {
        this.status('error', error.message);
        if (!settled) { settled = true; reject(error); }
      });
      socket.bind(this.port, () => {
        try {
          socket.addMembership(this.address);
          socket.setMulticastTTL(1);
          socket.setMulticastLoopback(true);
        } catch (error) {
          this.status('error', error.message);
          socket.close();
          if (!settled) { settled = true; reject(error); }
          return;
        }
        this.heartbeatTimer = setInterval(() => this.send(this.peer ? 'HEARTBEAT' : 'HELLO'), HEARTBEAT_MS);
        this.peerTimer = setInterval(() => this.expirePeer(), 1000);
        this.send('HELLO');
        const value = this.status('waiting', '같은 세션·모둠의 CubeLink Studio를 기다립니다.');
        if (!settled) { settled = true; resolve(value); }
      });
    });
  }

  sendFactoryEvent(event) {
    const normalized = String(event || '').toUpperCase();
    if (!EVENTS.includes(normalized)) throw new Error('Unsupported factory event.');
    if (!this.peer) throw new Error('The matching group is not paired yet.');
    const eventId = crypto.randomUUID();
    EVENT_RETRY_DELAYS_MS.forEach(delay => {
      if (delay === 0) this.send('EVENT', { event: normalized, eventId });
      else setTimeout(() => {
        if (this.peer) this.send('EVENT', { event: normalized, eventId });
      }, delay);
    });
    return { ok: true, event: normalized };
  }

  async stop(emit = true) {
    clearInterval(this.heartbeatTimer);
    clearInterval(this.peerTimer);
    this.heartbeatTimer = null;
    this.peerTimer = null;
    this.peer = null;
    this.seenEvents.clear();
    const socket = this.socket;
    this.socket = null;
    this.config = null;
    if (socket) {
      try { socket.close(); } catch (_) {}
    }
    return emit ? this.status('idle', 'CubeLink 연동이 종료되었습니다.') : this.snapshot('idle');
  }
}

module.exports = {
  NAMESPACE, MULTICAST_ADDRESS, MULTICAST_PORT, HEARTBEAT_MS, PEER_TIMEOUT_MS,
  EVENT_RETRY_DELAYS_MS, ROLES, EVENTS, normalizeConfig, sanitizeMessage,
  isMatchingPeer, FactoryNetwork
};
