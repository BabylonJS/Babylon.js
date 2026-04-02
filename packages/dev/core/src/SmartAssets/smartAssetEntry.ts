import type { AssetContainer } from "../assetContainer";

/**
 * Options for configuring a smart asset entry.
 * These provide hints for loader selection and allow arbitrary user metadata.
 */
export interface ISmartAssetOptions {
    /**
     * Loader type hint (e.g., "gltf", "texture", "nodeMaterial").
     * When provided, takes priority over extension-based inference.
     */
    readonly type?: string;

    /**
     * File extension hint for loader selection (e.g., ".glb", ".png").
     * Used when the URL does not have a clear file extension.
     */
    readonly extension?: string;

    /**
     * User-defined metadata associated with this asset.
     */
    readonly metadata?: Record<string, unknown>;
}

/**
 * Represents the loading state of a smart asset.
 */
export enum SmartAssetLoadState {
    /** The asset is registered but has not been loaded. */
    NotLoaded = 0,
    /** The asset is currently being loaded. */
    Loading = 1,
    /** The asset has been successfully loaded and added to the scene. */
    Loaded = 2,
    /** The asset failed to load. */
    Error = 3,
}

/**
 * Describes a registered smart asset entry in the asset table.
 * Each entry maps a unique string key to an asset URL and tracks its load state.
 */
export interface ISmartAssetEntry {
    /** Unique string key identifying this asset. */
    readonly key: string;

    /** URL or path to the asset file. */
    readonly url: string;

    /** Configuration options for this entry. */
    readonly options: Readonly<ISmartAssetOptions>;

    /** Current loading state of the asset. */
    readonly loadState: SmartAssetLoadState;

    /**
     * The loaded asset container, or null if the asset is not loaded.
     * For scene-file types (GLB, glTF), this is the container returned by LoadAssetContainerAsync.
     * For standalone types (textures), this is a synthetic container wrapping the loaded object.
     */
    readonly container: AssetContainer | null;
}
