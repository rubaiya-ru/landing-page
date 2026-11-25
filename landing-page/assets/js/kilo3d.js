/* Hero: real-time 3D Kilo.
   - Shows a still image first; swaps to the live 3D canvas once it has rendered.
   - If WebGL or the three.js download is unavailable, the still image simply stays.
   - Idle bob, blinking, waving, and the head gently follows the pointer.
   - Stops rendering when off-screen or when the tab is hidden.
   - With "reduce motion" turned on, renders one still frame and does not animate. */
import * as THREE from 'three';
import { buildKilo, addStage } from './kilo-model.js';

const wrap = document.querySelector('[data-kilo-3d]');
if (wrap) {
  try {
    init(wrap);
  } catch (err) {
    console.warn('3D Kilo is unavailable; showing the still image instead.', err);
  }
}

function init(wrap) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const canvas = document.createElement('canvas');
  canvas.className = 'kilo-canvas';
  canvas.setAttribute('aria-hidden', 'true');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  wrap.appendChild(canvas);

  const scene = new THREE.Scene();
  addStage(scene, renderer);
  const kilo = buildKilo();
  scene.add(kilo.root);

  const camera = new THREE.PerspectiveCamera(30, 6 / 7, .1, 50);
  const target = new THREE.Vector3(.1, 1.17, 0);
  camera.position.set(.1, 1.5, 5.15);
  camera.lookAt(target);

  /* Size */
  const resize = () => {
    const { width, height } = wrap.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (!running) renderer.render(scene, camera);
  };
  new ResizeObserver(resize).observe(wrap);

  /* Pointer: head follows within a small range */
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    const r = wrap.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * .35;
    look.tx = THREE.MathUtils.clamp((e.clientX - cx) / (window.innerWidth * .5), -1, 1);
    look.ty = THREE.MathUtils.clamp((e.clientY - cy) / (window.innerHeight * .6), -1, 1);
  }, { passive: true });

  /* Hop when someone signs up */
  let hopStart = -1;
  window.addEventListener('kilo:hop', () => { hopStart = now(); if (!running) start(); });

  const t0 = performance.now();
  const now = () => (performance.now() - t0) / 1000;
  let running = false;
  let visible = true;
  let rafId = 0;
  let nextBlink = 2.5;

  const pose = (t) => {
    const k = kilo;
    // breathing + bob
    let y = Math.sin(t * 2) * .022;
    if (hopStart >= 0) {
      const h = t - hopStart;
      if (h < .9) {
        y += Math.sin(Math.min(h / .55, 1) * Math.PI) * .32 + (h > .55 ? Math.sin(((h - .55) / .35) * Math.PI) * .06 : 0);
        k.body.rotation.z = Math.sin(h * 7) * .05 * (1 - h / .9);
      } else {
        hopStart = -1;
        k.body.rotation.z = 0;
      }
    }
    k.body.position.y = y;
    k.torso.scale.y = 1 + Math.sin(t * 2 + .6) * .008;

    // wave in bursts
    const cycle = t % 7;
    const env = cycle < 3 ? Math.sin((cycle / 3) * Math.PI) : 0;
    k.armWave.rotation.z = 2.42 + Math.sin(t * 7) * .2 * env;
    k.armWave.rotation.x = -.1 * env;
    k.armRest.rotation.z = -.2 + Math.sin(t * 2 + 1) * .02;

    // head follows the pointer
    look.x += (look.tx - look.x) * .06;
    look.y += (look.ty - look.y) * .06;
    k.head.rotation.y = look.x * .38;
    k.head.rotation.x = .04 + look.y * .16;
    k.head.rotation.z = Math.sin(t * .9) * .035 - look.x * .05;

    // blink
    let blink = 1;
    if (t > nextBlink) {
      const b = (t - nextBlink) / .16;
      if (b >= 1) nextBlink = t + 2.5 + Math.random() * 3;
      else blink = 1 - Math.sin(b * Math.PI) * .9;
    }
    k.eyes.forEach((e) => { e.scale.y = blink; });

    // "on call" light pulse
    const pulse = .55 + .45 * (Math.sin(t * 3.4) * .5 + .5);
    k.live.scale.setScalar(.85 + pulse * .25);
    k.liveGlow.intensity = .04 + pulse * .12;
  };

  const tick = () => {
    rafId = 0;
    if (!running) return;
    pose(now());
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  function start() {
    if (running || !visible || document.hidden) return;
    if (reduceMotion.matches && hopStart < 0) return;
    running = true;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) start(); else stop();
  }, { rootMargin: '100px' }).observe(wrap);

  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduceMotion.addEventListener('change', () => {
    stop();
    pose(0);
    renderer.render(scene, camera);
    start();
  });

  /* First frame, then swap the still image for the live canvas */
  resize();
  pose(0);
  renderer.render(scene, camera);
  requestAnimationFrame(() => wrap.classList.add('is-3d'));
  start();

  // Debug: adding ?kilo-debug to the URL exposes the scene as window.__kilo (used to render the still images).
  if (new URLSearchParams(location.search).has('kilo-debug')) {
    window.__kilo = { THREE, renderer, scene, camera, kilo, pose, stop };
  }
}
