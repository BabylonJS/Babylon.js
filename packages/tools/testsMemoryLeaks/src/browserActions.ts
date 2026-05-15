/**
 * Browser-side options used to load a playground scene in memlab.
 */
export interface IPlaygroundSceneBrowserOptions {
    /** Babylon server base URL. */
    baseUrl: string;
    /** Playground snippet API URL. */
    snippetUrl: string;
    /** Playground asset root URL. */
    pgRoot: string;
    /** Playground id to load. */
    playgroundId: string;
    /** Number of frames to render after the scene is ready. */
    renderCount?: number;
    /** Whether to open and close the inspector as part of the interaction. */
    toggleInspector?: boolean;
    /** Whether to simulate a small camera interaction. */
    simulateCameraMove?: boolean;
    /** Whether to briefly exercise animation groups during the action. */
    exerciseAnimationGroups?: boolean;
    /** Target engine name. */
    engineName?: "webgl2" | "webgl1";
    /** Time to wait after the scene becomes ready. */
    settleAfterReadyMs?: number;
    /** Time to wait after disposal completes. */
    settleAfterDisposeMs?: number;
}

/**
 * Browser-side options used to mount a viewer scenario in memlab.
 */
export interface IViewerSceneBrowserOptions {
    /** Viewer HTML that should be attached to the DOM. */
    viewerHtml: string;
    /** Minimum rendered frame count before the action is considered stable. */
    minFrameCount?: number;
    /** Time to wait after the viewer becomes idle. */
    settleAfterReadyMs?: number;
    /** Time to wait after unmounting the viewer. */
    settleAfterDisposeMs?: number;
}

/**
 * Browser-side options used to run package-focused scenarios on top of empty.html.
 */
export interface IPackageSceneBrowserOptions {
    /** Babylon server base URL. */
    baseUrl: string;
    /** Shared Babylon assets base URL. */
    assetsUrl: string;
    /** Package scenario identifier. */
    scenario:
        | "core-feature-stack"
        | "core-rendering-materials-shadows-stack"
        | "core-textures-render-targets-postprocess-stack"
        | "gui-fullscreen-ui"
        | "gui-mesh-adt"
        | "loaders-boombox-import"
        | "loaders-obj-direct-load"
        | "loaders-stl-direct-load"
        | "materials-library-stack"
        | "postprocesses-digital-rain-stack"
        | "procedural-textures-stack"
        | "serializers-gltf-export"
        | "serializers-glb-export";
    /** Number of frames to render after the scenario completes its main action. */
    renderCount?: number;
    /** Time to wait after the scenario becomes ready. */
    settleAfterReadyMs?: number;
}

/**
 * Initializes the Babylon page state and loads a playground into a fresh engine.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Playground load options.
 */
export async function EvaluateInitializePlaygroundScene(options: IPlaygroundSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & {
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
        seed?: number;
    };
    const globalWindowRecord = globalWindow as typeof globalWindow & Record<string, unknown>;
    const harnessStateKey = "__babylonLeakHarnessState";
    const originalMathRandomKey = "__babylonOriginalMathRandom";

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindowRecord[harnessStateKey] = { busy, status, lastError };
    };
    const waitForAnimationFramesAsync = async (count = 2) =>
        await new Promise<void>((resolve) => {
            const advanceFrame = (remainingFrameCount: number) => {
                if (remainingFrameCount <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(() => {
                    advanceFrame(remainingFrameCount - 1);
                });
            };

            advanceFrame(count);
        });
    const waitForSettleAsync = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFramesAsync(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("loading", true);

    try {
        if (!globalWindowRecord[originalMathRandomKey]) {
            globalWindowRecord[originalMathRandomKey] = globalWindow.Math.random;
        }
        globalWindow.seed = 1;
        globalWindow.Math.random = function () {
            const currentSeed = globalWindow.seed ?? 1;
            globalWindow.seed = currentSeed + 1;
            const x = Math.sin(currentSeed) * 10000;
            return x - Math.floor(x);
        };

        // eslint-disable-next-line @typescript-eslint/naming-convention -- BABYLON is the intentional runtime namespace.
        const BABYLON = globalWindow.BABYLON;
        if (!BABYLON) {
            throw new Error("BABYLON is not available on the test page.");
        }

        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }
        if (globalWindow.scene) {
            globalWindow.scene.dispose();
            globalWindow.scene = null;
        }
        if (globalWindow.engine) {
            globalWindow.engine.stopRenderLoop?.();
            globalWindow.engine.dispose();
            globalWindow.engine = null;
        }

        const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("The memory leak page does not expose #babylon-canvas.");
        }

        globalWindow.canvas = canvas;
        BABYLON.Tools.ScriptBaseUrl = options.baseUrl;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

        const engine = new BABYLON.Engine(canvas, false, {
            disableWebGL2Support: options.engineName === "webgl1",
            useHighPrecisionFloats: true,
        });
        engine.enableOfflineSupport = false;
        engine.renderEvenInBackground = true;
        engine.getCaps().parallelShaderCompile = undefined;
        globalWindow.engine = engine;

        const normalizedPlaygroundId = options.playgroundId[0] !== "#" || options.playgroundId.indexOf("#", 1) === -1 ? `${options.playgroundId}#0` : options.playgroundId;
        const data = await fetch(options.snippetUrl + normalizedPlaygroundId.replace(/#/g, "/"));
        const snippet = await data.json();
        const payload = JSON.parse(snippet.jsonPayload);

        let code: string;
        if (Object.prototype.hasOwnProperty.call(payload, "version")) {
            const v2Manifest = JSON.parse(payload.code);
            code = v2Manifest.files[v2Manifest.entry];
            code = code
                .replace(/export default \w+/g, "")
                .replace(/export const /g, "const ")
                .replace(/export var /g, "var ");
        } else {
            code = payload.code.toString();
        }

        code = code
            .replace(/"\/textures\//g, `"${options.pgRoot}/textures/`)
            .replace(/"textures\//g, `"${options.pgRoot}/textures/`)
            .replace(/\/scenes\//g, `${options.pgRoot}/scenes/`)
            .replace(/"scenes\//g, `"${options.pgRoot}/scenes/`)
            .replace(/"\.\.\/\.\.https/g, '"https')
            .replace("http://", "https://");

        const createSceneResult = eval(code + "\ncreateScene(engine)");
        const scene = await Promise.resolve(createSceneResult);
        globalWindow.scene = scene;

        if (!scene) {
            throw new Error(`The playground ${options.playgroundId} did not produce a scene.`);
        }

        await scene.whenReadyAsync();
        await waitForSettleAsync(0, 2);

        const renderCount = options.renderCount ?? 6;
        for (let index = 0; index < renderCount; index++) {
            scene.render();
        }

        if (options.exerciseAnimationGroups && scene.animationGroups?.length) {
            scene.animationGroups.forEach((animationGroup: any) => {
                if (!animationGroup.isPlaying) {
                    animationGroup.start?.(true);
                }
            });

            for (let index = 0; index < Math.max(renderCount, 12); index++) {
                scene.render();
            }

            scene.animationGroups.forEach((animationGroup: any) => {
                animationGroup.stop?.();
                animationGroup.reset?.();
            });
            scene.stopAllAnimations?.();
            scene.render();
        }

        if (options.simulateCameraMove && scene.activeCamera) {
            const activeCamera = scene.activeCamera as any;
            if (typeof activeCamera.alpha === "number") {
                activeCamera.alpha += 0.15;
            }
            if (typeof activeCamera.beta === "number") {
                activeCamera.beta += 0.05;
            }
            if (activeCamera.position && typeof activeCamera.position.z === "number") {
                activeCamera.position.z += 0.25;
            }
            scene.render();
        }

        if (options.toggleInspector && scene.debugLayer) {
            await scene.debugLayer.show();
            scene.render();
            await scene.debugLayer.hide();
            scene.render();
        }

        await waitForSettleAsync(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Initializes a package-focused Babylon scenario on top of the empty Babylon Server host page.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Package scenario options.
 */
export async function EvaluateInitializePackageScene(options: IPackageSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & {
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
    };
    const globalWindowRecord = globalWindow as typeof globalWindow & Record<string, unknown>;
    const harnessStateKey = "__babylonLeakHarnessState";

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindowRecord[harnessStateKey] = { busy, status, lastError };
    };
    const waitForAnimationFramesAsync = async (count = 2) =>
        await new Promise<void>((resolve) => {
            const advanceFrame = (remainingFrameCount: number) => {
                if (remainingFrameCount <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(() => {
                    advanceFrame(remainingFrameCount - 1);
                });
            };

            advanceFrame(count);
        });
    const waitForSettleAsync = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFramesAsync(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("loading", true);

    try {
        // eslint-disable-next-line @typescript-eslint/naming-convention -- BABYLON is the intentional runtime namespace.
        const BABYLON = globalWindow.BABYLON;
        if (!BABYLON) {
            throw new Error("BABYLON is not available on the test page.");
        }

        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }
        if (globalWindow.scene) {
            globalWindow.scene.dispose();
            globalWindow.scene = null;
        }
        if (globalWindow.engine) {
            globalWindow.engine.stopRenderLoop?.();
            globalWindow.engine.dispose();
            globalWindow.engine = null;
        }

        const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement | null;
        if (!canvas) {
            throw new Error("The memory leak page does not expose #babylon-canvas.");
        }

        globalWindow.canvas = canvas;
        BABYLON.Tools.ScriptBaseUrl = options.baseUrl;
        BABYLON.SceneLoader.ShowLoadingScreen = false;
        BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental = true;

        const engine = new BABYLON.Engine(canvas, false, {
            useHighPrecisionFloats: true,
        });
        engine.enableOfflineSupport = false;
        engine.renderEvenInBackground = true;
        engine.getCaps().parallelShaderCompile = undefined;
        globalWindow.engine = engine;

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.04, 0.05, 0.08, 1);
        globalWindow.scene = scene;

        const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 8, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(canvas, false);
        scene.activeCamera = camera;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 1.2;

        const createBaseContent = () => {
            const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 8, height: 8 }, scene);
            ground.position.y = -1;
            const material = new BABYLON.StandardMaterial("ground-material", scene);
            material.diffuseColor = new BABYLON.Color3(0.18, 0.19, 0.23);
            ground.material = material;
            return ground;
        };

        createBaseContent();

        if (options.scenario === "core-feature-stack") {
            const speaker = BABYLON.MeshBuilder.CreateSphere("audio-speaker", { diameter: 0.7, segments: 24 }, scene);
            speaker.position = new BABYLON.Vector3(-1.35, 0.25, 0);
            const listenerMarker = BABYLON.MeshBuilder.CreateBox("audio-listener", { size: 0.35 }, scene);
            listenerMarker.position = new BABYLON.Vector3(1.6, 0.15, -0.2);

            const speakerMaterial = new BABYLON.StandardMaterial("audio-speaker-material", scene);
            speakerMaterial.diffuseColor = new BABYLON.Color3(0.92, 0.55, 0.18);
            speaker.material = speakerMaterial;

            const listenerMaterial = new BABYLON.StandardMaterial("audio-listener-material", scene);
            listenerMaterial.emissiveColor = new BABYLON.Color3(0.25, 0.72, 0.94);
            listenerMarker.material = listenerMaterial;

            if (!BABYLON.Engine.audioEngine && BABYLON.AudioEngine) {
                BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
            }

            const audioContext = BABYLON.Engine.audioEngine?.audioContext;
            if (!audioContext) {
                throw new Error("The legacy Babylon audio engine is not available on the memory leak page.");
            }

            const sampleRate = audioContext.sampleRate || 22050;
            const audioBuffer = audioContext.createBuffer(1, Math.floor(sampleRate * 0.24), sampleRate);
            const samples = audioBuffer.getChannelData(0);
            for (let index = 0; index < samples.length; index++) {
                const envelope = Math.min(1, index / 220) * Math.min(1, (samples.length - index) / 220);
                const harmonic = Math.sin((2 * Math.PI * 330 * index) / sampleRate) + Math.sin((2 * Math.PI * 660 * index) / sampleRate) * 0.25;
                samples[index] = harmonic * 0.45 * envelope;
            }

            const sound = new BABYLON.Sound("audio-tone", audioBuffer, scene, null, {
                autoplay: false,
                loop: true,
            });

            sound.setVolume(0.4);
            sound.setPlaybackRate(1.12);

            BABYLON.Engine.audioEngine?.unlock?.();
            BABYLON.Engine.audioEngine?.setGlobalVolume?.(0.65);

            sound.play(0, 0, 0.14);
            speaker.position.x += 1.4;
            scene.render();
            sound.pause();
            sound.play(0, 0.04, 0.08);
            scene.render();
            sound.stop();

            const cannonInjection = (globalThis as typeof globalThis & { CANNON?: any }).CANNON;
            if (!cannonInjection || !BABYLON.CannonJSPlugin || !BABYLON.PhysicsImpostor) {
                throw new Error("The Cannon physics runtime is not available on the memory leak page.");
            }

            const physicsSteps = { count: 0 };
            scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin(true, 10, cannonInjection));
            scene.onBeforePhysicsObservable.add(() => {
                physicsSteps.count += 1;
            });

            const physicsGround = BABYLON.MeshBuilder.CreateGround("physics-ground", { width: 14, height: 14 }, scene);
            physicsGround.position.y = -1;

            const sphere = BABYLON.MeshBuilder.CreateSphere("physics-sphere", { diameter: 1, segments: 24 }, scene);
            sphere.position = new BABYLON.Vector3(-1.4, 2.2, 0);
            sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.55, friction: 0.2 }, scene);

            const box = BABYLON.MeshBuilder.CreateBox("physics-box", { size: 0.95 }, scene);
            box.position = new BABYLON.Vector3(1.1, 1.2, 0.4);
            box.rotation.z = Math.PI / 10;
            box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0.8, restitution: 0.2, friction: 0.55 }, scene);

            sphere.applyImpulse(new BABYLON.Vector3(2.8, 0, 0.3), sphere.getAbsolutePosition());
            box.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(-0.45, 0, -0.18));

            for (let index = 0; index < 18; index++) {
                scene.render();
            }

            const sphereVelocity = sphere.physicsImpostor.getLinearVelocity();
            if (!sphereVelocity || sphere.position.y >= 2.2 || physicsSteps.count === 0) {
                throw new Error("The physics scenario did not advance the Cannon simulation.");
            }

            const flareTextureUrl = `${options.baseUrl}/textures/flare.png`;
            const emitter = BABYLON.MeshBuilder.CreateSphere("particles-emitter", { diameter: 0.35 }, scene);
            emitter.position = new BABYLON.Vector3(0, 0.35, 0);
            emitter.isVisible = false;

            const cpuParticleSystem = new BABYLON.ParticleSystem("particles-cpu", 2500, scene);
            cpuParticleSystem.particleTexture = new BABYLON.Texture(flareTextureUrl, scene);
            cpuParticleSystem.emitter = emitter;
            cpuParticleSystem.minEmitPower = 0.8;
            cpuParticleSystem.maxEmitPower = 2.2;
            cpuParticleSystem.emitRate = 650;
            cpuParticleSystem.minSize = 0.08;
            cpuParticleSystem.maxSize = 0.22;
            cpuParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            cpuParticleSystem.color1 = new BABYLON.Color4(0.48, 0.76, 1, 1);
            cpuParticleSystem.color2 = new BABYLON.Color4(1, 0.42, 0.26, 1);
            cpuParticleSystem.start();

            const spsSource = BABYLON.MeshBuilder.CreateBox("particles-sps-source", { size: 0.15 }, scene);
            const solidParticleSystem = new BABYLON.SolidParticleSystem("particles-sps", scene, { updatable: true });
            solidParticleSystem.addShape(spsSource, 120, {
                positionFunction: (particle: any, particleIndex: number) => {
                    particle.position.x = -3 + (particleIndex % 15) * 0.4;
                    particle.position.y = -0.2 + Math.floor(particleIndex / 15) * 0.18;
                    particle.position.z = Math.sin(particleIndex * 0.35) * 0.65;
                    particle.rotation.x = particleIndex * 0.05;
                    particle.color = new BABYLON.Color4(0.18, 0.62, 0.95, 1);
                },
            });
            const solidParticleMesh = solidParticleSystem.buildMesh();
            spsSource.dispose();
            solidParticleSystem.initParticles();
            solidParticleSystem.setParticles();

            let gpuParticleSystem: any = null;
            if (BABYLON.GPUParticleSystem?.IsSupported) {
                gpuParticleSystem = new BABYLON.GPUParticleSystem("particles-gpu", { capacity: 1800 }, scene);
                gpuParticleSystem.particleTexture = new BABYLON.Texture(flareTextureUrl, scene);
                gpuParticleSystem.emitter = new BABYLON.Vector3(1.75, 0.4, 0);
                gpuParticleSystem.minEmitPower = 0.6;
                gpuParticleSystem.maxEmitPower = 1.8;
                gpuParticleSystem.emitRate = 420;
                gpuParticleSystem.start();
            }

            scene.onBeforeRenderObservable.add(() => {
                emitter.position.x = Math.sin(scene.getEngine().getDeltaTime() * 0.002 + emitter.position.x) * 0.6;
                solidParticleMesh.rotation.y += 0.01;
                solidParticleMesh.rotation.x += 0.003;
                solidParticleSystem.setParticles();
            });

            for (let index = 0; index < 16; index++) {
                scene.render();
            }

            cpuParticleSystem.stop();
            gpuParticleSystem?.stop?.();
            scene.render();

            const recastFactory = (globalThis as Record<string, unknown>)["Recast"];
            const recastInjection = typeof recastFactory === "function" ? await recastFactory() : recastFactory;
            if (!recastInjection || !BABYLON.RecastJSPlugin) {
                throw new Error("The Recast navigation runtime is not available on the memory leak page.");
            }

            const navigationGround = BABYLON.MeshBuilder.CreateGround("navigation-ground", { width: 12, height: 12, subdivisions: 12 }, scene);
            navigationGround.position.y = -1;

            const obstacle = BABYLON.MeshBuilder.CreateBox("navigation-obstacle", { width: 1.3, height: 1.6, depth: 1.8 }, scene);
            obstacle.position = new BABYLON.Vector3(0, -0.2, 0);

            const navigationPlugin = new BABYLON.RecastJSPlugin(recastInjection);
            navigationPlugin.createNavMesh([navigationGround, obstacle], {
                cs: 0.2,
                ch: 0.2,
                walkableSlopeAngle: 45,
                walkableHeight: 2,
                walkableClimb: 0.4,
                walkableRadius: 0.5,
                maxEdgeLen: 12,
                maxSimplificationError: 1.3,
                minRegionArea: 8,
                mergeRegionArea: 20,
                maxVertsPerPoly: 6,
                detailSampleDist: 6,
                detailSampleMaxError: 1,
            });

            const debugNavMesh = navigationPlugin.createDebugNavMesh(scene);
            debugNavMesh.position.y = -0.96;
            const debugMaterial = new BABYLON.StandardMaterial("navigation-debug-material", scene);
            debugMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.3);
            debugMaterial.alpha = 0.35;
            debugNavMesh.material = debugMaterial;

            const agentMesh = BABYLON.MeshBuilder.CreateCapsule("navigation-agent", { height: 1.3, radius: 0.28 }, scene);
            agentMesh.position = new BABYLON.Vector3(-3.2, -0.35, -2.2);
            const navigationStart = navigationPlugin.getClosestPoint(agentMesh.position);
            const navigationTarget = navigationPlugin.getClosestPoint(new BABYLON.Vector3(3.1, -0.35, 2.1));
            const navigationPath = navigationPlugin.computePath(navigationStart, navigationTarget);
            if (!navigationPath.length) {
                throw new Error("The navigation scenario did not produce a navigation path.");
            }

            for (const waypoint of navigationPath.slice(1)) {
                agentMesh.position.copyFrom(navigationPlugin.moveAlong(agentMesh.position, waypoint));
                scene.render();
            }

            for (let index = 0; index < 18; index++) {
                scene.render();
            }

            if (agentMesh.position.x <= -3.1) {
                throw new Error("The navigation scenario did not move along the Recast navigation path.");
            }
        } else if (options.scenario === "core-rendering-materials-shadows-stack") {
            const renderGround = scene.getMeshByName("ground");
            if (!renderGround) {
                throw new Error("The rendering scenario could not reuse the base ground mesh.");
            }

            renderGround.receiveShadows = true;
            const renderGroundMaterial = renderGround.material as any;
            renderGroundMaterial.diffuseColor = new BABYLON.Color3(0.22, 0.24, 0.28);
            renderGroundMaterial.specularColor = BABYLON.Color3.Black();

            const sun = new BABYLON.DirectionalLight("render-sun", new BABYLON.Vector3(-0.55, -1, 0.35), scene);
            sun.position = new BABYLON.Vector3(10, 14, -8);
            sun.intensity = 1.65;

            const fill = new BABYLON.PointLight("render-fill", new BABYLON.Vector3(-3, 4, 3), scene);
            fill.intensity = 0.45;

            const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
            shadowGenerator.usePercentageCloserFiltering = true;
            shadowGenerator.bias = 0.0005;
            shadowGenerator.normalBias = 0.02;

            const heroSphere = BABYLON.MeshBuilder.CreateSphere("render-hero-sphere", { diameter: 1.4, segments: 48 }, scene);
            heroSphere.position = new BABYLON.Vector3(-1.85, 0.2, 0.35);
            const heroMaterial = new BABYLON.PBRMaterial("render-hero-material", scene);
            heroMaterial.albedoColor = new BABYLON.Color3(0.77, 0.44, 0.18);
            heroMaterial.metallic = 0.55;
            heroMaterial.roughness = 0.24;
            heroMaterial.environmentIntensity = 0.7;
            heroSphere.material = heroMaterial;

            const reflectorBox = BABYLON.MeshBuilder.CreateBox("render-reflector-box", { size: 1.2 }, scene);
            reflectorBox.position = new BABYLON.Vector3(0.3, -0.05, -0.4);
            reflectorBox.rotation = new BABYLON.Vector3(Math.PI / 18, Math.PI / 7, Math.PI / 24);
            const reflectorMaterial = new BABYLON.StandardMaterial("render-reflector-material", scene);
            reflectorMaterial.diffuseColor = new BABYLON.Color3(0.18, 0.52, 0.9);
            reflectorMaterial.specularColor = new BABYLON.Color3(0.75, 0.82, 0.95);
            reflectorMaterial.specularPower = 96;
            reflectorBox.material = reflectorMaterial;

            const knot = BABYLON.MeshBuilder.CreateTorusKnot("render-knot", { radius: 0.65, tube: 0.2, radialSegments: 128, tubularSegments: 48 }, scene);
            knot.position = new BABYLON.Vector3(2.05, 0.55, 0.25);
            const knotMaterial = new BABYLON.StandardMaterial("render-knot-material", scene);
            knotMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.82, 0.68);
            knotMaterial.emissiveColor = new BABYLON.Color3(0.03, 0.12, 0.09);
            knotMaterial.specularColor = new BABYLON.Color3(0.35, 0.4, 0.42);
            knot.material = knotMaterial;

            shadowGenerator.addShadowCaster(heroSphere);
            shadowGenerator.addShadowCaster(reflectorBox);
            shadowGenerator.addShadowCaster(knot);

            const reflectionTarget = new BABYLON.RenderTargetTexture("render-reflection-target", { width: 512, height: 512 }, scene, false, true);
            reflectionTarget.renderList = [heroSphere, reflectorBox, knot];
            reflectionTarget.activeCamera = camera;
            reflectionTarget.clearColor = new BABYLON.Color4(0.03, 0.03, 0.05, 1);
            reflectionTarget.refreshRate = 1;
            scene.customRenderTargets.push(reflectionTarget);

            const previewPlane = BABYLON.MeshBuilder.CreatePlane("render-preview-plane", { width: 2.2, height: 1.2 }, scene);
            previewPlane.position = new BABYLON.Vector3(0.1, 1.8, 2.55);
            previewPlane.rotation.x = -Math.PI / 16;
            const previewMaterial = new BABYLON.StandardMaterial("render-preview-material", scene);
            previewMaterial.disableLighting = true;
            previewMaterial.emissiveTexture = reflectionTarget;
            previewMaterial.diffuseColor = BABYLON.Color3.Black();
            previewPlane.material = previewMaterial;

            const defaultPipeline = new BABYLON.DefaultRenderingPipeline("render-pipeline", false, scene, [camera]);
            defaultPipeline.samples = 2;
            defaultPipeline.imageProcessingEnabled = true;
            defaultPipeline.fxaaEnabled = true;
            defaultPipeline.bloomEnabled = true;
            defaultPipeline.bloomWeight = 0.18;

            const shadowMap = shadowGenerator.getShadowMap();
            if (!shadowMap || shadowMap.renderList?.length !== 3) {
                throw new Error("The rendering scenario did not register the expected shadow casters.");
            }

            if (reflectionTarget.renderList?.length !== 3) {
                throw new Error("The rendering scenario did not register the expected render target meshes.");
            }

            for (let index = 0; index < 14; index++) {
                heroSphere.rotation.y += 0.08;
                reflectorBox.rotation.y -= 0.05;
                knot.rotation.x += 0.04;
                knot.rotation.y += 0.06;
                sun.direction.x = -0.55 + index * 0.01;
                heroMaterial.metallic = 0.45 + index * 0.01;
                heroMaterial.roughness = 0.3 - index * 0.005;
                scene.render();
            }

            if (previewPlane.material !== previewMaterial || !renderGround.receiveShadows) {
                throw new Error("The rendering scenario did not keep the core material and shadow wiring active.");
            }
        } else if (options.scenario === "core-textures-render-targets-postprocess-stack") {
            const textureGround = scene.getMeshByName("ground");
            if (!textureGround) {
                throw new Error("The textures scenario could not reuse the base ground mesh.");
            }

            const dynamicTexture = new BABYLON.DynamicTexture("textures-dynamic", { width: 256, height: 256 }, scene, false);
            const dynamicContext = dynamicTexture.getContext();
            dynamicContext.fillStyle = "#0e1626";
            dynamicContext.fillRect(0, 0, 256, 256);
            dynamicContext.fillStyle = "#3fd0ff";
            dynamicContext.fillRect(18, 18, 220, 56);
            dynamicContext.fillStyle = "#ffffff";
            dynamicContext.font = "bold 42px sans-serif";
            dynamicContext.fillText("MEM", 28, 62);
            dynamicContext.strokeStyle = "#ff9f43";
            dynamicContext.lineWidth = 10;
            dynamicContext.strokeRect(24, 96, 208, 132);
            dynamicTexture.update(false);

            const rawTextureData = new Uint8Array(64 * 64 * 4);
            for (let index = 0; index < rawTextureData.length; index += 4) {
                const pixelIndex = index / 4;
                const x = pixelIndex % 64;
                const y = Math.floor(pixelIndex / 64);
                const stripe = (x + y) % 2 === 0;
                rawTextureData[index] = stripe ? 250 : 40;
                rawTextureData[index + 1] = stripe ? 110 : 180;
                rawTextureData[index + 2] = stripe ? 70 : 255;
                rawTextureData[index + 3] = 255;
            }
            const rawTexture = BABYLON.RawTexture.CreateRGBATexture(rawTextureData, 64, 64, scene, false, false, BABYLON.Constants.TEXTURE_NEAREST_NEAREST);

            const texturedBox = BABYLON.MeshBuilder.CreateBox("textures-box", { size: 1.25 }, scene);
            texturedBox.position = new BABYLON.Vector3(-1.5, 0.05, 0.1);
            const boxMaterial = new BABYLON.StandardMaterial("textures-box-material", scene);
            boxMaterial.diffuseTexture = rawTexture;
            boxMaterial.emissiveTexture = dynamicTexture;
            boxMaterial.specularColor = new BABYLON.Color3(0.18, 0.18, 0.18);
            texturedBox.material = boxMaterial;

            const texturedSphere = BABYLON.MeshBuilder.CreateSphere("textures-sphere", { diameter: 1.3, segments: 32 }, scene);
            texturedSphere.position = new BABYLON.Vector3(1.5, 0.2, -0.2);
            const sphereMaterial = new BABYLON.PBRMaterial("textures-sphere-material", scene);
            sphereMaterial.albedoTexture = dynamicTexture;
            sphereMaterial.metallic = 0.05;
            sphereMaterial.roughness = 0.42;
            sphereMaterial.emissiveTexture = rawTexture;
            texturedSphere.material = sphereMaterial;

            const renderTargetTexture = new BABYLON.RenderTargetTexture("textures-rtt", { width: 512, height: 512 }, scene, false, true);
            renderTargetTexture.activeCamera = camera;
            renderTargetTexture.clearColor = new BABYLON.Color4(0.02, 0.03, 0.05, 1);
            renderTargetTexture.renderList = [texturedBox, texturedSphere];
            renderTargetTexture.refreshRate = 1;
            scene.customRenderTargets.push(renderTargetTexture);

            const previewPlane = BABYLON.MeshBuilder.CreatePlane("textures-preview", { width: 2.8, height: 1.6 }, scene);
            previewPlane.position = new BABYLON.Vector3(0, 1.85, 2.3);
            const previewMaterial = new BABYLON.StandardMaterial("textures-preview-material", scene);
            previewMaterial.disableLighting = true;
            previewMaterial.emissiveTexture = renderTargetTexture;
            previewMaterial.diffuseColor = BABYLON.Color3.Black();
            previewPlane.material = previewMaterial;

            const groundMaterial = textureGround.material as any;
            groundMaterial.diffuseTexture = dynamicTexture;
            groundMaterial.specularColor = BABYLON.Color3.Black();

            const passPostProcess = new BABYLON.PassPostProcess("textures-pass", 1.0, camera);
            const blackAndWhitePostProcess = new BABYLON.BlackAndWhitePostProcess("textures-bw", 1.0, camera);
            const blurPostProcess = new BABYLON.BlurPostProcess("textures-blur", new BABYLON.Vector2(1, 0), 6, 1.0, camera);
            blurPostProcess.autoClear = false;
            blurPostProcess.kernel = 12;
            blackAndWhitePostProcess.degree = 0.35;

            if (renderTargetTexture.renderList?.length !== 2) {
                throw new Error("The textures scenario did not register the expected render target meshes.");
            }

            for (let index = 0; index < 12; index++) {
                texturedBox.rotation.y += 0.09;
                texturedSphere.rotation.x += 0.05;
                texturedSphere.rotation.y -= 0.04;
                blackAndWhitePostProcess.degree = 0.2 + index * 0.03;
                dynamicContext.fillStyle = index % 2 === 0 ? "#ff9f43" : "#3fd0ff";
                dynamicContext.fillRect(36 + index * 4, 110, 24, 96);
                dynamicTexture.update(false);
                scene.render();
            }

            if (!passPostProcess.isReusable() && !previewMaterial.emissiveTexture) {
                throw new Error("The textures scenario did not keep its post-process and render target wiring active.");
            }

            blurPostProcess.dispose(camera);
            blackAndWhitePostProcess.dispose(camera);
            passPostProcess.dispose(camera);
        } else if (options.scenario === "gui-fullscreen-ui") {
            const sphere = BABYLON.MeshBuilder.CreateSphere("gui-sphere", { diameter: 1.4, segments: 32 }, scene);
            sphere.position.y = 0.2;

            const adt = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("memlab-ui", true, scene);
            const panel = new BABYLON.GUI.StackPanel("panel");
            panel.width = "280px";
            panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
            panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
            adt.addControl(panel);

            const header = new BABYLON.GUI.TextBlock("header", "Memory Leak GUI Scenario");
            header.height = "40px";
            header.color = "white";
            header.fontSize = 22;
            panel.addControl(header);

            const slider = new BABYLON.GUI.Slider("slider");
            slider.minimum = 0;
            slider.maximum = 1;
            slider.value = 0.35;
            slider.height = "20px";
            slider.width = "220px";
            slider.onValueChangedObservable.add((value: number) => {
                sphere.scaling.setAll(1 + value * 0.5);
            });
            panel.addControl(slider);

            const button = BABYLON.GUI.Button.CreateSimpleButton("button", "Toggle Color");
            button.width = "220px";
            button.height = "44px";
            button.color = "white";
            button.background = "#5067ff";
            button.onPointerClickObservable.add(() => {
                sphere.material ??= new BABYLON.StandardMaterial("gui-sphere-material", scene);
                sphere.material.diffuseColor = sphere.material.diffuseColor?.equals?.(BABYLON.Color3.Red()) ? BABYLON.Color3.Blue() : BABYLON.Color3.Red();
            });
            panel.addControl(button);

            slider.value = 0.75;
            button.onPointerClickObservable.notifyObservers(button);
            scene.render();
        } else if (options.scenario === "gui-mesh-adt") {
            const panelMesh = BABYLON.MeshBuilder.CreatePlane("gui-panel-mesh", { width: 2.4, height: 1.2 }, scene);
            panelMesh.position = new BABYLON.Vector3(0, 0.75, 0);

            const badgeMesh = BABYLON.MeshBuilder.CreatePlane("gui-badge-mesh", { width: 1.1, height: 1.1 }, scene);
            badgeMesh.position = new BABYLON.Vector3(-1.9, 0.55, 0.35);

            const panelTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(panelMesh, 1024, 512);
            const badgeTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(badgeMesh, 512, 512);

            const rectangle = new BABYLON.GUI.Rectangle("mesh-rectangle");
            rectangle.thickness = 3;
            rectangle.cornerRadius = 30;
            rectangle.color = "#d8e3ff";
            rectangle.background = "#1d2840";
            panelTexture.addControl(rectangle);

            const stack = new BABYLON.GUI.StackPanel("mesh-stack");
            stack.spacing = 16;
            stack.width = "80%";
            rectangle.addControl(stack);

            const title = new BABYLON.GUI.TextBlock("mesh-title", "Projected GUI");
            title.height = "70px";
            title.fontSize = 34;
            title.color = "white";
            stack.addControl(title);

            const toggle = BABYLON.GUI.Button.CreateSimpleButton("mesh-button", "Emphasize");
            toggle.width = "260px";
            toggle.height = "56px";
            toggle.color = "white";
            toggle.background = "#3ea66b";
            toggle.onPointerClickObservable.add(() => {
                rectangle.background = rectangle.background === "#1d2840" ? "#3c1f4f" : "#1d2840";
                panelMesh.scaling.x = panelMesh.scaling.x === 1 ? 1.08 : 1;
            });
            stack.addControl(toggle);

            const badge = new BABYLON.GUI.Ellipse("mesh-badge");
            badge.thickness = 10;
            badge.color = "#f6f3ff";
            badge.background = "#5067ff";
            badgeTexture.addControl(badge);

            const badgeText = new BABYLON.GUI.TextBlock("mesh-badge-text", "GUI");
            badgeText.color = "white";
            badgeText.fontSize = 130;
            badge.addControl(badgeText);

            toggle.onPointerClickObservable.notifyObservers(toggle);
            scene.render();
        } else if (options.scenario === "loaders-boombox-import") {
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", `${options.assetsUrl}/meshes/`, "boombox.glb", scene);
            if (!result.meshes.length) {
                throw new Error("The loaders scenario did not load any meshes.");
            }
            result.meshes.forEach((mesh: any, index: number) => {
                if (mesh.position && typeof mesh.position.y === "number") {
                    mesh.position.y += index === 0 ? 0.5 : 0;
                }
            });
            result.animationGroups?.forEach?.((animationGroup: any) => animationGroup.start?.(true));
            scene.render();
            result.animationGroups?.forEach?.((animationGroup: any) => {
                animationGroup.stop?.();
                animationGroup.reset?.();
            });
        } else if (options.scenario === "loaders-obj-direct-load") {
            const objData = [
                "o quad",
                "v -1 -1 0",
                "v 1 -1 0",
                "v 1 1 0",
                "v -1 1 0",
                "vt 0 0",
                "vt 1 0",
                "vt 1 1",
                "vt 0 1",
                "vn 0 0 1",
                "f 1/1/1 2/2/1 3/3/1",
                "f 1/1/1 3/3/1 4/4/1",
            ].join("\n");
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", `data:model/obj;base64,${btoa(objData)}`, scene, undefined, ".obj");
            if (result.meshes.length !== 1 || result.meshes[0].getTotalVertices() !== 4) {
                throw new Error("The loaders OBJ scenario did not produce the expected mesh topology.");
            }
            result.meshes[0].rotation.y = Math.PI / 6;
            scene.render();
        } else if (options.scenario === "loaders-stl-direct-load") {
            const stlData = ["solid triangle", "facet normal 0 0 1", "outer loop", "vertex 0 0 0", "vertex 1 0 0", "vertex 0 1 0", "endloop", "endfacet", "endsolid triangle"].join(
                "\n"
            );
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", `data:;base64,${btoa(stlData)}`, scene, undefined, ".stl");
            if (result.meshes.length !== 1 || result.meshes[0].getTotalVertices() !== 3) {
                throw new Error("The loaders STL scenario did not produce the expected mesh topology.");
            }
            result.meshes[0].position.x = 0.5;
            scene.render();
        } else if (options.scenario === "materials-library-stack") {
            const sun = new BABYLON.DirectionalLight("materials-sun", new BABYLON.Vector3(-0.45, -1, 0.25), scene);
            sun.position = new BABYLON.Vector3(14, 18, -10);
            sun.intensity = 1.3;

            const skyDome = BABYLON.MeshBuilder.CreateSphere("materials-sky-dome", { diameter: 60, segments: 32, sideOrientation: BABYLON.Mesh.BACKSIDE }, scene);
            const skyMaterial = new BABYLON.SkyMaterial("materials-sky-material", scene);
            skyMaterial.backFaceCulling = false;
            skyMaterial.azimuth = 0.22;
            skyMaterial.inclination = 0.36;
            skyMaterial.luminance = 0.65;
            skyMaterial.turbidity = 8;
            skyDome.material = skyMaterial;

            const materialsGround = BABYLON.MeshBuilder.CreateGround("materials-ground", { width: 14, height: 14, subdivisions: 6 }, scene);
            materialsGround.position.y = -1;
            const gridMaterial = new BABYLON.GridMaterial("materials-grid", scene);
            gridMaterial.majorUnitFrequency = 5;
            gridMaterial.minorUnitVisibility = 0.35;
            gridMaterial.gridRatio = 0.8;
            gridMaterial.mainColor = new BABYLON.Color3(0.13, 0.14, 0.18);
            gridMaterial.lineColor = new BABYLON.Color3(0.48, 0.76, 0.94);
            gridMaterial.opacity = 0.96;
            materialsGround.material = gridMaterial;
            materialsGround.receiveShadows = true;

            const knot = BABYLON.MeshBuilder.CreateTorusKnot("materials-knot", { radius: 0.8, tube: 0.22, radialSegments: 160, tubularSegments: 48 }, scene);
            knot.position = new BABYLON.Vector3(-1.4, 0.6, 0.1);
            const normalMaterial = new BABYLON.NormalMaterial("materials-normal", scene);
            knot.material = normalMaterial;

            const capsule = BABYLON.MeshBuilder.CreateCapsule("materials-capsule", { height: 2.4, radius: 0.48, tessellation: 24 }, scene);
            capsule.position = new BABYLON.Vector3(1.65, 0.35, -0.25);
            capsule.rotation.z = Math.PI / 7;
            const cellMaterial = new BABYLON.CellMaterial("materials-cell", scene);
            cellMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.52, 0.18);
            capsule.material = cellMaterial;

            const shadowGenerator = new BABYLON.ShadowGenerator(1024, sun);
            shadowGenerator.useBlurExponentialShadowMap = true;
            shadowGenerator.blurKernel = 16;
            shadowGenerator.addShadowCaster(knot);
            shadowGenerator.addShadowCaster(capsule);

            skyMaterial.azimuth += 0.08;
            knot.rotation.y = Math.PI / 4;
            capsule.rotation.x = Math.PI / 12;
            scene.render();
        } else if (options.scenario === "postprocesses-digital-rain-stack") {
            const meshes: any[] = [];
            for (let x = -2; x <= 2; x++) {
                for (let z = -2; z <= 2; z++) {
                    const box = BABYLON.MeshBuilder.CreateBox(`post-box-${x}-${z}`, { size: 0.8 }, scene);
                    box.position = new BABYLON.Vector3(x * 1.15, 0.2, z * 1.15);
                    const boxMaterial = new BABYLON.StandardMaterial(`post-box-material-${x}-${z}`, scene);
                    boxMaterial.diffuseColor = new BABYLON.Color3(0.16 + (x + 2) * 0.1, 0.22 + (z + 2) * 0.08, 0.65);
                    boxMaterial.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
                    box.material = boxMaterial;
                    meshes.push(box);
                }
            }

            const edgePostProcess = new BABYLON.EdgeDetectionPostProcess("post-edge", scene, 1.0, camera);
            edgePostProcess.edgeIntensity = 0.35;
            edgePostProcess.edgeWidth = 0.55;
            edgePostProcess.edgeColor = new BABYLON.Color3(0.4, 1, 0.78);

            const digitalRainPostProcess = new BABYLON.DigitalRainPostProcess("post-digital-rain", camera, {
                font: "18px Monospace",
                mixToNormal: 0.2,
                mixToTile: 0.15,
            });
            digitalRainPostProcess.speed = 0.006;

            meshes.forEach((mesh, index) => {
                mesh.rotation.y = index * 0.08;
            });
            camera.alpha += 0.18;
            scene.render();
        } else if (options.scenario === "procedural-textures-stack") {
            const woodTexture = new BABYLON.WoodProceduralTexture("procedural-wood", 256, scene);
            woodTexture.ampScale = 65;
            woodTexture.woodColor = new BABYLON.Color3(0.45, 0.27, 0.16);

            const cloudTexture = new BABYLON.CloudProceduralTexture("procedural-cloud", 256, scene);
            cloudTexture.amplitude = 0.82;
            cloudTexture.numOctaves = 6;
            cloudTexture.skyColor = new BABYLON.Color4(0.1, 0.26, 0.48, 1);
            cloudTexture.cloudColor = new BABYLON.Color4(0.9, 0.95, 1, 1);

            const fireTexture = new BABYLON.FireProceduralTexture("procedural-fire", 256, scene);
            fireTexture.fireColors = BABYLON.FireProceduralTexture.PurpleFireColors;
            fireTexture.speed = new BABYLON.Vector2(0.38, 0.22);
            fireTexture.time = 0.6;

            const crate = BABYLON.MeshBuilder.CreateBox("procedural-crate", { size: 1.45 }, scene);
            crate.position = new BABYLON.Vector3(-1.8, 0, 0);
            const crateMaterial = new BABYLON.StandardMaterial("procedural-crate-material", scene);
            crateMaterial.diffuseTexture = woodTexture;
            crate.material = crateMaterial;

            const billboard = BABYLON.MeshBuilder.CreatePlane("procedural-billboard", { width: 3.2, height: 2 }, scene);
            billboard.position = new BABYLON.Vector3(0.25, 1.5, 2.2);
            const billboardMaterial = new BABYLON.StandardMaterial("procedural-billboard-material", scene);
            billboardMaterial.emissiveTexture = cloudTexture;
            billboardMaterial.disableLighting = true;
            billboard.material = billboardMaterial;

            const orb = BABYLON.MeshBuilder.CreateSphere("procedural-orb", { diameter: 1.35, segments: 32 }, scene);
            orb.position = new BABYLON.Vector3(1.8, 0.2, -0.15);
            const orbMaterial = new BABYLON.StandardMaterial("procedural-orb-material", scene);
            orbMaterial.emissiveTexture = fireTexture;
            orbMaterial.disableLighting = true;
            orb.material = orbMaterial;

            for (let index = 0; index < 4; index++) {
                fireTexture.time += 0.3;
                scene.render();
            }
        } else if (options.scenario === "serializers-gltf-export") {
            const box = BABYLON.MeshBuilder.CreateBox("serializers-box", { size: 1.2 }, scene);
            box.position.x = -1.1;
            const sphere = BABYLON.MeshBuilder.CreateSphere("serializers-sphere", { diameter: 1.1 }, scene);
            sphere.position.x = 1.1;

            const material = new BABYLON.PBRMaterial("serializers-material", scene);
            material.metallic = 0.2;
            material.roughness = 0.35;
            material.albedoColor = new BABYLON.Color3(0.9, 0.6, 0.2);
            box.material = material;
            sphere.material = material;

            const exportData = await BABYLON.GLTF2Export.GLTFAsync(scene, "memlab-scene");
            const exportedFiles = Object.keys(exportData.files ?? exportData.glTFFiles ?? {});
            if (exportedFiles.length === 0) {
                throw new Error("The serializers scenario did not produce any exported files.");
            }
            if (!exportedFiles.some((fileName) => fileName.endsWith(".gltf"))) {
                throw new Error("The serializers scenario did not produce a glTF file.");
            }
        } else {
            const torus = BABYLON.MeshBuilder.CreateTorus("serializers-torus", { diameter: 1.5, thickness: 0.35, tessellation: 48 }, scene);
            torus.rotation.x = Math.PI / 3;
            const knot = BABYLON.MeshBuilder.CreateTorusKnot("serializers-knot", { radius: 0.55, tube: 0.18, radialSegments: 96, tubularSegments: 48 }, scene);
            knot.position.set(1.4, 0.2, 0);

            const material = new BABYLON.StandardMaterial("serializers-glb-material", scene);
            material.diffuseColor = new BABYLON.Color3(0.18, 0.66, 0.86);
            torus.material = material;
            knot.material = material;

            const exportData = await BABYLON.GLTF2Export.GLBAsync(scene, "memlab-scene");
            const exportedFiles = Object.keys(exportData.files ?? exportData.glTFFiles ?? {});
            if (exportedFiles.length === 0) {
                throw new Error("The serializers GLB scenario did not produce any exported files.");
            }
            if (!exportedFiles.some((fileName) => fileName.endsWith(".glb"))) {
                throw new Error("The serializers GLB scenario did not produce a GLB file.");
            }
        }

        await scene.whenReadyAsync();

        const renderCount = options.renderCount ?? 8;
        for (let index = 0; index < renderCount; index++) {
            scene.render();
        }

        await waitForSettleAsync(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Disposes the active Babylon scene and engine from the memlab page.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Disposal timing options.
 */
export async function EvaluateDisposePlaygroundScene(options: Pick<IPlaygroundSceneBrowserOptions, "settleAfterDisposeMs"> = {}): Promise<void> {
    const globalWindow = window as typeof window & {
        BABYLON?: any;
        engine?: any;
        scene?: any;
        canvas?: HTMLCanvasElement;
    };
    const globalWindowRecord = globalWindow as typeof globalWindow & Record<string, unknown>;
    const harnessStateKey = "__babylonLeakHarnessState";
    const originalMathRandomKey = "__babylonOriginalMathRandom";
    const waitForAnimationFramesAsync = async (count = 2) =>
        await new Promise<void>((resolve) => {
            const advanceFrame = (remainingFrameCount: number) => {
                if (remainingFrameCount <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(() => {
                    advanceFrame(remainingFrameCount - 1);
                });
            };

            advanceFrame(count);
        });
    const waitForSettleAsync = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFramesAsync(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };
    const forceGarbageCollection = () => {
        if ((window as any).gc) {
            for (let index = 0; index < 3; index++) {
                (window as any).gc();
            }
        }
    };

    globalWindowRecord[harnessStateKey] = { busy: true, status: "disposing" };

    try {
        if (globalWindow.scene?.debugLayer?.isVisible()) {
            await globalWindow.scene.debugLayer.hide();
        }

        globalWindow.scene?.activeCamera?.detachControl?.();
        globalWindow.scene?.activeCameras?.forEach?.((camera: any) => camera.detachControl?.());
        globalWindow.scene?.stopAllAnimations?.();
        globalWindow.scene?.animationGroups?.forEach?.((animationGroup: any) => animationGroup.stop?.());

        globalWindow.scene?.dispose?.();
        globalWindow.scene = null;

        globalWindow.engine?.stopRenderLoop?.();
        globalWindow.engine?.dispose?.();
        globalWindow.engine = null;
        (globalWindow as any).canvas = undefined;

        const lastCreatedAudioEngine = globalWindow.BABYLON?.LastCreatedAudioEngine?.();
        lastCreatedAudioEngine?.dispose?.();

        const legacyAudioEngine = globalWindow.BABYLON?.Engine?.audioEngine;
        if (legacyAudioEngine && legacyAudioEngine !== lastCreatedAudioEngine) {
            legacyAudioEngine.dispose?.();
        }
        if (globalWindow.BABYLON?.Engine) {
            globalWindow.BABYLON.Engine.audioEngine = null;
        }

        const floatingOriginCurrentScene = globalWindow.BABYLON?.FloatingOriginCurrentScene;
        if (floatingOriginCurrentScene) {
            floatingOriginCurrentScene.getScene = () => undefined;
            floatingOriginCurrentScene.eyeAtCamera = true;
        }

        const originalMathRandom = globalWindowRecord[originalMathRandomKey] as (() => number) | undefined;
        if (originalMathRandom) {
            globalWindow.Math.random = originalMathRandom;
        }
        delete (globalWindow as any).seed;

        await waitForSettleAsync(options?.settleAfterDisposeMs ?? 150, 3);
        forceGarbageCollection();
        await waitForSettleAsync(50, 2);

        if (globalWindow.scene || globalWindow.engine) {
            throw new Error("The memory leak harness still holds engine or scene references after disposal.");
        }

        globalWindowRecord[harnessStateKey] = { busy: false, status: "disposed" };
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        globalWindowRecord[harnessStateKey] = { busy: false, status: "error", lastError: message };
        throw error;
    }
}

/**
 * Mounts a Babylon viewer custom element for memlab analysis.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Viewer mount options.
 */
export async function EvaluateMountViewerScenario(options: IViewerSceneBrowserOptions): Promise<void> {
    const globalWindow = window as typeof window & Record<string, unknown>;
    const harnessStateKey = "__babylonLeakHarnessState";

    const setHarnessState = (status: string, busy: boolean, lastError?: string) => {
        globalWindow[harnessStateKey] = {
            busy,
            status,
            lastError,
            mountedElementSelector: "babylon-viewer",
        };
    };
    const waitForAnimationFramesAsync = async (count = 2) =>
        await new Promise<void>((resolve) => {
            const advanceFrame = (remainingFrameCount: number) => {
                if (remainingFrameCount <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(() => {
                    advanceFrame(remainingFrameCount - 1);
                });
            };

            advanceFrame(count);
        });
    const waitForSettleAsync = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFramesAsync(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };

    setHarnessState("mounting", true);

    try {
        const existingContainer = document.getElementById("__babylonMemlabViewerRoot");
        existingContainer?.remove();

        const container = document.createElement("div");
        container.id = "__babylonMemlabViewerRoot";
        container.innerHTML = options.viewerHtml;
        document.body.appendChild(container);

        const waitForConditionAsync = async (predicate: () => boolean, timeoutMs: number, errorMessage: string, startTime = Date.now()) => {
            if (predicate()) {
                return;
            }

            if (Date.now() - startTime >= timeoutMs) {
                throw new Error(errorMessage);
            }

            await new Promise((resolve) => setTimeout(resolve, 50));
            await waitForConditionAsync(predicate, timeoutMs, errorMessage, startTime);
        };

        await waitForConditionAsync(() => !!document.querySelector("babylon-viewer"), 30000, "The viewer element was not attached to the page.");

        const viewerElement = document.querySelector("babylon-viewer") as any;

        await waitForConditionAsync(
            () => !!viewerElement.viewerDetails && viewerElement.viewerDetails.viewer.loadingProgress === false,
            60000,
            "The viewer did not finish loading."
        );

        const minFrameCount = options.minFrameCount ?? 20;
        await waitForConditionAsync(
            () => {
                const details = viewerElement.viewerDetails;
                const engine = details?.scene?.getEngine?.();
                return !!engine && engine.frameId >= minFrameCount;
            },
            30000,
            `The viewer did not render ${minFrameCount} frames.`
        );

        await waitForSettleAsync(options.settleAfterReadyMs ?? 150, 2);

        setHarnessState("ready", false);
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        setHarnessState("error", false, message);
        throw error;
    }
}

/**
 * Unmounts the Babylon viewer custom element after a memlab action.
 * This function is evaluated in the browser context by Puppeteer.
 * @param options Disposal timing options.
 */
export async function EvaluateUnmountViewerScenario(options: Pick<IViewerSceneBrowserOptions, "settleAfterDisposeMs"> = {}): Promise<void> {
    const globalWindow = window as typeof window & Record<string, unknown>;
    const harnessStateKey = "__babylonLeakHarnessState";
    const waitForAnimationFramesAsync = async (count = 2) =>
        await new Promise<void>((resolve) => {
            const advanceFrame = (remainingFrameCount: number) => {
                if (remainingFrameCount <= 0) {
                    resolve();
                    return;
                }

                requestAnimationFrame(() => {
                    advanceFrame(remainingFrameCount - 1);
                });
            };

            advanceFrame(count);
        });
    const waitForSettleAsync = async (delayMs = 0, frameCount = 2) => {
        await waitForAnimationFramesAsync(frameCount);
        await Promise.resolve();

        if (delayMs > 0) {
            await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
            await Promise.resolve();
        }
    };
    const forceGarbageCollection = () => {
        if ((window as any).gc) {
            for (let index = 0; index < 3; index++) {
                (window as any).gc();
            }
        }
    };

    globalWindow[harnessStateKey] = { busy: true, status: "disposing" };

    try {
        (document.querySelector("babylon-viewer") as HTMLElement | null)?.remove();
        document.getElementById("__babylonMemlabViewerRoot")?.remove();

        await waitForSettleAsync(options?.settleAfterDisposeMs ?? 150, 2);
        forceGarbageCollection();
        await waitForSettleAsync(50, 2);

        if (document.querySelector("babylon-viewer") || document.getElementById("__babylonMemlabViewerRoot")) {
            throw new Error("The viewer test app still has mounted elements after unmount.");
        }

        globalWindow[harnessStateKey] = { busy: false, status: "disposed" };
    } catch (error) {
        const message = error instanceof Error ? error.message : `${error}`;
        globalWindow[harnessStateKey] = { busy: false, status: "error", lastError: message };
        throw error;
    }
}
