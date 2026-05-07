import { type AssetContainer } from "../assetContainer";

/**
 * Event data fired when a smart asset finishes loading successfully.
 */
export interface ISmartAssetLoadedEvent {
    /** The key of the loaded asset. */
    readonly key: string;

    /** The asset container produced by loading, or undefined for standalone textures. */
    readonly container?: AssetContainer;
}

/**
 * Event data fired when a smart asset key's URL is changed.
 */
export interface ISmartAssetUrlChangedEvent {
    /** The key whose URL changed. */
    readonly key: string;

    /** The previous URL. */
    readonly oldUrl: string;

    /** The new URL. */
    readonly newUrl: string;
}

/**
 * Event data fired when a smart asset fails to load.
 */
export interface ISmartAssetErrorEvent {
    /** The key of the asset that failed. */
    readonly key: string;

    /** The URL that was attempted. */
    readonly url: string;

    /** The error that occurred during loading. */
    readonly error: unknown;
}

/**
 * Event data fired when a smart asset is unloaded from the scene.
 */
export interface ISmartAssetUnloadedEvent {
    /** The key of the unloaded asset. */
    readonly key: string;
}
