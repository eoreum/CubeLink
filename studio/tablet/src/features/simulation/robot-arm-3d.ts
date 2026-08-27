import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type RobotArmPose = {
  base: number;
  lower: number;
  upper: number;
  gripper: number;
};

export type RobotArm3DSimulator = {
  setPose: (pose: RobotArmPose, immediate?: boolean) => void;
  resetCamera: () => void;
  dispose: () => void;
};

type RobotPartName = 'base' | 'lower' | 'upper' | 'grip01' | 'grip02';

const MODEL_PATH = './models/cubelink-arm/';
const PART_NAMES: RobotPartName[] = ['base', 'lower', 'upper', 'grip01', 'grip02'];

// Desktop studio/web/js/simulator3D.js의 실물 모델 조립 좌표와 서보 축을 그대로 사용한다.
const ASSEMBLY = {
  baseJoint: new THREE.Vector3(0, 11, 0),
  basePart: new THREE.Vector3(0, -11, 0),
  upperJoint: new THREE.Vector3(-20, 75, 0),
  upperPart: new THREE.Vector3(20, -72, 0),
  gripperJoint: new THREE.Vector3(-40, -12, 0),
  lowerFingerPivot: new THREE.Vector3(0, 0, -1),
  upperFingerPivot: new THREE.Vector3(0, 0, 1),
  lowerFingerPart: new THREE.Vector3(0, 0, -10),
  upperFingerPart: new THREE.Vector3(0, 0, 7),
} as const;

const DEFAULT_CAMERA = new THREE.Vector3(125, 120, 190);
const CAMERA_TARGET = new THREE.Vector3(-5, 40, 0);

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    });
  });
}

export async function createRobotArm3DSimulator(
  container: HTMLElement,
  onStatus: (message: string) => void,
): Promise<RobotArm3DSimulator> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f5ef);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1500);
  camera.position.copy(DEFAULT_CAMERA);
  camera.lookAt(CAMERA_TARGET);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'robot-3d-canvas';
  renderer.domElement.setAttribute('aria-label', 'CubeLink 실물 모델 3D 로봇팔');
  renderer.domElement.setAttribute('role', 'img');
  container.replaceChildren(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xaaa7b5, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(90, 170, 120);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xbab3ff, 1.5);
  fillLight.position.set(-120, 70, -80);
  scene.add(fillLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(105, 80),
    new THREE.MeshStandardMaterial({ color: 0xeeeae1, roughness: 0.92, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.35;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(180, 18, 0xd6d0ee, 0xe2ded5);
  grid.position.y = -0.25;
  scene.add(grid);

  const practiceObject = new THREE.Mesh(
    new THREE.BoxGeometry(19, 19, 19),
    new THREE.MeshStandardMaterial({ color: 0xf2c353, roughness: 0.58, metalness: 0.05 }),
  );
  practiceObject.position.set(-55, 9.5, 42);
  practiceObject.castShadow = true;
  practiceObject.receiveShadow = true;
  scene.add(practiceObject);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(CAMERA_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 90;
  controls.maxDistance = 420;
  controls.enablePan = false;
  controls.update();

  const robotGroup = new THREE.Group();
  scene.add(robotGroup);
  const joints: Partial<Record<6 | 9 | 10 | 11, THREE.Group>> = {};
  let lowerFingerPivot: THREE.Group | undefined;
  let upperFingerPivot: THREE.Group | undefined;
  let disposed = false;
  let frameId = 0;
  let currentPose: RobotArmPose = { base: 90, lower: 90, upper: 90, gripper: 180 };
  let targetPose: RobotArmPose = { ...currentPose };

  const applyPose = (pose: RobotArmPose): void => {
    if (joints[6]) joints[6].rotation.y = THREE.MathUtils.degToRad(pose.base - 90);
    if (joints[9]) joints[9].rotation.z = THREE.MathUtils.degToRad(pose.lower - 90);
    if (joints[10]) joints[10].rotation.z = THREE.MathUtils.degToRad(pose.upper - 90);
    const gripRadians = THREE.MathUtils.degToRad(pose.gripper - 90) * 1.2;
    if (lowerFingerPivot) lowerFingerPivot.rotation.y = -gripRadians;
    if (upperFingerPivot) upperFingerPivot.rotation.y = gripRadians;
  };

  const resize = (): void => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const clock = new THREE.Clock();
  const renderFrame = (): void => {
    if (disposed) return;
    const blend = 1 - Math.exp(-9 * Math.min(clock.getDelta(), 0.05));
    currentPose = {
      base: THREE.MathUtils.lerp(currentPose.base, targetPose.base, blend),
      lower: THREE.MathUtils.lerp(currentPose.lower, targetPose.lower, blend),
      upper: THREE.MathUtils.lerp(currentPose.upper, targetPose.upper, blend),
      gripper: THREE.MathUtils.lerp(currentPose.gripper, targetPose.gripper, blend),
    };
    applyPose(currentPose);
    controls.update();
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(renderFrame);
  };
  renderFrame();

  onStatus('Desktop 실물 모델 5개를 불러오는 중…');
  const loader = new GLTFLoader();
  try {
    const loaded = await Promise.all(PART_NAMES.map(async (name) => {
      const gltf = await loader.loadAsync(`${MODEL_PATH}${name}.glb`);
      return [name, gltf.scene] as const;
    }));
    const parts = Object.fromEntries(loaded) as Record<RobotPartName, THREE.Group>;
    if (disposed) {
      Object.values(parts).forEach(disposeObject);
      throw new Error('Simulator was disposed while loading.');
    }

    Object.values(parts).forEach((part) => part.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;
    }));

    joints[6] = new THREE.Group();
    joints[6].position.copy(ASSEMBLY.baseJoint);
    robotGroup.add(joints[6]);
    parts.base.position.copy(ASSEMBLY.basePart);
    joints[6].add(parts.base);

    joints[9] = new THREE.Group();
    joints[6].add(joints[9]);
    joints[9].add(parts.lower);

    joints[10] = new THREE.Group();
    joints[10].position.copy(ASSEMBLY.upperJoint);
    joints[9].add(joints[10]);
    parts.upper.position.copy(ASSEMBLY.upperPart);
    joints[10].add(parts.upper);

    joints[11] = new THREE.Group();
    joints[11].position.copy(ASSEMBLY.gripperJoint);
    joints[10].add(joints[11]);

    lowerFingerPivot = new THREE.Group();
    upperFingerPivot = new THREE.Group();
    lowerFingerPivot.position.copy(ASSEMBLY.lowerFingerPivot);
    upperFingerPivot.position.copy(ASSEMBLY.upperFingerPivot);
    joints[11].add(lowerFingerPivot, upperFingerPivot);
    parts.grip01.position.copy(ASSEMBLY.lowerFingerPart);
    parts.grip02.position.copy(ASSEMBLY.upperFingerPart);
    lowerFingerPivot.add(parts.grip01);
    upperFingerPivot.add(parts.grip02);
    applyPose(currentPose);
    onStatus('실물 3D 모델 준비 완료 · 화면을 손가락으로 돌려보세요');
  } catch (error) {
    if (!disposed) {
      console.error('[Tablet 3D simulator] model load failed', error);
      onStatus('3D 모델을 불러오지 못했습니다');
    }
  }

  return {
    setPose: (pose, immediate = false) => {
      targetPose = { ...pose };
      if (immediate) {
        currentPose = { ...pose };
        applyPose(currentPose);
      }
    },
    resetCamera: () => {
      camera.position.copy(DEFAULT_CAMERA);
      controls.target.copy(CAMERA_TARGET);
      controls.update();
    },
    dispose: () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
