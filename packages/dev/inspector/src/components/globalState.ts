/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line import/no-internal-modules
import { GLTFLoaderAnimationStartMode, GLTFLoaderCoordinateSystemMode } from "loaders/glTF/index";
import type { IGLTFValidationResults } from "babylonjs-gltf2interface";

import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { Scene } from "core/scene";
import type { Light } from "core/Lights/light";
import type { Camera } from "core/Cameras/camera";
import { LightGizmo } from "core/Gizmos/lightGizmo";
import { CameraGizmo } from "core/Gizmos/cameraGizmo";
import type { PropertyChangedEvent } from "./propertyChangedEvent";
import { ReplayRecorder } from "./replayRecorder";
import { DataStorage } from "core/Misc/dataStorage";
// eslint-disable-next-line import/no-internal-modules
import type { IGLTFLoaderExtension, GLTFFileLoader } from "loaders/glTF/index";

export class GlobalState {
    public onSelectionChangedObservable: Observable<any>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    public onInspectorClosedObservable = new Observable<Scene>();
    public onTabChangedObservable = new Observable<number>();
    public onSelectionRenamedObservable = new Observable<void>();
    public onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;
    public onNewSceneObservable = new Observable<Scene>();
    public sceneImportDefaults: { [key: string]: any } = {};

    public validationResults: Nullable<IGLTFValidationResults> = null;
    public onValidationResultsUpdatedObservable = new Observable<Nullable<IGLTFValidationResults>>();

    public onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;

    public glTFLoaderExtensionDefaults: { [name: string]: { [key: string]: any } } = {
        MSFT_lod: { enabled: true, maxLODsToLoad: 10 },
        MSFT_minecraftMesh: { enabled: true },
        MSFT_sRGBFactors: { enabled: true },
        MSFT_audio_emitter: { enabled: true },
        KHR_xmp_json_ld: { enabled: true },
        KHR_draco_mesh_compression: { enabled: true },
        KHR_mesh_quantization: { enabled: true },
        KHR_materials_pbrSpecularGlossiness: { enabled: true },
        KHR_materials_clearcoat: { enabled: true },
        KHR_materials_iridescence: { enabled: true },
        KHR_materials_anisotropy: { enabled: true },
        KHR_materials_emissive_strength: { enabled: true },
        KHR_materials_ior: { enabled: true },
        KHR_materials_sheen: { enabled: true },
        KHR_materials_specular: { enabled: true },
        KHR_materials_unlit: { enabled: true },
        KHR_materials_variants: { enabled: true },
        KHR_materials_transmission: { enabled: true },
        KHR_materials_translucency: { enabled: true },
        KHR_materials_volume: { enabled: true },
        KHR_materials_dispersion: { enabled: true },
        KHR_lights_punctual: { enabled: true },
        KHR_texture_basisu: { enabled: true },
        KHR_texture_transform: { enabled: true },
        EXT_lights_image_based: { enabled: true },
        EXT_mesh_gpu_instancing: { enabled: true },
        EXT_texture_webp: { enabled: true },
    };

    public glTFLoaderDefaults: { [key: string]: any } = {
        alwaysComputeBoundingBox: false,
        alwaysComputeSkeletonRootNode: false,
        animationStartMode: typeof GLTFLoaderAnimationStartMode !== "undefined" ? GLTFLoaderAnimationStartMode.FIRST : 1,
        capturePerformanceCounters: false,
        compileMaterials: false,
        compileShadowGenerators: false,
        coordinateSystemMode: typeof GLTFLoaderCoordinateSystemMode !== "undefined" ? GLTFLoaderCoordinateSystemMode.AUTO : 0,
        createInstances: true,
        loadAllMaterials: false,
        loggingEnabled: false,
        targetFps: 60,
        transparencyAsCoverage: false,
        useClipPlane: false,
        useSRGBBuffers: true,
    };

    public glTFLoaderExtensions: { [key: string]: IGLTFLoaderExtension } = {};

    public blockMutationUpdates = false;
    public selectedLineContainerTitles: Array<string> = [];
    public selectedLineContainerTitlesNoFocus: Array<string> = [];

    public recorder = new ReplayRecorder();

    private _onlyUseEulers: Nullable<boolean> = null;

    public get onlyUseEulers(): boolean {
        if (this._onlyUseEulers === null) {
            this._onlyUseEulers = DataStorage.ReadBoolean("settings_onlyUseEulers", true);
        }

        return this._onlyUseEulers!;
    }

    public set onlyUseEulers(value: boolean) {
        this._onlyUseEulers = value;

        DataStorage.WriteBoolean("settings_onlyUseEulers", value);
    }

    private _ignoreBackfacesForPicking: Nullable<boolean> = null;

    public get ignoreBackfacesForPicking(): boolean {
        if (this._ignoreBackfacesForPicking === null) {
            this._ignoreBackfacesForPicking = DataStorage.ReadBoolean("settings_ignoreBackfacesForPicking", false);
        }

        return this._ignoreBackfacesForPicking!;
    }

    public set ignoreBackfacesForPicking(value: boolean) {
        this._ignoreBackfacesForPicking = value;

        DataStorage.WriteBoolean("settings_ignoreBackfacesForPicking", value);
    }

    public init(propertyChangedObservable: Observable<PropertyChangedEvent>) {
        this.onPropertyChangedObservable = propertyChangedObservable;

        this.onNewSceneObservable.add(() => {
            this.recorder.cancel();
        });
    }

    public prepareGLTFPlugin(loader: GLTFFileLoader) {
        this.glTFLoaderExtensions = {};
        const loaderState = this.glTFLoaderDefaults;
        if (loaderState !== undefined) {
            for (const key in loaderState) {
                (loader as any)[key] = loaderState[key];
            }
        }

        loader.onExtensionLoadedObservable.add((extension: import("loaders/glTF/index").IGLTFLoaderExtension) => {
            const extensionState = this.glTFLoaderExtensionDefaults[extension.name];
            if (extensionState !== undefined) {
                for (const key in extensionState) {
                    (extension as any)[key] = extensionState[key];
                }
            }

            this.glTFLoaderExtensions[extension.name] = extension;
        });

        loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
            this.validationResults = results;
            this.onValidationResultsUpdatedObservable.notifyObservers(results);

            if (results.issues.numErrors || results.issues.numWarnings) {
                this.selectedLineContainerTitlesNoFocus.push("GLTF VALIDATION");
                this.onTabChangedObservable.notifyObservers(3);
            }
        });
    }

    public resetGLTFValidationResults() {
        if (this.validationResults) {
            this.validationResults = null;
            this.onValidationResultsUpdatedObservable.notifyObservers(null);
        }
    }

    // Light gizmos
    public lightGizmos: Array<LightGizmo> = [];
    public enableLightGizmo(light: Light, enable = true, gizmoCamera: Nullable<Camera> = null) {
        if (enable) {
            if (!light.reservedDataStore) {
                light.reservedDataStore = {};
            }
            if (!light.reservedDataStore.lightGizmo) {
                light.reservedDataStore.lightGizmo = new LightGizmo();
                this.lightGizmos.push(light.reservedDataStore.lightGizmo);
                light.reservedDataStore.lightGizmo.light = light;
                light.reservedDataStore.lightGizmo.material.reservedDataStore = { hidden: true };
                if (gizmoCamera) {
                    light.reservedDataStore.lightGizmo.gizmoLayer.setRenderCamera(gizmoCamera);
                }
            }
        } else if (light.reservedDataStore && light.reservedDataStore.lightGizmo) {
            this.lightGizmos.splice(this.lightGizmos.indexOf(light.reservedDataStore.lightGizmo), 1);
            light.reservedDataStore.lightGizmo.dispose();
            light.reservedDataStore.lightGizmo = null;
        }
    }
    // Camera gizmos
    public cameraGizmos: Array<CameraGizmo> = [];
    public enableCameraGizmo(camera: Camera, enable = true, gizmoCamera: Nullable<Camera> = null) {
        if (enable) {
            if (!camera.reservedDataStore) {
                camera.reservedDataStore = {};
            }
            if (!camera.reservedDataStore.cameraGizmo) {
                camera.reservedDataStore.cameraGizmo = new CameraGizmo();
                this.cameraGizmos.push(camera.reservedDataStore.cameraGizmo);
                camera.reservedDataStore.cameraGizmo.camera = camera;
                camera.reservedDataStore.cameraGizmo.material.reservedDataStore = { hidden: true };
                if (gizmoCamera) {
                    camera.reservedDataStore.cameraGizmo.gizmoLayer.setRenderCamera(gizmoCamera);
                }
            }
        } else if (camera.reservedDataStore && camera.reservedDataStore.cameraGizmo) {
            this.cameraGizmos.splice(this.cameraGizmos.indexOf(camera.reservedDataStore.cameraGizmo), 1);
            camera.reservedDataStore.cameraGizmo.dispose();
            camera.reservedDataStore.cameraGizmo = null;
        }
    }

    public onSceneExplorerClosedObservable = new Observable<void>();
    public onActionTabsClosedObservable = new Observable<void>();
}
