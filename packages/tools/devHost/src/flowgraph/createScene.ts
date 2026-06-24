import { type Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import "core/Lights/Shadows/shadowGeneratorSceneComponent";
import { GlowLayer } from "core/Layers/glowLayer";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { TransformNode } from "core/Meshes/transformNode";
import { type Mesh } from "core/Meshes/mesh";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { Animation } from "core/Animations/animation";
import { AnimationGroup } from "core/Animations/animationGroup";
import { SineEase, CircleEase, EasingFunction, BackEase } from "core/Animations/easing";
import { CreateAudioEngineAsync } from "core/AudioV2/webAudio/webAudioEngine";
import { CreateSoundAsync } from "core/AudioV2/abstractAudio/audioEngineV2";
import { type StaticSound } from "core/AudioV2/abstractAudio/staticSound";
// Importing from the FlowGraph index also registers every block class used below.
import { ParseCoordinatorAsync } from "core/FlowGraph";

// Physics v2 (Havok) — gives the hero gravity, lets it stand/jump on platforms
// and physically collide with the coins.
import { HavokPlugin } from "core/Physics/v2/Plugins/havokPlugin";
import { PhysicsAggregate } from "core/Physics/v2/physicsAggregate";
import { PhysicsShapeType, PhysicsMotionType } from "core/Physics/v2/IPhysicsEnginePlugin";
import "core/Physics/joinedPhysicsEngineComponent";

import "core/Culling/ray";

// The serialized "Babylon Bros." interaction graph that drives all gameplay.
// It is also published on the snippet server (#EH7L45) and can be opened in the
// Flow Graph Editor for editing.
import BabylonBrosFlowGraph from "./babylonBrosFlowGraph.json";

/**
 * ---------------------------------------------------------------------------
 * "Babylon Bros." — a sophisticated, STATIC Mario-style world.
 * ---------------------------------------------------------------------------
 * This scene is intentionally inert: nothing moves, plays, or reacts on its
 * own. Every interactive behavior (jumping, enemy patrols, coin spins, block
 * bumps, spring bounces, sounds, win condition...) is pre-built and left
 * paused so that a Flow Graph can drive it step by step.
 *
 * Conventions that make the scene Flow-Graph-friendly:
 *  - Every interactive object has a stable, unique, human-readable name.
 *  - Every behavior is an AnimationGroup (Flow Graph "Play Animation" target),
 *    created and normalized but NEVER started here.
 *  - Every sound is loaded via Audio v2 and parked (never played here).
 *  - A discovery registry is attached to `scene.metadata.world` so tooling can
 *    enumerate the actors, animation groups and sounds quickly.
 * ---------------------------------------------------------------------------
 */

// CDN sound files verified to exist on the Babylon public assets host.
const SoundBaseUrl = "https://playground.babylonjs.com/sounds/";
const SoundUrls = {
    jump: SoundBaseUrl + "bounce.wav",
    stomp: SoundBaseUrl + "gunshot.wav",
    // Short 2 ms "click" (a single pulse at ~0.2 s in an otherwise silent 1 s
    // buffer) — used as the quick coin-pickup blip. The Flow Graph PlaySound
    // block skips the silent lead-in with a startOffset so it fires instantly.
    coin: "https://assets.babylonjs.com/sound/testing/audioV2/pulsed-1.mp3",
    spring: SoundBaseUrl + "bounce.wav",
    // Triumphant violin flourish played as the "end of level" music when the
    // hero reaches the flag.
    win: SoundBaseUrl + "violons11.wav",
};

const Fps = 30;

type World = {
    hero: TransformNode;
    enemies: TransformNode[];
    platforms: AbstractMesh[];
    movingPlatform: AbstractMesh;
    springs: AbstractMesh[];
    coins: AbstractMesh[];
    blocks: AbstractMesh[];
    goal: TransformNode;
    animationGroups: Record<string, AnimationGroup>;
    sounds: Record<string, StaticSound>;
};

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function (engine: Engine, canvas: HTMLCanvasElement): Promise<Scene> {
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.46, 0.74, 0.96, 1.0); // bright platformer sky
    scene.ambientColor = new Color3(0.3, 0.3, 0.35);

    // --- Physics (Havok) -----------------------------------------------------
    // Enable before any body is created. The Havok WASM is served by the
    // devHost Vite config (serveHavokWasmPlugin) at "/HavokPhysics.wasm".
    let physicsEnabled = false;
    try {
        const { default: havokFactory } = await import("@babylonjs/havok");
        const havok = await havokFactory();
        scene.enablePhysics(new Vector3(0, -16, 0), new HavokPlugin(true, havok));
        physicsEnabled = true;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[BabylonBros] Havok physics unavailable; the hero will not be physics-driven:", e);
    }

    // --- Camera: a comfortable 3/4 side-scroller view of the whole level. ---
    const camera = new ArcRotateCamera("mainCamera", -Math.PI / 2.4, Math.PI / 2.7, 38, new Vector3(12, 4, 0), scene);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 80;
    camera.upperBetaLimit = Math.PI / 2.05;
    camera.wheelDeltaPercentage = 0.02;
    camera.attachControl(canvas, true);
    // Detach the keyboard from the camera so the arrow keys drive the hero (via
    // the Flow Graph) instead of panning/rotating the view.
    camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");

    // --- Lighting + shadows. ---
    const hemi = new HemisphericLight("ambientLight", new Vector3(0.2, 1, 0.1), scene);
    hemi.intensity = 0.75;
    hemi.groundColor = new Color3(0.35, 0.3, 0.4);

    const sun = new DirectionalLight("sunLight", new Vector3(-0.6, -1, 0.4), scene);
    sun.position = new Vector3(20, 30, -20);
    sun.intensity = 1.1;
    // Tight depth bounds keep the shadow map's precision focused on the level
    // instead of being stretched across a huge auto-computed frustum.
    sun.shadowMinZ = 1;
    sun.shadowMaxZ = 140;

    const shadows = new ShadowGenerator(2048, sun);
    // Blurred exponential shadow maps were smearing the whole level into a soft
    // grey wash. Percentage-closer filtering with a small bias gives crisp,
    // correctly-placed contact shadows instead.
    shadows.usePercentageCloserFiltering = true;
    shadows.filteringQuality = ShadowGenerator.QUALITY_HIGH;
    shadows.bias = 0.012;
    shadows.normalBias = 0.02;

    // Make coins / blocks / goal glow.
    const glow = new GlowLayer("glow", scene);
    glow.intensity = 0.6;

    // --- Shared material palette. ---
    const mat = (name: string, hex: string, opts?: { emissive?: string; specular?: string }) => {
        const m = new StandardMaterial(name, scene);
        m.diffuseColor = Color3.FromHexString(hex);
        m.specularColor = opts?.specular ? Color3.FromHexString(opts.specular) : new Color3(0.1, 0.1, 0.1);
        if (opts?.emissive) {
            m.emissiveColor = Color3.FromHexString(opts.emissive);
        }
        return m;
    };

    const materials = {
        ground: mat("mat_ground", "#5fae3a"),
        dirt: mat("mat_dirt", "#7a4a23"),
        brick: mat("mat_brick", "#b5651d"),
        block: mat("mat_block", "#f2c14e", { emissive: "#5a3d00" }),
        blockUsed: mat("mat_blockUsed", "#8a6d3b"),
        heroBody: mat("mat_heroBody", "#d6322b"),
        heroOveralls: mat("mat_heroOveralls", "#2b53d6"),
        heroSkin: mat("mat_heroSkin", "#f1c27d"),
        goomba: mat("mat_goomba", "#7a4a23"),
        goombaFoot: mat("mat_goombaFoot", "#3a2412"),
        flyer: mat("mat_flyer", "#9b59b6"),
        flyerWing: mat("mat_flyerWing", "#ecf0f1"),
        spike: mat("mat_spike", "#c0392b"),
        spikeTip: mat("mat_spikeTip", "#ecf0f1"),
        coin: mat("mat_coin", "#ffd700", { emissive: "#b8860b" }),
        spring: mat("mat_spring", "#bdc3c7", { specular: "#ffffff" }),
        platform: mat("mat_platform", "#8e7cc3"),
        flagPole: mat("mat_flagPole", "#dddddd"),
        flag: mat("mat_flag", "#2ecc71", { emissive: "#0d5c2c" }),
    };

    // --- Easing helpers. ---
    const ease = (fn: EasingFunction, mode: number = EasingFunction.EASINGMODE_EASEINOUT) => {
        fn.setEasingMode(mode);
        return fn;
    };

    // Build a paused AnimationGroup from a single keyframed animation.
    const buildGroup = (
        groupName: string,
        target: TransformNode | AbstractMesh,
        property: string,
        keys: { frame: number; value: number | Vector3 }[],
        loop: boolean,
        easing?: EasingFunction
    ): AnimationGroup => {
        const sample = keys[0].value;
        const dataType = sample instanceof Vector3 ? Animation.ANIMATIONTYPE_VECTOR3 : Animation.ANIMATIONTYPE_FLOAT;
        const anim = new Animation(groupName + "_anim", property, Fps, dataType, Animation.ANIMATIONLOOPMODE_CYCLE);
        anim.setKeys(keys);
        if (easing) {
            anim.setEasingFunction(easing);
        }
        const group = new AnimationGroup(groupName, scene);
        group.addTargetedAnimation(anim, target);
        const lastFrame = keys[keys.length - 1].frame;
        group.normalize(0, lastFrame);
        group.loopAnimation = loop;
        // Park it: explicitly NOT played. The group stays at rest for a clean static look.
        return group;
    };

    const animationGroups: Record<string, AnimationGroup> = {};
    const register = (g: AnimationGroup) => {
        animationGroups[g.name] = g;
        return g;
    };

    // =======================================================================
    // GROUND & TERRAIN
    // =======================================================================
    const ground = MeshBuilder.CreateBox("ground", { width: 56, height: 2, depth: 8 }, scene);
    ground.position.set(16, -1, 0);
    ground.material = materials.ground;
    ground.receiveShadows = true;

    // A pit gap is implied by raised terrain blocks; add a couple of dirt steps.
    const step1 = MeshBuilder.CreateBox("terrain_step_1", { width: 6, height: 4, depth: 8 }, scene);
    step1.position.set(-2, 1, 0);
    step1.material = materials.dirt;
    step1.receiveShadows = true;

    const step2 = MeshBuilder.CreateBox("terrain_step_2", { width: 6, height: 8, depth: 8 }, scene);
    step2.position.set(34, 3, 0);
    step2.material = materials.dirt;
    step2.receiveShadows = true;

    const terrain: AbstractMesh[] = [ground, step1, step2];

    // =======================================================================
    // HERO  ("Babylon Bro")
    // =======================================================================
    // The hero root is an invisible box that doubles as the physics collider.
    // Visual parts are parented to it and centered on its origin.
    const hero = MeshBuilder.CreateBox("hero", { width: 1.0, height: 2.2, depth: 0.7 }, scene);
    hero.isVisible = false;
    hero.position.set(-8, 1.3, 0);

    const heroBody = MeshBuilder.CreateBox("hero_body", { width: 1, height: 1.1, depth: 0.7 }, scene);
    heroBody.material = materials.heroOveralls;
    heroBody.parent = hero;
    heroBody.position.y = -0.55;

    const heroTorso = MeshBuilder.CreateBox("hero_torso", { width: 1.02, height: 0.5, depth: 0.72 }, scene);
    heroTorso.material = materials.heroBody;
    heroTorso.parent = hero;
    heroTorso.position.y = -0.05;

    const heroHead = MeshBuilder.CreateSphere("hero_head", { diameter: 0.7, segments: 16 }, scene);
    heroHead.material = materials.heroSkin;
    heroHead.parent = hero;
    heroHead.position.y = 0.5;

    const heroCap = MeshBuilder.CreateCylinder("hero_cap", { diameterTop: 0.78, diameterBottom: 0.82, height: 0.22, tessellation: 16 }, scene);
    heroCap.material = materials.heroBody;
    heroCap.parent = hero;
    heroCap.position.y = 0.85;

    for (const part of [heroBody, heroTorso, heroHead, heroCap]) {
        shadows.addShadowCaster(part);
    }

    // The hero's vertical motion (jumping, falling, idle bob) is now driven by
    // the physics engine, so no position.y animation groups are registered here.

    // =======================================================================
    // ENEMIES  (3 types)
    // =======================================================================
    const enemies: TransformNode[] = [];

    // --- Type 1: Goomba (ground patroller). ---
    const makeGoomba = (id: string, x: number): TransformNode => {
        const root = new TransformNode(id, scene);
        root.position.set(x, 0.6, 0);

        const body = MeshBuilder.CreateSphere(id + "_body", { diameterX: 1.3, diameterY: 1.0, diameterZ: 1.1, segments: 16 }, scene);
        body.material = materials.goomba;
        body.parent = root;

        const footL = MeshBuilder.CreateBox(id + "_footL", { width: 0.4, height: 0.25, depth: 0.5 }, scene);
        footL.material = materials.goombaFoot;
        footL.parent = root;
        footL.position.set(-0.35, -0.55, 0);

        const footR = footL.clone(id + "_footR", root)!;
        footR.position.x = 0.35;

        shadows.addShadowCaster(body);
        register(
            buildGroup(
                id + "_walk",
                root,
                "position.x",
                [
                    { frame: 0, value: x },
                    { frame: Fps * 2, value: x - 4 },
                    { frame: Fps * 4, value: x },
                ],
                true,
                ease(new SineEase())
            )
        );
        enemies.push(root);
        return root;
    };
    makeGoomba("goomba_1", 6);
    makeGoomba("goomba_2", 22);

    // --- Type 2: Flyer (hovering enemy). ---
    const makeFlyer = (id: string, position: Vector3): TransformNode => {
        const root = new TransformNode(id, scene);
        root.position.copyFrom(position);

        const body = MeshBuilder.CreateSphere(id + "_body", { diameter: 1.0, segments: 16 }, scene);
        body.material = materials.flyer;
        body.parent = root;

        const wingL = MeshBuilder.CreateBox(id + "_wingL", { width: 0.7, height: 0.08, depth: 0.5 }, scene);
        wingL.material = materials.flyerWing;
        wingL.parent = root;
        wingL.position.set(-0.7, 0.1, 0);
        wingL.rotation.z = 0.4;

        const wingR = wingL.clone(id + "_wingR", root)!;
        wingR.position.x = 0.7;
        wingR.rotation.z = -0.4;

        shadows.addShadowCaster(body);
        register(
            buildGroup(
                id + "_hover",
                root,
                "position.y",
                [
                    { frame: 0, value: position.y },
                    { frame: Fps * 1.5, value: position.y + 1.4 },
                    { frame: Fps * 3, value: position.y },
                ],
                true,
                ease(new SineEase())
            )
        );
        enemies.push(root);
        return root;
    };
    makeFlyer("flyer_1", new Vector3(16, 6, 0));

    // --- Type 3: Spiky (stationary hazard that pulses). ---
    const makeSpike = (id: string, position: Vector3): TransformNode => {
        const root = new TransformNode(id, scene);
        root.position.copyFrom(position);

        const core = MeshBuilder.CreateSphere(id + "_core", { diameter: 0.9, segments: 12 }, scene);
        core.material = materials.spike;
        core.parent = root;

        const dirs = [
            new Vector3(0, 1, 0),
            new Vector3(0, -1, 0),
            new Vector3(1, 0, 0),
            new Vector3(-1, 0, 0),
            new Vector3(0, 0, 1),
            new Vector3(0, 0, -1),
        ];
        dirs.forEach((d, i) => {
            const spike = MeshBuilder.CreateCylinder(id + "_spike_" + i, { diameterTop: 0, diameterBottom: 0.28, height: 0.6, tessellation: 8 }, scene);
            spike.material = materials.spikeTip;
            spike.parent = root;
            spike.position = d.scale(0.6);
            // Point the cone outward along d.
            if (d.y === 0) {
                spike.rotation.z = d.x !== 0 ? (d.x > 0 ? -Math.PI / 2 : Math.PI / 2) : 0;
                spike.rotation.x = d.z !== 0 ? (d.z > 0 ? Math.PI / 2 : -Math.PI / 2) : 0;
            } else if (d.y < 0) {
                spike.rotation.x = Math.PI;
            }
            shadows.addShadowCaster(spike);
        });

        shadows.addShadowCaster(core);
        register(
            buildGroup(
                id + "_pulse",
                root,
                "scaling",
                [
                    { frame: 0, value: new Vector3(1, 1, 1) },
                    { frame: Fps * 0.5, value: new Vector3(1.25, 1.25, 1.25) },
                    { frame: Fps, value: new Vector3(1, 1, 1) },
                ],
                true,
                ease(new SineEase())
            )
        );
        enemies.push(root);
        return root;
    };
    makeSpike("spike_1", new Vector3(28, 1.4, 0));

    // =======================================================================
    // PLATFORMS  (static + one moving)
    // =======================================================================
    const platforms: AbstractMesh[] = [];
    const makePlatform = (id: string, position: Vector3, size = { w: 3, h: 0.6, d: 4 }): Mesh => {
        const p = MeshBuilder.CreateBox(id, { width: size.w, height: size.h, depth: size.d }, scene);
        p.position.copyFrom(position);
        p.material = materials.platform;
        p.receiveShadows = true;
        shadows.addShadowCaster(p);
        platforms.push(p);
        return p;
    };
    makePlatform("platform_static_1", new Vector3(2, 3.2, 0));
    makePlatform("platform_static_2", new Vector3(11, 5.0, 0));
    makePlatform("platform_static_3", new Vector3(18, 3.6, 0));
    makePlatform("platform_static_4", new Vector3(26, 6.2, 0));

    // Moving platform (paused loop between two points).
    const movingPlatform = makePlatform("platform_moving", new Vector3(7, 4.2, 0), { w: 3.2, h: 0.5, d: 4 });
    // A vertical "elevator". The per-frame hero velocity override owns the
    // horizontal axis, so a sideways platform would slide out from under a
    // standing hero (leaving them briefly floating). Moving on Y instead means
    // the elevator physically lifts/lowers the hero, which the velocity override
    // preserves, so it behaves as expected.
    register(
        buildGroup(
            "platform_moving_loop",
            movingPlatform,
            "position.y",
            [
                { frame: 0, value: 4.2 },
                { frame: Fps * 2.5, value: 7.2 },
                { frame: Fps * 5, value: 4.2 },
            ],
            true,
            ease(new SineEase())
        )
    );

    // =======================================================================
    // SPRINGS  (bounce pads)
    // =======================================================================
    const springs: AbstractMesh[] = [];
    const makeSpring = (id: string, x: number): Mesh => {
        const base = MeshBuilder.CreateCylinder(id, { diameterTop: 1.0, diameterBottom: 1.2, height: 0.8, tessellation: 16 }, scene);
        base.position.set(x, 0.4, 0);
        base.material = materials.spring;
        base.setPivotPoint(new Vector3(0, -0.4, 0)); // compress from the bottom
        base.receiveShadows = true;
        shadows.addShadowCaster(base);
        springs.push(base);
        register(
            buildGroup(
                id + "_compress",
                base,
                "scaling",
                [
                    { frame: 0, value: new Vector3(1, 1, 1) },
                    { frame: Fps * 0.15, value: new Vector3(1.1, 0.4, 1.1) },
                    { frame: Fps * 0.5, value: new Vector3(1, 1, 1) },
                ],
                false,
                ease(new BackEase(), EasingFunction.EASINGMODE_EASEOUT)
            )
        );
        return base;
    };
    makeSpring("spring_1", 14);
    makeSpring("spring_2", 31);

    // =======================================================================
    // COINS  (collectibles)
    // =======================================================================
    const coins: AbstractMesh[] = [];
    // Coins sit roughly at hero chest height over a reachable surface so that
    // running or jumping into them triggers a physics collision.
    const coinSpots = [
        new Vector3(-6, 1.0, 0), // ground, before the first dirt step
        new Vector3(-2, 4.0, 0), // on top of terrain_step_1
        new Vector3(2, 4.5, 0), // on platform_static_1
        new Vector3(11, 6.3, 0), // on platform_static_2
        new Vector3(18, 4.9, 0), // on platform_static_3
        new Vector3(22, 1.0, 0), // back down on the ground
        new Vector3(26, 7.5, 0), // on platform_static_4
    ];
    coinSpots.forEach((pos, i) => {
        const id = "coin_" + (i + 1);
        const coin = MeshBuilder.CreateCylinder(id, { diameter: 0.9, height: 0.14, tessellation: 24 }, scene);
        coin.rotation.x = Math.PI / 2; // face the camera like a disc
        coin.position.copyFrom(pos);
        coin.material = materials.coin;
        shadows.addShadowCaster(coin);
        coins.push(coin);
        register(
            buildGroup(
                id + "_spin",
                coin,
                "rotation.y",
                [
                    { frame: 0, value: 0 },
                    { frame: Fps * 2, value: Math.PI * 2 },
                ],
                true
            )
        );
    });

    // =======================================================================
    // QUESTION BLOCKS  (interactive bump blocks)
    // =======================================================================
    const blocks: AbstractMesh[] = [];
    // A classic "question block" row floating over the open running stretch past
    // platform_static_3: high enough for the hero to run underneath, low enough
    // to bonk from a ground jump, and clear of the platform-to-platform jump
    // arcs so they no longer block traversal between platforms.
    const blockSpots = [new Vector3(20, 5.0, 0), new Vector3(22, 5.0, 0), new Vector3(24, 5.0, 0)];
    blockSpots.forEach((pos, i) => {
        const id = "block_" + (i + 1);
        const block = MeshBuilder.CreateBox(id, { size: 1 }, scene);
        block.position.copyFrom(pos);
        block.material = materials.block;
        shadows.addShadowCaster(block);
        blocks.push(block);
        register(
            buildGroup(
                id + "_bump",
                block,
                "position.y",
                [
                    { frame: 0, value: pos.y },
                    { frame: Fps * 0.2, value: pos.y + 0.6 },
                    { frame: Fps * 0.5, value: pos.y },
                ],
                false,
                ease(new BackEase(), EasingFunction.EASINGMODE_EASEOUT)
            )
        );
    });

    // =======================================================================
    // GOAL  (flag at the end of the level)
    // =======================================================================
    const goal = new TransformNode("goal_flag", scene);
    goal.position.set(40, 7, 0);

    const pole = MeshBuilder.CreateCylinder("goal_pole", { diameter: 0.18, height: 8, tessellation: 12 }, scene);
    pole.material = materials.flagPole;
    pole.parent = goal;
    pole.position.y = 0;

    const flag = MeshBuilder.CreateBox("goal_flag_cloth", { width: 1.6, height: 1.0, depth: 0.05 }, scene);
    flag.material = materials.flag;
    flag.parent = goal;
    flag.position.set(0.8, 2.2, 0); // parked low; "raise" lifts it to the top
    shadows.addShadowCaster(pole);
    shadows.addShadowCaster(flag);

    register(
        buildGroup(
            "goal_flag_raise",
            flag,
            "position.y",
            [
                { frame: 0, value: 2.2 },
                { frame: Fps * 1.2, value: 3.6 },
            ],
            false,
            ease(new CircleEase(), EasingFunction.EASINGMODE_EASEOUT)
        )
    );

    // =======================================================================
    // AUDIO v2  (loaded & parked — never played here)
    // =======================================================================
    const sounds: Record<string, StaticSound> = {};
    try {
        const audioEngine = await CreateAudioEngineAsync({ volume: 0.6 });
        // All sounds load as static sounds (short SFX + the win flourish).
        const sfxNames = ["jump", "stomp", "coin", "spring", "win"] as const;
        await Promise.all(
            sfxNames.map(async (key) => {
                try {
                    sounds[key] = await CreateSoundAsync("sfx_" + key, SoundUrls[key], { autoplay: false }, audioEngine);
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.warn(`[BabylonBros] Could not load sound '${key}':`, e);
                }
            })
        );
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[BabylonBros] Audio v2 engine unavailable; continuing without sound:", e);
    }

    // =======================================================================
    // DISCOVERY REGISTRY
    // =======================================================================
    const world: World = {
        hero,
        enemies,
        platforms: [...platforms],
        movingPlatform,
        springs,
        coins,
        blocks,
        goal,
        animationGroups,
        sounds,
    };
    scene.metadata = { ...(scene.metadata ?? {}), world, terrain };

    // eslint-disable-next-line no-console
    console.log(
        `[BabylonBros] Static world ready: ${enemies.length} enemies, ${platforms.length} platforms, ${coins.length} coins, ${blocks.length} blocks, ` +
            `${Object.keys(animationGroups).length} paused animation groups, ${Object.keys(sounds).length} parked sounds.`
    );

    // =======================================================================
    // PHYSICS BODIES
    // The hero is a dynamic capsule-ish box; the ground, dirt steps and
    // platforms are static; the moving platform is an ANIMATED vertical elevator
    // so it lifts the hero; coins are non-physical (collected by proximity).
    // =======================================================================
    if (physicsEnabled) {
        // Static world geometry.
        for (const mesh of [...terrain, ...platforms]) {
            new PhysicsAggregate(mesh, PhysicsShapeType.BOX, { mass: 0, friction: 0.6, restitution: 0 }, scene);
        }

        // Moving platform: keep it kinematic/ANIMATED so its animation drives it
        // through physics and it carries dynamic bodies resting on top.
        const movingAggregate = new PhysicsAggregate(movingPlatform, PhysicsShapeType.BOX, { mass: 0, friction: 0.8, restitution: 0 }, scene);
        movingAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
        movingAggregate.body.disablePreStep = false;

        // Springs: solid STATIC bounce-pad colliders. The Flow Graph applies a
        // strong upward impulse to the hero on contact, so they launch the hero
        // back up to the platforms after a fall down to the ground.
        for (const spring of springs) {
            new PhysicsAggregate(spring, PhysicsShapeType.BOX, { mass: 0, friction: 0.6, restitution: 0 }, scene);
        }

        // Coins are intentionally NON-physical. A solid coin collider can be
        // stood on, and a static-vs-dynamic contact only sometimes re-fires, so
        // the Flow Graph collects coins with a per-frame proximity test instead.
        // This lets the hero pass cleanly through them like real pickups.

        // Enemies: give each a solid collider so the hero physically bumps into
        // them. The collider is the enemy's body/core child mesh (the roots are
        // bare TransformNodes with no geometry). Goombas patrol and the flyer
        // hovers, so their bodies are ANIMATED (disablePreStep off) to let their
        // patrol animation drive the physics body; the spike only pulses in
        // place, so it stays STATIC. A BOX shape avoids the non-uniform-scale
        // warning the sphere bodies would otherwise emit.
        for (const enemy of enemies) {
            const isSpike = enemy.name.startsWith("spike");
            const collider = scene.getMeshByName(enemy.name + (isSpike ? "_core" : "_body"));
            if (!collider) {
                continue;
            }
            // A SPHERE collider sized to the visible body keeps the hit area a
            // tight round shape. A BOX circumscribes the sphere, so its corners
            // would "hit" the hero well before the visible body is touched.
            const colliderRadius = enemy.name.startsWith("goomba") ? 0.6 : 0.5;
            const enemyAggregate = new PhysicsAggregate(collider, PhysicsShapeType.SPHERE, { mass: 0, radius: colliderRadius, friction: 0.4, restitution: 0 }, scene);
            if (isSpike) {
                enemyAggregate.body.setMotionType(PhysicsMotionType.STATIC);
            } else {
                enemyAggregate.body.setMotionType(PhysicsMotionType.ANIMATED);
                enemyAggregate.body.disablePreStep = false;
            }
        }

        // Question blocks floating at the top of the level: solid STATIC boxes so
        // the hero can bump into them and land on top.
        for (const block of blocks) {
            new PhysicsAggregate(block, PhysicsShapeType.BOX, { mass: 0, friction: 0.6, restitution: 0 }, scene);
        }

        // Hero: dynamic, upright. Zeroing the inertia locks rotation so the box
        // never topples while running and jumping. The mass must be passed
        // explicitly here, otherwise Havok recomputes it from the box volume
        // (~1540) and the jump impulse becomes imperceptible.
        const heroAggregate = new PhysicsAggregate(hero, PhysicsShapeType.BOX, { mass: 1, friction: 0.4, restitution: 0 }, scene);
        heroAggregate.body.setMassProperties({ mass: 1, inertia: Vector3.Zero() });
        heroAggregate.body.setAngularDamping(100);
    }

    // =======================================================================
    // FLOW GRAPH — load & start the serialized interaction graph locally so we
    // can verify it drives the static world (enemy patrols, coin spins, jumps,
    // pickups, win condition...). References resolve against the scene by name.
    // =======================================================================
    try {
        const coordinator = await ParseCoordinatorAsync(BabylonBrosFlowGraph, { scene });
        coordinator.start();
        // Audio V2 sounds are not a serializable Flow Graph asset type, so each
        // PlaySound block reads its sound from a named graph variable. Bind the
        // parked sounds into every execution context here (after start, so the
        // contexts exist) — the play logic itself lives entirely in the Flow Graph.
        const soundBindings: Record<string, StaticSound | undefined> = {
            coinSound: sounds.coin,
            jumpSound: sounds.jump,
            hurtSound: sounds.stomp,
            winSound: sounds.win,
        };
        for (const flowGraph of coordinator.flowGraphs) {
            for (let i = 0; i < flowGraph.contextCount; i++) {
                const ctx = flowGraph.getContext(i);
                for (const key of Object.keys(soundBindings)) {
                    const snd = soundBindings[key];
                    if (snd) {
                        ctx.setVariable(key, snd);
                    }
                }
            }
        }

        // --- Score HUD (polled, NOT driven by the Flow Graph) ----------------
        // The Flow Graph owns the "score" and "gameDone" variables; this HTML
        // overlay merely reads them every frame and renders them. No game logic
        // lives here — it is a pure view that polls the graph context.
        const hudContext = coordinator.flowGraphs[0]?.contextCount ? coordinator.flowGraphs[0].getContext(0) : undefined;
        const hudId = "babylonBrosHud";
        document.getElementById(hudId)?.remove();
        const hud = document.createElement("div");
        hud.id = hudId;
        hud.style.cssText =
            "position:fixed;top:14px;left:16px;z-index:20;pointer-events:none;" +
            "font-family:'Segoe UI',system-ui,sans-serif;font-weight:700;color:#ffffff;" +
            "text-shadow:0 2px 4px rgba(0,0,0,0.65);";
        hud.innerHTML =
            '<div style="font-size:26px;letter-spacing:1px">SCORE&nbsp;<span id="bbScore">0</span></div>' +
            '<div id="bbState" style="font-size:32px;color:#ffe14d;margin-top:6px"></div>';
        document.body.appendChild(hud);
        const scoreEl = hud.querySelector("#bbScore") as HTMLSpanElement;
        const stateEl = hud.querySelector("#bbState") as HTMLDivElement;
        scene.onDisposeObservable.addOnce(() => hud.remove());
        scene.onBeforeRenderObservable.add(() => {
            if (!hudContext) {
                return;
            }
            const score = hudContext.hasVariable("score") ? hudContext.getVariable("score") : 0;
            scoreEl.textContent = String(score ?? 0);
            const done = hudContext.hasVariable("gameDone") ? hudContext.getVariable("gameDone") : false;
            stateEl.textContent = done ? "GAME DONE!" : "";
        });

        // eslint-disable-next-line no-console
        console.log(
            `[BabylonBros] Flow graph started: ${coordinator.flowGraphs.length} graph(s) driving the scene. Use ←/→ to run, Space to jump onto the platforms; bump into the coins to collect them and reach the flag to win.`
        );
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[BabylonBros] Could not start the Babylon Bros flow graph:", e);
    }

    return scene;
};
