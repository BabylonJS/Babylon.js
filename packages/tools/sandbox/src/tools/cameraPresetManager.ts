import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Camera } from "core/Cameras/camera";
import { type AutoRotationBehavior } from "core/Behaviors/Cameras/autoRotationBehavior";
import { type BouncingBehavior } from "core/Behaviors/Cameras/bouncingBehavior";
import { type FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { DataStorage } from "core/Misc/dataStorage";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";

export const CameraPresetStorageKey = "Babylon/Sandbox/cameraPresets";
export const DefaultCameraPresetOption = "Default camera";

const CameraPresetStorageVersion = 1;

interface IAutoRotationBehaviorState {
    idleRotationSpeed: number;
    idleRotationWaitTime: number;
    idleRotationSpinupTime: number;
    zoomStopsAnimation: boolean;
    targetAlpha: number | null;
}

interface IBouncingBehaviorState {
    transitionDuration: number;
    lowerRadiusTransitionRange: number;
    upperRadiusTransitionRange: number;
    autoTransitionRange: boolean;
}

interface IFramingBehaviorState {
    mode: number;
    radiusScale: number;
    positionScale: number;
    defaultElevation: number;
    elevationReturnTime: number;
    elevationReturnWaitTime: number;
    zoomStopsAnimation: boolean;
    framingTime: number;
    autoCorrectCameraLimitsAndSensibility: boolean;
}

export interface ICameraPresetBehaviorState {
    version: 1;
    useAutoRotationBehavior?: boolean;
    useBouncingBehavior?: boolean;
    useFramingBehavior?: boolean;
    autoRotation?: IAutoRotationBehaviorState;
    bouncing?: IBouncingBehaviorState;
    framing?: IFramingBehaviorState;
}

export interface ICameraPreset {
    id: string;
    name: string;
    cameraType: string;
    cameraData: Record<string, unknown>;
    behaviors?: ICameraPresetBehaviorState;
}

export interface ICameraPresetState {
    version: 1;
    activePresetId: string | null;
    presets: ICameraPreset[];
}

export interface ICameraPresetStorageBackend {
    read(): unknown;
    write(state: ICameraPresetState): void;
}

const DefaultCameraPresetState: ICameraPresetState = {
    version: CameraPresetStorageVersion,
    activePresetId: null,
    presets: [],
};

const DataStorageBackend: ICameraPresetStorageBackend = {
    read: () => DataStorage.ReadJson<unknown>(CameraPresetStorageKey, null),
    write: (state) => DataStorage.WriteJson(CameraPresetStorageKey, state),
};

function IsRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function IsFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function ParseAutoRotationBehaviorState(value: unknown): IAutoRotationBehaviorState | undefined {
    if (
        !IsRecord(value) ||
        !IsFiniteNumber(value.idleRotationSpeed) ||
        !IsFiniteNumber(value.idleRotationWaitTime) ||
        !IsFiniteNumber(value.idleRotationSpinupTime) ||
        typeof value.zoomStopsAnimation !== "boolean" ||
        (value.targetAlpha !== null && !IsFiniteNumber(value.targetAlpha))
    ) {
        return undefined;
    }

    return {
        idleRotationSpeed: value.idleRotationSpeed,
        idleRotationWaitTime: value.idleRotationWaitTime,
        idleRotationSpinupTime: value.idleRotationSpinupTime,
        zoomStopsAnimation: value.zoomStopsAnimation,
        targetAlpha: value.targetAlpha,
    };
}

function ParseBouncingBehaviorState(value: unknown): IBouncingBehaviorState | undefined {
    if (
        !IsRecord(value) ||
        !IsFiniteNumber(value.transitionDuration) ||
        !IsFiniteNumber(value.lowerRadiusTransitionRange) ||
        !IsFiniteNumber(value.upperRadiusTransitionRange) ||
        typeof value.autoTransitionRange !== "boolean"
    ) {
        return undefined;
    }

    return {
        transitionDuration: value.transitionDuration,
        lowerRadiusTransitionRange: value.lowerRadiusTransitionRange,
        upperRadiusTransitionRange: value.upperRadiusTransitionRange,
        autoTransitionRange: value.autoTransitionRange,
    };
}

function ParseFramingBehaviorState(value: unknown): IFramingBehaviorState | undefined {
    if (
        !IsRecord(value) ||
        !IsFiniteNumber(value.mode) ||
        !IsFiniteNumber(value.radiusScale) ||
        !IsFiniteNumber(value.positionScale) ||
        !IsFiniteNumber(value.defaultElevation) ||
        !IsFiniteNumber(value.elevationReturnTime) ||
        !IsFiniteNumber(value.elevationReturnWaitTime) ||
        typeof value.zoomStopsAnimation !== "boolean" ||
        !IsFiniteNumber(value.framingTime) ||
        typeof value.autoCorrectCameraLimitsAndSensibility !== "boolean"
    ) {
        return undefined;
    }

    return {
        mode: value.mode,
        radiusScale: value.radiusScale,
        positionScale: value.positionScale,
        defaultElevation: value.defaultElevation,
        elevationReturnTime: value.elevationReturnTime,
        elevationReturnWaitTime: value.elevationReturnWaitTime,
        zoomStopsAnimation: value.zoomStopsAnimation,
        framingTime: value.framingTime,
        autoCorrectCameraLimitsAndSensibility: value.autoCorrectCameraLimitsAndSensibility,
    };
}

function ParseBehaviorState(value: unknown): ICameraPresetBehaviorState | undefined {
    if (!IsRecord(value)) {
        return undefined;
    }

    const behaviorState: ICameraPresetBehaviorState = { version: 1 };
    for (const property of ["useAutoRotationBehavior", "useBouncingBehavior", "useFramingBehavior"] as const) {
        if (typeof value[property] === "boolean") {
            behaviorState[property] = value[property];
        }
    }

    if (value.version === 1) {
        behaviorState.autoRotation = ParseAutoRotationBehaviorState(value.autoRotation);
        behaviorState.bouncing = ParseBouncingBehaviorState(value.bouncing);
        behaviorState.framing = ParseFramingBehaviorState(value.framing);
    }

    const hasBehaviorContent = Object.entries(behaviorState).some(([property, propertyValue]) => property !== "version" && propertyValue !== undefined);
    return hasBehaviorContent ? behaviorState : undefined;
}

function CreateCameraPresetId(): string {
    if (globalThis.crypto?.randomUUID) {
        return globalThis.crypto.randomUUID();
    }

    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function GetUniqueCameraPresetName(existingNames: readonly string[], requestedName: string): string {
    const normalizedNames = new Set(existingNames.map((name) => name.trim().toLocaleLowerCase()));
    const trimmedName = requestedName.trim();

    if (!trimmedName) {
        let index = 1;
        while (normalizedNames.has(`preset ${index}`)) {
            index++;
        }
        return `Preset ${index}`;
    }

    if (!normalizedNames.has(trimmedName.toLocaleLowerCase())) {
        return trimmedName;
    }

    const suffixMatch = /^(.*)\s+(\d+)$/.exec(trimmedName);
    const baseName = suffixMatch?.[1].trim() || trimmedName;
    let suffix = suffixMatch ? Number(suffixMatch[2]) + 1 : 2;
    if (!Number.isSafeInteger(suffix)) {
        suffix = 2;
    }

    while (normalizedNames.has(`${baseName} ${suffix}`.toLocaleLowerCase())) {
        suffix++;
    }

    return `${baseName} ${suffix}`;
}

export function ParseCameraPresetState(value: unknown): ICameraPresetState {
    if (!IsRecord(value) || value.version !== CameraPresetStorageVersion || !Array.isArray(value.presets)) {
        return { ...DefaultCameraPresetState, presets: [] };
    }

    const ids = new Set<string>();
    const names = [DefaultCameraPresetOption];
    const presets: ICameraPreset[] = [];

    for (const candidate of value.presets) {
        if (!IsRecord(candidate) || typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.cameraType !== "string") {
            continue;
        }

        const id = candidate.id.trim();
        const requestedName = candidate.name.trim();
        const cameraType = candidate.cameraType.trim();
        if (!id || !requestedName || !cameraType || ids.has(id) || !IsRecord(candidate.cameraData) || candidate.cameraData.type !== cameraType) {
            continue;
        }

        const name = GetUniqueCameraPresetName(names, requestedName);
        ids.add(id);
        names.push(name);
        presets.push({
            id,
            name,
            cameraType,
            cameraData: candidate.cameraData,
            behaviors: ParseBehaviorState(candidate.behaviors),
        });
    }

    const activePresetId = typeof value.activePresetId === "string" && ids.has(value.activePresetId) ? value.activePresetId : null;
    return {
        version: CameraPresetStorageVersion,
        activePresetId,
        presets,
    };
}

function GetBehaviorState(camera: Camera): ICameraPresetBehaviorState | undefined {
    if (!(camera instanceof ArcRotateCamera)) {
        return undefined;
    }

    const behaviorState: ICameraPresetBehaviorState = {
        version: 1,
        useAutoRotationBehavior: camera.useAutoRotationBehavior,
        useBouncingBehavior: camera.useBouncingBehavior,
        useFramingBehavior: camera.useFramingBehavior,
    };

    const autoRotationBehavior = camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior | null;
    if (autoRotationBehavior) {
        behaviorState.autoRotation = {
            idleRotationSpeed: autoRotationBehavior.idleRotationSpeed,
            idleRotationWaitTime: autoRotationBehavior.idleRotationWaitTime,
            idleRotationSpinupTime: autoRotationBehavior.idleRotationSpinupTime,
            zoomStopsAnimation: autoRotationBehavior.zoomStopsAnimation,
            targetAlpha: autoRotationBehavior.targetAlpha,
        };
    }

    const bouncingBehavior = camera.getBehaviorByName("Bouncing") as BouncingBehavior | null;
    if (bouncingBehavior) {
        behaviorState.bouncing = {
            transitionDuration: bouncingBehavior.transitionDuration,
            lowerRadiusTransitionRange: bouncingBehavior.lowerRadiusTransitionRange,
            upperRadiusTransitionRange: bouncingBehavior.upperRadiusTransitionRange,
            autoTransitionRange: bouncingBehavior.autoTransitionRange,
        };
    }

    const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior | null;
    if (framingBehavior) {
        behaviorState.framing = {
            mode: framingBehavior.mode,
            radiusScale: framingBehavior.radiusScale,
            positionScale: framingBehavior.positionScale,
            defaultElevation: framingBehavior.defaultElevation,
            elevationReturnTime: framingBehavior.elevationReturnTime,
            elevationReturnWaitTime: framingBehavior.elevationReturnWaitTime,
            zoomStopsAnimation: framingBehavior.zoomStopsAnimation,
            framingTime: framingBehavior.framingTime,
            autoCorrectCameraLimitsAndSensibility: framingBehavior.autoCorrectCameraLimitsAndSensibility,
        };
    }

    return behaviorState;
}

function ApplyBehaviorState(camera: Camera, behaviorState: ICameraPresetBehaviorState | undefined): void {
    if (!behaviorState || !(camera instanceof ArcRotateCamera)) {
        return;
    }

    for (const property of ["useAutoRotationBehavior", "useBouncingBehavior", "useFramingBehavior"] as const) {
        if (typeof behaviorState[property] === "boolean") {
            camera[property] = behaviorState[property];
        }
    }

    const autoRotationBehavior = camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior | null;
    if (autoRotationBehavior && behaviorState.autoRotation) {
        Object.assign(autoRotationBehavior, behaviorState.autoRotation);
    }

    const bouncingBehavior = camera.getBehaviorByName("Bouncing") as BouncingBehavior | null;
    if (bouncingBehavior && behaviorState.bouncing) {
        Object.assign(bouncingBehavior, behaviorState.bouncing);
    }

    const framingBehavior = camera.getBehaviorByName("Framing") as FramingBehavior | null;
    if (framingBehavior && behaviorState.framing) {
        Object.assign(framingBehavior, behaviorState.framing);
    }
}

function DisposeCameras(cameras: Iterable<Camera>): void {
    for (const camera of cameras) {
        if (!camera.isDisposed()) {
            camera.dispose();
        }
    }
}

export class CameraPresetManager {
    public readonly onChanged = new Observable<void>();

    private _state: ICameraPresetState;
    private readonly _presetCameras = new WeakMap<Scene, Set<Camera>>();
    private readonly _presetCameraSet = new WeakSet<Camera>();
    private readonly _sceneCameras = new WeakMap<Scene, Camera>();

    public constructor(
        private readonly _storage: ICameraPresetStorageBackend = DataStorageBackend,
        private readonly _createId: () => string = CreateCameraPresetId,
        private readonly _onError?: (message: string, scene?: Scene) => void
    ) {
        try {
            this._state = ParseCameraPresetState(this._storage.read());
        } catch (error) {
            Logger.Warn(`Unable to read Sandbox camera presets: ${error instanceof Error ? error.message : String(error)}`);
            this._state = { ...DefaultCameraPresetState, presets: [] };
        }
    }

    public get presets(): readonly ICameraPreset[] {
        return this._state.presets;
    }

    public get activePresetId(): string | null {
        return this._state.activePresetId;
    }

    public get activePreset(): ICameraPreset | undefined {
        return this._state.presets.find((preset) => preset.id === this._state.activePresetId);
    }

    public saveCamera(camera: Camera, requestedName: string): ICameraPreset | null {
        try {
            const name = GetUniqueCameraPresetName([DefaultCameraPresetOption, ...this._state.presets.map((preset) => preset.name)], requestedName);
            let id = this._createId();
            while (this._state.presets.some((preset) => preset.id === id)) {
                id = this._createId();
            }

            const cameraData = JSON.parse(JSON.stringify(camera.serialize())) as Record<string, unknown>;
            const preset: ICameraPreset = {
                id,
                name,
                cameraType: camera.getClassName(),
                cameraData,
                behaviors: GetBehaviorState(camera),
            };

            return this._updateState(
                {
                    ...this._state,
                    presets: [...this._state.presets, preset],
                },
                camera.getScene()
            )
                ? preset
                : null;
        } catch (error) {
            this._reportError(`Unable to save Sandbox camera preset: ${error instanceof Error ? error.message : String(error)}`, camera.getScene());
            return null;
        }
    }

    public activatePreset(presetId: string, scene: Scene): Camera | null {
        const preset = this._state.presets.find((candidate) => candidate.id === presetId);
        if (!preset) {
            return null;
        }

        const previousState = this._state;
        const nextState: ICameraPresetState = {
            ...this._state,
            activePresetId: preset.id,
        };
        if (preset.id !== this._state.activePresetId && !this._persistState(nextState, scene)) {
            return null;
        }

        const camera = this._applyPreset(preset, scene);
        if (!camera) {
            if (preset.id !== previousState.activePresetId) {
                this._restorePersistedState(previousState, scene);
            }
            return null;
        }

        if (preset.id !== previousState.activePresetId) {
            this._commitState(nextState);
        }
        return camera;
    }

    public applyActivePreset(scene: Scene): Camera | null {
        const preset = this.activePreset;
        return preset ? this._applyPreset(preset, scene) : null;
    }

    public deactivatePreset(scene: Scene, sceneCamera?: Camera): Camera | null {
        let camera = sceneCamera ?? this._sceneCameras.get(scene);
        if (!camera || camera.isDisposed() || this.isPresetCamera(camera) || !scene.cameras.includes(camera)) {
            camera = scene.cameras.find((candidate) => !this.isPresetCamera(candidate));
        }

        if (!camera) {
            return null;
        }

        if (
            this._state.activePresetId !== null &&
            !this._updateState(
                {
                    ...this._state,
                    activePresetId: null,
                },
                scene
            )
        ) {
            return scene.activeCamera;
        }

        const inputElement = scene.getEngine().getInputElement();
        if (inputElement && scene.activeCamera !== camera) {
            scene.activeCamera?.detachControl();
        }
        scene.activeCamera = camera;
        if (inputElement) {
            camera.attachControl();
        }

        this._sceneCameras.set(scene, camera);
        this.releasePresetCamera(scene);
        return camera;
    }

    public isPresetCamera(camera: Camera): boolean {
        return this._presetCameraSet.has(camera);
    }

    public releasePresetCamera(scene: Scene): void {
        const cameras = this._presetCameras.get(scene);
        if (cameras && (!scene.activeCamera || !cameras.has(scene.activeCamera))) {
            this._presetCameras.delete(scene);
            for (const camera of cameras) {
                this._presetCameraSet.delete(camera);
            }
            DisposeCameras(cameras);
        }
    }

    private _applyPreset(preset: ICameraPreset, scene: Scene): Camera | null {
        const existingCameras = new Set(scene.cameras);
        const previousCamera = scene.activeCamera;
        if (previousCamera && !this.isPresetCamera(previousCamera)) {
            this._sceneCameras.set(scene, previousCamera);
        }
        const inputElement = scene.getEngine().getInputElement();
        const cameraData: Record<string, unknown> = {
            ...preset.cameraData,
            id: `SandboxCameraPreset/${preset.id}`,
            name: preset.name,
        };
        delete cameraData.parentId;
        delete cameraData.parentInstanceIndex;
        delete cameraData.lockedTargetId;

        let camera: Camera | undefined;
        let previousCameraDetached = false;
        try {
            camera = Camera.Parse(cameraData, scene);
            if (camera.getClassName() !== preset.cameraType) {
                DisposeCameras(scene.cameras.filter((createdCamera) => !existingCameras.has(createdCamera)));
                this._reportError(`Unable to apply Sandbox camera preset "${preset.name}": camera type "${preset.cameraType}" is not available.`, scene);
                return null;
            }

            ApplyBehaviorState(camera, preset.behaviors);

            if (inputElement) {
                camera.attachControl();
                if (previousCamera) {
                    previousCameraDetached = true;
                    previousCamera.detachControl();
                }
            }
            scene.activeCamera = camera;
        } catch (error) {
            if (scene.activeCamera && !existingCameras.has(scene.activeCamera)) {
                scene.activeCamera = previousCamera;
            }
            DisposeCameras(scene.cameras.filter((createdCamera) => !existingCameras.has(createdCamera)));
            if (inputElement && previousCameraDetached && previousCamera) {
                previousCamera.attachControl();
            }
            this._reportError(`Unable to apply Sandbox camera preset "${preset.name}": ${error instanceof Error ? error.message : String(error)}`, scene);
            return null;
        }

        const createdCameras = new Set(scene.cameras.filter((sceneCamera) => !existingCameras.has(sceneCamera)));
        createdCameras.add(camera);
        const previousPresetCameras = this._presetCameras.get(scene);
        if (previousPresetCameras) {
            for (const previousPresetCamera of previousPresetCameras) {
                this._presetCameraSet.delete(previousPresetCamera);
            }
            DisposeCameras(previousPresetCameras);
        }

        this._presetCameras.set(scene, createdCameras);
        for (const createdCamera of createdCameras) {
            this._presetCameraSet.add(createdCamera);
        }
        return camera;
    }

    private _updateState(state: ICameraPresetState, scene?: Scene): boolean {
        if (!this._persistState(state, scene)) {
            return false;
        }

        this._commitState(state);
        return true;
    }

    private _persistState(state: ICameraPresetState, scene?: Scene): boolean {
        try {
            this._storage.write(state);
        } catch (error) {
            this._reportError(`Unable to persist Sandbox camera presets: ${error instanceof Error ? error.message : String(error)}`, scene);
            return false;
        }

        return true;
    }

    private _restorePersistedState(state: ICameraPresetState, scene: Scene): void {
        try {
            this._storage.write(state);
        } catch (error) {
            this._reportError(`Unable to restore Sandbox camera preset preference: ${error instanceof Error ? error.message : String(error)}`, scene);
        }
    }

    private _commitState(state: ICameraPresetState): void {
        this._state = state;
        this.onChanged.notifyObservers();
    }

    private _reportError(message: string, scene?: Scene): void {
        Logger.Warn(message);
        this._onError?.(message, scene);
    }
}
