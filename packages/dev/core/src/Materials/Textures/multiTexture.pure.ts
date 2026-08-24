/** This file must only contain pure code and pure imports */

import { type ThinEngine } from "../../Engines/thinEngine.pure";
import { Constants } from "../../Engines/constants";
import { Logger } from "../../Misc/logger";
import { ShaderLanguage } from "../../Materials/shaderLanguage";
import { type Nullable } from "../../types";
import { type Scene } from "../../scene.pure";
import { type IProceduralTextureCreationOptions, ProceduralTexture } from "./Procedurals/proceduralTexture.pure";
import { RawTexture2DArray } from "./rawTexture2DArray";
import { UploadImageToTexture2DArrayLayer } from "./rawTexture2DArray.functions";
import { Texture } from "./texture.pure";
/**
 * Options for creating a MultiTexture.
 */
export interface IMultiTextureOptions {
    /** Fixed layer resolution. REQUIRED. Positive integer. */
    width: number;
    /** Fixed layer resolution. REQUIRED. Positive integer. */
    height: number;
    /** Array depth to allocate. Default: urls.length. Must be \>= urls.length (else throw). */
    maxLayers?: number;
    /** Default MultiBlendMode.ALPHA_BLEND. */
    blendMode?: MultiBlendMode;
    /** Default false — the composite RTT itself never needs mips (consumed at 1:1 by materials). */
    generateMipMaps?: boolean;
    /** Default Texture.TRILINEAR_SAMPLINGMODE. Passed to RawTexture2DArray. */
    samplingMode?: number;
    /** Default false. Passed through to UploadImageToTexture2DArrayLayer. */
    premultiplyAlpha?: boolean;
    /** "resize" (default): decode-time rescale to width×height. "strict": reject mismatched dims. */
    fit?: "resize" | "strict";
    /** Composite RTT resolution = width*rttScale × height*rttScale. Default 1. */
    rttScale?: number;
    /** Default false. HEAD-polling change detection. */
    watch?: boolean;
    /** Default 2000 ms. Only used when watch is true. */
    pollInterval?: number;
    /** Fired once after all initial layers have settled (success or failure). */
    onLoad?: () => void;
    /** Fired on any async failure (init, updateLayer, poll). Not thrown. */
    onError?: (message?: string, exception?: any) => void;
}

/** Composite fragment shader name per blend mode (index aligned with MultiBlendMode). */
const FRAGMENT_NAMES = [
    "multiTextureCompositeAlphaBlend",
    "multiTextureCompositeAlphaMax",
    "multiTextureCompositeAdd",
    "multiTextureCompositeMultiply",
    "multiTextureCompositeSubtract",
    "multiTextureCompositeScreen",
];

/** Defines flag token per blend mode (index aligned with MultiBlendMode). Cache key only - referenced by no shader line. */
const MODE_FLAGS = ["ALPHA_BLEND", "ALPHA_MAX", "ADD", "MULTIPLY", "SUBTRACT", "SCREEN"];

/** Maximum number of in-flight decodes during initialization and watch polling. */
const DECODE_CONCURRENCY = 4;

/** Default watch-mode poll interval in milliseconds when options.pollInterval is omitted. */
const DEFAULT_POLL_INTERVAL_MS = 2000;

interface ILayerEntry {
    url: string;
    etag: string | null;
    lastModified: string | null;
    /** Always retained until replaced or disposed (enables cheap re-uploads on shift/reallocation). */
    bitmap: ImageBitmap | null;
    /** W*H*4 RGBA; null when the layer failed to load. */
    pixels: Uint8ClampedArray | null;
    /** False until the first successful upload. */
    loaded: boolean;
}

/**
 * Composes an array of image files into a single TEXTURE_2D_ARRAY and blends the layers per pixel
 * according to a selectable {@link MultiBlendMode}. The blended result is written to a render-target
 * texture that can be assigned to materials like any other texture.
 *
 * Requires a WebGL2 or WebGPU engine (TEXTURE_2D_ARRAY + sampler2DArray). The constructor throws
 * synchronously on WebGL1.
 *
 * Supported source formats are the raster formats your browser can decode with createImageBitmap
 * (PNG, JPEG, WebP, AVIF, GIF first frame, BMP). Compressed/container formats such as KTX2 are NOT
 * supported: the existing KTX2 transcode path goes straight to the GPU (which would bypass the
 * CPU pixel cache this class maintains), and KTX2 containers hold the whole array in a single file
 * (which conflicts with the one-file-per-layer-index update model).
 *
 * Notes:
 * - `url` is null (the base texture loader is not used); the `urls` property is the source of truth.
 * - By default every decoded layer is read back into a CPU `Uint8ClampedArray` (see `pixels`). This costs one canvas readback per upload.
 * - With `premultiplyAlpha: true` the GPU layers are stored premultiplied, but the CPU `pixels`
 *   cache still holds the raw decoded (non-premultiplied) bytes.
 * - The default ALPHA_BLEND mode folds the layers with a running mix: each layer is blended over
 *   the accumulated result using its own alpha (`result = mix(result, layer, layer.a)`), so later
 *   layers draw over earlier ones and a fully opaque layer hides everything below it.
 * - ALPHA_MAX picks the sample with the highest alpha; ties (equal alpha) resolve to the lowest
 *   layer index (URL order).
 * - With zero active layers, ALPHA_BLEND/ALPHA_MAX/ADD/SUBTRACT/SCREEN output transparent black
 *   and MULTIPLY outputs white (empty-product identity).
 * - Compositing is skipped while `scene.proceduralTexturesEnabled` is false (standard
 *   procedural-texture render-loop behavior).
 * - On WebGPU you must also import the WebGPU upload extension yourself:
 *   `import "core/Engines/WebGPU/Extensions/engine.texture2DArrayImageSource";`
 *   (the WebGL2 extension is imported automatically by the non-pure `multiTexture` entry).
 *
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures
 */
export class MultiTexture extends ProceduralTexture {
    private _layers: ILayerEntry[];
    private _layerCount: number;
    private _maxLayers: number;
    private _blendMode: MultiBlendMode;
    private _pollTimer: ReturnType<typeof setInterval> | null = null;
    private _canvas: Nullable<OffscreenCanvas | HTMLCanvasElement>;
    private _ctx: Nullable<CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D>;
    /** One-shot warning state per entry: avoids repeated error logging for persistently failing watched layers. */
    private _warnedLoadFailure: boolean[];
    private _disposed: boolean = false;
    private _mtOptions: IMultiTextureOptions;
    private _arrayTexture: RawTexture2DArray;

    /**
     * Number of active layers (drives the uLayerCount uniform). Changes only via addLayer/removeLayer.
     */
    public get layerCount(): number {
        return this._layerCount;
    }

    /**
     * The underlying TEXTURE_2D_ARRAY, for users who want to sample individual layers directly.
     */
    public get arrayTexture(): RawTexture2DArray {
        return this._arrayTexture;
    }

    /**
     * The input URLs, in layer order. Updated by addLayer/removeLayer/updateLayerAsync(url).
     */
    public readonly urls: string[];

    /**
     * CPU pixel cache. `pixels[i]` is a W*H*4 RGBA buffer or
     * layer i failed to load.
     */
    public readonly pixels: Array<Uint8ClampedArray | null>;

    /**
     * Creates a new MultiTexture.
     * @param name defines the name of the texture
     * @param urls defines the array of image URLs to load as layers
     * @param scene defines the hosting scene
     * @param options defines the creation options (width/height required)
     */
    constructor(name: string, urls: string[], scene: Scene, options: IMultiTextureOptions) {
        const engine = scene.getEngine();
        if (!engine || (!engine.isWebGPU && (engine as ThinEngine).webGLVersion < 2)) {
            throw new Error(
                "MultiTexture requires WebGL2 (TEXTURE_2D_ARRAY + sampler2DArray) or WebGPU. " +
                    "This context is WebGL1 or unavailable. Create the engine with WebGL2 enabled, e.g. " +
                    "new Engine(canvas, { webglVersion: 2 })."
            );
        }

        if (!Number.isInteger(options.width) || options.width <= 0 || !Number.isInteger(options.height) || options.height <= 0) {
            throw new Error("MultiTexture: width and height must be positive integers.");
        }

        if (options.maxLayers !== undefined && options.maxLayers < urls.length) {
            throw new Error(`MultiTexture: maxLayers (${options.maxLayers}) must be >= urls.length (${urls.length}).`);
        }

        const blendMode = options.blendMode ?? MultiBlendMode.ALPHA_BLEND;
        const maxLayers = options.maxLayers ?? urls.length;
        const rttW = Math.max(1, Math.round(options.width * (options.rttScale ?? 1)));
        const rttH = Math.max(1, Math.round(options.height * (options.rttScale ?? 1)));
        const generateMipMaps = options.generateMipMaps ?? false;
        const shaderLanguage = engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;

        const extraInitializationsAsync = async (): Promise<void> => {
            // Import ALL six fragment companions for this language so any later blend-mode swap
            // finds its source in the store. Static import list - do not build dynamic import paths from variables.
            if (shaderLanguage === ShaderLanguage.WGSL) {
                await Promise.all([
                    import("../../ShadersWGSL/multiTextureCompositeAlphaBlend.fragment"),
                    import("../../ShadersWGSL/multiTextureCompositeAlphaMax.fragment"),
                    import("../../ShadersWGSL/multiTextureCompositeAdd.fragment"),
                    import("../../ShadersWGSL/multiTextureCompositeMultiply.fragment"),
                    import("../../ShadersWGSL/multiTextureCompositeSubtract.fragment"),
                    import("../../ShadersWGSL/multiTextureCompositeScreen.fragment"),
                ]);
            } else {
                await Promise.all([
                    import("../../Shaders/multiTextureCompositeAlphaBlend.fragment"),
                    import("../../Shaders/multiTextureCompositeAlphaMax.fragment"),
                    import("../../Shaders/multiTextureCompositeAdd.fragment"),
                    import("../../Shaders/multiTextureCompositeMultiply.fragment"),
                    import("../../Shaders/multiTextureCompositeSubtract.fragment"),
                    import("../../Shaders/multiTextureCompositeScreen.fragment"),
                ]);
            }
        };

        const creationOptions: IProceduralTextureCreationOptions = {
            shaderLanguage,
            extraInitializationsAsync,
        };

        super(
            name,
            { width: rttW, height: rttH },
            FRAGMENT_NAMES[blendMode],
            scene,
            creationOptions,
            /*generateMipMaps*/ false,
            /*isCube*/ false,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );

        this._mtOptions = {
            ...options,
            maxLayers,
            blendMode,
            generateMipMaps,
            samplingMode: options.samplingMode ?? Texture.TRILINEAR_SAMPLINGMODE,
            premultiplyAlpha: options.premultiplyAlpha ?? false,
            fit: options.fit ?? "resize",
            rttScale: options.rttScale ?? 1,
            watch: options.watch ?? false,
            pollInterval: options.pollInterval ?? DEFAULT_POLL_INTERVAL_MS,
        };
        this._maxLayers = maxLayers;
        this._blendMode = blendMode;

        this._arrayTexture = new RawTexture2DArray(
            null,
            options.width,
            options.height,
            maxLayers,
            Constants.TEXTUREFORMAT_RGBA,
            scene,
            generateMipMaps,
            /*invertY*/ false,
            options.samplingMode ?? Texture.TRILINEAR_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );
        this._arrayTexture.name = `${this.name}_2DArray`;
        this._layers = urls.map((url) => ({ url, etag: null, lastModified: null, bitmap: null, pixels: null, loaded: false }));
        this._layerCount = this._layers.length;
        this.urls = urls.slice();
        this.pixels = new Array<Uint8ClampedArray | null>(this._layerCount).fill(null);
        this._warnedLoadFailure = new Array<boolean>(this._layerCount).fill(false);

        this.defines = this._buildDefines(maxLayers, MODE_FLAGS[blendMode]);
        this.setTexture("uLayers", this._arrayTexture);
        this.setInt("uLayerCount", this._layerCount);
        this.refreshRate = 0; // Render only when resetRefreshCounter() is called.

        let canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
        if (typeof OffscreenCanvas !== "undefined") {
            canvas = new OffscreenCanvas(options.width, options.height);
        } else if (typeof document !== "undefined") {
            canvas = document.createElement("canvas");
            canvas.width = options.width;
            canvas.height = options.height;
        }
        if (!canvas) {
            throw new Error("MultiTexture: no 2D canvas surface available (requires DOM or OffscreenCanvas).");
        }
        this._canvas = canvas;
        this._ctx = canvas.getContext("2d", { willReadFrequently: true }) || null;

        void this._initialize();
    }

    /**
     * How the layers combine. Setting it swaps the composite fragment shader and triggers one
     * re-composite.
     */
    public get blendMode(): MultiBlendMode {
        return this._blendMode;
    }

    public set blendMode(value: MultiBlendMode) {
        if (value === this._blendMode) {
            return;
        }
        this._blendMode = value;
        // Both lines are required: setFragment alone would keep the stale cached effect, because the
        // base class only rebuilds the effect when `defines` changes.
        this.setFragment(FRAGMENT_NAMES[value]);
        this.defines = this._buildDefines(this._maxLayers, MODE_FLAGS[value]);
        this.resetRefreshCounter();
    }

    /**
     * Replaces a layer by URL. Fetches, decodes and uploads layer i only.
     * Exactly one texSubImage3D is issued for the target layer; uLayerCount is unchanged.
     * @param index defines the layer index to replace
     * @param url defines the new source for the layer
     * @returns a promise resolving once the layer has been uploaded
     */
    public async updateLayerAsync(index: number, url: string): Promise<void> {
        if (!Number.isInteger(index) || index < 0 || index >= this._layerCount) {
            throw new RangeError(`MultiTexture: layer index ${index} out of range [0, ${this._layerCount}).`);
        }

        try {
            await this._loadLayer(index, url);
            this.urls[index] = url;
            this._layers[index].url = url;
            this._layers[index].etag = null;
            this._layers[index].lastModified = null;
        } catch (e) {
            this._reportError(e);
            throw e;
        }
    }

    /**
     * Appends a new layer at the end and returns its index. Grows the underlying array (doubling its
     * depth and re-uploading the existing layers from their retained bitmaps) when the current depth
     * is exhausted.
     * @param url defines the URL of the image to load as the new layer
     * @returns a promise resolving to the index of the new layer
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention -- public API name mandated by docs/plans/multi-texture-plan.md
    public async addLayer(url: string): Promise<number> {
        const newIndex = this._layerCount;

        try {
            if (newIndex >= this._maxLayers) {
                this._growArray();
            }
            this._pushLayerEntry(url);
            // The fragment shader only samples the first uLayerCount layers, so the uniform must
            // track the internal count or the freshly appended layer is never composited.
            this.setInt("uLayerCount", this._layerCount);
            await this._loadLayer(newIndex, url);
        } catch (e) {
            this._reportError(e);
            throw e;
        }

        return newIndex;
    }

    /**
     * Removes a layer. Higher indices shift down (re-uploaded from their retained bitmaps) and
     * uLayerCount is decremented.
     * @param index defines the layer index to remove
     * @returns a promise resolving once the shift is done
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention -- public API name mandated by docs/plans/multi-texture-plan.md
    public async removeLayer(index: number): Promise<void> {
        if (!Number.isInteger(index) || index < 0 || index >= this._layerCount) {
            throw new RangeError(`MultiTexture: layer index ${index} out of range [0, ${this._layerCount}).`);
        }

        const removed = this._layers.splice(index, 1)[0];
        this.pixels.splice(index, 1);
        this.urls.splice(index, 1);
        this._warnedLoadFailure.splice(index, 1);
        if (removed.bitmap) {
            removed.bitmap.close();
        }
        this._layerCount--;

        for (let j = index + 1; j < this._layerCount; j++) {
            const bitmap = this._layers[j - 1].bitmap;
            if (bitmap !== null) {
                UploadImageToTexture2DArrayLayer(this._arrayTexture, bitmap, j - 1, { premultiplyAlpha: this._mtOptions.premultiplyAlpha });
            }
        }

        this.setInt("uLayerCount", this._layerCount);
        this.resetRefreshCounter();
    }

    /**
     * Disposes the texture: stops the watch poller, closes every retained bitmap, disposes the layer
     * array and releases the composite render target through the standard procedural-texture path.
     */
    public override dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;

        if (this._pollTimer !== null) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }

        for (const entry of this._layers) {
            if (entry.bitmap) {
                entry.bitmap.close();
                entry.bitmap = null;
            }
            entry.pixels = null;
        }
        for (let i = 0; i < this.pixels.length; i++) {
            this.pixels[i] = null;
        }
        this._layers.length = 0;
        this._canvas = null;
        this._ctx = null;

        // Clear material slots that still reference us so materials re-derive their defines and
        // fall back to texture-less shader defaults (flat color) instead of binding the
        // destroyed texture and rendering black.
        const materialContainer = this.getScene()!.materials as unknown;
        const materialList = Array.isArray(materialContainer)
            ? (materialContainer as { getPropertiesNames?: () => string[] }[])
            : typeof (materialContainer as { get?: () => unknown[] })?.get === "function"
              ? ((materialContainer as { get: () => unknown[] }).get() as { getPropertiesNames?: () => string[] }[])
              : [];
        for (const material of materialList) {
            const record = material as unknown as Record<string, unknown>;
            const keys =
                typeof (material as { getPropertiesNames?: () => string[] }).getPropertiesNames === "function"
                    ? (material as { getPropertiesNames: () => string[] }).getPropertiesNames()
                    : Object.keys(record);
            for (const key of keys) {
                const slot = (record as Record<string, unknown>)[key];
                if ((key.endsWith("Texture") || key === "diffuseTexture") && slot === this) {
                    try {
                        (record as Record<string, unknown>)[key] = null;
                    } catch {
                        // Getter-only slot; best-effort clear.
                    }
                }
            }
        }

        this._arrayTexture.dispose();

        super.dispose();
    }

    private _buildDefines(maxLayers: number, flag: string): string {
        return (
            "#define MULTITEXTURE_MAXLAYERS " +
            maxLayers +
            "\n#define MULTITEXTURE_WIDTH " +
            this._mtOptions.width +
            "\n#define MULTITEXTURE_HEIGHT " +
            this._mtOptions.height +
            "\n#define MULTITEXTURE_BLEND_" +
            flag
        );
    }

    private _bitmapOptions(): ImageBitmapOptions {
        return this._mtOptions.fit === "resize" ? { resizeWidth: this._mtOptions.width, resizeHeight: this._mtOptions.height, resizeQuality: "high" } : {};
    }

    private _reportError(error: unknown): void {
        const message = String((error as { message?: unknown })?.message ?? error);
        Logger.Error(message);
        this._mtOptions.onError?.(message, error);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private async _loadLayer(index: number, url: string): Promise<void> {
        // Body runs across awaits; if dispose() wins the race, skip the fetch entirely.
        if (this._disposed) {
            return;
        }
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`MultiTexture: failed to fetch ${url}: ${response.status} ${response.statusText}`);
        }
        const etag = response.headers.get("etag");
        const lastModified = response.headers.get("last-modified");
        const blob = await response.blob();

        const bitmap = await createImageBitmap(blob, this._bitmapOptions());

        if (this._mtOptions.fit === "strict") {
            const width = bitmap.width;
            const height = bitmap.height;
            if (width !== this._mtOptions.width || height !== this._mtOptions.height) {
                bitmap.close();
                throw new Error(
                    `MultiTexture: layer ${index} (${url}) is ${width}x${height}, expected ${this._mtOptions.width}x${this._mtOptions.height}. Use fit: "resize" to auto-scale.`
                );
            }
        }

        this._uploadBitmap(index, bitmap, { etag, lastModified });
    }

    private _uploadBitmap(index: number, bitmap: ImageBitmap, meta: { etag: string | null; lastModified: string | null }): void {
        // If dispose() won the race, drop the decoded bitmap without touching the layer entry
        // (dispose clears _layers), the pixel cache, the refresh counter or the onLoad path:
        // the internal 2D array texture is already destroyed and upload would throw
        // "Cannot upload to a 2D array texture that has no internal texture".
        if (this._disposed) {
            bitmap.close();
            return;
        }

        UploadImageToTexture2DArrayLayer(this._arrayTexture, bitmap, index, { premultiplyAlpha: this._mtOptions.premultiplyAlpha });

        const entry = this._layers[index];

        if (this._canvas && this._ctx) {
            this._ctx.clearRect(0, 0, this._mtOptions.width, this._mtOptions.height);
            this._ctx.drawImage(bitmap, 0, 0, this._mtOptions.width, this._mtOptions.height);
            entry.pixels = this._ctx.getImageData(0, 0, this._mtOptions.width, this._mtOptions.height).data.slice();
        } else {
            entry.pixels = null;
        }

        if (entry.bitmap !== null) {
            entry.bitmap.close();
        }
        entry.bitmap = bitmap;
        entry.loaded = true;
        entry.etag = meta.etag;
        entry.lastModified = meta.lastModified;
        this._warnedLoadFailure[index] = false;
        this.pixels[index] = entry.pixels;

        this.resetRefreshCounter();
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private async _initialize(): Promise<void> {
        try {
            if (this._disposed) {
                // Dispose won the init race; leave the texture as-is, the object is dead.
                return;
            }
            const internal = this._arrayTexture.getInternalTexture();
            const mips = this._mtOptions.generateMipMaps ?? false;
            if (mips && internal) {
                internal.generateMipMaps = false;
            }

            let next = 0;
            const count = this._layers.length;
            const workerAsync = async (): Promise<void> => {
                let i: number;
                while ((i = next++) < count) {
                    try {
                        // eslint-disable-next-line no-await-in-loop -- decode pool: each worker processes layers sequentially.
                        await this._loadLayer(i, this._layers[i].url);
                    } catch (e) {
                        this._reportError(e);
                    }
                }
            };
            const workers: Promise<void>[] = [];
            for (let w = 0; w < DECODE_CONCURRENCY; w++) {
                workers.push(workerAsync());
            }
            await Promise.all(workers);

            if (!this._disposed && mips && internal) {
                internal.generateMipMaps = true;
                this.getScene()!.getEngine().generateMipmaps(internal);
            }

            if (!this._disposed) {
                this.onLoadObservable.notifyObservers(this);
                this._mtOptions.onLoad?.();

                this.resetRefreshCounter();
            }
            if (this._mtOptions.watch) {
                this._startPolling();
            }
        } catch (e) {
            this._reportError(e);
        }
    }

    private _pushLayerEntry(url: string): void {
        this._layers.push({ url, etag: null, lastModified: null, bitmap: null, pixels: null, loaded: false });
        this.pixels.push(null);
        this.urls.push(url);
        this._warnedLoadFailure.push(false);
        this._layerCount++;
    }

    private _growArray(): void {
        const scene = this.getScene()!;
        const newDepth = this._maxLayers * 2;

        const newRaw = new RawTexture2DArray(
            null,
            this._mtOptions.width,
            this._mtOptions.height,
            newDepth,
            Constants.TEXTUREFORMAT_RGBA,
            scene,
            this._mtOptions.generateMipMaps ?? false,
            /*invertY*/ false,
            this._mtOptions.samplingMode ?? Texture.TRILINEAR_SAMPLINGMODE,
            Constants.TEXTURETYPE_UNSIGNED_BYTE
        );

        for (let i = 0; i < this._layerCount; i++) {
            const bitmap = this._layers[i].bitmap;
            if (bitmap !== null) {
                UploadImageToTexture2DArrayLayer(newRaw, bitmap, i, { premultiplyAlpha: this._mtOptions.premultiplyAlpha });
            }
        }

        this._arrayTexture.dispose();
        this._arrayTexture = newRaw;

        this.setTexture("uLayers", newRaw);

        this._maxLayers = newDepth;

        // The loop-bound define changed, so the effect must rebuild with the wider loop.
        this.defines = this._buildDefines(newDepth, MODE_FLAGS[this._blendMode]);
    }

    private _startPolling(): void {
        if (this._pollTimer !== null || this._disposed) {
            return;
        }
        this._pollTimer = setInterval(() => {
            void this._poll();
        }, this._mtOptions.pollInterval);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private async _poll(): Promise<void> {
        if (this._disposed) {
            return;
        }
        if (typeof document !== "undefined" && document.visibilityState === "hidden") {
            return;
        }

        let next = 0;
        const count = this._layers.length;
        const workerAsync = async (): Promise<void> => {
            let i: number;
            while ((i = next++) < count) {
                const entry = this._layers[i];
                try {
                    if (entry.etag === null && entry.lastModified === null) {
                        // No etag/last-modified recorded for this entry — either it never loaded or
                        // the server sends no validators. HEAD-based change detection cannot apply,
                        // so retry a direct full load (a 404 at startup that is published later
                        // recovers this way instead of being skipped forever).
                        try {
                            // eslint-disable-next-line no-await-in-loop -- full-load retry, same pool as the HEAD checks below.
                            await this._loadLayer(i, entry.url);
                        } catch (e) {
                            // Persistently failing layer: warn once, retry on the next tick.
                            if (!this._warnedLoadFailure[i]) {
                                this._warnedLoadFailure[i] = true;
                                const message = `MultiTexture: watched layer ${i} (${entry.url}) failed to load: ${String((e as { message?: unknown })?.message ?? e)}`;
                                Logger.Error(message);
                                this._mtOptions.onError?.(message);
                            }
                        }
                        continue;
                    }

                    // eslint-disable-next-line no-await-in-loop -- poll pool: each worker checks layers sequentially.
                    const response = await fetch(entry.url, { method: "HEAD" });

                    if (response.status === 404) {
                        if (!this._warnedLoadFailure[i]) {
                            this._warnedLoadFailure[i] = true;
                            const message = `MultiTexture: watched layer ${i} (${entry.url}) returned 404.`;
                            Logger.Error(message);
                            this._mtOptions.onError?.(message);
                        }
                        continue;
                    }

                    if (!response.ok) {
                        // Transient failure: ignore for this tick.
                        continue;
                    }

                    const etag = response.headers.get("etag");
                    const lastModified = response.headers.get("last-modified");
                    if (etag === null && lastModified === null) {
                        // Change detection is unavailable for this entry (server sends no
                        // etag/last-modified); nothing to compare against — skip.
                        continue;
                    }

                    if ((etag !== null && etag !== entry.etag) || (lastModified !== null && lastModified !== entry.lastModified)) {
                        try {
                            // eslint-disable-next-line no-await-in-loop -- reload happens after the HEAD check above.
                            await this._loadLayer(i, entry.url);
                        } catch (e) {
                            this._reportError(e);
                        }
                    }
                } catch {
                    // Transient fetch failure: ignore for this tick.
                }
            }
        };

        const workers: Promise<void>[] = [];
        for (let w = 0; w < DECODE_CONCURRENCY; w++) {
            workers.push(workerAsync());
        }
        await Promise.all(workers);
    }
}

/**
 * Blend modes controlling how the layers of a MultiTexture are combined per pixel.
 */
export enum MultiBlendMode {
    /**
     * Default. Folds the layers with a running mix: each layer i is blended over the accumulated
     * result using its own alpha, `result = mix(result, layer, layer.a)`. Later layers are drawn
     * over earlier ones; a fully opaque layer (a = 1) completely covers everything below it.
     * Zero active layers output transparent black.
     */
    ALPHA_BLEND = 0,
    /** Keeps the sample with the highest alpha among the layers (ties: lowest index wins). Zero active layers output transparent black. */
    ALPHA_MAX = 1,
    /** Adds all layers per channel, clamped to 1. */
    ADD = 2,
    /** Multiplies all layers per channel (empty product is 1). */
    MULTIPLY = 3,
    /** Starts from layer 0 and subtracts every following layer, clamped to 0. */
    SUBTRACT = 4,
    /** Screens all layers per channel. */
    SCREEN = 5,
}
