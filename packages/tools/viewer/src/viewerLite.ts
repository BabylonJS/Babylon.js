/* eslint-disable @typescript-eslint/naming-convention */
import { type IColor4Like, type Nullable } from "core/index";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";

import {
    addToScene,
    attachControl,
    createArcRotateCamera,
    createDirectionalLight,
    createEngine,
    createSceneContext,
    createShadowGenerator,
    disposeEngine,
    disposeScene,
    getVariantNames,
    goToFrame,
    loadEnvironment as liteLoadEnvironment,
    pauseAnimation as litePauseAnimation,
    playAnimation as litePlayAnimation,
    loadGltf,
    loadHdrEnvironment,
    onBeforeRender,
    registerScene,
    resetVariant,
    selectVariant,
    startEngine,
    stopEngine,
    unregisterScene,
    type ArcRotateCamera,
    type AssetContainer,
    type DirectionalLight,
    type EngineContext,
    type EnvironmentTextures,
    type AnimationGroup as LiteAnimationGroup,
    type ShadowGenerator as LiteShadowGenerator,
    type Mesh,
    type SceneContext,
} from "@babylonjs/lite";

import {
    type CameraAutoOrbit,
    type EnvironmentOptions,
    type EnvironmentParams,
    type HotSpot,
    type IViewer,
    type LoadEnvironmentOptions,
    type PostProcessing,
    type ResetFlag,
    type ShadowParams,
    type ShadowQuality,
    type ToneMapping,
    type ViewerBaseOptions,
    type ViewerHotSpotResult,
    type ViewerLoadModelOptions,
} from "./viewerInterface";

// ── Defaults ──

const DefaultCameraAutoOrbit: CameraAutoOrbit = { enabled: false, speed: 0.5, delay: 4000 };

const DefaultEnvironmentConfig: EnvironmentParams = { intensity: 1, blur: 0.3, rotation: 0 };

const DefaultPostProcessing: PostProcessing = { toneMapping: "standard", contrast: 1, exposure: 1, ssao: "disabled" };

const DefaultShadowConfig: ShadowParams = { quality: "none" };

const DefaultCameraAlpha = -Math.PI / 2;
const DefaultCameraBeta = Math.PI / 2.5;
const DefaultCameraRadius = 3;

// ── Helpers ──

function throwIfAborted(...signals: (AbortSignal | undefined)[]): void {
    for (const signal of signals) {
        signal?.throwIfAborted();
    }
}

function observePromise(promise: Promise<unknown>): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
        try {
            await promise;
        } catch (e) {
            if (!(e instanceof AbortError)) {
                Logger.Error(`Viewer: ${e}`);
            }
        }
    })();
}

function getExtension(url: string, explicitExt?: string): string {
    if (explicitExt) {
        return explicitExt.startsWith(".") ? explicitExt : `.${explicitExt}`;
    }
    const dotIdx = url.lastIndexOf(".");
    return dotIdx >= 0 ? url.substring(dotIdx).toLowerCase() : "";
}

function toneMappingToLiteType(mode: ToneMapping): "standard" | "aces" | undefined {
    switch (mode) {
        case "standard":
            return "standard";
        case "aces":
            return "aces";
        case "neutral":
            Logger.Warn("Viewer: Tone mapping 'neutral' is not supported by Babylon Lite. Falling back to 'aces'.");
            return "aces";
        case "none":
            return undefined;
    }
}

// ── Viewer ──

/**
 * A lightweight implementation of the {@link IViewer} interface built on the Babylon Lite API.
 *
 * @remarks
 * Babylon Lite is a WebGPU-only engine that provides a subset of the full Babylon.js feature set.
 * Features that are not available in Lite (SSAO, "high" shadow quality, hot spots, File/ArrayBufferView model sources)
 * will log warnings and fall back gracefully.
 */
export class Viewer implements IViewer {
    // ── Observables ──

    public readonly onEnvironmentChanged = new Observable<void>();
    public readonly onEnvironmentConfigurationChanged = new Observable<void>();
    public readonly onEnvironmentError = new Observable<unknown>();
    public readonly onShadowsConfigurationChanged = new Observable<void>();
    public readonly onPostProcessingChanged = new Observable<void>();
    public readonly onModelChanged = new Observable<Nullable<string | File | ArrayBufferView>>();
    public readonly onModelError = new Observable<unknown>();
    public readonly onLoadingProgressChanged = new Observable<void>();
    public readonly onCameraAutoOrbitChanged = new Observable<void>();
    public readonly onSelectedAnimationChanged = new Observable<void>();
    public readonly onAnimationSpeedChanged = new Observable<void>();
    public readonly onIsAnimationPlayingChanged = new Observable<void>();
    public readonly onAnimationProgressChanged = new Observable<void>();
    public readonly onSelectedMaterialVariantChanged = new Observable<void>();
    public readonly onHotSpotsChanged = new Observable<void>();
    public readonly onCamerasAsHotSpotsChanged = new Observable<void>();
    public readonly onAfterRenderObservable = new Observable<void>();
    public readonly onClearColorChanged = new Observable<void>();

    // ── Private State ──

    private readonly _scene: SceneContext;
    private readonly _camera: ArcRotateCamera;
    private _detachControl: (() => void) | null = null;
    private _renderLoopRunning = false;

    // Auto-orbit
    private _autoOrbit: CameraAutoOrbit = { ...DefaultCameraAutoOrbit };
    private _autoOrbitIdleTime = 0;
    private _lastPointerTime = 0;

    // Environment
    private _envConfig: EnvironmentParams = { ...DefaultEnvironmentConfig };
    /** Retained reference to the loaded environment GPU textures (used when swapping environments). */
    private _envTextures: EnvironmentTextures | null = null;

    // Post processing
    private _postProcessing: PostProcessing = { ...DefaultPostProcessing };

    // Shadows
    private _shadowConfig: ShadowParams = { ...DefaultShadowConfig };
    private _shadowGenerator: LiteShadowGenerator | null = null;
    /** Retained reference to the shadow directional light for cleanup when shadows are reconfigured. */
    private _shadowLight: DirectionalLight | null = null;

    // Model
    private _container: AssetContainer | null = null;
    /** The source that was passed to the most recent {@link loadModel} call, for notifications. */
    private _modelSource: Nullable<string | File | ArrayBufferView> = null;
    private _loadingProgress: boolean | number = false;
    private _loadModelAbortController: AbortController | null = null;

    // Animation
    private _selectedAnimation = -1;
    private _animationSpeed = 1;
    private _wasPlaying = false;
    private _lastProgress = -1;

    // Material variants
    private _selectedMaterialVariant: Nullable<string> = null;

    // Hot spots
    private _hotSpots: Record<string, HotSpot> = {};
    private _camerasAsHotSpots = false;

    // Lifecycle
    private _isDisposed = false;
    private _defaultAlpha: number;
    private _defaultBeta: number;
    private _defaultRadius: number;
    private _defaultTarget = { x: 0, y: 0, z: 0 };

    /**
     * Creates a new Viewer instance.
     * @param _engine The Babylon Lite engine context.
     * @param _options Optional viewer configuration.
     */
    constructor(
        private readonly _engine: EngineContext,
        private readonly _options?: ViewerBaseOptions
    ) {
        // Create scene internally (matching how full Viewer owns its scene)
        this._scene = createSceneContext(_engine);
        // Camera — NaN means "auto" (will be recomputed when model loads)
        const orbitAlpha = _options?.cameraOrbit?.[0];
        const orbitBeta = _options?.cameraOrbit?.[1];
        const orbitRadius = _options?.cameraOrbit?.[2];
        const alpha = orbitAlpha != null && !isNaN(orbitAlpha) ? orbitAlpha : DefaultCameraAlpha;
        const beta = orbitBeta != null && !isNaN(orbitBeta) ? orbitBeta : DefaultCameraBeta;
        const radius = orbitRadius != null && !isNaN(orbitRadius) ? orbitRadius : DefaultCameraRadius;
        this._defaultAlpha = alpha;
        this._defaultBeta = beta;
        this._defaultRadius = radius;

        if (_options?.cameraTarget) {
            const tx = _options.cameraTarget[0];
            const ty = _options.cameraTarget[1];
            const tz = _options.cameraTarget[2];
            this._defaultTarget = {
                x: tx != null && !isNaN(tx) ? tx : 0,
                y: ty != null && !isNaN(ty) ? ty : 0,
                z: tz != null && !isNaN(tz) ? tz : 0,
            };
        }

        this._camera = createArcRotateCamera(alpha, beta, radius, this._defaultTarget);
        this._scene.camera = this._camera;

        this._detachControl = attachControl(this._camera, this._engine.canvas, this._scene);

        // Track pointer activity for auto-orbit idle detection
        const onPointerActivity = () => {
            this._lastPointerTime = performance.now();
        };
        this._engine.canvas.addEventListener("pointerdown", onPointerActivity);
        this._engine.canvas.addEventListener("pointermove", onPointerActivity);
        this._engine.canvas.addEventListener("wheel", onPointerActivity);

        // Clear color — default to transparent black (matching full Viewer)
        this._scene.clearColor = {
            r: _options?.clearColor?.[0] ?? 0,
            g: _options?.clearColor?.[1] ?? 0,
            b: _options?.clearColor?.[2] ?? 0,
            a: _options?.clearColor?.[3] ?? 0,
        };

        // Auto-orbit
        if (_options?.cameraAutoOrbit) {
            this._autoOrbit = {
                enabled: _options.cameraAutoOrbit.enabled ?? DefaultCameraAutoOrbit.enabled,
                speed: _options.cameraAutoOrbit.speed ?? DefaultCameraAutoOrbit.speed,
                delay: _options.cameraAutoOrbit.delay ?? DefaultCameraAutoOrbit.delay,
            };
        }

        // Environment config
        if (_options?.environmentConfig) {
            this._envConfig = {
                intensity: _options.environmentConfig.intensity ?? DefaultEnvironmentConfig.intensity,
                blur: _options.environmentConfig.blur ?? DefaultEnvironmentConfig.blur,
                rotation: _options.environmentConfig.rotation ?? DefaultEnvironmentConfig.rotation,
            };
        }

        // Post processing
        if (_options?.postProcessing) {
            this._applyPostProcessing(_options.postProcessing);
        }

        // Shadow config
        if (_options?.shadowConfig?.quality) {
            observePromise(this.updateShadows({ quality: _options.shadowConfig.quality }));
        }

        // Animation options
        if (_options?.animationSpeed !== undefined) {
            this._animationSpeed = _options.animationSpeed;
        }

        // Hot spots
        if (_options?.hotSpots) {
            this._hotSpots = _options.hotSpots;
        }

        // Per-frame callback
        onBeforeRender(this._scene, (_deltaMs) => {
            if (this._isDisposed) {
                return;
            }

            this._updateAutoOrbit(_deltaMs);
            this._pollAnimationState();

            this.onAfterRenderObservable.notifyObservers();
        });

        // Start the render loop immediately (empty scene renders clear color)
        observePromise(this._beginRendering());

        // Initial loads — each will restart the render loop to pick up new renderables
        const envUrl = _options?.environmentLighting ?? _options?.environmentSkybox ?? "auto";
        observePromise(this.loadEnvironment(envUrl));

        if (_options?.source) {
            observePromise(this.loadModel(_options.source));
        }
    }

    // ── Clear Color ──

    public get clearColor(): IColor4Like {
        return this._scene.clearColor;
    }

    public set clearColor(value: IColor4Like) {
        const cc = this._scene.clearColor;
        cc.r = value.r;
        cc.g = value.g;
        cc.b = value.b;
        cc.a = value.a;
        this.onClearColorChanged.notifyObservers();
    }

    // ── Camera ──

    public get cameraAutoOrbit(): Readonly<CameraAutoOrbit> {
        return this._autoOrbit;
    }

    public set cameraAutoOrbit(value: Partial<Readonly<CameraAutoOrbit>>) {
        let changed = false;
        if (value.enabled !== undefined && value.enabled !== this._autoOrbit.enabled) {
            this._autoOrbit.enabled = value.enabled;
            changed = true;
        }
        if (value.speed !== undefined && value.speed !== this._autoOrbit.speed) {
            this._autoOrbit.speed = value.speed;
            changed = true;
        }
        if (value.delay !== undefined && value.delay !== this._autoOrbit.delay) {
            this._autoOrbit.delay = value.delay;
            changed = true;
        }
        if (changed) {
            this.onCameraAutoOrbitChanged.notifyObservers();
        }
    }

    public resetCamera(reframe?: boolean): void {
        this._camera.alpha = this._defaultAlpha;
        this._camera.beta = this._defaultBeta;
        this._camera.radius = this._defaultRadius;
        this._camera.target = { x: this._defaultTarget.x, y: this._defaultTarget.y, z: this._defaultTarget.z };

        if (reframe) {
            // TODO: compute bounds from loaded meshes when Lite exposes bounding info
        }
    }

    public updateCamera(pose: { alpha?: number; beta?: number; radius?: number; targetX?: number; targetY?: number; targetZ?: number }): void {
        if (pose.alpha !== undefined) {
            this._camera.alpha = pose.alpha;
        }
        if (pose.beta !== undefined) {
            this._camera.beta = pose.beta;
        }
        if (pose.radius !== undefined) {
            this._camera.radius = pose.radius;
        }

        const target = this._camera.target;
        if (pose.targetX !== undefined) {
            target.x = pose.targetX;
        }
        if (pose.targetY !== undefined) {
            target.y = pose.targetY;
        }
        if (pose.targetZ !== undefined) {
            target.z = pose.targetZ;
        }
    }

    private _frameCameraToModel(): void {
        const meshes = this._scene.meshes;
        if (!meshes || meshes.length === 0) {
            return;
        }

        // Compute aggregate bounding box from scene meshes
        let minX = Infinity,
            minY = Infinity,
            minZ = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;
        let hasBounds = false;

        for (const mesh of meshes) {
            const m = mesh as any;
            if (m.boundMin && m.boundMax) {
                minX = Math.min(minX, m.boundMin[0]);
                minY = Math.min(minY, m.boundMin[1]);
                minZ = Math.min(minZ, m.boundMin[2]);
                maxX = Math.max(maxX, m.boundMax[0]);
                maxY = Math.max(maxY, m.boundMax[1]);
                maxZ = Math.max(maxZ, m.boundMax[2]);
                hasBounds = true;
            }
        }

        if (!hasBounds) {
            return;
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;
        const sx = maxX - minX;
        const sy = maxY - minY;
        const sz = maxZ - minZ;
        const size = Math.sqrt(sx * sx + sy * sy + sz * sz);
        const radius = size * 1.5;

        this._camera.target = { x: cx, y: cy, z: cz };
        this._camera.radius = radius;
    }

    // ── Environment ──

    public get environmentConfig(): Readonly<EnvironmentParams> {
        return this._envConfig;
    }

    public set environmentConfig(value: Partial<Readonly<EnvironmentParams>>) {
        let changed = false;
        if (value.intensity !== undefined && value.intensity !== this._envConfig.intensity) {
            this._envConfig.intensity = value.intensity;
            changed = true;
        }
        if (value.blur !== undefined && value.blur !== this._envConfig.blur) {
            this._envConfig.blur = value.blur;
            changed = true;
        }
        if (value.rotation !== undefined && value.rotation !== this._envConfig.rotation) {
            this._envConfig.rotation = value.rotation;
            this._scene.envRotationY = value.rotation;
            changed = true;
        }
        if (changed) {
            this.onEnvironmentConfigurationChanged.notifyObservers();
        }
    }

    public async loadEnvironment(url: string, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        try {
            throwIfAborted(abortSignal);

            const effectiveUrl = url === "auto" ? (await import("./defaultEnvironment")).default : url;
            const ext = getExtension(effectiveUrl, options?.extension);

            if (ext === ".hdr") {
                this._envTextures = await loadHdrEnvironment(this._scene, effectiveUrl, {
                    skipGround: true,
                    skyboxSize: 20,
                });
            } else {
                // .env or other — use the standard env loader
                this._envTextures = await liteLoadEnvironment(this._scene, effectiveUrl, {
                    brdfUrl: (await import("./defaultBRDF")).default,
                    skyboxUrl: options?.skybox !== false ? effectiveUrl : undefined,
                    skipSkybox: options?.skybox === false,
                    skipGround: true,
                    skyboxSize: 20,
                });
            }

            if (this._envConfig.rotation !== 0) {
                this._scene.envRotationY = this._envConfig.rotation;
            }

            throwIfAborted(abortSignal);

            this.onEnvironmentChanged.notifyObservers();
        } catch (e) {
            if (e instanceof AbortError) {
                throw e;
            }
            this.onEnvironmentError.notifyObservers(e);
            throw e;
        }
    }

    public async resetEnvironment(_options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        throwIfAborted(abortSignal);

        if (this._envTextures !== null) {
            this._envTextures = null;
        }
        this._envConfig = { ...DefaultEnvironmentConfig };
        this._scene.envRotationY = 0;

        this.onEnvironmentChanged.notifyObservers();
        this.onEnvironmentConfigurationChanged.notifyObservers();
    }

    // ── Post Processing ──

    public get postProcessing(): Readonly<PostProcessing> {
        return this._postProcessing;
    }

    public set postProcessing(value: Partial<Readonly<PostProcessing>>) {
        this._applyPostProcessing(value);
        this.onPostProcessingChanged.notifyObservers();
    }

    private _applyPostProcessing(value: Partial<Readonly<PostProcessing>>): void {
        if (value.toneMapping !== undefined) {
            this._postProcessing.toneMapping = value.toneMapping;
            const liteType = toneMappingToLiteType(value.toneMapping);
            this._scene.imageProcessing.toneMappingEnabled = liteType !== undefined;
            if (liteType !== undefined) {
                this._scene.imageProcessing.toneMappingType = liteType;
            }
        }
        if (value.exposure !== undefined) {
            this._postProcessing.exposure = value.exposure;
            this._scene.imageProcessing.exposure = value.exposure;
        }
        if (value.contrast !== undefined) {
            this._postProcessing.contrast = value.contrast;
            this._scene.imageProcessing.contrast = value.contrast;
        }
        if (value.ssao !== undefined) {
            this._postProcessing.ssao = value.ssao;
            if (value.ssao !== "disabled") {
                Logger.Warn("Viewer: SSAO is not supported by Babylon Lite.");
            }
        }
    }

    // ── Shadows ──

    public get shadowConfig(): Readonly<ShadowParams> {
        return this._shadowConfig;
    }

    public async updateShadows(value: Partial<Readonly<ShadowParams>>): Promise<void> {
        if (value.quality === undefined) {
            return;
        }

        let quality: ShadowQuality = value.quality;
        if (quality === "high") {
            Logger.Warn("Viewer: Shadow quality 'high' is not supported by Babylon Lite. Falling back to 'normal'.");
            quality = "normal";
        }

        this._shadowConfig = { quality };

        // Tear down existing shadow state
        if (this._shadowLight !== null) {
            this._shadowLight = null;
        }
        this._shadowGenerator = null;

        if (quality === "normal" && this._container) {
            this._setupShadows();
        }

        this.onShadowsConfigurationChanged.notifyObservers();
    }

    private _setupShadows(): void {
        if (!this._container || this._shadowConfig.quality === "none") {
            return;
        }

        const light = createDirectionalLight([0.5, -1, 0.5], 1);
        addToScene(this._scene, light);
        this._shadowLight = light;

        // Collect caster meshes from the container
        const casterMeshes = this._container.entities.filter((e): e is Mesh => "vertices" in e);

        if (casterMeshes.length > 0) {
            this._shadowGenerator = createShadowGenerator(this._engine, light, casterMeshes);
            addToScene(this._scene, this._shadowGenerator);
        }
    }

    // ── Model Loading ──

    public async loadModel(source: string | File | ArrayBufferView, options?: ViewerLoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        // Abort any in-flight load
        this._loadModelAbortController?.abort(new AbortError("Superseded by new load"));
        const controller = new AbortController();
        this._loadModelAbortController = controller;

        const combinedAbort = abortSignal ? AbortSignal.any([abortSignal, controller.signal]) : controller.signal;

        try {
            throwIfAborted(combinedAbort);

            if (typeof source !== "string") {
                Logger.Warn("Viewer: Only string URLs are supported for model loading. File and ArrayBufferView sources are not supported.");
                this.onModelError.notifyObservers(new Error("Unsupported model source type"));
                return;
            }

            // Set loading state
            this._loadingProgress = true;
            this.onLoadingProgressChanged.notifyObservers();

            // Unload previous model
            this._unloadCurrentModel();

            // Load new model
            const url = source;
            if (options?.pluginExtension) {
                // Append extension hint if provided
                const ext = options.pluginExtension.startsWith(".") ? options.pluginExtension : `.${options.pluginExtension}`;
                if (!url.toLowerCase().endsWith(ext.toLowerCase())) {
                    // The Lite loader determines format from URL extension;
                    // for now we just trust the URL.
                }
            }

            const container = await loadGltf(this._engine, url);

            throwIfAborted(combinedAbort);

            this._container = container;
            this._modelSource = source;

            // Add to scene and rebuild renderables
            addToScene(this._scene, container);
            await this._beginRendering();

            // Apply clear color from model if present
            if (container.clearColor) {
                this._scene.clearColor = container.clearColor;
                this.onClearColorChanged.notifyObservers();
            }

            // Setup shadows if configured
            if (this._shadowConfig.quality !== "none") {
                this._setupShadows();
            }

            // Setup animations
            this._setupAnimations();

            // Apply material variant from options
            if (this._options?.selectedMaterialVariant) {
                this.selectedMaterialVariant = this._options.selectedMaterialVariant;
            }

            // Frame camera to loaded model
            this._frameCameraToModel();

            // Loading complete
            this._loadingProgress = false;
            this.onLoadingProgressChanged.notifyObservers();

            this.onModelChanged.notifyObservers(source);
        } catch (e) {
            this._loadingProgress = false;
            this.onLoadingProgressChanged.notifyObservers();

            if (e instanceof AbortError) {
                throw e;
            }
            this.onModelError.notifyObservers(e);
            throw e;
        }
    }

    public async resetModel(abortSignal?: AbortSignal): Promise<void> {
        throwIfAborted(abortSignal);

        this._loadModelAbortController?.abort(new AbortError("Model reset"));
        this._loadModelAbortController = null;

        const hadModel = this._modelSource !== null;
        this._unloadCurrentModel();

        if (hadModel) {
            this.onModelChanged.notifyObservers(null);
        }
    }

    private _unloadCurrentModel(): void {
        // Reset animation state
        this._selectedAnimation = -1;
        this._wasPlaying = false;
        this._lastProgress = -1;

        // Reset material variant
        if (this._container && this._selectedMaterialVariant !== null) {
            resetVariant(this._container);
            this._selectedMaterialVariant = null;
        }

        // Remove shadows
        this._shadowGenerator = null;
        this._shadowLight = null;

        this._container = null;
        this._modelSource = null;
    }

    // ── Animation ──

    public get animations(): readonly string[] {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            return [];
        }
        return groups.map((g) => g.name);
    }

    public get selectedAnimation(): number {
        return this._selectedAnimation;
    }

    public set selectedAnimation(index: number) {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            this._selectedAnimation = -1;
            this.onSelectedAnimationChanged.notifyObservers();
            return;
        }

        // Pause the currently playing animation
        if (this._selectedAnimation >= 0 && this._selectedAnimation < groups.length) {
            litePauseAnimation(groups[this._selectedAnimation]);
        }

        this._selectedAnimation = index >= 0 && index < groups.length ? index : -1;
        this.onSelectedAnimationChanged.notifyObservers();
    }

    public get animationSpeed(): number {
        return this._animationSpeed;
    }

    public set animationSpeed(value: number) {
        this._animationSpeed = value;

        const group = this._getActiveAnimationGroup();
        if (group) {
            group.speedRatio = value;
        }

        this.onAnimationSpeedChanged.notifyObservers();
    }

    public get isAnimationPlaying(): boolean {
        const group = this._getActiveAnimationGroup();
        return group ? group.isPlaying : false;
    }

    public get animationProgress(): number {
        const group = this._getActiveAnimationGroup();
        if (!group || group.duration <= 0) {
            return 0;
        }
        // currentFrame is in seconds; duration is also in seconds
        return Math.min(group.currentFrame / group.duration, 1);
    }

    public set animationProgress(value: number) {
        const group = this._getActiveAnimationGroup();
        if (!group || group.duration <= 0) {
            return;
        }

        // goToFrame expects a frame number at 60 fps
        const targetSeconds = value * group.duration;
        const frameAt60fps = targetSeconds * 60;
        goToFrame(group, frameAt60fps);

        this.onAnimationProgressChanged.notifyObservers();
    }

    public toggleAnimation(): void {
        if (this.isAnimationPlaying) {
            observePromise(this.pauseAnimation());
        } else {
            this.playAnimation();
        }
    }

    public playAnimation(): void {
        const group = this._getActiveAnimationGroup();
        if (group) {
            group.speedRatio = this._animationSpeed;
            group.loopAnimation = true;
            litePlayAnimation(group);
            this.onIsAnimationPlayingChanged.notifyObservers();
        }
    }

    public async pauseAnimation(): Promise<void> {
        const group = this._getActiveAnimationGroup();
        if (group) {
            litePauseAnimation(group);
            this.onIsAnimationPlayingChanged.notifyObservers();
        }
    }

    private _getActiveAnimationGroup(): LiteAnimationGroup | null {
        const groups = this._container?.animationGroups;
        if (!groups || this._selectedAnimation < 0 || this._selectedAnimation >= groups.length) {
            return null;
        }
        return groups[this._selectedAnimation];
    }

    private _setupAnimations(): void {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            this._selectedAnimation = -1;
            return;
        }

        // Select the first animation by default, or the one specified in options
        const defaultIndex = this._options?.selectedAnimation ?? 0;
        this._selectedAnimation = defaultIndex >= 0 && defaultIndex < groups.length ? defaultIndex : 0;
        this.onSelectedAnimationChanged.notifyObservers();

        // Auto-play if configured
        if (this._options?.animationAutoPlay) {
            const group = groups[this._selectedAnimation];
            group.speedRatio = this._animationSpeed;
            group.loopAnimation = true;
            litePlayAnimation(group);
            this.onIsAnimationPlayingChanged.notifyObservers();
        }
    }

    private _pollAnimationState(): void {
        const group = this._getActiveAnimationGroup();
        if (!group) {
            return;
        }

        const isPlaying = group.isPlaying;
        if (isPlaying !== this._wasPlaying) {
            this._wasPlaying = isPlaying;
            this.onIsAnimationPlayingChanged.notifyObservers();
        }

        if (isPlaying) {
            const progress = group.duration > 0 ? group.currentFrame / group.duration : 0;
            if (progress !== this._lastProgress) {
                this._lastProgress = progress;
                this.onAnimationProgressChanged.notifyObservers();
            }
        }
    }

    // ── Material Variants ──

    public get materialVariants(): readonly string[] {
        if (!this._container) {
            return [];
        }
        return getVariantNames(this._container);
    }

    public get selectedMaterialVariant(): Nullable<string> {
        return this._selectedMaterialVariant;
    }

    public set selectedMaterialVariant(value: Nullable<string>) {
        if (value === this._selectedMaterialVariant) {
            return;
        }
        this._selectedMaterialVariant = value;

        if (this._container) {
            if (value === null) {
                resetVariant(this._container);
            } else {
                selectVariant(this._container, value);
            }
        }

        this.onSelectedMaterialVariantChanged.notifyObservers();
    }

    // ── Hot Spots ──

    public get hotSpots(): Record<string, HotSpot> {
        return this._hotSpots;
    }

    public set hotSpots(value: Record<string, HotSpot>) {
        this._hotSpots = value;
        this.onHotSpotsChanged.notifyObservers();
    }

    public get camerasAsHotSpots(): boolean {
        return this._camerasAsHotSpots;
    }

    public set camerasAsHotSpots(value: boolean) {
        if (value === this._camerasAsHotSpots) {
            return;
        }
        this._camerasAsHotSpots = value;
        this.onCamerasAsHotSpotsChanged.notifyObservers();
    }

    public queryHotSpot(_name: string, _result: ViewerHotSpotResult): boolean {
        Logger.Warn("Viewer: Hot spot queries are not supported by Babylon Lite.");
        return false;
    }

    public focusHotSpot(_name: string): boolean {
        Logger.Warn("Viewer: Hot spot focus is not supported by Babylon Lite.");
        return false;
    }

    // ── State ──

    public get isModelLoaded(): boolean {
        return this._container !== null;
    }

    public get loadingProgress(): boolean | number {
        return this._loadingProgress;
    }

    public reset(...flags: ResetFlag[]): void {
        const all = flags.length === 0;

        if (all || flags.includes("camera")) {
            this.resetCamera();
            this.cameraAutoOrbit = this._options?.cameraAutoOrbit
                ? {
                      enabled: this._options.cameraAutoOrbit.enabled ?? DefaultCameraAutoOrbit.enabled,
                      speed: this._options.cameraAutoOrbit.speed ?? DefaultCameraAutoOrbit.speed,
                      delay: this._options.cameraAutoOrbit.delay ?? DefaultCameraAutoOrbit.delay,
                  }
                : { ...DefaultCameraAutoOrbit };
        }

        if (all || flags.includes("environment")) {
            observePromise(this.resetEnvironment());
            if (this._options?.environmentLighting || this._options?.environmentSkybox) {
                const envUrl = this._options.environmentLighting ?? this._options.environmentSkybox ?? "auto";
                observePromise(this.loadEnvironment(envUrl));
            }
        }

        if (all || flags.includes("post-processing")) {
            this._applyPostProcessing({
                toneMapping: this._options?.postProcessing?.toneMapping ?? DefaultPostProcessing.toneMapping,
                contrast: this._options?.postProcessing?.contrast ?? DefaultPostProcessing.contrast,
                exposure: this._options?.postProcessing?.exposure ?? DefaultPostProcessing.exposure,
                ssao: this._options?.postProcessing?.ssao ?? DefaultPostProcessing.ssao,
            });
            this.onPostProcessingChanged.notifyObservers();
        }

        if (all || flags.includes("shadow")) {
            observePromise(this.updateShadows({ quality: this._options?.shadowConfig?.quality ?? DefaultShadowConfig.quality }));
        }

        if (all || flags.includes("animation")) {
            const groups = this._container?.animationGroups;
            if (groups && groups.length > 0) {
                // Pause current
                const current = this._getActiveAnimationGroup();
                if (current) {
                    litePauseAnimation(current);
                }
                this._selectedAnimation = this._options?.selectedAnimation ?? 0;
                this._animationSpeed = this._options?.animationSpeed ?? 1;
                this.onSelectedAnimationChanged.notifyObservers();
                this.onAnimationSpeedChanged.notifyObservers();

                if (this._options?.animationAutoPlay) {
                    this.playAnimation();
                }
            }
        }

        if (all || flags.includes("material-variant")) {
            this.selectedMaterialVariant = this._options?.selectedMaterialVariant ?? null;
        }

        if (all || flags.includes("source")) {
            observePromise(this.resetModel());
            if (this._options?.source) {
                observePromise(this.loadModel(this._options.source));
            }
        }
    }

    /**
     * Registers the scene with the engine and starts the render loop.
     * Safe to call multiple times — stops and re-registers if already running.
     */
    private async _beginRendering(): Promise<void> {
        if (this._isDisposed) {
            return;
        }
        if (this._renderLoopRunning) {
            stopEngine(this._engine);
            unregisterScene(this._engine, this._scene);
            this._renderLoopRunning = false;
        }
        await registerScene(this._engine, this._scene);
        await startEngine(this._engine);
        this._renderLoopRunning = true;
    }

    public dispose(): void {
        if (this._isDisposed) {
            return;
        }
        this._isDisposed = true;

        // Detach camera controls
        this._detachControl?.();
        this._detachControl = null;

        // Clean up pointer listeners
        this._engine.canvas.removeEventListener("pointerdown", this._onPointerActivity);
        this._engine.canvas.removeEventListener("pointermove", this._onPointerActivity);
        this._engine.canvas.removeEventListener("wheel", this._onPointerActivity);

        // Abort any in-flight loads
        this._loadModelAbortController?.abort(new AbortError("Disposed"));
        this._loadModelAbortController = null;

        // Unload model
        this._unloadCurrentModel();

        // Stop and dispose engine/scene
        stopEngine(this._engine);
        unregisterScene(this._engine, this._scene);
        disposeScene(this._scene);
        disposeEngine(this._engine);

        // Clear all observables
        this.onEnvironmentChanged.clear();
        this.onEnvironmentConfigurationChanged.clear();
        this.onEnvironmentError.clear();
        this.onShadowsConfigurationChanged.clear();
        this.onPostProcessingChanged.clear();
        this.onModelChanged.clear();
        this.onModelError.clear();
        this.onLoadingProgressChanged.clear();
        this.onCameraAutoOrbitChanged.clear();
        this.onSelectedAnimationChanged.clear();
        this.onAnimationSpeedChanged.clear();
        this.onIsAnimationPlayingChanged.clear();
        this.onAnimationProgressChanged.clear();
        this.onSelectedMaterialVariantChanged.clear();
        this.onHotSpotsChanged.clear();
        this.onCamerasAsHotSpotsChanged.clear();
        this.onAfterRenderObservable.clear();
        this.onClearColorChanged.clear();
    }

    // ── Private Helpers ──

    private _onPointerActivity = (): void => {
        this._lastPointerTime = performance.now();
    };

    private _updateAutoOrbit(deltaMs: number): void {
        if (!this._autoOrbit.enabled) {
            this._autoOrbitIdleTime = 0;
            return;
        }

        const now = performance.now();
        const idleMs = now - this._lastPointerTime;

        if (idleMs < this._autoOrbit.delay) {
            this._autoOrbitIdleTime = 0;
            return;
        }

        this._autoOrbitIdleTime += deltaMs;

        // Rotate alpha based on speed (radians per second)
        const rotationAmount = (this._autoOrbit.speed * deltaMs) / 1000;
        this._camera.alpha += rotationAmount;
    }
}

/**
 * Creates a new {@link Viewer} instance for the given canvas element.
 * @param canvas The HTML canvas element to render into.
 * @param options Optional viewer configuration.
 * @returns A promise that resolves to the initialized Viewer.
 */
export async function CreateViewerForCanvas(canvas: HTMLCanvasElement, options?: ViewerBaseOptions): Promise<Viewer> {
    const engine = await createEngine(canvas);
    return new Viewer(engine, options);
}
