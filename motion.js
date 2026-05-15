import * as THREE from "./vendor/three.module.js";

const canvas = document.querySelector("#luxe-scene");
const motionSection = document.querySelector(".luxe-motion");

if (canvas && motionSection) {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  if (THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  if (THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x140f0c, 0.035);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.15, 8.2);

  const root = new THREE.Group();
  scene.add(root);

  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xc89a45,
    metalness: 0.86,
    roughness: 0.28,
    clearcoat: 0.85,
    clearcoatRoughness: 0.18
  });
  const deepGold = new THREE.MeshPhysicalMaterial({
    color: 0x8f6427,
    metalness: 0.8,
    roughness: 0.3,
    clearcoat: 0.6
  });
  const pearl = new THREE.MeshPhysicalMaterial({
    color: 0xf8f3ea,
    roughness: 0.3,
    metalness: 0.02,
    clearcoat: 0.7
  });
  const eyeBlue = new THREE.MeshPhysicalMaterial({
    color: 0x126ed1,
    emissive: 0x062147,
    emissiveIntensity: 0.16,
    roughness: 0.24,
    metalness: 0.08,
    clearcoat: 0.95
  });
  const black = new THREE.MeshPhysicalMaterial({
    color: 0x070707,
    roughness: 0.32,
    metalness: 0.16
  });
  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xdaf7ff,
    emissive: 0x0d5160,
    emissiveIntensity: 0.08,
    roughness: 0.18,
    metalness: 0.04,
    clearcoat: 1,
    clearcoatRoughness: 0.08
  });
  const blush = new THREE.MeshPhysicalMaterial({
    color: 0xe7a0a2,
    emissive: 0x381111,
    emissiveIntensity: 0.05,
    roughness: 0.26,
    metalness: 0.2,
    clearcoat: 0.8
  });

  scene.add(new THREE.AmbientLight(0xffead1, 1.2));

  const keyLight = new THREE.DirectionalLight(0xfff2d0, 3.2);
  keyLight.position.set(-4, 5, 6);
  scene.add(keyLight);

  const blueLight = new THREE.PointLight(0x17a4bc, 11, 9);
  blueLight.position.set(3.2, -1.4, 3);
  scene.add(blueLight);

  const rimLight = new THREE.PointLight(0xffc66b, 7, 10);
  rimLight.position.set(-3.8, -2.2, 4.6);
  scene.add(rimLight);

  const torusLarge = new THREE.TorusGeometry(0.86, 0.045, 28, 128);
  const torusSmall = new THREE.TorusGeometry(0.34, 0.03, 20, 80);
  const linkTorus = new THREE.TorusGeometry(0.16, 0.017, 16, 48);
  const bead = new THREE.SphereGeometry(0.095, 28, 18);
  const miniBead = new THREE.SphereGeometry(0.055, 20, 14);
  const gem = new THREE.OctahedronGeometry(0.12, 0);
  const eyeRim = new THREE.TorusGeometry(0.205, 0.014, 16, 64);
  const eyeBase = new THREE.CylinderGeometry(0.18, 0.18, 0.035, 52);
  const blueIris = new THREE.CylinderGeometry(0.095, 0.095, 0.04, 42);
  const pupil = new THREE.CylinderGeometry(0.042, 0.042, 0.045, 32);

  function makeEye(scale = 1) {
    const group = new THREE.Group();
    const rim = new THREE.Mesh(eyeRim, gold);
    const base = new THREE.Mesh(eyeBase, pearl);
    const iris = new THREE.Mesh(blueIris, eyeBlue);
    const dot = new THREE.Mesh(pupil, black);

    base.rotation.x = Math.PI / 2;
    iris.rotation.x = Math.PI / 2;
    dot.rotation.x = Math.PI / 2;
    iris.position.set(0, 0, 0.032);
    dot.position.set(0, 0, 0.064);
    rim.position.set(0, 0, 0.072);
    group.add(base, iris, dot, rim);
    group.scale.setScalar(scale);
    return group;
  }

  const chain = new THREE.Group();
  const chainPoints = [];

  for (let i = 0; i < 30; i += 1) {
    const t = (i / 29) * Math.PI * 1.15 + 0.08;
    const x = Math.cos(t) * 2.65 - 0.45;
    const y = Math.sin(t) * 0.86 - 0.74;
    const z = Math.sin(t * 2.2) * 0.26;
    const isEye = i % 7 === 2;
    const piece = isEye ? makeEye(0.68) : new THREE.Mesh(bead, i % 3 === 0 ? gold : deepGold);

    piece.position.set(x, y, z);
    piece.rotation.set(t * 0.4, -t, 0);
    piece.userData.floatPhase = i * 0.38;
    piece.userData.baseY = y;
    chain.add(piece);
    chainPoints.push(new THREE.Vector3(x, y, z));
  }

  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(chainPoints), 160, 0.015, 8, false);
  chain.add(new THREE.Mesh(tube, gold));
  chain.rotation.set(-0.18, -0.36, -0.08);
  chain.scale.set(0.74, 0.92, 0.92);
  chain.position.set(-0.08, -0.14, 0);
  root.add(chain);

  const rings = new THREE.Group();
  const ringData = [
    [-2.35, 1.25, -0.5, 0.8, 0.3, 0.2],
    [1.55, 0.72, 0.15, -0.25, 0.95, -0.08],
    [2.55, -1.2, -0.55, 0.55, -0.35, 0.24],
    [-0.15, 1.75, -1.0, 1.05, -0.15, 0.1]
  ];

  ringData.forEach(([x, y, z, rx, ry, rz], index) => {
    const ring = new THREE.Mesh(index === 1 ? torusLarge : torusSmall, gold);
    ring.position.set(x, y, z);
    ring.rotation.set(rx, ry, rz);
    ring.userData.floatPhase = index * 0.8;
    ring.userData.baseY = y;
    rings.add(ring);
  });

  root.add(rings);

  const pendant = makeEye(1.06);
  pendant.position.set(0.58, -1.12, 0.86);
  pendant.rotation.set(0.08, -0.24, 0.08);
  root.add(pendant);

  const braceletOrbit = new THREE.Group();
  const orbitPath = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.012, 10, 120), deepGold);
  orbitPath.scale.y = 0.38;
  orbitPath.rotation.z = 0.1;
  braceletOrbit.add(orbitPath);

  for (let i = 0; i < 36; i += 1) {
    const angle = (i / 36) * Math.PI * 2;
    const isCharm = i % 9 === 0;
    const piece = isCharm
      ? makeEye(0.38)
      : new THREE.Mesh(i % 4 === 0 ? linkTorus : miniBead, i % 5 === 0 ? crystal : gold);

    piece.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 0.46, Math.sin(angle * 2.1) * 0.1);
    piece.rotation.set(angle * 0.32, angle, angle * 0.52);
    piece.userData.floatPhase = i * 0.28;
    piece.userData.baseY = piece.position.y;
    braceletOrbit.add(piece);
  }

  braceletOrbit.position.set(1.34, 0.03, 0.9);
  braceletOrbit.rotation.set(0.62, -0.78, 0.08);
  root.add(braceletOrbit);

  const gemBurst = new THREE.Group();
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const radius = 1.65 + (i % 4) * 0.28;
    const sparkleGem = new THREE.Mesh(gem, i % 3 === 0 ? blush : crystal);
    sparkleGem.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.4) * 1.02, -0.82 + Math.sin(angle) * 0.36);
    sparkleGem.rotation.set(angle, angle * 0.5, angle * 0.2);
    sparkleGem.userData.floatPhase = i * 0.44;
    sparkleGem.userData.baseY = sparkleGem.position.y;
    gemBurst.add(sparkleGem);
  }
  root.add(gemBurst);

  const sparkleGeometry = new THREE.BufferGeometry();
  const sparklePositions = [];
  for (let i = 0; i < 130; i += 1) {
    sparklePositions.push(
      (Math.random() - 0.5) * 8.2,
      (Math.random() - 0.5) * 5.4,
      (Math.random() - 0.5) * 4.2
    );
  }
  sparkleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparklePositions, 3));
  const sparkles = new THREE.Points(
    sparkleGeometry,
    new THREE.PointsMaterial({
      color: 0xf5c76f,
      opacity: 0.48,
      size: 0.03,
      transparent: true
    })
  );
  root.add(sparkles);

  const pointer = { x: 0, y: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const width = motionSection.clientWidth;
    const height = motionSection.clientHeight;
    const isMobile = width < 700;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 1.7));
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.fov = isMobile ? 43 : 38;
    camera.updateProjectionMatrix();

    root.scale.setScalar(isMobile ? 0.68 : 0.92);
    root.position.set(isMobile ? 0.08 : 1.62, isMobile ? 0.14 : 0.05, 0);
  }

  function animate(time = 0) {
    const t = time * 0.001;
    const scrollRatio =
      window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    camera.position.x = Math.sin(t * 0.18) * 0.24 + pointer.x * 0.12;
    camera.position.y = 0.15 + Math.cos(t * 0.2) * 0.12 - pointer.y * 0.06;
    camera.lookAt(0, 0, 0);

    keyLight.position.x = -4 + Math.sin(t * 0.38) * 0.8;
    blueLight.intensity = 10 + Math.sin(t * 2.1) * 3.2;
    rimLight.intensity = 6.5 + Math.cos(t * 1.7) * 1.6;
    rimLight.position.x = -3.8 + Math.sin(t * 0.9) * 1.1;

    root.rotation.y = Math.sin(t * 0.42) * 0.22 + pointer.x * 0.18 + scrollRatio * 0.72;
    root.rotation.x = Math.cos(t * 0.34) * 0.08 - pointer.y * 0.08;
    root.rotation.z = Math.sin(t * 0.24) * 0.025;
    chain.children.forEach((child) => {
      if (child.userData.floatPhase !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(t * 1.6 + child.userData.floatPhase) * 0.035;
      }
    });
    rings.children.forEach((ring) => {
      ring.rotation.z += 0.005;
      ring.rotation.y += 0.0025;
      ring.position.y = ring.userData.baseY + Math.sin(t * 1.2 + ring.userData.floatPhase) * 0.045;
    });
    braceletOrbit.rotation.z = 0.08 + t * 0.3;
    braceletOrbit.rotation.y = -0.78 + Math.sin(t * 0.7) * 0.16 + pointer.x * 0.04;
    braceletOrbit.children.forEach((child) => {
      if (child.userData.floatPhase !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(t * 2.1 + child.userData.floatPhase) * 0.025;
      }
    });
    gemBurst.rotation.y = -t * 0.08;
    gemBurst.rotation.z = Math.sin(t * 0.34) * 0.08;
    gemBurst.children.forEach((child) => {
      child.rotation.x += 0.008;
      child.rotation.y += 0.011;
      child.position.y = child.userData.baseY + Math.sin(t * 1.7 + child.userData.floatPhase) * 0.035;
    });
    pendant.rotation.y = -0.24 + Math.sin(t * 1.15) * 0.18;
    pendant.rotation.z = 0.08 + Math.cos(t * 1.35) * 0.06;
    sparkles.rotation.y -= 0.0015;
    sparkles.rotation.x += 0.0006;
    sparkles.material.opacity = 0.44 + Math.sin(t * 2.5) * 0.14;

    renderer.render(scene, camera);
    if (!reducedMotion) {
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  });

  resize();
  animate();
}
