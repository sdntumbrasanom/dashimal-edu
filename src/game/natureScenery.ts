import * as THREE from 'three';

// Palette for Bright Nature Theme
export const NATURE_COLORS = {
  sky: 0x7dd3fc,           // Bright clear sunny cyan sky
  skyFog: 0xbae6fd,        // Soft sunny horizon haze
  sun: 0xfef08a,           // Radiant sunny yellow
  sunGlow: 0xfde047,
  cloud: 0xffffff,         // Fluffy white clouds
  mountainBase: 0x334e44,  // Lush mountain green/slate
  mountainSnow: 0xf8fafc,  // Glistening snow peaks
  grassMeadow: 0x4ade80,   // Lush vibrant spring green grass
  grassHills: 0x22c55e,    // Rich meadow green
  riverWater: 0x38bdf8,    // Sparkling azure river water
  riverDeep: 0x0284c7,
  ballastGravel: 0xfef3c7, // Warm golden crushed stone ballast
  timberTies: 0x78350f,    // Rich warm rustic timber wood
  steelRails: 0xe2e8f0,    // Gleaming bright steel
  woodFence: 0x92400e,     // Split-rail wooden fence
  treeLeavesOak: 0x22c55e,
  treeLeavesOak2: 0x16a34a,
  treeLeavesPine: 0x15803d,
  treeTrunk: 0x854d0e,
  flowerYellow: 0xfde047,
  flowerPink: 0xf472b6,
  flowerWhite: 0xf8fafc,
  flowerRed: 0xf87171,
  stoneRock: 0x94a3b8,
};

// Common reusable materials
const grassMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.grassMeadow,
  roughness: 0.85,
  metalness: 0.05,
});

const riverMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.riverWater,
  roughness: 0.12,
  metalness: 0.35,
  transparent: true,
  opacity: 0.92,
});

const ballastMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.ballastGravel,
  roughness: 0.8,
  metalness: 0.05,
});

const timberMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.timberTies,
  roughness: 0.75,
  metalness: 0.05,
});

const railMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.steelRails,
  metalness: 0.88,
  roughness: 0.18,
});

const trunkMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.treeTrunk,
  roughness: 0.9,
});

const oakLeavesMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.treeLeavesOak,
  roughness: 0.75,
  flatShading: true,
});

const oakLeaves2Mat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.treeLeavesOak2,
  roughness: 0.75,
  flatShading: true,
});

const pineLeavesMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.treeLeavesPine,
  roughness: 0.7,
  flatShading: true,
});

const snowCapMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.mountainSnow,
  roughness: 0.45,
  metalness: 0.1,
  flatShading: true,
});

const mountainMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.mountainBase,
  roughness: 0.9,
  metalness: 0.05,
  flatShading: true,
});

const cloudMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.cloud,
  roughness: 0.5,
  flatShading: true,
  transparent: true,
  opacity: 0.94,
});

const rockMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.stoneRock,
  roughness: 0.9,
  flatShading: true,
});

const fenceMat = new THREE.MeshStandardMaterial({
  color: NATURE_COLORS.woodFence,
  roughness: 0.8,
});

/**
 * Builds a lush oak tree with clustered leafy canopy
 */
export function createOakTree(scale = 1.0): THREE.Group {
  const tree = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.22 * scale, 0.3 * scale, 2.2 * scale, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.1 * scale;
  tree.add(trunk);

  // Canopy spheres
  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = 2.4 * scale;

  const clusterConfigs = [
    { x: 0, y: 0.6, z: 0, r: 1.15, mat: oakLeavesMat },
    { x: -0.6, y: 0.2, z: 0.3, r: 0.85, mat: oakLeaves2Mat },
    { x: 0.65, y: 0.1, z: -0.2, r: 0.9, mat: oakLeavesMat },
    { x: 0.1, y: 0.1, z: 0.65, r: 0.8, mat: oakLeaves2Mat },
    { x: -0.3, y: 0.85, z: -0.3, r: 0.75, mat: oakLeavesMat },
  ];

  clusterConfigs.forEach((c) => {
    const geo = new THREE.DodecahedronGeometry(c.r * scale, 1);
    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.position.set(c.x * scale, c.y * scale, c.z * scale);
    foliageGroup.add(mesh);
  });

  tree.add(foliageGroup);
  return tree;
}

/**
 * Builds a layered conical evergreen pine tree
 */
export function createPineTree(scale = 1.0): THREE.Group {
  const tree = new THREE.Group();

  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.18 * scale, 0.25 * scale, 1.8 * scale, 7);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.9 * scale;
  tree.add(trunk);

  // Layered green cones
  const tiers = [
    { y: 1.6 * scale, r: 1.4 * scale, h: 1.5 * scale },
    { y: 2.5 * scale, r: 1.1 * scale, h: 1.4 * scale },
    { y: 3.4 * scale, r: 0.75 * scale, h: 1.2 * scale },
    { y: 4.1 * scale, r: 0.4 * scale, h: 0.9 * scale },
  ];

  tiers.forEach((t) => {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(t.r, t.h, 7),
      pineLeavesMat
    );
    cone.position.y = t.y;
    tree.add(cone);
  });

  return tree;
}

/**
 * Builds a puffy cartoon cloud
 */
export function createPuffyCloud(scale = 1.0): THREE.Group {
  const cloud = new THREE.Group();
  const spheres = [
    { x: 0, y: 0, z: 0, r: 2.2 },
    { x: -1.8, y: -0.4, z: 0.3, r: 1.6 },
    { x: 1.8, y: -0.3, z: -0.2, r: 1.7 },
    { x: -0.8, y: 0.9, z: -0.3, r: 1.5 },
    { x: 0.9, y: 0.8, z: 0.4, r: 1.6 },
    { x: 2.8, y: -0.6, z: 0.2, r: 1.1 },
    { x: -2.7, y: -0.6, z: -0.2, r: 1.1 },
  ];

  spheres.forEach((s) => {
    const mesh = new THREE.Mesh(
      new THREE.DodecahedronGeometry(s.r * scale, 1),
      cloudMat
    );
    mesh.position.set(s.x * scale, s.y * scale, s.z * scale);
    cloud.add(mesh);
  });

  return cloud;
}

/**
 * Builds the majestic distant mountain range, radiant sun, and sky clouds
 */
export function createNatureHorizon(): {
  group: THREE.Group;
  clouds: THREE.Group[];
  update: (delta: number) => void;
} {
  const group = new THREE.Group();
  const clouds: THREE.Group[] = [];

  // 1. Radiant Glowing Sun
  const sunGroup = new THREE.Group();
  sunGroup.position.set(38, 48, -135);

  const sunMesh = new THREE.Mesh(
    new THREE.SphereGeometry(7, 16, 16),
    new THREE.MeshBasicMaterial({ color: NATURE_COLORS.sun })
  );
  sunGroup.add(sunMesh);

  // Soft corona halo disc
  const haloMesh = new THREE.Mesh(
    new THREE.CircleGeometry(16, 24),
    new THREE.MeshBasicMaterial({
      color: NATURE_COLORS.sunGlow,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
  );
  sunGroup.add(haloMesh);
  group.add(sunGroup);

  // 2. Distant Majestic Mountain Peaks
  // Spread across horizon from X = -110 to +110, Z = -120 to -160
  const mountainConfigs = [
    { x: -75, z: -145, h: 48, r: 38 },
    { x: -45, z: -130, h: 36, r: 28 },
    { x: -20, z: -155, h: 54, r: 42 },
    { x: 8, z: -135, h: 42, r: 32 },
    { x: 38, z: -150, h: 50, r: 39 },
    { x: 68, z: -135, h: 38, r: 30 },
    { x: 95, z: -145, h: 46, r: 36 },
  ];

  mountainConfigs.forEach((m) => {
    const peak = new THREE.Group();
    peak.position.set(m.x, 0, m.z);

    // Mountain body
    const bodyGeo = new THREE.ConeGeometry(m.r, m.h, 7);
    const body = new THREE.Mesh(bodyGeo, mountainMat);
    body.position.y = m.h / 2;
    peak.add(body);

    // Glistening Snow Cap (top 35% of peak)
    const capHeight = m.h * 0.35;
    const capRadius = m.r * 0.35;
    const capGeo = new THREE.ConeGeometry(capRadius, capHeight, 7);
    const cap = new THREE.Mesh(capGeo, snowCapMat);
    cap.position.y = m.h - capHeight / 2;
    peak.add(cap);

    group.add(peak);
  });

  // 3. Floating Sunny Clouds
  const cloudConfigs = [
    { x: -55, y: 32, z: -95, scale: 1.4, speed: 0.6 },
    { x: -18, y: 38, z: -115, scale: 1.8, speed: 0.4 },
    { x: 22, y: 30, z: -85, scale: 1.3, speed: 0.7 },
    { x: 60, y: 36, z: -105, scale: 1.6, speed: 0.5 },
    { x: 5, y: 26, z: -65, scale: 1.1, speed: 0.8 },
  ];

  cloudConfigs.forEach((c) => {
    const cloud = createPuffyCloud(c.scale);
    cloud.position.set(c.x, c.y, c.z);
    cloud.userData = { speed: c.speed, initialX: c.x };
    clouds.push(cloud);
    group.add(cloud);
  });

  const update = (delta: number) => {
    clouds.forEach((cloud) => {
      cloud.position.x += cloud.userData.speed * delta * 2.5;
      if (cloud.position.x > 90) {
        cloud.position.x = -90;
      }
    });
  };

  return { group, clouds, update };
}

/**
 * Builds a single looping 40-unit chunk of nature railway track with:
 * - Left: lush rolling green meadow, wildflowers, trees, wooden fences, boulders
 * - Center: warm golden gravel ballast, rustic wooden ties, shining steel rails
 * - Right: sparkling winding river stream, riverbank stones, reeds, trees
 */
export function createNatureTrackChunk(zPos: number, lanes: number[]): THREE.Group {
  const group = new THREE.Group();
  group.position.z = zPos;
  const chunkLength = 40;

  // 1. Main Lush Green Meadow (Floor)
  // Wide terrain spanning X: -35 to +35
  const meadowGeo = new THREE.PlaneGeometry(70, chunkLength);
  const meadow = new THREE.Mesh(meadowGeo, grassMat);
  meadow.rotation.x = -Math.PI / 2;
  meadow.position.y = -0.06;
  group.add(meadow);

  // 2. Rolling Green Meadow Elevation on Left Side (Hill ridge)
  const leftHillGeo = new THREE.BoxGeometry(16, 2.4, chunkLength);
  const leftHill = new THREE.Mesh(leftHillGeo, grassMat);
  leftHill.position.set(-16, 0.6, 0);
  group.add(leftHill);

  // 3. Sparkling Blue River Stream on Right Side (X: 7.2 to 19.5)
  const riverWidth = 12.5;
  const riverGeo = new THREE.PlaneGeometry(riverWidth, chunkLength);
  const river = new THREE.Mesh(riverGeo, riverMat);
  river.rotation.x = -Math.PI / 2;
  river.position.set(13.2, 0.02, 0);
  group.add(river);

  // River banks (slight wooden/rock edging)
  const bankBorderGeo = new THREE.BoxGeometry(0.5, 0.18, chunkLength);
  const bankBorderMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    roughness: 0.9,
  });
  const bankLeft = new THREE.Mesh(bankBorderGeo, bankBorderMat);
  bankLeft.position.set(7.0, 0.08, 0);
  group.add(bankLeft);

  // River Pebbles and Reeds along the bank
  [-14, -6, 2, 10, 16].forEach((pz, idx) => {
    const pebbleGeo = new THREE.DodecahedronGeometry(0.35 + (idx % 3) * 0.12, 1);
    const pebble = new THREE.Mesh(pebbleGeo, rockMat);
    pebble.position.set(6.7 + (idx % 2) * 0.3, 0.12, pz);
    pebble.scale.set(1.4, 0.6, 1.2);
    group.add(pebble);

    // River reeds (green cylinders)
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 1.2, 5),
      pineLeavesMat
    );
    reed.position.set(7.4, 0.5, pz + 0.4);
    reed.rotation.z = (idx % 2 === 0 ? 1 : -1) * 0.15;
    group.add(reed);
  });

  // 4. Warm Golden Railway Ballast (Under tracks)
  const ballastGeo = new THREE.PlaneGeometry(10.5, chunkLength);
  const ballast = new THREE.Mesh(ballastGeo, ballastMat);
  ballast.rotation.x = -Math.PI / 2;
  ballast.position.set(0, -0.01, 0);
  group.add(ballast);

  // Ballast shoulder slopes
  [-5.3, 5.3].forEach((bx) => {
    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.1, chunkLength),
      timberMat
    );
    shoulder.position.set(bx, 0.02, 0);
    group.add(shoulder);
  });

  // 5. Rustic Wooden Sleepers (Ties) across 3 lanes
  const tieGeo = new THREE.BoxGeometry(7.8, 0.1, 0.45);
  for (let z = -18; z <= 18; z += 1.8) {
    const tie = new THREE.Mesh(tieGeo, timberMat);
    tie.position.set(0, 0.04, z);
    group.add(tie);
  }

  // 6. Gleaming Steel Rails for the 3 lanes
  const railGeo = new THREE.BoxGeometry(0.09, 0.12, chunkLength);
  lanes.forEach((lx) => {
    const rLeft = new THREE.Mesh(railGeo, railMat);
    rLeft.position.set(lx - 0.72, 0.1, 0);
    group.add(rLeft);

    const rRight = new THREE.Mesh(railGeo, railMat);
    rRight.position.set(lx + 0.72, 0.1, 0);
    group.add(rRight);
  });

  // 7. Trees & Nature scenery along the track
  // Left Side: Oak and Pine Trees + Boulders + Flowers
  const leftTrees = [
    { type: 'oak', x: -8.8, z: -14, s: 1.3 },
    { type: 'pine', x: -11.5, z: -5, s: 1.2 },
    { type: 'oak', x: -9.2, z: 6, s: 1.4 },
    { type: 'pine', x: -12.0, z: 15, s: 1.1 },
  ];

  leftTrees.forEach((t) => {
    const tree = t.type === 'oak' ? createOakTree(t.s) : createPineTree(t.s);
    tree.position.set(t.x, 0, t.z);
    group.add(tree);
  });

  // Right Side (Across the river): Willows and Pines
  const rightTrees = [
    { type: 'pine', x: 21.0, z: -12, s: 1.3 },
    { type: 'oak', x: 20.5, z: 4, s: 1.2 },
    { type: 'pine', x: 22.0, z: 16, s: 1.4 },
  ];

  rightTrees.forEach((t) => {
    const tree = t.type === 'oak' ? createOakTree(t.s) : createPineTree(t.s);
    tree.position.set(t.x, 0, t.z);
    group.add(tree);
  });

  // 8. Wooden Park Fence along Left Border
  for (let z = -18; z <= 18; z += 4.5) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6),
      fenceMat
    );
    post.position.set(-6.5, 0.6, z);
    group.add(post);

    if (z < 18) {
      const rail1 = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.09, 4.5),
        fenceMat
      );
      rail1.position.set(-6.5, 0.85, z + 2.25);
      group.add(rail1);

      const rail2 = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.09, 4.5),
        fenceMat
      );
      rail2.position.set(-6.5, 0.45, z + 2.25);
      group.add(rail2);
    }
  }

  // 9. Wildflower Patches (Colorful blossom clusters on the meadow)
  const flowerColors = [
    NATURE_COLORS.flowerYellow,
    NATURE_COLORS.flowerPink,
    NATURE_COLORS.flowerWhite,
    NATURE_COLORS.flowerRed,
  ];

  [-16, -8, 0, 8, 15].forEach((fz, i) => {
    const patchMat = new THREE.MeshBasicMaterial({
      color: flowerColors[i % flowerColors.length],
    });
    for (let f = 0; f < 3; f++) {
      const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), patchMat);
      fl.position.set(-7.5 - f * 0.45, 0.15, fz + f * 0.4);
      group.add(fl);
    }
  });

  // 10. Scenic Rustic Timber Overhead Archway at z = 18
  const archGroup = new THREE.Group();
  archGroup.position.set(0, 0, 18);

  const archTimberMat = new THREE.MeshStandardMaterial({
    color: NATURE_COLORS.timberTies,
    roughness: 0.75,
  });

  // Left & Right rustic posts
  [-4.8, 4.8].forEach((px) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.3, 5.2, 8),
      archTimberMat
    );
    post.position.set(px, 2.6, 0);
    archGroup.add(post);

    // Stone footing
    const footing = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.5, 0.8),
      rockMat
    );
    footing.position.set(px, 0.25, 0);
    archGroup.add(footing);
  });

  // Overhead crossbeam
  const crossbeam = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.45, 0.5),
    archTimberMat
  );
  crossbeam.position.set(0, 5.0, 0);
  archGroup.add(crossbeam);

  // Ivy foliage clusters hanging on the arch
  [-3.0, -1.2, 1.2, 3.0].forEach((ix) => {
    const ivy = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 7, 7),
      oakLeavesMat
    );
    ivy.position.set(ix, 4.8, 0.3);
    ivy.scale.set(1.2, 0.8, 0.9);
    archGroup.add(ivy);
  });

  // Friendly Park Railway Lanterns (Warm golden glow)
  lanes.forEach((lx) => {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.45, 0.32),
      timberMat
    );
    lamp.position.set(lx, 4.45, 0);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfef08a })
    );
    bulb.position.set(0, -0.05, 0);
    lamp.add(bulb);
    archGroup.add(lamp);
  });

  group.add(archGroup);

  return group;
}
