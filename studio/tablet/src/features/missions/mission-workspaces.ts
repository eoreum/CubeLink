const xml = (blocks: string) => `<xml xmlns="https://developers.google.com/blockly/xml">${blocks}</xml>`;

const missionWorkspaceTemplates: Record<string, string> = {
  'hello-arm': xml(`
    <block type="cubelink_start" x="70" y="55">
      <next><block type="cubelink_servo_smooth_simple">
        <field name="PIN">6</field>
        <field name="ANGLE">60</field>
        <field name="SEC">1</field>
      </block></next>
    </block>`),
  'pick-and-place': xml(`
    <block type="cubelink_start" x="70" y="55">
      <next><block type="cubelink_gripper">
        <field name="ACTION">OPEN</field>
      </block></next>
    </block>`),
  'distance-guard': xml(`
    <block type="cubelink_start" x="70" y="55">
      <next><block type="cubelink_wait_until_distance">
        <field name="DISTANCE">10</field>
      </block></next>
    </block>`),
};

export function missionWorkspaceXml(missionId: string): string {
  return missionWorkspaceTemplates[missionId] ?? xml('');
}

export function ensureStartBlockXml(workspaceXml: string): string {
  if (!workspaceXml.trim() || workspaceXml.includes('type="cubelink_start"')) return workspaceXml;
  const document = new DOMParser().parseFromString(workspaceXml, 'application/xml');
  const root = document.documentElement;
  if (root.nodeName === 'parsererror') return workspaceXml;
  const firstBlock = Array.from(root.children).find((element) => element.tagName.toLowerCase() === 'block');
  if (!firstBlock) return workspaceXml;

  const start = document.createElement('block');
  start.setAttribute('type', 'cubelink_start');
  start.setAttribute('x', firstBlock.getAttribute('x') ?? '70');
  start.setAttribute('y', firstBlock.getAttribute('y') ?? '55');
  firstBlock.removeAttribute('x');
  firstBlock.removeAttribute('y');
  const next = document.createElement('next');
  root.insertBefore(start, firstBlock);
  next.appendChild(firstBlock);
  start.appendChild(next);
  return new XMLSerializer().serializeToString(document);
}
