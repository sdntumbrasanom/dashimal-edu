import * as THREE from 'three';
import { AnimalId, Question } from '../types/game.ts';
import { buildAnimalModel, AnimatedAnimalGroup } from './animalModels.ts';
import {
  playJumpSound,
  playSlideSound,
  playCoinSound,
  playHitSound,
  playQuestionBonusSound,
} from '../utils/sound.ts';

export interface RunnerCallbacks {
  onHit: (newLives: number, isDead: boolean) => void;
  onQuestionTrigger: (question: Question) => void;
  onCoinCollect: (coins: number) => void;
  onStatsUpdate: (stats: {
    distance: number;
    score: number;
    coins: number;
    lives: number;
    speed: number;
  }) => void;
}

export interface EngineConfig {
  animalId: AnimalId;
  initialLives: number;
  maxLives: number;
  questions: Question[];
  callbacks: RunnerCallbacks;
}

const LANES = [-2.5, 0, 2.5];
const GRAVITY = 38;
const JUMP_VELOCITY = 13.5;
const SLIDE_DURATION = 0.65;
const INVULNERABLE_DURATION = 1.6;

interface ActiveObstacle {
  mesh: THREE.Group;
  type: 'hurdle' | 'overhead' | 'train';
  lane: number;
  z: number;
  width: number;
  height: number;
  minY: number;
  passed: boolean;
}

interface ActivePickup {
  mesh: THREE.Group;
  type: 'coin' | 'question';
  lane: number;
  z: number;
  collected: boolean;
}

export class SubwayRunnerEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private config: EngineConfig;

  private animalModel: AnimatedAnimalGroup;
  private currentLane = 1; // 0 = Left (-2.5), 1 = Center (0), 2 = Right (2.5)
  private playerX = 0;
  private playerY = 0;
  private playerVy = 0;
  private isJumping = false;
  private isSliding = false;
  private slideTimer = 0;

  private lives: number;
  private maxLives: number;
  private isInvulnerable = false;
  private invulnerableTimer = 0;

  private distance = 0;
  private coins = 0;
  private score = 0;
  private speed = 19;
  private isRunning = false;
  private isPaused = false;

  private obstacles: ActiveObstacle[] = [];
  private pickups: ActivePickup[] = [];
  private trackPieces: THREE.Group[] = [];
  private nextSpawnZ = -30;
  private questionIndex = 0;

  private clock = new THREE.Clock();
  private reqId: number | null = null;
  private lastStatsPush = 0;

  // Particle burst ring
  private particleGroup = new THREE.Group();

  constructor(container: HTMLElement, config: EngineConfig) {
    this.container = container;
    this.config = config;
    this.lives = config.initialLives;
    this.maxLives = config.maxLives;

    // Renderer
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    this.renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.016);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      140
    );
    this.camera.position.set(0, 4.4, 6.2);
    this.camera.lookAt(0, 1.2, -10);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x1e293b, 1.0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.6);
    dirLight.position.set(10, 20, 15);
    this.scene.add(dirLight);

    // Track & Ground
    this.initTrackChunks();

    // Animal Character
    this.animalModel = buildAnimalModel(config.animalId);
    this.animalModel.position.set(0, 0, 0);
    this.scene.add(this.animalModel);

    // Particles
    this.scene.add(this.particleGroup);

    // Resize listener
    window.addEventListener('resize', this.onWindowResize);

    // Pre-warm
    this.renderer.compile(this.scene, this.camera);
  }

  public setAnimal(animalId: AnimalId) {
    if (this.animalModel) {
      this.scene.remove(this.animalModel);
    }
    this.config.animalId = animalId;
    this.animalModel = buildAnimalModel(animalId);
    this.animalModel.position.set(this.playerX, this.playerY, 0);
    this.scene.add(this.animalModel);
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.tick();
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.clock.start();
  }

  public addLife(amount = 1) {
    this.lives = Math.min(this.maxLives, this.lives + amount);
    this.score += 100;
    this.pushStats();
  }

  public moveLeft() {
    if (!this.isRunning || this.isPaused) return;
    if (this.currentLane > 0) {
      this.currentLane--;
    }
  }

  public moveRight() {
    if (!this.isRunning || this.isPaused) return;
    if (this.currentLane < LANES.length - 1) {
      this.currentLane++;
    }
  }

  public jump() {
    if (!this.isRunning || this.isPaused) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.playerVy = JUMP_VELOCITY;
      playJumpSound();
    }
  }

  public slide() {
    if (!this.isRunning || this.isPaused) return;
    this.isSliding = true;
    this.slideTimer = SLIDE_DURATION;
    // Fast drop if jumping
    if (this.isJumping) {
      this.playerVy = -18;
    }
    playSlideSound();
  }

  private onWindowResize = () => {
    if (!this.container || !this.renderer) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private initTrackChunks() {
    const chunkLength = 40;
    for (let i = 0; i < 5; i++) {
      const chunk = this.createTrackChunk(i * -chunkLength);
      this.trackPieces.push(chunk);
      this.scene.add(chunk);
    }
  }

  private createTrackChunk(zPos: number): THREE.Group {
    const group = new THREE.Group();
    group.position.z = zPos;

    // Ground gravel ballast
    const ballastGeo = new THREE.PlaneGeometry(16, 40);
    const ballastMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ballast = new THREE.Mesh(ballastGeo, ballastMat);
    ballast.rotation.x = -Math.PI / 2;
    ballast.position.y = -0.05;
    group.add(ballast);

    // Track Ties (wooden sleepers) across 3 lanes
    const tieGeo = new THREE.BoxGeometry(7.6, 0.08, 0.4);
    const tieMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.8,
    });
    for (let z = -18; z <= 18; z += 1.8) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(0, 0.01, z);
      group.add(tie);
    }

    // Steel Rails for 3 lanes
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.2,
    });
    const railGeo = new THREE.BoxGeometry(0.08, 0.1, 40);

    LANES.forEach((lx) => {
      // Left rail
      const r1 = new THREE.Mesh(railGeo, railMat);
      r1.position.set(lx - 0.7, 0.06, 0);
      group.add(r1);
      // Right rail
      const r2 = new THREE.Mesh(railGeo, railMat);
      r2.position.set(lx + 0.7, 0.06, 0);
      group.add(r2);
    });

    // Side tunnel walls / arches / pillars
    const girderMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.5,
      roughness: 0.4,
    });
    const pillarGeo = new THREE.BoxGeometry(0.6, 5, 0.6);
    const beamGeo = new THREE.BoxGeometry(11, 0.5, 0.6);

    [-18, 18].forEach((pz) => {
      // Left pillar
      const pLeft = new THREE.Mesh(pillarGeo, girderMat);
      pLeft.position.set(-4.8, 2.5, pz);
      group.add(pLeft);
      // Right pillar
      const pRight = new THREE.Mesh(pillarGeo, girderMat);
      pRight.position.set(4.8, 2.5, pz);
      group.add(pRight);
      // Overhead girder beam
      const beam = new THREE.Mesh(beamGeo, girderMat);
      beam.position.set(0, 4.8, pz);
      group.add(beam);

      // Warning Traffic Lights (Red, Yellow, Green LEDs)
      LANES.forEach((lx) => {
        const lightBox = new THREE.Mesh(
          new THREE.BoxGeometry(0.35, 0.5, 0.2),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
        );
        lightBox.position.set(lx, 4.3, pz);
        const ledMat = new THREE.MeshBasicMaterial({ color: lx === 0 ? 0x22c55e : 0xf59e0b });
        const led = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), ledMat);
        led.position.set(0, 0, 0.12);
        lightBox.add(led);
        group.add(lightBox);
      });
    });

    return group;
  }

  private spawnObstaclesAndPickups(chunkZ: number) {
    // Determine obstacle type
    const lane = Math.floor(Math.random() * 3);
    const laneX = LANES[lane];
    const rand = Math.random();

    if (rand < 0.4) {
      // Low Hurdle (Jump over)
      const hurdle = new THREE.Group();
      hurdle.position.set(laneX, 0, chunkZ);

      const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.25, 0.2), barMat);
      bar.position.y = 0.45;
      hurdle.add(bar);

      const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      [-0.8, 0.8].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.6, 8), postMat);
        post.position.set(px, 0.3, 0);
        hurdle.add(post);
      });

      this.scene.add(hurdle);
      this.obstacles.push({
        mesh: hurdle,
        type: 'hurdle',
        lane,
        z: chunkZ,
        width: 1.6,
        height: 0.65,
        minY: 0,
        passed: false,
      });
    } else if (rand < 0.7) {
      // High Overhead Sign (Slide/Duck under)
      const overhead = new THREE.Group();
      overhead.position.set(laneX, 0, chunkZ);

      const signMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.25), signMat);
      sign.position.y = 1.9;
      overhead.add(sign);

      // Warning stripes on sign
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.2, 0.26), stripeMat);
      stripe.position.y = 1.9;
      overhead.add(stripe);

      // Posts on sides
      [-1.0, 1.0].forEach((px) => {
        const post = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.5, 8),
          new THREE.MeshStandardMaterial({ color: 0x64748b })
        );
        post.position.set(px, 1.25, 0);
        overhead.add(post);
      });

      this.scene.add(overhead);
      this.obstacles.push({
        mesh: overhead,
        type: 'overhead',
        lane,
        z: chunkZ,
        width: 1.8,
        height: 1.6,
        minY: 1.0, // Open clearance below 1.0m!
        passed: false,
      });
    } else {
      // Subway Cart / Barrier (Block lane completely)
      const train = new THREE.Group();
      train.position.set(laneX, 0, chunkZ);

      const cartMat = new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        metalness: 0.6,
        roughness: 0.3,
      });
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 3.5), cartMat);
      cart.position.y = 1.1;
      train.add(cart);

      // Windshield & lights
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1 });
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8), glassMat);
      glass.position.set(0, 1.4, 1.76);
      train.add(glass);

      // Red taillights
      [-0.6, 0.6].forEach((tx) => {
        const light = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xef4444 })
        );
        light.position.set(tx, 0.6, 1.76);
        train.add(light);
      });

      this.scene.add(train);
      this.obstacles.push({
        mesh: train,
        type: 'train',
        lane,
        z: chunkZ,
        width: 1.7,
        height: 2.2,
        minY: 0,
        passed: false,
      });
    }

    // Spawn Pickups in another lane or slightly ahead/behind
    const pickupLane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    const pickupLaneX = LANES[pickupLane];

    // Every ~60m or 25% chance: Mystery Question Box!
    const isQuestionBox = Math.random() < 0.35 && this.config.questions.length > 0;

    if (isQuestionBox) {
      const qBox = new THREE.Group();
      qBox.position.set(pickupLaneX, 1.1, chunkZ - 6);

      // Glowing Question Cube
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x6b21a8,
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), boxMat);
      qBox.add(boxMesh);

      // Yellow question mark emblem spheres
      const qSignMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const qDot = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), qSignMat);
      qDot.position.set(0, -0.2, 0.44);
      qBox.add(qDot);

      const qHook = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 6, 12, Math.PI * 1.3), qSignMat);
      qHook.position.set(0, 0.12, 0.44);
      qHook.rotation.z = -Math.PI / 4;
      qBox.add(qHook);

      this.scene.add(qBox);
      this.pickups.push({
        mesh: qBox,
        type: 'question',
        lane: pickupLane,
        z: chunkZ - 6,
        collected: false,
      });
    } else {
      // Golden Coin trail (3 coins in a row)
      for (let c = 0; c < 3; c++) {
        const coin = new THREE.Group();
        coin.position.set(pickupLaneX, 0.7, chunkZ - 4 - c * 2.5);

        const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 14);
        const coinMat = new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.9,
          roughness: 0.2,
        });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.rotation.x = Math.PI / 2;
        coin.add(coinMesh);

        this.scene.add(coin);
        this.pickups.push({
          mesh: coin,
          type: 'coin',
          lane: pickupLane,
          z: chunkZ - 4 - c * 2.5,
          collected: false,
        });
      }
    }
  }

  private triggerHit() {
    if (this.isInvulnerable) return;
    this.isInvulnerable = true;
    this.invulnerableTimer = INVULNERABLE_DURATION;

    playHitSound();
    this.lives = Math.max(0, this.lives - 1);
    const isDead = this.lives <= 0;

    this.config.callbacks.onHit(this.lives, isDead);

    if (isDead) {
      this.isRunning = false;
    }
  }

  private triggerQuestionPickup() {
    playQuestionBonusSound();
    if (this.config.questions.length === 0) return;

    const q = this.config.questions[this.questionIndex % this.config.questions.length];
    this.questionIndex++;

    this.pause();
    this.config.callbacks.onQuestionTrigger(q);
  }

  private pushStats() {
    this.config.callbacks.onStatsUpdate({
      distance: this.distance,
      score: this.score,
      coins: this.coins,
      lives: this.lives,
      speed: this.speed,
    });
  }

  private tick = () => {
    if (!this.isRunning) return;

    this.reqId = requestAnimationFrame(this.tick);

    const rawDt = this.clock.getDelta();
    const dt = Math.min(rawDt, 0.05);

    if (this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    // Advance speed gradually
    this.speed = Math.min(34, 19 + (this.distance / 120) * 1.5);
    const moveZ = this.speed * dt;
    this.distance += moveZ;
    this.score += Math.floor(moveZ);

    // Damped Lane Interpolation
    const targetX = LANES[this.currentLane];
    this.playerX = THREE.MathUtils.damp(this.playerX, targetX, 16, dt);

    // Jump Physics
    if (this.isJumping) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= GRAVITY * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isJumping = false;
      }
    }

    // Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Invulnerability Timer
    if (this.isInvulnerable) {
      this.invulnerableTimer -= dt;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
        this.animalModel.visible = true;
      } else {
        // Blink visible
        this.animalModel.visible = Math.floor(this.invulnerableTimer * 12) % 2 === 0;
      }
    }

    // Animate Animal Mesh
    this.animalModel.position.set(this.playerX, this.playerY, 0);

    // Squash & Stretch & Slide transform
    if (this.isSliding) {
      this.animalModel.scale.set(1.2, 0.45, 1.4);
      this.animalModel.position.y = 0.05;
    } else if (this.isJumping) {
      this.animalModel.scale.set(0.9, 1.25, 0.9);
    } else {
      // Running bounce
      const runCycle = this.distance * 1.5;
      const bounce = Math.abs(Math.sin(runCycle)) * 0.12;
      this.animalModel.position.y = this.playerY + bounce;
      this.animalModel.scale.set(1, 1, 1);

      // Swing limbs
      const limbs = this.animalModel.userData.limbs || [];
      limbs.forEach((limb, idx) => {
        const sign = idx % 2 === 0 ? 1 : -1;
        limb.rotation.x = Math.sin(runCycle) * 0.6 * sign;
      });

      // Flap wings if bird
      const wings = this.animalModel.userData.wings || [];
      wings.forEach((wing, idx) => {
        const sign = idx === 0 ? -1 : 1;
        wing.rotation.z = sign * (0.2 + Math.sin(runCycle * 2) * 0.3);
      });
    }

    // Lane tilt
    const laneDeltaX = targetX - this.playerX;
    this.animalModel.rotation.z = -laneDeltaX * 0.15;
    this.animalModel.rotation.y = laneDeltaX * 0.2;

    // Shift Track Chunks
    const chunkLength = 40;
    this.trackPieces.forEach((chunk) => {
      chunk.position.z += moveZ;
      if (chunk.position.z > 25) {
        chunk.position.z -= chunkLength * this.trackPieces.length;
      }
    });

    // Check when to spawn new obstacles
    this.nextSpawnZ += moveZ;
    if (this.nextSpawnZ >= 0) {
      this.spawnObstaclesAndPickups(-90 - Math.random() * 20);
      this.nextSpawnZ = -35;
    }

    // Update Obstacles
    const playerHitboxWidth = 0.75;
    const playerHitboxHeight = this.isSliding ? 0.45 : 1.35;
    const playerHitboxY = this.playerY;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.mesh.position.z += moveZ;

      // Collision Check
      const zDist = Math.abs(obs.mesh.position.z);
      if (zDist < 1.0 && !obs.passed) {
        const xDist = Math.abs(this.playerX - LANES[obs.lane]);
        if (xDist < (playerHitboxWidth + obs.width) * 0.45) {
          // Check Y clearance
          let isHit = false;
          if (obs.type === 'hurdle') {
            // Must jump above obstacle height
            if (playerHitboxY < obs.height) {
              isHit = true;
            }
          } else if (obs.type === 'overhead') {
            // Must duck under (player top < obs.minY)
            const playerTop = playerHitboxY + playerHitboxHeight;
            if (playerTop > obs.minY) {
              isHit = true;
            }
          } else {
            // Train/Barrier blocks whole lane
            isHit = true;
          }

          if (isHit) {
            obs.passed = true;
            this.triggerHit();
          }
        }
      }

      if (obs.mesh.position.z > 2) {
        obs.passed = true;
      }

      // Cleanup passed obstacles
      if (obs.mesh.position.z > 15) {
        this.scene.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    // Update Pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pick = this.pickups[i];
      pick.mesh.position.z += moveZ;

      // Spin pickups
      pick.mesh.rotation.y += dt * 3.5;

      const zDist = Math.abs(pick.mesh.position.z);
      if (zDist < 1.2 && !pick.collected) {
        const xDist = Math.abs(this.playerX - LANES[pick.lane]);
        if (xDist < 0.8) {
          pick.collected = true;
          this.scene.remove(pick.mesh);
          this.pickups.splice(i, 1);

          if (pick.type === 'coin') {
            this.coins++;
            this.score += 10;
            playCoinSound();
            this.config.callbacks.onCoinCollect(this.coins);
          } else if (pick.type === 'question') {
            this.triggerQuestionPickup();
          }
          continue;
        }
      }

      if (pick.mesh.position.z > 15) {
        this.scene.remove(pick.mesh);
        this.pickups.splice(i, 1);
      }
    }

    // Smooth Camera Follow
    const targetCamX = this.playerX * 0.4;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 10, dt);

    // Throttle stats push to 10Hz
    const now = performance.now();
    if (now - this.lastStatsPush > 100) {
      this.lastStatsPush = now;
      this.pushStats();
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isRunning = false;
    if (this.reqId !== null) {
      cancelAnimationFrame(this.reqId);
    }
    window.removeEventListener('resize', this.onWindowResize);

    // Clean up meshes
    this.obstacles.forEach((o) => this.scene.remove(o.mesh));
    this.pickups.forEach((p) => this.scene.remove(p.mesh));
    this.trackPieces.forEach((t) => this.scene.remove(t));
    if (this.animalModel) {
      this.scene.remove(this.animalModel);
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
