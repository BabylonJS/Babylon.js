import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import type { IService } from "../../../modularity/serviceDefinition";
import type { ISceneContext } from "../../sceneContext";
import { SceneContextIdentity } from "../../sceneContext";
import type { Observable } from "core/Misc/observable";
import { Observable as BabylonObservable } from "core/Misc/observable";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { GLTFFileLoader, IGLTFLoaderExtension } from "loaders/glTF/glTFFileLoader";
import { GLTFLoaderAnimationStartMode, GLTFLoaderCoordinateSystemMode } from "loaders/glTF/glTFFileLoader";
import type { IGLTFValidationResults } from "babylonjs-gltf2interface";
import type { Nullable } from "core/types";

export const GLTFLoaderServiceIdentity = Symbol("GLTFLoaderService");

/**
 * Configuration state for the glTF loader.
 * Uses the actual property types from GLTFFileLoader for type safety.
 */
export type IGLTFLoaderState = Pick<
    GLTFFileLoader,
    | "alwaysComputeBoundingBox"
    | "alwaysComputeSkeletonRootNode"
    | "animationStartMode"
    | "capturePerformanceCounters"
    | "compileMaterials"
    | "compileShadowGenerators"
    | "coordinateSystemMode"
    | "createInstances"
    | "loggingEnabled"
    | "loadAllMaterials"
    | "targetFps"
    | "transparencyAsCoverage"
    | "useClipPlane"
    | "useSRGBBuffers"
>;

/**
 * State for a single glTF extension.
 * Uses the actual enabled property from IGLTFLoaderExtension with additional extension-specific properties.
 */
export type IGLTFExtensionState = Pick<IGLTFLoaderExtension, "enabled"> & {
    /** Additional extension-specific properties */
    [key: string]: any;
};

/**
 * Collection of extension states keyed by extension name
 */
export interface IGLTFExtensionStates {
    [key: string]: IGLTFExtensionState;
}

/**
 * Service for managing all aspects of the glTF loader including configuration,
 * extensions, validation, and plugin lifecycle
 */
export interface IGLTFLoaderService extends IService<typeof GLTFLoaderServiceIdentity> {
    // Plugin lifecycle
    /**
     * Observable that fires when a glTF loader plugin is activated
     */
    readonly onLoaderActivatedObservable: Observable<GLTFFileLoader>;

    // Loader configuration
    /**
     * Observable that fires when loader configuration changes
     */
    readonly onLoaderConfigChangedObservable: Observable<IGLTFLoaderState>;

    /**
     * Get the current loader configuration
     */
    getLoaderConfig(): IGLTFLoaderState;

    /**
     * Update a specific loader configuration property
     */
    updateLoaderConfig<K extends keyof IGLTFLoaderState>(key: K, value: IGLTFLoaderState[K]): void;

    // Extensions configuration
    /**
     * Observable that fires when extension configuration changes
     */
    readonly onExtensionConfigChangedObservable: Observable<IGLTFExtensionStates>;

    /**
     * Get the current extension configurations
     */
    getExtensionStates(): IGLTFExtensionStates;

    /**
     * Update a specific extension's enabled state
     */
    updateExtensionState(extensionName: string, enabled: boolean): void;

    /**
     * Update a specific property on an extension
     */
    updateExtensionProperty<K extends string>(extensionName: string, property: K, value: any): void;

    // Validation
    /**
     * Observable that fires when new validation results are received
     */
    readonly onValidationResultsObservable: Observable<Nullable<IGLTFValidationResults>>;

    /**
     * Get the most recent validation results
     */
    getValidationResults(): Nullable<IGLTFValidationResults>;
}

/**
 * Creates default glTF loader state
 * @returns Default loader configuration
 */
const CreateDefaultLoaderState = (): IGLTFLoaderState => ({
    alwaysComputeBoundingBox: false,
    alwaysComputeSkeletonRootNode: false,
    animationStartMode: GLTFLoaderAnimationStartMode.FIRST,
    capturePerformanceCounters: false,
    compileMaterials: false,
    compileShadowGenerators: false,
    coordinateSystemMode: GLTFLoaderCoordinateSystemMode.AUTO,
    createInstances: true,
    loggingEnabled: false,
    loadAllMaterials: false,
    targetFps: 60,
    transparencyAsCoverage: false,
    useClipPlane: false,
    useSRGBBuffers: false,
});

/**
 * Creates default extension states
 * @returns Default extension configuration
 */
const CreateDefaultExtensionStates = (): IGLTFExtensionStates => {
    /* eslint-disable @typescript-eslint/naming-convention */
    return {
        EXT_lights_image_based: { enabled: true },
        EXT_mesh_gpu_instancing: { enabled: true },
        EXT_texture_webp: { enabled: true },
        EXT_texture_avif: { enabled: true },
        KHR_draco_mesh_compression: { enabled: true },
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
        KHR_materials_diffuse_transmission: { enabled: true },
        KHR_materials_volume: { enabled: true },
        KHR_materials_dispersion: { enabled: true },
        KHR_materials_diffuse_roughness: { enabled: true },
        KHR_mesh_quantization: { enabled: true },
        KHR_lights_punctual: { enabled: true },
        EXT_lights_area: { enabled: true },
        KHR_texture_basisu: { enabled: true },
        KHR_texture_transform: { enabled: true },
        KHR_xmp_json_ld: { enabled: true },
        MSFT_lod: { enabled: true, maxLODsToLoad: Number.MAX_VALUE },
        MSFT_minecraftMesh: { enabled: true },
        MSFT_sRGBFactors: { enabled: true },
        MSFT_audio_emitter: { enabled: true },
    };
};

/**
 * Unified service for managing all aspects of the glTF loader
 */
export const GLTFLoaderServiceDefinition: ServiceDefinition<[IGLTFLoaderService], [ISceneContext]> = {
    friendlyName: "glTF Loader",
    produces: [GLTFLoaderServiceIdentity],
    consumes: [SceneContextIdentity],
    factory: (_sceneContext) => {
        // Plugin lifecycle
        const onLoaderActivatedObservable = new BabylonObservable<GLTFFileLoader>();

        // Loader configuration
        const onLoaderConfigChangedObservable = new BabylonObservable<IGLTFLoaderState>();
        let loaderState = CreateDefaultLoaderState();

        // Extensions configuration
        const onExtensionConfigChangedObservable = new BabylonObservable<IGLTFExtensionStates>();
        let extensionStates = CreateDefaultExtensionStates();

        // Validation
        const onValidationResultsObservable = new BabylonObservable<Nullable<IGLTFValidationResults>>();
        let validationResults: Nullable<IGLTFValidationResults> = null;

        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Subscribe to loader
                loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
                    validationResults = results;
                    onValidationResultsObservable.notifyObservers(results);
                });

                // Subscribe to extension loading
                loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
                    const extensionState = extensionStates[extension.name];
                    if (extensionState) {
                        // Apply all extension properties
                        Object.keys(extensionState).forEach((key) => {
                            (extension as any)[key] = extensionState[key];
                        });
                    }
                });

                // Apply loader configuration
                Object.keys(loaderState).forEach((key) => {
                    (loader as any)[key] = loaderState[key as keyof IGLTFLoaderState];
                });

                // Always enable validation to provide feedback in the UI
                // This ensures validation results are available regardless of user settings
                loader.validate = true;

                // Notify observers after everything is set up
                onLoaderActivatedObservable.notifyObservers(loader);
            }
        });

        return {
            // Plugin lifecycle
            onLoaderActivatedObservable,

            // Loader configuration
            onLoaderConfigChangedObservable,

            getLoaderConfig: () => ({ ...loaderState }),

            updateLoaderConfig: <K extends keyof IGLTFLoaderState>(key: K, value: IGLTFLoaderState[K]) => {
                loaderState = { ...loaderState, [key]: value };
                onLoaderConfigChangedObservable.notifyObservers(loaderState);
            },

            // Extensions configuration
            onExtensionConfigChangedObservable,

            getExtensionStates: () => {
                // Return a deep copy to prevent external mutation
                return JSON.parse(JSON.stringify(extensionStates));
            },

            updateExtensionState: (extensionName: string, enabled: boolean) => {
                // Ensure extension state exists before updating
                const currentState = extensionStates[extensionName] ?? { enabled: true };
                extensionStates = {
                    ...extensionStates,
                    [extensionName]: { ...currentState, enabled },
                };
                onExtensionConfigChangedObservable.notifyObservers(extensionStates);
            },

            updateExtensionProperty: <K extends string>(extensionName: string, property: K, value: any) => {
                // Ensure extension state exists before updating
                const currentState = extensionStates[extensionName] ?? { enabled: true };
                extensionStates = {
                    ...extensionStates,
                    [extensionName]: { ...currentState, [property]: value },
                };
                onExtensionConfigChangedObservable.notifyObservers(extensionStates);
            },

            // Validation
            onValidationResultsObservable,

            getValidationResults: () => validationResults,

            dispose: () => {
                pluginObserver.remove();
                onLoaderActivatedObservable.clear();
                onLoaderConfigChangedObservable.clear();
                onExtensionConfigChangedObservable.clear();
                onValidationResultsObservable.clear();
            },
        };
    },
};
