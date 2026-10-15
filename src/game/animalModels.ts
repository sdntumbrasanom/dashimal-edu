import * as THREE from 'three';
import { AnimalId } from '../types/game.ts';

export interface AnimatedAnimalGroup extends THREE.Group {
  userData: {
    animalId: AnimalId;
    limbs: THREE.Mesh[];
    ears?: THREE.Mesh[];
    tail?: THREE.Object3D;
    head?: THREE.Object3D;
    wings?: THREE.Object3D[];
    originalScaleY: number;
  };
}

// Shared reusable materials & geometries
function createMat(color: number | string, roughness = 0.5, metalness = 0.1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    flatShading: false,
  });
}

const blackMat = createMat(0x111827, 0.3, 0.2);
const whiteMat = createMat(0xffffff, 0.4, 0.1);
const pinkMat = createMat(0xf472b6, 0.6, 0.05);
const darkBrownMat = createMat(0x451a03, 0.7, 0.1);

export function buildAnimalModel(animalId: AnimalId): AnimatedAnimalGroup {
  const root = new THREE.Group() as AnimatedAnimalGroup;
  const limbs: THREE.Mesh[] = [];
  const ears: THREE.Mesh[] = [];
  let tail: THREE.Object3D | undefined;
  let headObj: THREE.Object3D | undefined;
  let wings: THREE.Object3D[] | undefined;

  // Contact shadow disc at bottom
  const shadowGeo = new THREE.CircleGeometry(0.55, 20);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  root.add(shadow);

  // Helper for eyes
  const addEyes = (parent: THREE.Object3D, y: number, z: number, spacing = 0.22, size = 0.07) => {
    const eyeGeo = new THREE.SphereGeometry(size, 12, 12);
    const pupilGeo = new THREE.SphereGeometry(size * 0.55, 10, 10);

    const leftEye = new THREE.Mesh(eyeGeo, whiteMat);
    leftEye.position.set(-spacing, y, z);
    const leftPupil = new THREE.Mesh(pupilGeo, blackMat);
    leftPupil.position.set(0, 0, size * 0.7);
    leftEye.add(leftPupil);
    parent.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, whiteMat);
    rightEye.position.set(spacing, y, z);
    const rightPupil = new THREE.Mesh(pupilGeo, blackMat);
    rightPupil.position.set(0, 0, size * 0.7);
    rightEye.add(rightPupil);
    parent.add(rightEye);
  };

  switch (animalId) {
    case 'kelinci': {
      // White fluffy bunny
      const mainMat = createMat(0xf8fafc, 0.6, 0.05);

      // Body
      const bodyGeo = new THREE.SphereGeometry(0.42, 16, 16);
      const body = new THREE.Mesh(bodyGeo, mainMat);
      body.position.set(0, 0.55, 0);
      body.scale.set(0.9, 1.1, 1.0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), mainMat);
      headObj.position.set(0, 1.05, 0.12);
      root.add(headObj);
      addEyes(headObj, 0.06, 0.24, 0.18, 0.065);

      // Cute pink nose
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), pinkMat);
      nose.position.set(0, 0.01, 0.32);
      headObj.add(nose);

      // Long ears with pink interior
      const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.55, 12);
      const innerEarGeo = new THREE.CylinderGeometry(0.025, 0.05, 0.45, 10);

      const leftEar = new THREE.Mesh(earGeo, mainMat);
      leftEar.position.set(-0.14, 0.42, -0.05);
      leftEar.rotation.z = 0.15;
      leftEar.rotation.x = -0.1;
      const leftInner = new THREE.Mesh(innerEarGeo, pinkMat);
      leftInner.position.set(0, 0, 0.035);
      leftEar.add(leftInner);
      headObj.add(leftEar);
      ears.push(leftEar);

      const rightEar = new THREE.Mesh(earGeo, mainMat);
      rightEar.position.set(0.14, 0.42, -0.05);
      rightEar.rotation.z = -0.15;
      rightEar.rotation.x = -0.1;
      const rightInner = new THREE.Mesh(innerEarGeo, pinkMat);
      rightInner.position.set(0, 0, 0.035);
      rightEar.add(rightInner);
      headObj.add(rightEar);
      ears.push(rightEar);

      // Puffy round tail
      const tailMesh = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), mainMat);
      tailMesh.position.set(0, 0.42, -0.42);
      root.add(tailMesh);
      tail = tailMesh;

      // 4 Paws / Limbs
      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.28, 10);
      const pawPositions = [
        [-0.22, 0.14, 0.2],
        [0.22, 0.14, 0.2],
        [-0.24, 0.14, -0.2],
        [0.24, 0.14, -0.2],
      ];
      pawPositions.forEach(([x, y, z]) => {
        const leg = new THREE.Mesh(legGeo, mainMat);
        leg.position.set(x, y, z);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'jerapah': {
      // Yellow Giraffe with brown patches and long neck
      const yellowMat = createMat(0xfacc15, 0.5, 0.05);
      const patchMat = createMat(0x854d0e, 0.6, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.75), yellowMat);
      body.position.set(0, 0.65, 0);
      root.add(body);

      // Patches on body
      const patch1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.02), patchMat);
      patch1.position.set(0.28, 0.65, 0.1);
      root.add(patch1);

      // Long Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.9, 12), yellowMat);
      neck.position.set(0, 1.25, 0.25);
      neck.rotation.x = 0.18;
      root.add(neck);

      // Head
      headObj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.28, 0.4), yellowMat);
      headObj.position.set(0, 1.75, 0.42);
      root.add(headObj);
      addEyes(headObj, 0.05, 0.16, 0.16, 0.06);

      // Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.2), patchMat);
      snout.position.set(0, -0.05, 0.26);
      headObj.add(snout);

      // 2 Horns (Ossicones)
      const hornGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8);
      const knobGeo = new THREE.SphereGeometry(0.045, 8, 8);

      [-0.09, 0.09].forEach((hx) => {
        const horn = new THREE.Mesh(hornGeo, yellowMat);
        horn.position.set(hx, 0.2, -0.05);
        const knob = new THREE.Mesh(knobGeo, patchMat);
        knob.position.set(0, 0.1, 0);
        horn.add(knob);
        headObj!.add(horn);
      });

      // Tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), yellowMat);
      tailMesh.position.set(0, 0.5, -0.4);
      tailMesh.rotation.x = -0.3;
      const tailTuft = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), patchMat);
      tailTuft.position.set(0, -0.2, 0);
      tailMesh.add(tailTuft);
      root.add(tailMesh);
      tail = tailMesh;

      // Sturdy long legs
      const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.55, 10);
      [
        [-0.2, 0.27, 0.25],
        [0.2, 0.27, 0.25],
        [-0.2, 0.27, -0.25],
        [0.2, 0.27, -0.25],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, yellowMat);
        leg.position.set(lx, ly, lz);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), patchMat);
        hoof.position.set(0, -0.23, 0);
        leg.add(hoof);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'kuda': {
      // Strong chestnut Horse
      const horseMat = createMat(0x92400e, 0.6, 0.1);
      const maneMat = createMat(0x451a03, 0.7, 0.1);

      // Torso
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.65, 8, 16), horseMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.65, 0);
      root.add(body);

      // Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.6, 12), horseMat);
      neck.position.set(0, 1.05, 0.26);
      neck.rotation.x = 0.35;
      root.add(neck);

      // Mane
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.2), maneMat);
      mane.position.set(0, 1.15, 0.15);
      mane.rotation.x = 0.35;
      root.add(mane);

      // Head
      headObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.45), horseMat);
      headObj.position.set(0, 1.35, 0.48);
      headObj.rotation.x = 0.2;
      root.add(headObj);
      addEyes(headObj, 0.06, 0.12, 0.15, 0.06);

      // Snout
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.22), maneMat);
      muzzle.position.set(0, -0.06, 0.28);
      headObj.add(muzzle);

      // Ears
      [-0.1, 0.1].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), horseMat);
        ear.position.set(ex, 0.2, -0.1);
        headObj!.add(ear);
      });

      // Tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.45, 8), maneMat);
      tailMesh.position.set(0, 0.6, -0.45);
      tailMesh.rotation.x = -0.4;
      root.add(tailMesh);
      tail = tailMesh;

      // Legs with hooves
      const legGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.48, 10);
      [
        [-0.2, 0.24, 0.26],
        [0.2, 0.24, 0.26],
        [-0.2, 0.24, -0.26],
        [0.2, 0.24, -0.26],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, horseMat);
        leg.position.set(lx, ly, lz);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 8), blackMat);
        hoof.position.set(0, -0.2, 0);
        leg.add(hoof);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'katak': {
      // Vibrant green Frog with big bulbous eyes
      const frogMat = createMat(0x22c55e, 0.4, 0.1);
      const bellyMat = createMat(0x86efac, 0.5, 0.05);

      // Body (round squarish)
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 16), frogMat);
      body.scale.set(1.1, 0.85, 1.0);
      body.position.set(0, 0.46, 0);
      root.add(body);

      // Light belly
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 14), bellyMat);
      belly.scale.set(0.9, 0.7, 0.8);
      belly.position.set(0, 0.42, 0.12);
      root.add(belly);

      // Head area
      headObj = new THREE.Group();
      headObj.position.set(0, 0.65, 0.1);
      root.add(headObj);

      // Big bulbous frog eyes on top
      [-0.22, 0.22].forEach((ex) => {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), frogMat);
        bulb.position.set(ex, 0.18, 0.05);
        const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), whiteMat);
        eyeWhite.position.set(0, 0, 0.07);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), blackMat);
        pupil.position.set(0, 0, 0.08);
        eyeWhite.add(pupil);
        bulb.add(eyeWhite);
        headObj!.add(bulb);
      });

      // Wide frog mouth line
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.03, 0.1), createMat(0x15803d, 0.4));
      mouth.position.set(0, -0.05, 0.35);
      headObj.add(mouth);

      // 4 frog limbs
      const limbGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
      [
        [-0.32, 0.18, 0.2],
        [0.32, 0.18, 0.2],
        [-0.36, 0.22, -0.15],
        [0.36, 0.22, -0.15],
      ].forEach(([lx, ly, lz], idx) => {
        const limb = new THREE.Mesh(limbGeo, frogMat);
        limb.position.set(lx, ly, lz);
        if (idx >= 2) {
          limb.scale.set(1.4, 1.2, 1.4); // Hind jumping legs are larger
          limb.rotation.z = lx < 0 ? -0.4 : 0.4;
        }
        root.add(limb);
        limbs.push(limb);
      });
      break;
    }

    case 'harimau': {
      // Orange Tiger with black stripes
      const tigerMat = createMat(0xea580c, 0.5, 0.1);
      const stripeMat = createMat(0x18181b, 0.6, 0.1);
      const whiteFur = createMat(0xf8fafc, 0.5, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.6, 8, 16), tigerMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.6, 0);
      root.add(body);

      // Stripes on body
      [-0.15, 0, 0.15].forEach((sz) => {
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.03, 6, 16, Math.PI), stripeMat);
        stripe.rotation.x = Math.PI / 2;
        stripe.position.set(0, 0.6, sz);
        root.add(stripe);
      });

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), tigerMat);
      headObj.position.set(0, 0.95, 0.36);
      root.add(headObj);
      addEyes(headObj, 0.05, 0.24, 0.18, 0.065);

      // White cheeks & muzzle
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.18), whiteFur);
      muzzle.position.set(0, -0.06, 0.28);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), stripeMat);
      nose.position.set(0, 0.04, 0.1);
      muzzle.add(nose);
      headObj.add(muzzle);

      // Tiger ears
      [-0.2, 0.2].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), tigerMat);
        ear.position.set(ex, 0.26, 0);
        headObj!.add(ear);
        ears.push(ear);
      });

      // Striped Tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 10), tigerMat);
      tailMesh.position.set(0, 0.65, -0.42);
      tailMesh.rotation.x = -0.5;
      root.add(tailMesh);
      tail = tailMesh;

      // Paws
      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.36, 10);
      [
        [-0.22, 0.18, 0.25],
        [0.22, 0.18, 0.25],
        [-0.22, 0.18, -0.22],
        [0.22, 0.18, -0.22],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, tigerMat);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'singa': {
      // Majestic Lion with grand golden/amber mane
      const lionMat = createMat(0xd97706, 0.5, 0.1);
      const maneMat = createMat(0x78350f, 0.7, 0.1);

      // Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 8, 16), lionMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.6, 0);
      root.add(body);

      // Huge fluffy mane
      const mane = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.2, 10, 20), maneMat);
      mane.position.set(0, 0.95, 0.25);
      root.add(mane);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), lionMat);
      headObj.position.set(0, 0.95, 0.35);
      root.add(headObj);
      addEyes(headObj, 0.05, 0.22, 0.16, 0.065);

      // Snout
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.18), lionMat);
      snout.position.set(0, -0.06, 0.26);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), darkBrownMat);
      nose.position.set(0, 0.04, 0.1);
      snout.add(nose);
      headObj.add(snout);

      // Ears peeking out
      [-0.24, 0.24].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), lionMat);
        ear.position.set(ex, 0.24, 0);
        headObj!.add(ear);
        ears.push(ear);
      });

      // Tail with fluffy tip
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 8), lionMat);
      tailMesh.position.set(0, 0.62, -0.42);
      tailMesh.rotation.x = -0.45;
      const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 10), maneMat);
      tuft.position.set(0, -0.24, 0);
      tailMesh.add(tuft);
      root.add(tailMesh);
      tail = tailMesh;

      // Paws
      const legGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.36, 10);
      [
        [-0.22, 0.18, 0.25],
        [0.22, 0.18, 0.25],
        [-0.22, 0.18, -0.22],
        [0.22, 0.18, -0.22],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, lionMat);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'burung': {
      // Sky blue Falcon/Eagle bird
      const birdMat = createMat(0x38bdf8, 0.5, 0.1);
      const crestMat = createMat(0x0284c7, 0.6, 0.1);
      const beakMat = createMat(0xf59e0b, 0.4, 0.1);

      // Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 14), birdMat);
      body.rotation.x = -Math.PI / 2.3;
      body.position.set(0, 0.55, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 14), birdMat);
      headObj.position.set(0, 0.95, 0.2);
      root.add(headObj);
      addEyes(headObj, 0.05, 0.18, 0.15, 0.06);

      // Crest feather
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 6), crestMat);
      crest.position.set(0, 0.32, -0.05);
      crest.rotation.x = -0.3;
      headObj.add(crest);

      // Beak
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.24, 8), beakMat);
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, -0.02, 0.32);
      headObj.add(beak);

      // Wings
      const wingGeo = new THREE.BoxGeometry(0.45, 0.08, 0.35);
      const leftWing = new THREE.Mesh(wingGeo, crestMat);
      leftWing.position.set(-0.35, 0.6, 0);
      leftWing.rotation.z = -0.2;
      root.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, crestMat);
      rightWing.position.set(0.35, 0.6, 0);
      rightWing.rotation.z = 0.2;
      root.add(rightWing);
      wings = [leftWing, rightWing];

      // Tail feathers
      const tailFeathers = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.4), crestMat);
      tailFeathers.position.set(0, 0.5, -0.42);
      tailFeathers.rotation.x = -0.3;
      root.add(tailFeathers);
      tail = tailFeathers;

      // Talons/Legs
      const talonGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.26, 8);
      [-0.15, 0.15].forEach((tx) => {
        const talon = new THREE.Mesh(talonGeo, beakMat);
        talon.position.set(tx, 0.14, 0.05);
        root.add(talon);
        limbs.push(talon);
      });
      break;
    }

    case 'monyet': {
      // Warm brown Monkey with round ears and peach face
      const monkeyMat = createMat(0xa16207, 0.6, 0.1);
      const faceMat = createMat(0xfde68a, 0.5, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), monkeyMat);
      body.scale.set(0.9, 1.1, 0.9);
      body.position.set(0, 0.58, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), monkeyMat);
      headObj.position.set(0, 1.05, 0.12);
      root.add(headObj);

      // Peach face mask
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), faceMat);
      face.scale.set(1.0, 0.9, 0.6);
      face.position.set(0, -0.02, 0.18);
      headObj.add(face);
      addEyes(headObj, 0.05, 0.24, 0.14, 0.06);

      // Cute big round monkey ears
      [-0.32, 0.32].forEach((mx) => {
        const ear = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.04, 8, 16), monkeyMat);
        ear.position.set(mx, 0.08, 0);
        ear.rotation.y = Math.PI / 2;
        headObj!.add(ear);
        ears.push(ear as unknown as THREE.Mesh);
      });

      // Long curled tail
      const tailCurve = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16, Math.PI * 1.5), monkeyMat);
      tailCurve.position.set(0, 0.65, -0.38);
      tailCurve.rotation.y = Math.PI / 2;
      root.add(tailCurve);
      tail = tailCurve;

      // Limbs
      const armLegGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.35, 10);
      [
        [-0.25, 0.45, 0.15],
        [0.25, 0.45, 0.15],
        [-0.2, 0.16, -0.1],
        [0.2, 0.16, -0.1],
      ].forEach(([lx, ly, lz]) => {
        const limb = new THREE.Mesh(armLegGeo, monkeyMat);
        limb.position.set(lx, ly, lz);
        root.add(limb);
        limbs.push(limb);
      });
      break;
    }

    case 'babi': {
      // Cheerful pink Pig with cute round snout & nostrils
      const pigMat = createMat(0xf472b6, 0.5, 0.05);
      const darkPigMat = createMat(0xdb2777, 0.6, 0.05);

      // Body (chubby sphere)
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.46, 16, 16), pigMat);
      body.scale.set(1.0, 0.9, 1.15);
      body.position.set(0, 0.54, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 16), pigMat);
      headObj.position.set(0, 0.88, 0.35);
      root.add(headObj);
      addEyes(headObj, 0.08, 0.24, 0.18, 0.06);

      // Cylindrical Pig Snout with 2 nostrils
      const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.14, 14), darkPigMat);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -0.04, 0.32);
      // Nostrils
      [-0.05, 0.05].forEach((nx) => {
        const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), blackMat);
        nostril.position.set(nx, 0.07, 0);
        snout.add(nostril);
      });
      headObj.add(snout);

      // Floppy ears
      [-0.22, 0.22].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), darkPigMat);
        ear.position.set(ex, 0.26, 0);
        ear.rotation.z = ex < 0 ? 0.6 : -0.6;
        ear.rotation.x = -0.3;
        headObj!.add(ear);
        ears.push(ear);
      });

      // Curly corkscrew tail
      const tailMesh = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.03, 6, 14, Math.PI * 1.8), darkPigMat);
      tailMesh.position.set(0, 0.58, -0.48);
      root.add(tailMesh);
      tail = tailMesh;

      // Short chubby legs
      const legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.24, 10);
      [
        [-0.22, 0.12, 0.22],
        [0.22, 0.12, 0.22],
        [-0.22, 0.12, -0.22],
        [0.22, 0.12, -0.22],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, pigMat);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'anjing': {
      // Golden friendly Dog with floppy ears
      const dogMat = createMat(0xd97706, 0.5, 0.1);
      const earMat = createMat(0x92400e, 0.6, 0.1);
      const snoutMat = createMat(0xfef3c7, 0.5, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.55, 8, 16), dogMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.55, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), dogMat);
      headObj.position.set(0, 0.95, 0.32);
      root.add(headObj);
      addEyes(headObj, 0.06, 0.22, 0.16, 0.065);

      // Snout with black nose
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.2), snoutMat);
      muzzle.position.set(0, -0.06, 0.26);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blackMat);
      nose.position.set(0, 0.05, 0.1);
      muzzle.add(nose);
      headObj.add(muzzle);

      // Floppy ears
      [-0.24, 0.24].forEach((dx) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.15), earMat);
        ear.position.set(dx, 0.05, 0.05);
        ear.rotation.z = dx < 0 ? -0.25 : 0.25;
        headObj!.add(ear);
        ears.push(ear);
      });

      // Wagging tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.38, 8), dogMat);
      tailMesh.position.set(0, 0.6, -0.4);
      tailMesh.rotation.x = -0.6;
      root.add(tailMesh);
      tail = tailMesh;

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.32, 10);
      [
        [-0.2, 0.16, 0.22],
        [0.2, 0.16, 0.22],
        [-0.2, 0.16, -0.22],
        [0.2, 0.16, -0.22],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, dogMat);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'kucing':
    default: {
      // Sleek silver/pink Cat with pointy ears & whiskers
      const catMat = createMat(0x94a3b8, 0.5, 0.1);
      const pinkInner = createMat(0xf472b6, 0.6, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), catMat);
      body.scale.set(0.95, 1.05, 1.15);
      body.position.set(0, 0.52, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), catMat);
      headObj.position.set(0, 0.9, 0.3);
      root.add(headObj);
      addEyes(headObj, 0.06, 0.22, 0.16, 0.065);

      // Tiny pink nose
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.06, 6), pinkInner);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, -0.02, 0.3);
      headObj.add(nose);

      // Sharp triangular cat ears
      [-0.16, 0.16].forEach((cx) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 6), catMat);
        ear.position.set(cx, 0.28, 0);
        ear.rotation.z = cx < 0 ? 0.2 : -0.2;
        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 6), pinkInner);
        inner.position.set(0, 0, 0.03);
        ear.add(inner);
        headObj!.add(ear);
        ears.push(ear);
      });

      // Long curled cat tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.55, 8), catMat);
      tailMesh.position.set(0, 0.6, -0.4);
      tailMesh.rotation.x = -0.7;
      root.add(tailMesh);
      tail = tailMesh;

      // Legs
      const legGeo = new THREE.CylinderGeometry(0.07, 0.075, 0.3, 10);
      [
        [-0.18, 0.15, 0.2],
        [0.18, 0.15, 0.2],
        [-0.18, 0.15, -0.2],
        [0.18, 0.15, -0.2],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, catMat);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }
  }

  root.userData = {
    animalId,
    limbs,
    ears,
    tail,
    head: headObj,
    wings,
    originalScaleY: 1,
  };

  return root;
}
