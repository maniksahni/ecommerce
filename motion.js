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

  const scene = new THREE.Scene();
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
  const bead = new THREE.SphereGeometry(0.095, 28, 18);
  const eyeBase = new THREE.SphereGeometry(0.18, 38, 24);
  const blueIris = new THREE.SphereGeometry(0.095, 32, 18);
  const pupil = new THREE.SphereGeometry(0.045, 24, 14);

  function makeEye(scale = 1) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(eyeBase, pearl);
    const iris = new THREE.Mesh(blueIris, eyeBlue);
    const dot = new THREE.Mesh(pupil, black);

    iris.position.set(0, 0, 0.15);
    dot.position.set(0, 0, 0.23);
    group.add(base, iris, dot);
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
    const isEye = i % 6 === 2;
    const piece = isEye ? makeEye(0.88) : new THREE.Mesh(bead, i % 3 === 0 ? gold : deepGold);

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
  chain.position.set(-1.55, -0.15, 0);
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

  const pendant = makeEye(1.35);
  pendant.position.set(1.05, -1.5, 0.85);
  pendant.rotation.set(0.16, -0.34, 0.08);
  root.add(pendant);

  const sparkleGeometry = new THREE.BufferGeometry();
  const sparklePositions = [];
  for (let i = 0; i < 90; i += 1) {
    sparklePositions.push(
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 4.8,
      (Math.random() - 0.5) * 3.5
    );
  }
  sparkleGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparklePositions, 3));
  const sparkles = new THREE.Points(
    sparkleGeometry,
    new THREE.PointsMaterial({
      color: 0xf5c76f,
      opacity: 0.42,
      size: 0.025,
      transparent: true
    })
  );
  root.add(sparkles);

  const pointer = { x: 0, y: 0 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    const width = motionSection.clientWidth;
    const height = motionSection.clientHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();

    const isMobile = width < 700;
    root.scale.setScalar(isMobile ? 0.78 : 1);
    root.position.set(isMobile ? -0.35 : -1.05, isMobile ? 0.42 : 0.05, 0);
  }

  function animate(time = 0) {
    const t = time * 0.001;
    const scrollRatio =
      window.scrollY / Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    root.rotation.y = Math.sin(t * 0.34) * 0.22 + pointer.x * 0.16 + scrollRatio * 0.8;
    root.rotation.x = Math.cos(t * 0.28) * 0.08 - pointer.y * 0.08;
    chain.children.forEach((child) => {
      if (child.userData.floatPhase !== undefined) {
        child.position.y = child.userData.baseY + Math.sin(t * 1.6 + child.userData.floatPhase) * 0.035;
      }
    });
    rings.children.forEach((ring) => {
      ring.rotation.z += 0.004;
      ring.rotation.y += 0.002;
      ring.position.y = ring.userData.baseY + Math.sin(t * 1.2 + ring.userData.floatPhase) * 0.045;
    });
    pendant.rotation.y = -0.34 + Math.sin(t * 1.15) * 0.22;
    sparkles.rotation.y -= 0.0008;

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
