import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture";
import type { ConnectionPointType, InputBlock, InputBlockEditorData } from "@babylonjs/smart-filters";
import type { Observable } from "@babylonjs/core/Misc/observable";
import { loadTextureInputBlockAsset } from "./editorTextureLoaders.js";

/**
 * An entry in the texture asset cache.
 */
type CacheEntry = {
    /**
     * The key for the cache entry.
     */
    key: InputBlockEditorData<ConnectionPointType.Texture>;

    /**
     * The texture for the cache entry.
     */
    texture: ThinTexture;

    /**
     * The dispose function for the cache entry.
     */
    dispose: () => void;

    /**
     * If true, the cache entry is still used.
     */
    stillUsed: boolean;
};

/**
 * Tracks assets loaded for a SmartFilter, such as images and videos.
 * When a SmartFilter is reloaded, this cache helps reuse previously loaded assets
 * while ensuring previously loaded assets that are no longer used are disposed.
 */
export class TextureAssetCache {
    private _cache: CacheEntry[] = [];
    private readonly _engine: ThinEngine;
    private readonly _beforeRenderObservable: Observable<void>;

    /**
     * Creates a new texture asset cache.
     * @param engine - The engine to use to load the assets.
     * @param beforeRenderObservable - The observable to use to notify when the engine is about to render a frame.
     */
    constructor(engine: ThinEngine, beforeRenderObservable: Observable<void>) {
        this._engine = engine;
        this._beforeRenderObservable = beforeRenderObservable;
    }

    /**
     * Loads the assets for the given input blocks, using the cache if possible.
     * @param inputBlocks - The input blocks to load assets for.
     */
    public async loadAssetsForInputBlocks(inputBlocks: InputBlock<ConnectionPointType.Texture>[]) {
        // Set all entries to be unused
        for (const entry of this._cache) {
            entry.stillUsed = false;
        }

        for (const inputBlock of inputBlocks) {
            const editorData = inputBlock.editorData;

            if (!editorData) {
                continue;
            }

            const cacheEntry = this._cache.find(
                (entry) =>
                    entry.key.url === editorData.url &&
                    entry.key.urlTypeHint === editorData.urlTypeHint &&
                    entry.key.anisotropicFilteringLevel === editorData.anisotropicFilteringLevel &&
                    entry.key.flipY === editorData.flipY &&
                    entry.key.forcedExtension === editorData.forcedExtension
            );

            if (cacheEntry) {
                // Cache hit: mark as still used and set the texture
                cacheEntry.stillUsed = true;
                inputBlock.output.runtimeData.value = cacheEntry.texture;
            } else {
                // Cache miss: try to load the asset
                const result = await loadTextureInputBlockAsset(inputBlock, this._engine, this._beforeRenderObservable);

                // If the asset was loaded, add it to the cache
                if (result) {
                    this._cache.push({
                        key: {
                            ...editorData,
                        },
                        texture: result.texture,
                        dispose: result.dispose,
                        stillUsed: true,
                    });
                }
            }
        }

        // Dispose all entries that are no longer used
        let cacheEntry: CacheEntry | undefined;
        for (let index = this._cache.length - 1; index >= 0; index--) {
            cacheEntry = this._cache[index];
            if (cacheEntry?.stillUsed === false) {
                cacheEntry.dispose();
                this._cache.splice(index, 1);
            }
        }
    }

    public dispose(): void {
        for (const entry of this._cache) {
            entry.dispose();
        }
        this._cache.length = 0;
    }
}
