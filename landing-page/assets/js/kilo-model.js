/* Kilo the quokka, built from simple 3D shapes with three.js.
   Shared by the hero (kilo3d.js) and the tool that renders the still images.
   Colours come from the ByteVoice palette; lighting follows the guidelines:
   key light upper-left, cyan rim lower-right, warm gold fill from below. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* ---------- Textures ---------- */
function ribTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 8;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 8, 0);
  grad.addColorStop(0, '#000'); grad.addColorStop(.5, '#fff'); grad.addColorStop(1, '#000');
  for (let x = 0; x < 64; x += 8) { g.fillStyle = grad; g.save(); g.translate(x, 0); g.fillRect(0, 0, 8, 8); g.restore(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(12, 1);
  return t;
}

function badgeTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#F2CB1D'; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = '#0A1129'; g.lineWidth = 13; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(48, 32); g.lineTo(48, 96);
  g.moveTo(84, 32); g.lineTo(50, 64); g.lineTo(84, 96);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.center.set(.5, .5);
  t.rotation = Math.PI / 2; // cylinder cap UVs are turned a quarter; this keeps the K upright
  return t;
}

/* ---------- Materials ---------- */
function makeMaterials() {
  const ribs = ribTexture();
  const P = (o) => new THREE.MeshPhysicalMaterial(o);
  return {
    fur:       P({ color: '#9A7437', roughness: .82, sheen: .55, sheenColor: '#E5D8B6', sheenRoughness: .6 }),
    furDark:   P({ color: '#7A5B26', roughness: .85, sheen: .5, sheenColor: '#E5D8B6', sheenRoughness: .6 }),
    cream:     P({ color: '#EADCBC', roughness: .72, sheen: .6, sheenColor: '#FFFFFF', sheenRoughness: .5 }),
    innerEar:  P({ color: '#E9B65C', roughness: .6 }),
    blush:     new THREE.MeshStandardMaterial({ color: '#E9A85C', roughness: .9, transparent: true, opacity: .45, depthWrite: false }),
    jumper:    P({ color: '#243A78', roughness: .92, sheen: .7, sheenColor: '#5D6FAC', sheenRoughness: .7, bumpMap: ribs, bumpScale: 2 }),
    jumperDark:P({ color: '#16244D', roughness: .9, sheen: .5, sheenColor: '#3A4F96', sheenRoughness: .7, bumpMap: ribs, bumpScale: 2 }),
    knitGold:  P({ color: '#D9B04A', roughness: .6, sheen: .5, sheenColor: '#FFF3C8' }),
    gold:      P({ color: '#F2CB1D', metalness: .85, roughness: .26 }),
    plastic:   P({ color: '#101A38', roughness: .32, clearcoat: .9, clearcoatRoughness: .2 }),
    plastic2:  P({ color: '#1E2F63', roughness: .35, clearcoat: .8, clearcoatRoughness: .25 }),
    eye:       P({ color: '#0A1129', roughness: .1, clearcoat: 1, clearcoatRoughness: .04 }),
    nose:      P({ color: '#0F172A', roughness: .28, clearcoat: .7 }),
    mouth:     new THREE.MeshStandardMaterial({ color: '#0A1129', roughness: .6 }),
    tongue:    P({ color: '#E58C6A', roughness: .5, clearcoat: .4 }),
    shine:     new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
    live:      new THREE.MeshBasicMaterial({ color: '#00D2FF', toneMapped: false }),
    badgeFace: new THREE.MeshPhysicalMaterial({ map: badgeTexture(), roughness: .4, metalness: .2 }),
  };
}

/* ---------- Helpers ---------- */
function mesh(geo, material, { pos, scale, rot } = {}) {
  const m = new THREE.Mesh(geo, material);
  if (pos) m.position.set(...pos);
  if (scale) m.scale.set(...scale);
  if (rot) m.rotation.set(...rot);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const sphere = (r, w = 40, h = 28) => new THREE.SphereGeometry(r, w, h);

function tube(points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points);
  const m = mesh(new THREE.TubeGeometry(curve, 48, radius, 12, false), material);
  // round end caps
  [points[0], points[points.length - 1]].forEach((p) => {
    const cap = mesh(sphere(radius, 12, 8), material, { pos: [p.x, p.y, p.z] });
    m.add(cap);
    cap.position.sub(m.position);
  });
  return { mesh: m, curve };
}

/* ---------- Kilo ---------- */
export function buildKilo() {
  const M = makeMaterials();
  const root = new THREE.Group();   // stays on the ground
  const body = new THREE.Group();   // bobs, hops
  root.add(body);

  /* Feet, hips, tail */
  body.add(
    mesh(sphere(.2), M.furDark, { pos: [-.25, .085, .16], scale: [.82, .42, 1.45] }),
    mesh(sphere(.2), M.furDark, { pos: [.25, .085, .16], scale: [.82, .42, 1.45] }),
    mesh(sphere(.48), M.fur, { pos: [0, .3, 0], scale: [1.05, .6, .9] }),
  );
  const tail = mesh(new THREE.CapsuleGeometry(.09, .42, 8, 16), M.furDark);
  const tailDir = new THREE.Vector3(.75, -.35, -.55).normalize();
  tail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tailDir);
  tail.position.set(.3, .3, -.3).addScaledVector(tailDir, .3);
  body.add(tail);

  /* Jumper (lathe) */
  const profilePts = [
    [.001, .26], [.42, .28], [.56, .42], [.6, .62], [.56, .86], [.47, 1.06], [.33, 1.2], [.001, 1.25],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const profile = new THREE.SplineCurve(profilePts).getPoints(60);
  const radiusAt = (y) => {
    for (let i = 1; i < profile.length; i++) {
      const a = profile[i - 1], b = profile[i];
      if (y >= a.y && y <= b.y) return a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y || 1));
    }
    return .3;
  };
  const torso = new THREE.Group();
  torso.scale.set(1, 1, .86);
  torso.add(mesh(new THREE.LatheGeometry(profile, 72), M.jumper));
  const ring = (y, tubeR, material, extra = .004) => {
    const r = mesh(new THREE.TorusGeometry(radiusAt(y) + extra, tubeR, 12, 96), material, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] });
    torso.add(r);
  };
  ring(.33, .06, M.jumperDark, -.01);  // hem
  ring(.68, .022, M.knitGold, -.012);  // stripes, sitting flush in the knit
  ring(.8, .022, M.knitGold, -.012);
  ring(1.17, .075, M.jumperDark, -.02); // collar
  body.add(torso);

  /* Chest badge */
  const badge = new THREE.Group();
  const bY = .98, bTheta = .42, bR = radiusAt(bY);
  badge.position.set(bR * Math.sin(bTheta), bY, .86 * bR * Math.cos(bTheta) + .012);
  const disc = mesh(new THREE.CylinderGeometry(.085, .085, .022, 40), [M.gold, M.badgeFace, M.gold], { rot: [Math.PI / 2, 0, 0] });
  badge.add(disc);
  badge.lookAt(badge.position.clone().add(new THREE.Vector3(Math.sin(bTheta), .25, Math.cos(bTheta) / .86)));
  body.add(badge);

  /* Arms */
  const makeArm = (side, waving) => {
    const pivot = new THREE.Group();
    pivot.position.set(.47 * side, 1.03, .02);
    pivot.add(
      mesh(new THREE.CapsuleGeometry(.125, .28, 8, 20), M.jumper, { pos: [0, -.2, 0] }),
      mesh(new THREE.TorusGeometry(.112, .036, 10, 32), M.jumperDark, { pos: [0, -.37, 0], rot: [Math.PI / 2, 0, 0] }),
      mesh(sphere(.13), M.fur, { pos: [0, -.48, 0], scale: [1, 1.05, .85] }),
    );
    if (waving) {
      [[-.07, -.575], [0, -.605], [.07, -.575]].forEach(([x, y]) => pivot.add(mesh(sphere(.046, 20, 14), M.fur, { pos: [x, y, .015] })));
    }
    body.add(pivot);
    return pivot;
  };
  const armRest = makeArm(-1, false);
  armRest.rotation.set(-.14, 0, -.2);
  const armWave = makeArm(1, true);
  armWave.rotation.set(0, 0, 2.45);

  /* Head */
  const head = new THREE.Group();
  head.position.set(0, 1.72, .03);
  head.rotation.x = .04;
  body.add(head);

  head.add(
    mesh(sphere(.56, 56, 40), M.fur, { scale: [1.06, .95, .92] }),                 // skull
    mesh(sphere(.3), M.fur, { pos: [-.27, -.16, .18] }),                           // cheeks
    mesh(sphere(.3), M.fur, { pos: [.27, -.16, .18] }),
    mesh(sphere(.3), M.cream, { pos: [0, -.14, .38], scale: [1.05, .8, .75] }),    // muzzle
  );

  // ears
  [-1, 1].forEach((s) => {
    head.add(mesh(sphere(.13), M.furDark, { pos: [.37 * s, .44, -.07], scale: [1, 1.08, .5], rot: [0, 0, -.4 * s] }));
    head.add(mesh(sphere(.075), M.innerEar, { pos: [.37 * s, .44, -.03], scale: [1, 1.08, .35], rot: [0, 0, -.4 * s] }));
  });

  // cheek blush
  [-1, 1].forEach((s) => {
    const dir = new THREE.Vector3(.35 * s, .12, .93).normalize();
    const b = mesh(sphere(.08, 24, 16), M.blush, { scale: [1, .62, .25] });
    b.castShadow = false;
    b.position.set(.27 * s, -.16, .18).addScaledVector(dir, .295);
    b.lookAt(b.position.clone().add(dir));
    head.add(b);
  });

  // eyes
  const eyes = [];
  [-1, 1].forEach((s) => {
    const g = new THREE.Group();
    g.position.set(.19 * s, .06, .47);
    g.add(mesh(sphere(.078, 32, 24), M.eye));
    const shine = new THREE.Mesh(sphere(.022, 12, 8), M.shine);
    shine.position.set(.026, .03, .062);
    const shine2 = new THREE.Mesh(sphere(.01, 10, 6), M.shine);
    shine2.position.set(-.024, -.026, .068);
    g.add(shine, shine2);
    head.add(g);
    eyes.push(g);
  });

  // brows
  [-1, 1].forEach((s) => {
    const pts = [new THREE.Vector3(.12 * s, .2, .47), new THREE.Vector3(.19 * s, .225, .47), new THREE.Vector3(.26 * s, .205, .44)];
    head.add(tube(pts, .014, M.furDark).mesh);
  });

  // nose, mouth
  const mC = new THREE.Vector3(0, -.14, .38), mR = new THREE.Vector3(.315, .24, .225);
  const onMuzzle = (x, y, lift = .006) => {
    const dx = x / mR.x, dy = (y - mC.y) / mR.y;
    return new THREE.Vector3(x, y, mC.z + mR.z * Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)) + lift);
  };
  const nosePos = onMuzzle(0, -.05, -.03);
  head.add(mesh(sphere(.07, 32, 20), M.nose, { pos: [nosePos.x, nosePos.y, nosePos.z], scale: [1.35, .85, .9] }));
  head.add(tube([onMuzzle(0, -.1), onMuzzle(0, -.17), onMuzzle(0, -.215)], .012, M.mouth).mesh);
  const smile = [];
  for (let i = 0; i <= 10; i++) {
    const x = -.13 + .026 * i;
    smile.push(onMuzzle(x, -.232 + .07 * (x / .13) ** 2));
  }
  head.add(tube(smile, .017, M.mouth).mesh);
  const tonguePos = onMuzzle(0, -.258, -.012);
  head.add(mesh(sphere(.05, 24, 16), M.tongue, { pos: [tonguePos.x, tonguePos.y, tonguePos.z], scale: [1, .55, .4] }));

  /* Headset */
  const band = new THREE.Group();
  band.position.set(0, 0, -.02);
  band.rotation.x = -.45;
  band.scale.set(1, .9, 1);
  band.add(mesh(new THREE.TorusGeometry(.62, .045, 16, 72, Math.PI), M.plastic));
  head.add(band);
  [-1, 1].forEach((s) => {
    head.add(
      mesh(new THREE.CylinderGeometry(.16, .16, .12, 40), M.plastic2, { pos: [.66 * s, -.01, 0], rot: [0, 0, Math.PI / 2] }),
      mesh(new THREE.TorusGeometry(.16, .022, 12, 48), M.gold, { pos: [.72 * s, -.01, 0], rot: [0, Math.PI / 2, 0] }),
      mesh(new THREE.CylinderGeometry(.11, .11, .04, 32), M.plastic, { pos: [.735 * s, -.01, 0], rot: [0, 0, Math.PI / 2] }),
    );
  });
  const mic = tube([
    new THREE.Vector3(-.68, -.08, .05), new THREE.Vector3(-.63, -.22, .3),
    new THREE.Vector3(-.46, -.3, .5), new THREE.Vector3(-.25, -.285, .58),
  ], .018, M.plastic);
  head.add(mic.mesh);
  const tipDir = mic.curve.getTangent(1).normalize();
  const tip = mesh(new THREE.CapsuleGeometry(.038, .06, 6, 16), M.gold);
  tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tipDir);
  tip.position.copy(mic.curve.getPoint(1)).addScaledVector(tipDir, .03);
  head.add(tip);

  // "on call" light: cyan only appears as emitted light
  const live = new THREE.Mesh(sphere(.026, 16, 12), M.live);
  live.position.set(.69, .07, .15);
  head.add(live);
  const liveGlow = new THREE.PointLight('#00D2FF', .12, .45, 2);
  liveGlow.position.copy(live.position).add(new THREE.Vector3(.06, 0, .1));
  head.add(liveGlow);

  return { root, body, head, eyes, armWave, armRest, torso, live, liveGlow };
}

/* ---------- Lights, environment and ground ---------- */
export function addStage(scene, renderer, { ground = true } = {}) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .42;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight('#8B98C4', '#E9B65C', .55));

  const key = new THREE.DirectionalLight('#FFF3C8', 2.6);
  key.position.set(-2.2, 6, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2; key.shadow.camera.right = 2;
  key.shadow.camera.top = 3; key.shadow.camera.bottom = -1;
  key.shadow.camera.near = 1; key.shadow.camera.far = 14;
  key.shadow.bias = -.0005;
  key.shadow.normalBias = .02;
  key.shadow.radius = 4;
  scene.add(key);

  const rim = new THREE.DirectionalLight('#00D2FF', 1.3);
  rim.position.set(3, 1.4, -4);
  scene.add(rim);

  const rim2 = new THREE.DirectionalLight('#7FA6D8', 1.0);
  rim2.position.set(-3.5, 2.5, -2.5);
  scene.add(rim2);

  const fill = new THREE.PointLight('#E9B65C', 6, 9, 2);
  fill.position.set(.6, .2, 2.6);
  scene.add(fill);

  if (ground) {
    const g = new THREE.Mesh(new THREE.CircleGeometry(3, 48), new THREE.ShadowMaterial({ color: '#05091A', opacity: .45 }));
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    scene.add(g);
  }
}
