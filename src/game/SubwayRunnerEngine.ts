import * as THREE from 'three';
import { AnimalId, Question } from '../types/game.ts';
import { buildAnimalModel, AnimatedAnimalGroup } from './animalModels.ts';
import {
  createNatureHorizon,
  createNatureTrackChunk,
  NATURE_COLORS,
} from './natureScenery.ts';
import {
  playJumpSound,
  playSlideSound,
  playCoinSound,
  playHitSound,
  playQuestionBonusSound,
} from '../utils/sound.ts';
import { shuffleArray } from './quizParser.ts';

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
  facingFront?: boolean;
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
  private facingFront = false; // Default false: faces forward down the track (-Z) in direction of run
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

  // Majestic Nature Horizon (Distant Mountains, Sun, Floating Clouds)
  private natureHorizon?: {
    group: THREE.Group;
    clouds: THREE.Group[];
    update: (delta: number) => void;
  };

  constructor(container: HTMLElement, config: EngineConfig) {
    this.container = container;
    this.config = config;
    this.lives = config.initialLives;
    this.maxLives = config.maxLives;
    // Default false: animal faces forward down the track (-Z, rotation.y = Math.PI)
    this.facingFront = config.facingFront !== undefined ? config.facingFront : false;

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
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(this.renderer.domElement);

    // Bright Sunny Daylight Sky & Gentle Mountain Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(NATURE_COLORS.sky);
    this.scene.fog = new THREE.FogExp2(NATURE_COLORS.skyFog, 0.005);

    // Camera (extended draw distance for distant mountain panorama)
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    this.camera.position.set(0, 3.8, 5.6);
    this.camera.lookAt(0, 1.4, -12);

    // Bright Natural Sunlight & Sky/Meadow Bounce
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x86efac, 1.4);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    dirLight.position.set(30, 45, 25);
    this.scene.add(dirLight);

    // Distant Mountain Ranges, Radiant Sun, and Floating Clouds
    this.natureHorizon = createNatureHorizon();
    this.scene.add(this.natureHorizon.group);

    // Track & Ground
    this.initTrackChunks();

    // Animal Character - oriented facing forward towards front/screen (+Z) as requested
    this.animalModel = buildAnimalModel(config.animalId);
    this.animalModel.position.set(0, 0, 0);
    this.animalModel.rotation.y = this.facingFront ? 0 : Math.PI;
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
    this.animalModel.rotation.y = this.facingFront ? 0 : Math.PI;
    this.scene.add(this.animalModel);
  }

  public toggleFacingDirection(): boolean {
    this.facingFront = !this.facingFront;
    if (this.animalModel) {
      this.animalModel.rotation.y = this.facingFront ? 0 : Math.PI;
    }
    return this.facingFront;
  }

  public isFacingFront(): boolean {
    return this.facingFront;
  }

  public setFacingFront(facing: boolean) {
    this.facingFront = facing;
    if (this.animalModel) {
      this.animalModel.rotation.y = this.facingFront ? 0 : Math.PI;
    }
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
      const chunk = createNatureTrackChunk(i * -chunkLength, LANES);
      this.trackPieces.push(chunk);
      this.scene.add(chunk);
    }
  }

  private spawnObstaclesAndPickups(chunkZ: number) {
    // Determine obstacle type
    const lane = Math.floor(Math.random() * 3);
    const laneX = LANES[lane];
    const rand = Math.random();

    if (rand < 0.4) {
      // Low Hurdle (Jump over) - Rustic Nature Log with safety amber rings and support stakes
      const hurdle = new THREE.Group();
      hurdle.position.set(laneX, 0, chunkZ);

      // Carved timber log
      const logMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 1.85, 10), logMat);
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.44;
      hurdle.add(log);

      // Warning amber safety bands
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 });
      [-0.45, 0.45].forEach((bx) => {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.23, 0.3, 10), bandMat);
        band.rotation.z = Math.PI / 2;
        band.position.set(bx, 0.44, 0);
        hurdle.add(band);
      });

      // Rustic wooden support posts
      const stakeMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
      [-0.8, 0.8].forEach((px) => {
        const stake1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 7), stakeMat);
        stake1.position.set(px, 0.35, -0.1);
        stake1.rotation.x = 0.22;
        hurdle.add(stake1);

        const stake2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.75, 7), stakeMat);
        stake2.position.set(px, 0.35, 0.1);
        stake2.rotation.x = -0.22;
        hurdle.add(stake2);
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
      // High Overhead Sign (Slide/Duck under) - Scenic Nature Park Timber Arch with Ivy Vines
      const overhead = new THREE.Group();
      overhead.position.set(laneX, 0, chunkZ);

      // Wooden warning signboard
      const signMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75 });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.25), signMat);
      sign.position.y = 1.95;
      overhead.add(sign);

      // Vibrant yellow/amber warning chevron board
      const bannerMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.35 });
      const banner = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 0.27), bannerMat);
      banner.position.y = 1.95;
      overhead.add(banner);

      // Cute hanging green vines
      [-0.6, 0, 0.6].forEach((vx) => {
        const vine = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 })
        );
        vine.position.set(vx, 1.35, 0.12);
        vine.scale.set(0.85, 1.4, 0.85);
        overhead.add(vine);
      });

      // Wooden side posts
      const postMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
      [-1.0, 1.0].forEach((px) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 2.5, 8), postMat);
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
        minY: 1.0, // Open clearance below 1.0m
        passed: false,
      });
    } else {
      // Safari Express Train (Block lane completely)
      const train = new THREE.Group();
      train.position.set(laneX, 0, chunkZ);

      // Cheerful Yellow/Amber Locomotive Body
      const cartMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Warm vibrant amber
        metalness: 0.25,
        roughness: 0.35,
      });
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 3.8), cartMat);
      cart.position.y = 1.15;
      train.add(cart);

      // Emerald Forest Green Roof
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.4 });
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 3.9), roofMat);
      roof.position.y = 2.35;
      train.add(roof);

      // Front Sky-Blue Windshield
      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        roughness: 0.1,
        metalness: 0.3,
      });
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85), glassMat);
      glass.position.set(0, 1.5, 1.91);
      train.add(glass);

      // Glowing Warm Headlights
      [-0.55, 0.55].forEach((hx) => {
        const headlight = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 10, 10),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        headlight.position.set(hx, 0.75, 1.91);
        train.add(headlight);
      });

      // Safari decorative green stripe
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.3, 3.82), stripeMat);
      stripe.position.y = 0.55;
      train.add(stripe);

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

    const rawQ = this.config.questions[this.questionIndex % this.config.questions.length];
    this.questionIndex++;

    // Freshly shuffle options so the correct answer is randomized across all positions (A, B, C, D)
    const rawOptions = rawQ.options && rawQ.options.length > 0 ? rawQ.options : [rawQ.correctAnswer];
    const optsWithCorrect = rawOptions.includes(rawQ.correctAnswer) ? [...rawOptions] : [...rawOptions, rawQ.correctAnswer];
    const q: Question = {
      ...rawQ,
      options: shuffleArray(optsWithCorrect),
    };

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

    // Update floating clouds in the sunny nature sky
    if (this.natureHorizon) {
      this.natureHorizon.update(dt);
    }

    // Advance speed gradually
    this.speed = Math.min(34, 19 + (this.distance / 120) * 1.5);
    const moveZ = this.speed * dt;
    this.distance += moveZ;

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

    // Lane tilt and face forward (facing front/screen if facingFront is true)
    const laneDeltaX = targetX - this.playerX;
    const baseRotY = this.facingFront ? 0 : Math.PI;
    const rotSign = this.facingFront ? 1 : -1;
    this.animalModel.rotation.y = baseRotY + laneDeltaX * 0.22 * rotSign;
    this.animalModel.rotation.z = laneDeltaX * 0.12 * rotSign;

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
    if (this.natureHorizon) {
      this.scene.remove(this.natureHorizon.group);
    }
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
