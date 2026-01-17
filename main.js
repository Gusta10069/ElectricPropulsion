import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { PointerLockControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/PointerLockControls.js";

const canvas = document.querySelector("#world");
const hud = document.querySelector(".hud");
const blocker = document.querySelector("#blocker");
const startButton = document.querySelector("#start");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#020617");
scene.fog = new THREE.Fog("#020617", 10, 120);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500
);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new PointerLockControls(camera, document.body);

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const player = {
  height: 1.7,
  speed: 7,
  sprint: 12,
  jump: 6,
  onGround: false,
};

camera.position.set(0, player.height, 8);

const ambient = new THREE.AmbientLight(0xffffff, 0.45);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(10, 20, 6);
scene.add(sun);

const floorGeometry = new THREE.PlaneGeometry(300, 300, 40, 40);
const floorMaterial = new THREE.MeshStandardMaterial({
  color: "#0f172a",
  roughness: 0.9,
  metalness: 0.1,
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(300, 60, "#1e293b", "#0f172a");
scene.add(grid);

const structures = new THREE.Group();
const palette = ["#38bdf8", "#818cf8", "#34d399", "#fbbf24", "#f87171"];

for (let i = 0; i < 60; i += 1) {
  const size = 1 + Math.random() * 4;
  const geometry = new THREE.BoxGeometry(size, size, size);
  const material = new THREE.MeshStandardMaterial({
    color: palette[i % palette.length],
    roughness: 0.5,
    metalness: 0.2,
  });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(
    (Math.random() - 0.5) * 160,
    size / 2,
    (Math.random() - 0.5) * 160
  );
  structures.add(cube);
}
scene.add(structures);

const stars = new THREE.BufferGeometry();
const starCount = 500;
const starPositions = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i += 1) {
  starPositions[i * 3] = (Math.random() - 0.5) * 400;
  starPositions[i * 3 + 1] = 30 + Math.random() * 120;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 400;
}

stars.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
  color: "#e2e8f0",
  size: 0.6,
  sizeAttenuation: true,
});
const starField = new THREE.Points(stars, starMaterial);
scene.add(starField);

const keyState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  sprint: false,
  jump: false,
};

const onKey = (event, isDown) => {
  switch (event.code) {
    case "KeyW":
    case "ArrowUp":
      keyState.forward = isDown;
      break;
    case "KeyS":
    case "ArrowDown":
      keyState.backward = isDown;
      break;
    case "KeyA":
    case "ArrowLeft":
      keyState.left = isDown;
      break;
    case "KeyD":
    case "ArrowRight":
      keyState.right = isDown;
      break;
    case "ShiftLeft":
    case "ShiftRight":
      keyState.sprint = isDown;
      break;
    case "Space":
      keyState.jump = isDown;
      break;
    default:
      break;
  }
};

const resetControls = () => {
  Object.keys(keyState).forEach((key) => {
    keyState[key] = false;
  });
};

document.addEventListener("keydown", (event) => onKey(event, true));
document.addEventListener("keyup", (event) => onKey(event, false));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    resetControls();
  }
});

controls.addEventListener("lock", () => {
  hud.style.display = "none";
  blocker.style.display = "none";
});

controls.addEventListener("unlock", () => {
  hud.style.display = "block";
  blocker.style.display = "block";
  resetControls();
});

startButton.addEventListener("click", () => {
  controls.lock();
});

let previousTime = performance.now();

const animate = () => {
  requestAnimationFrame(animate);

  const time = performance.now();
  const delta = (time - previousTime) / 1000;

  direction.set(0, 0, 0);
  direction.z = Number(keyState.forward) - Number(keyState.backward);
  direction.x = Number(keyState.right) - Number(keyState.left);
  direction.normalize();

  const speed = keyState.sprint ? player.sprint : player.speed;

  if (controls.isLocked) {
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * delta;

    if (direction.lengthSq() > 0) {
      velocity.x -= direction.x * speed * delta;
      velocity.z -= direction.z * speed * delta;
    }

    if (keyState.jump && player.onGround) {
      velocity.y = player.jump;
      player.onGround = false;
    }

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    if (camera.position.y < player.height) {
      velocity.y = 0;
      camera.position.y = player.height;
      player.onGround = true;
    }
  }

  renderer.render(scene, camera);
  previousTime = time;
};

animate();

const onResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onResize);
