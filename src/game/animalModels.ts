import * as THREE from 'three';
import { AnimalId } from '../types/game.ts';

export interface AnimatedAnimalGroup extends THREE.Group {
  userData: {
    animalId: AnimalId;
    limbs: THREE.Mesh[];
    ears?: THREE.Object3D[];
    tail?: THREE.Object3D;
    head?: THREE.Object3D;
    wings?: THREE.Object3D[];
    originalScaleY: number;
  };
}

// Helper to create PBR standard materials
function createMat(
  color: number | string,
  roughness = 0.55,
  metalness = 0.08
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness,
    metalness,
    flatShading: false,
  });
}

// Common palette
const blackMat = createMat(0x18181b, 0.3, 0.15);
const whiteMat = createMat(0xf8fafc, 0.45, 0.05);
const pinkMat = createMat(0xf472b6, 0.5, 0.05);
const darkBrownMat = createMat(0x3b1c09, 0.65, 0.05);

export function buildAnimalModel(animalId: AnimalId): AnimatedAnimalGroup {
  const root = new THREE.Group() as AnimatedAnimalGroup;
  const limbs: THREE.Mesh[] = [];
  const ears: THREE.Object3D[] = [];
  let tail: THREE.Object3D | undefined;
  let headObj: THREE.Object3D | undefined;
  let wings: THREE.Object3D[] | undefined;

  // Soft Contact shadow disc at bottom center
  const shadowGeo = new THREE.CircleGeometry(0.58, 24);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  root.add(shadow);

  // Helper for detailed animal eyes with catchlights
  const addAnimalEyes = (
    parent: THREE.Object3D,
    y: number,
    z: number,
    spacing = 0.22,
    size = 0.07,
    irisColor = 0x18181b
  ) => {
    const eyeGeo = new THREE.SphereGeometry(size, 14, 14);
    const pupilGeo = new THREE.SphereGeometry(size * 0.6, 12, 12);
    const glintGeo = new THREE.SphereGeometry(size * 0.22, 8, 8);
    const irisMat = createMat(irisColor, 0.2, 0.1);

    [-spacing, spacing].forEach((ex) => {
      const eyeWhite = new THREE.Mesh(eyeGeo, whiteMat);
      eyeWhite.position.set(ex, y, z);

      const pupil = new THREE.Mesh(pupilGeo, irisMat);
      pupil.position.set(0, 0, size * 0.65);

      const glint = new THREE.Mesh(glintGeo, whiteMat);
      glint.position.set(size * 0.2, size * 0.2, size * 0.9);
      pupil.add(glint);

      eyeWhite.add(pupil);
      parent.add(eyeWhite);
    });
  };

  switch (animalId) {
    case 'kelinci': {
      // 1. KELINCI (Rabbit) - Athletic crouched posture, long ears with pink fold, cotton tail
      const furMat = createMat(0xf8fafc, 0.6, 0.02);
      const innerPink = createMat(0xfb7185, 0.5, 0.02);

      // Main Torso
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 18), furMat);
      body.scale.set(0.92, 1.1, 1.15);
      body.position.set(0, 0.56, 0);
      root.add(body);

      // White fluffy chest
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 14), whiteMat);
      chest.scale.set(0.85, 0.9, 0.85);
      chest.position.set(0, 0.54, 0.18);
      root.add(chest);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18), furMat);
      headObj.position.set(0, 1.05, 0.16);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.25, 0.19, 0.068, 0x1c1917);

      // Cheek ruffs
      [-0.26, 0.26].forEach((cx) => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), furMat);
        cheek.position.set(cx, -0.04, 0.15);
        headObj!.add(cheek);
      });

      // Pink Bunny Nose & Muzzle
      const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), whiteMat);
      muzzle.scale.set(1.1, 0.8, 1.0);
      muzzle.position.set(0, -0.04, 0.28);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.06, 6), innerPink);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, 0.05, 0.1);
      muzzle.add(nose);

      // Two Iconic Cute White Buck Teeth
      const toothGeo = new THREE.BoxGeometry(0.04, 0.055, 0.02);
      [-0.025, 0.025].forEach((tx) => {
        const tooth = new THREE.Mesh(toothGeo, whiteMat);
        tooth.position.set(tx, -0.09, 0.08);
        muzzle.add(tooth);
      });
      headObj.add(muzzle);

      // Delicate Bunny Whiskers
      [-0.18, 0.18].forEach((wx) => {
        [-0.03, 0.02].forEach((wy) => {
          const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 4), blackMat);
          whisker.rotation.z = Math.PI / 2 + (wx < 0 ? -0.15 : 0.15);
          whisker.rotation.y = wx < 0 ? -0.2 : 0.2;
          whisker.position.set(wx, wy, 0.22);
          headObj!.add(whisker);
        });
      });

      // Long Rabbit Ears with pink inner lining
      const earLength = 0.62;
      const earOuterGeo = new THREE.CylinderGeometry(0.04, 0.09, earLength, 12);
      const earInnerGeo = new THREE.CylinderGeometry(0.025, 0.06, earLength * 0.85, 10);

      [-0.14, 0.14].forEach((ex) => {
        const ear = new THREE.Mesh(earOuterGeo, furMat);
        ear.position.set(ex, 0.46, -0.04);
        ear.rotation.z = ex < 0 ? 0.12 : -0.12;
        ear.rotation.x = -0.15;

        const inner = new THREE.Mesh(earInnerGeo, innerPink);
        inner.position.set(0, 0, 0.04);
        ear.add(inner);

        headObj!.add(ear);
        ears.push(ear);
      });

      // Fluffy round cotton tail
      const tailBall = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), whiteMat);
      tailBall.position.set(0, 0.46, -0.48);
      root.add(tailBall);
      tail = tailBall;

      // 4 Paws: Large elongated hind jumping feet + front paws
      const frontPawGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.26, 10);
      const hindFootGeo = new THREE.BoxGeometry(0.15, 0.14, 0.36);

      [-0.2, 0.2].forEach((fx) => {
        const fPaw = new THREE.Mesh(frontPawGeo, furMat);
        fPaw.position.set(fx, 0.13, 0.22);
        root.add(fPaw);
        limbs.push(fPaw);
      });

      [-0.25, 0.25].forEach((hx) => {
        const hFoot = new THREE.Mesh(hindFootGeo, furMat);
        hFoot.position.set(hx, 0.14, -0.18);
        root.add(hFoot);
        limbs.push(hFoot as unknown as THREE.Mesh);
      });
      break;
    }

    case 'jerapah': {
      // 2. JERAPAH (Giraffe) - Sloping shoulder torso, long neck, dark patches, ossicones, mane
      const yellowCoat = createMat(0xfacc15, 0.5, 0.05);
      const brownPatch = createMat(0x78350f, 0.6, 0.05);
      const hoofMat = createMat(0x292524, 0.4, 0.2);

      // Body: taller at shoulders, sloping down
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.52, 0.85), yellowCoat);
      body.position.set(0, 0.72, 0);
      root.add(body);

      // Geometric giraffe patches on flanks
      const patchGeo = new THREE.BoxGeometry(0.18, 0.18, 0.03);
      [
        [-0.3, 0.76, 0.15],
        [0.3, 0.76, 0.15],
        [-0.3, 0.66, -0.15],
        [0.3, 0.66, -0.15],
        [0, 0.88, 0],
      ].forEach(([px, py, pz]) => {
        const p = new THREE.Mesh(patchGeo, brownPatch);
        p.position.set(px, py, pz);
        root.add(p);
      });

      // Long Elegant Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 1.15, 12), yellowCoat);
      neck.position.set(0, 1.4, 0.28);
      neck.rotation.x = 0.22;
      root.add(neck);

      // Giraffe Mane along crest of neck
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.1, 0.1), brownPatch);
      mane.position.set(0, 1.42, 0.18);
      mane.rotation.x = 0.22;
      root.add(mane);

      // Head
      headObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.42), yellowCoat);
      headObj.position.set(0, 2.05, 0.48);
      headObj.rotation.x = 0.08;
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.16, 0.16, 0.065, 0x451a03);

      // Muzzle & dark lips
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.2, 0.24), brownPatch);
      muzzle.position.set(0, -0.06, 0.28);
      headObj.add(muzzle);

      // 2 Ossicones (Giraffe horns with brown tufted knobs)
      const hornGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8);
      const knobGeo = new THREE.SphereGeometry(0.05, 10, 10);
      [-0.09, 0.09].forEach((hx) => {
        const horn = new THREE.Mesh(hornGeo, yellowCoat);
        horn.position.set(hx, 0.22, -0.06);
        const knob = new THREE.Mesh(knobGeo, brownPatch);
        knob.position.set(0, 0.12, 0);
        horn.add(knob);
        headObj!.add(horn);
        ears.push(horn);
      });

      // Lateral giraffe ears
      [-0.18, 0.18].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), yellowCoat);
        ear.position.set(ex, 0.14, -0.08);
        ear.rotation.z = ex < 0 ? 0.7 : -0.7;
        headObj!.add(ear);
      });

      // Tail with black brush tuft
      const tailRod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.45, 8), yellowCoat);
      tailRod.position.set(0, 0.55, -0.44);
      tailRod.rotation.x = -0.35;
      const brush = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), brownPatch);
      brush.position.set(0, -0.24, 0);
      tailRod.add(brush);
      root.add(tailRod);
      tail = tailRod;

      // Stilt-like long legs with dark hooves
      const legGeo = new THREE.CylinderGeometry(0.06, 0.065, 0.65, 10);
      [
        [-0.2, 0.32, 0.3],
        [0.2, 0.32, 0.3],
        [-0.2, 0.32, -0.28],
        [0.2, 0.32, -0.28],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, yellowCoat);
        leg.position.set(lx, ly, lz);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.12, 8), hoofMat);
        hoof.position.set(0, -0.28, 0);
        leg.add(hoof);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'kuda': {
      // 3. KUDA (Horse) - Athletic torso, arched neck, dark flowing mane and tail, hooves
      const coat = createMat(0x854d0e, 0.55, 0.08); // Chestnut brown
      const maneMat = createMat(0x292524, 0.65, 0.05); // Dark brown mane
      const hoofMat = createMat(0x18181b, 0.3, 0.2);

      // Torso
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.75, 10, 18), coat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.7, 0);
      root.add(body);

      // Arched Muscular Neck
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.68, 12), coat);
      neck.position.set(0, 1.15, 0.28);
      neck.rotation.x = 0.38;
      root.add(neck);

      // Flowing Dark Mane
      const mane = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.22), maneMat);
      mane.position.set(0, 1.25, 0.16);
      mane.rotation.x = 0.38;
      root.add(mane);

      // Horse Head
      headObj = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.48), coat);
      headObj.position.set(0, 1.48, 0.52);
      headObj.rotation.x = 0.24;
      root.add(headObj);
      addAnimalEyes(headObj, 0.08, 0.14, 0.16, 0.065, 0x1c1917);

      // Snout with Flared Nostrils
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.26), maneMat);
      snout.position.set(0, -0.06, 0.32);
      [-0.05, 0.05].forEach((nx) => {
        const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.024, 6, 6), blackMat);
        nostril.scale.set(0.7, 1.3, 0.5);
        nostril.position.set(nx, 0.04, 0.12);
        snout.add(nostril);
      });
      headObj.add(snout);

      // White Diamond Star / Blaze on Forehead
      const blaze = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.14, 0.02), whiteMat);
      blaze.rotation.z = Math.PI / 4;
      blaze.position.set(0, 0.12, 0.24);
      headObj.add(blaze);

      // Pointed Horse Ears
      [-0.1, 0.1].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 6), coat);
        ear.position.set(ex, 0.22, -0.12);
        ear.rotation.x = -0.1;
        headObj!.add(ear);
        ears.push(ear);
      });

      // Long Flowing Horse Tail
      const tailGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.6, 8);
      const horseTail = new THREE.Mesh(tailGeo, maneMat);
      horseTail.position.set(0, 0.65, -0.5);
      horseTail.rotation.x = -0.45;
      root.add(horseTail);
      tail = horseTail;

      // 4 Athletic Legs with hooves
      const legGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.52, 10);
      [
        [-0.2, 0.28, 0.3],
        [0.2, 0.28, 0.3],
        [-0.2, 0.28, -0.3],
        [0.2, 0.28, -0.3],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, coat);
        leg.position.set(lx, ly, lz);
        const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.12, 8), hoofMat);
        hoof.position.set(0, -0.22, 0);
        leg.add(hoof);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'katak': {
      // 4. KATAK (Frog) - Amphibian squat posture, bulbous protruding eyes, splayed legs
      const frogGreen = createMat(0x16a34a, 0.45, 0.05);
      const yellowBelly = createMat(0xfef08a, 0.55, 0.02);
      const darkSpot = createMat(0x14532d, 0.5, 0.02);

      // Low squat body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 18), frogGreen);
      body.scale.set(1.15, 0.8, 1.05);
      body.position.set(0, 0.42, 0);
      root.add(body);

      // Yellow-green belly
      const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 14), yellowBelly);
      belly.scale.set(1.0, 0.65, 0.85);
      belly.position.set(0, 0.36, 0.15);
      root.add(belly);

      // Spots on back
      [
        [-0.2, 0.56, -0.15],
        [0.2, 0.56, -0.15],
        [0, 0.58, -0.25],
      ].forEach(([sx, sy, sz]) => {
        const spot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), darkSpot);
        spot.position.set(sx, sy, sz);
        root.add(spot);
      });

      // Frog Head with Wide Smile
      headObj = new THREE.Group();
      headObj.position.set(0, 0.58, 0.15);
      root.add(headObj);

      // Iconic Bulging Frog Eyes on top with golden horizontal iris
      [-0.22, 0.22].forEach((ex) => {
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), frogGreen);
        bulb.position.set(ex, 0.18, 0.05);

        const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12), yellowBelly);
        eyeWhite.position.set(0, 0.02, 0.08);

        // Horizontal pupil
        const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), blackMat);
        pupil.position.set(0, 0, 0.08);
        eyeWhite.add(pupil);

        bulb.add(eyeWhite);
        headObj!.add(bulb);
        ears.push(bulb);
      });

      // Wide mouth line with cute pink tongue
      const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.04, 0.12), darkSpot);
      mouth.position.set(0, -0.06, 0.38);
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.14), pinkMat);
      tongue.position.set(0, -0.01, 0.08);
      mouth.add(tongue);
      headObj.add(mouth);

      // Muscular folded Z-legs
      const hindLegGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.45, 10);
      const frontLegGeo = new THREE.CylinderGeometry(0.07, 0.08, 0.28, 8);

      [-0.34, 0.34].forEach((hx) => {
        const hLeg = new THREE.Mesh(hindLegGeo, frogGreen);
        hLeg.position.set(hx, 0.24, -0.15);
        hLeg.rotation.z = hx < 0 ? -0.45 : 0.45;
        hLeg.rotation.x = -0.3;
        root.add(hLeg);
        limbs.push(hLeg);
      });

      [-0.3, 0.3].forEach((fx) => {
        const fLeg = new THREE.Mesh(frontLegGeo, frogGreen);
        fLeg.position.set(fx, 0.16, 0.25);
        root.add(fLeg);
        limbs.push(fLeg);
      });
      break;
    }

    case 'harimau': {
      // 5. HARIMAU (Tiger) - Vibrant Bengal orange with black vertical stripes, white bib & ruffs
      const orangeCoat = createMat(0xea580c, 0.5, 0.08);
      const stripeMat = createMat(0x18181b, 0.65, 0.05);

      // Muscular Torso
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.68, 10, 18), orangeCoat);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.64, 0);
      root.add(body);

      // White Belly
      const belly = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.6), whiteMat);
      belly.position.set(0, 0.45, 0);
      root.add(belly);

      // Iconic Black Tiger Stripes wrapping flanks
      [-0.22, -0.08, 0.06, 0.2].forEach((sz) => {
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.035, 8, 18, Math.PI), stripeMat);
        stripe.rotation.x = Math.PI / 2;
        stripe.position.set(0, 0.64, sz);
        root.add(stripe);
      });

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 18), orangeCoat);
      headObj.position.set(0, 1.0, 0.38);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.26, 0.18, 0.07, 0xd97706); // Amber eyes

      // White cheek ruffs
      [-0.28, 0.28].forEach((cx) => {
        const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), whiteMat);
        cheek.position.set(cx, -0.08, 0.18);
        headObj!.add(cheek);
      });

      // White Muzzle & Pink Nose Pad
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.2), whiteMat);
      muzzle.position.set(0, -0.06, 0.3);
      const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.05), pinkMat);
      nose.position.set(0, 0.06, 0.1);
      muzzle.add(nose);
      headObj.add(muzzle);

      // Iconic Black Tiger Forehead Stripes (King / Wang symbol)
      const foreStripe1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, 0.02), stripeMat);
      foreStripe1.position.set(0, 0.24, 0.24);
      headObj.add(foreStripe1);
      [-0.08, 0.08].forEach((sx) => {
        const sideStripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.02), stripeMat);
        sideStripe.position.set(sx, 0.22, 0.24);
        headObj!.add(sideStripe);
      });

      // Tiger Whiskers
      [-0.18, 0.18].forEach((wx) => {
        [-0.03, 0.02].forEach((wy) => {
          const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.2, 4), whiteMat);
          whisker.rotation.z = Math.PI / 2 + (wx < 0 ? -0.15 : 0.15);
          whisker.position.set(wx, wy, 0.24);
          headObj!.add(whisker);
        });
      });

      // Rounded Tiger Ears with black backs
      [-0.22, 0.22].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), orangeCoat);
        ear.position.set(ex, 0.28, 0.02);
        const earBack = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), stripeMat);
        earBack.position.set(0, 0, -0.04);
        ear.add(earBack);
        headObj!.add(ear);
        ears.push(ear);
      });

      // Striped Tail with black tip
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.55, 10), orangeCoat);
      tailMesh.position.set(0, 0.68, -0.46);
      tailMesh.rotation.x = -0.55;
      const tailTip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.15, 8), stripeMat);
      tailTip.position.set(0, -0.22, 0);
      tailMesh.add(tailTip);
      root.add(tailMesh);
      tail = tailMesh;

      // 4 Paws with white socks
      const legGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.38, 10);
      [
        [-0.22, 0.2, 0.28],
        [0.22, 0.2, 0.28],
        [-0.22, 0.2, -0.24],
        [0.22, 0.2, -0.24],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, orangeCoat);
        leg.position.set(lx, ly, lz);
        const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 10), whiteMat);
        sock.position.set(0, -0.14, 0);
        leg.add(sock);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'singa': {
      // 6. SINGA (Lion) - Golden body, full dark amber fluffy mane framing head & chest, tufted tail
      const lionGold = createMat(0xd97706, 0.55, 0.08);
      const maneMat = createMat(0x78350f, 0.75, 0.05);

      // Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.36, 0.7, 10, 18), lionGold);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.65, 0);
      root.add(body);

      // Magnificent Volumetric Dark Golden Mane
      const mainMane = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.24, 12, 24), maneMat);
      mainMane.position.set(0, 1.0, 0.26);
      root.add(mainMane);

      const chestMane = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), maneMat);
      chestMane.position.set(0, 0.78, 0.36);
      root.add(chestMane);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 18), lionGold);
      headObj.position.set(0, 1.0, 0.38);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.24, 0.17, 0.07, 0xb45309);

      // Snout & Nose
      const snout = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), lionGold);
      snout.position.set(0, -0.06, 0.28);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), darkBrownMat);
      nose.position.set(0, 0.05, 0.12);
      snout.add(nose);
      headObj.add(snout);

      // Ears nestled in mane
      [-0.24, 0.24].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lionGold);
        ear.position.set(ex, 0.26, 0.05);
        headObj!.add(ear);
        ears.push(ear);
      });

      // Tail with fluffy dark hair tassel
      const tailRod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.5, 8), lionGold);
      tailRod.position.set(0, 0.64, -0.46);
      tailRod.rotation.x = -0.5;
      const tassel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), maneMat);
      tassel.position.set(0, -0.26, 0);
      tailRod.add(tassel);
      root.add(tailRod);
      tail = tailRod;

      // Paws
      const legGeo = new THREE.CylinderGeometry(0.085, 0.095, 0.38, 10);
      [
        [-0.22, 0.2, 0.28],
        [0.22, 0.2, 0.28],
        [-0.22, 0.2, -0.24],
        [0.22, 0.2, -0.24],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, lionGold);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'burung': {
      // 7. BURUNG (Eagle / Falcon) - Aerodynamic feathered body, eagle beak, swept wings, crest plume
      const featherBlue = createMat(0x0284c7, 0.5, 0.1);
      const darkPlumage = createMat(0x0369a1, 0.6, 0.08);
      const beakYellow = createMat(0xf59e0b, 0.4, 0.1);

      // Body (aerodynamic cone)
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.78, 16), featherBlue);
      body.rotation.x = -Math.PI / 2.3;
      body.position.set(0, 0.58, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), featherBlue);
      headObj.position.set(0, 1.0, 0.22);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.2, 0.16, 0.065, 0xd97706);

      // Eagle Beak (curved hooked raptor beak)
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 8), beakYellow);
      beak.rotation.x = Math.PI / 1.8;
      beak.position.set(0, -0.02, 0.35);
      headObj.add(beak);

      // Feather Crest Plume on top of head
      const crest = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.38, 6), darkPlumage);
      crest.position.set(0, 0.34, -0.06);
      crest.rotation.x = -0.35;
      headObj.add(crest);

      // Broad Feathered Swept Wings
      const wingGeo = new THREE.BoxGeometry(0.55, 0.08, 0.4);
      const leftWing = new THREE.Mesh(wingGeo, darkPlumage);
      leftWing.position.set(-0.4, 0.65, 0);
      leftWing.rotation.z = -0.25;
      root.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, darkPlumage);
      rightWing.position.set(0.4, 0.65, 0);
      rightWing.rotation.z = 0.25;
      root.add(rightWing);
      wings = [leftWing, rightWing];

      // Layered Fan Tail Feathers
      const tailGeo = new THREE.BoxGeometry(0.42, 0.05, 0.48);
      const birdTail = new THREE.Mesh(tailGeo, darkPlumage);
      birdTail.position.set(0, 0.52, -0.46);
      birdTail.rotation.x = -0.3;
      root.add(birdTail);
      tail = birdTail;

      // Golden Talons
      const talonGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.28, 8);
      [-0.16, 0.16].forEach((tx) => {
        const talon = new THREE.Mesh(talonGeo, beakYellow);
        talon.position.set(tx, 0.15, 0.06);
        root.add(talon);
        limbs.push(talon);
      });
      break;
    }

    case 'monyet': {
      // 8. MONYET (Monkey) - Brown fur, peach face mask, large C-shaped ears, long curled tail
      const furMat = createMat(0x854d0e, 0.6, 0.05);
      const peachSkin = createMat(0xfde68a, 0.5, 0.02);

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 18, 18), furMat);
      body.scale.set(0.9, 1.15, 0.95);
      body.position.set(0, 0.6, 0);
      root.add(body);

      // Peach Chest Patch
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), peachSkin);
      chest.scale.set(0.85, 0.95, 0.6);
      chest.position.set(0, 0.58, 0.24);
      root.add(chest);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 18), furMat);
      headObj.position.set(0, 1.08, 0.15);
      root.add(headObj);

      // Peach Face Mask & Brow
      const face = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 14), peachSkin);
      face.scale.set(1.0, 0.9, 0.65);
      face.position.set(0, -0.02, 0.2);
      headObj.add(face);
      addAnimalEyes(headObj, 0.06, 0.25, 0.15, 0.065, 0x451a03);

      // Large C-shaped Monkey Ears
      [-0.34, 0.34].forEach((mx) => {
        const ear = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.045, 8, 18), peachSkin);
        ear.position.set(mx, 0.08, 0.02);
        ear.rotation.y = Math.PI / 2;
        headObj!.add(ear);
        ears.push(ear as unknown as THREE.Object3D);
      });

      // Long Curled Prehensile Tail
      const tailCurve = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.045, 8, 20, Math.PI * 1.6),
        furMat
      );
      tailCurve.position.set(0, 0.68, -0.42);
      tailCurve.rotation.y = Math.PI / 2;
      tailCurve.rotation.z = 0.2;
      root.add(tailCurve);
      tail = tailCurve;

      // Agile Limbs
      const limbGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.38, 10);
      [
        [-0.26, 0.45, 0.16],
        [0.26, 0.45, 0.16],
        [-0.22, 0.18, -0.12],
        [0.22, 0.18, -0.12],
      ].forEach(([lx, ly, lz]) => {
        const limb = new THREE.Mesh(limbGeo, furMat);
        limb.position.set(lx, ly, lz);
        root.add(limb);
        limbs.push(limb);
      });
      break;
    }

    case 'babi': {
      // 9. BABI (Pig) - Rosy pink body, flat cylindrical snout with 2 nostril holes, floppy ears, corkscrew tail
      const pigPink = createMat(0xf472b6, 0.5, 0.05);
      const darkPink = createMat(0xdb2777, 0.6, 0.05);
      const trotterMat = createMat(0x9d174d, 0.5, 0.1);

      // Chubby Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.48, 18, 18), pigPink);
      body.scale.set(1.0, 0.92, 1.18);
      body.position.set(0, 0.55, 0);
      root.add(body);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.35, 18, 18), pigPink);
      headObj.position.set(0, 0.9, 0.36);
      root.add(headObj);
      addAnimalEyes(headObj, 0.08, 0.25, 0.18, 0.065, 0x18181b);

      // Distinctive Flat Cylindrical Pig Snout with 2 Nostril Holes!
      const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.16, 16), darkPink);
      snout.rotation.x = Math.PI / 2;
      snout.position.set(0, -0.04, 0.34);
      // 2 Oval Nostrils
      [-0.05, 0.05].forEach((nx) => {
        const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), blackMat);
        nostril.scale.set(0.8, 1.2, 0.6);
        nostril.position.set(nx, 0.08, 0);
        snout.add(nostril);
      });
      headObj.add(snout);

      // Triangular Floppy Ears folded forward
      [-0.22, 0.22].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.24, 6), darkPink);
        ear.position.set(ex, 0.28, 0);
        ear.rotation.z = ex < 0 ? 0.65 : -0.65;
        ear.rotation.x = -0.35;
        headObj!.add(ear);
        ears.push(ear);
      });

      // Tight Corkscrew Curly Tail
      const tailMesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.035, 8, 16, Math.PI * 1.9),
        darkPink
      );
      tailMesh.position.set(0, 0.6, -0.52);
      root.add(tailMesh);
      tail = tailMesh;

      // Short Trotter Legs
      const legGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.26, 10);
      [
        [-0.22, 0.13, 0.24],
        [0.22, 0.13, 0.24],
        [-0.22, 0.13, -0.24],
        [0.22, 0.13, -0.24],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, pigPink);
        leg.position.set(lx, ly, lz);
        const trotter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.16), trotterMat);
        trotter.position.set(0, -0.12, 0.02);
        leg.add(trotter);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'anjing': {
      // 10. ANJING (Dog) - Golden hound, friendly snout, floppy ears, black nose pad, wagging tail
      const dogGold = createMat(0xd97706, 0.55, 0.08);
      const earBrown = createMat(0x92400e, 0.6, 0.05);
      const snoutCream = createMat(0xfef3c7, 0.5, 0.02);

      // Body
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.33, 0.62, 10, 18), dogGold);
      body.rotation.x = Math.PI / 2;
      body.position.set(0, 0.58, 0);
      root.add(body);

      // Cream Chest Bib
      const chest = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), snoutCream);
      chest.scale.set(0.9, 1.1, 0.6);
      chest.position.set(0, 0.58, 0.26);
      root.add(chest);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.33, 18, 18), dogGold);
      headObj.position.set(0, 0.98, 0.34);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.24, 0.17, 0.068, 0x1c1917);

      // Snout with glossy black nose pad & cute pink tongue
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.22), snoutCream);
      muzzle.position.set(0, -0.06, 0.28);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), blackMat);
      nose.scale.set(1.2, 0.8, 1.0);
      nose.position.set(0, 0.06, 0.12);
      muzzle.add(nose);
      const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.03, 0.12), pinkMat);
      tongue.position.set(0.02, -0.08, 0.06);
      tongue.rotation.x = 0.2;
      muzzle.add(tongue);
      headObj.add(muzzle);

      // Red Collar with Golden Medallion Tag
      const redMat = createMat(0xdc2626, 0.4, 0.1);
      const goldMat = createMat(0xfacc15, 0.2, 0.8);
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 16), redMat);
      collar.position.set(0, 0.76, 0.22);
      collar.rotation.x = 0.3;
      const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), goldMat);
      tag.rotation.x = Math.PI / 2;
      tag.position.set(0, -0.05, 0.3);
      collar.add(tag);
      root.add(collar);

      // Long Floppy Hound Ears draped against cheeks
      [-0.26, 0.26].forEach((dx) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.32, 0.16), earBrown);
        ear.position.set(dx, 0.04, 0.06);
        ear.rotation.z = dx < 0 ? -0.28 : 0.28;
        ear.rotation.x = -0.15;
        headObj!.add(ear);
        ears.push(ear);
      });

      // Happy Wagging Tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.42, 8), dogGold);
      tailMesh.position.set(0, 0.64, -0.44);
      tailMesh.rotation.x = -0.65;
      root.add(tailMesh);
      tail = tailMesh;

      // Paws
      const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.34, 10);
      [
        [-0.21, 0.17, 0.24],
        [0.21, 0.17, 0.24],
        [-0.21, 0.17, -0.24],
        [0.21, 0.17, -0.24],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, dogGold);
        leg.position.set(lx, ly, lz);
        root.add(leg);
        limbs.push(leg);
      });
      break;
    }

    case 'kucing':
    default: {
      // 11. KUCING (Cat) - Lithe feline body, sharp triangular upright ears, whisker pads, curved tail
      const catSilver = createMat(0x94a3b8, 0.5, 0.08); // Sleek silver tabby
      const innerPink = createMat(0xf472b6, 0.5, 0.02);

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.39, 18, 18), catSilver);
      body.scale.set(0.95, 1.05, 1.2);
      body.position.set(0, 0.54, 0);
      root.add(body);

      // White chest bib
      const bib = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), whiteMat);
      bib.scale.set(0.9, 1.0, 0.6);
      bib.position.set(0, 0.54, 0.24);
      root.add(bib);

      // Head
      headObj = new THREE.Mesh(new THREE.SphereGeometry(0.31, 18, 18), catSilver);
      headObj.position.set(0, 0.94, 0.32);
      root.add(headObj);
      addAnimalEyes(headObj, 0.06, 0.23, 0.16, 0.068, 0x15803d); // Emerald green cat eyes

      // White Whisker Muzzle & Tiny Pink Nose
      const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.16), whiteMat);
      muzzle.position.set(0, -0.06, 0.26);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.06, 6), innerPink);
      nose.rotation.x = -Math.PI / 2;
      nose.position.set(0, 0.04, 0.09);
      muzzle.add(nose);
      headObj.add(muzzle);

      // Delicate Cat Whiskers (3 on each cheek)
      [-0.15, 0.15].forEach((wx) => {
        [-0.03, 0, 0.03].forEach((wy) => {
          const whisker = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.16, 4), whiteMat);
          whisker.rotation.z = Math.PI / 2 + (wx < 0 ? -0.1 : 0.1) + wy * 2;
          whisker.rotation.y = wx < 0 ? -0.2 : 0.2;
          whisker.position.set(wx, wy - 0.04, 0.22);
          headObj!.add(whisker);
        });
      });

      // Sharp Triangular Upright Cat Ears
      [-0.17, 0.17].forEach((cx) => {
        const ear = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.22, 6), catSilver);
        ear.position.set(cx, 0.3, 0.02);
        ear.rotation.z = cx < 0 ? 0.22 : -0.22;
        ear.rotation.x = -0.15;

        const inner = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.16, 6), innerPink);
        inner.position.set(0, 0, 0.035);
        ear.add(inner);

        headObj!.add(ear);
        ears.push(ear);
      });

      // Long Gracefully Curved Cat Tail
      const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.042, 0.58, 10), catSilver);
      tailMesh.position.set(0, 0.62, -0.42);
      tailMesh.rotation.x = -0.75;
      root.add(tailMesh);
      tail = tailMesh;

      // Agile Legs
      const legGeo = new THREE.CylinderGeometry(0.07, 0.075, 0.32, 10);
      [
        [-0.19, 0.16, 0.22],
        [0.19, 0.16, 0.22],
        [-0.19, 0.16, -0.22],
        [0.19, 0.16, -0.22],
      ].forEach(([lx, ly, lz]) => {
        const leg = new THREE.Mesh(legGeo, catSilver);
        leg.position.set(lx, ly, lz);
        const paw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), whiteMat);
        paw.position.set(0, -0.14, 0.02);
        leg.add(paw);
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
