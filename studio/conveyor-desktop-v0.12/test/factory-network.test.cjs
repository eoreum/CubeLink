'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');

const conveyorRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(conveyorRoot, '..', '..');
const conveyorNetwork = require(path.join(conveyorRoot, 'electron', 'factoryNetwork.js'));
const robotNetwork = require(path.join(repoRoot, 'studio', 'desktop-v4', 'electron', 'factoryNetwork.js'));

class BusSocket extends EventEmitter {
  constructor(bus) { super(); this.bus = bus; this.closed = false; }
  bind(_port, callback) { this.bus.push(this); callback(); }
  addMembership() {}
  setMulticastTTL() {}
  setMulticastLoopback() {}
  send(buffer, _offset, _length, _port, _address, callback) {
    for (const socket of this.bus) {
      if (socket !== this && !socket.closed) socket.emit('message', Buffer.from(buffer));
    }
    if (callback) callback();
  }
  close() { this.closed = true; }
}

test('robot and conveyor builds use the exact same factory network contract', () => {
  assert.equal(conveyorNetwork.NAMESPACE, robotNetwork.NAMESPACE);
  assert.equal(conveyorNetwork.MULTICAST_ADDRESS, robotNetwork.MULTICAST_ADDRESS);
  assert.equal(conveyorNetwork.MULTICAST_PORT, robotNetwork.MULTICAST_PORT);
  assert.deepEqual(conveyorNetwork.EVENTS, robotNetwork.EVENTS);
  assert.deepEqual(conveyorNetwork.EVENT_RETRY_DELAYS_MS, [0, 120, 350]);
});

test('separate Robot and Conveyor services pair and deliver the automation event path', async () => {
  const bus = [];
  const robotEvents = [];
  const conveyorEvents = [];
  const robot = new robotNetwork.FactoryNetwork({
    createSocket: () => new BusSocket(bus),
    instanceId: '11111111-1111-4111-8111-111111111111',
    sendEvent: event => robotEvents.push(event)
  });
  const conveyor = new conveyorNetwork.FactoryNetwork({
    createSocket: () => new BusSocket(bus),
    instanceId: '22222222-2222-4222-8222-222222222222',
    sendEvent: event => conveyorEvents.push(event)
  });
  await robot.start({ role: 'ROBOT', sessionId: 'CLASS-A', groupId: '1' });
  await conveyor.start({ role: 'CONVEYOR', sessionId: 'CLASS-A', groupId: '1' });
  assert.equal(robot.snapshot('test').paired, true);
  assert.equal(conveyor.snapshot('test').paired, true);
  conveyor.sendFactoryEvent('OBJECT_ARRIVED');
  robot.sendFactoryEvent('ROBOT_WORKING');
  robot.sendFactoryEvent('ROBOT_DONE');
  assert.deepEqual(robotEvents.map(value => value.event), ['OBJECT_ARRIVED']);
  assert.deepEqual(conveyorEvents.map(value => value.event), ['ROBOT_WORKING', 'ROBOT_DONE']);
  await robot.stop(false);
  await conveyor.stop(false);
});

test('Conveyor renderer stops, calls the robot, and resumes with the firmware contract', () => {
  const html = fs.readFileSync(path.join(conveyorRoot, 'web', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(conveyorRoot, 'web', 'app.js'), 'utf8');
  const collaboration = fs.readFileSync(path.join(conveyorRoot, 'web', 'factoryCollaboration.js'), 'utf8');
  const main = fs.readFileSync(path.join(conveyorRoot, 'electron', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(conveyorRoot, 'electron', 'preload.js'), 'utf8');
  assert.match(html, /id="factoryLinkBtn"/);
  assert.match(html, /factoryCollaboration\.js/);
  assert.match(app, /sendCommand\('CONVEYOR,STOP'\)/);
  assert.match(app, /sendCommand\('CONVEYOR,START'\)/);
  assert.match(collaboration, /OBJECT_DETECTED/);
  assert.match(collaboration, /OBJECT_ARRIVED/);
  assert.match(collaboration, /ROBOT_WORKING/);
  assert.match(collaboration, /ROBOT_DONE/);
  assert.match(main, /factory-start/);
  assert.match(preload, /factorySendEvent/);
  assert.doesNotThrow(() => new Function(app));
  assert.doesNotThrow(() => new Function(collaboration));
});
