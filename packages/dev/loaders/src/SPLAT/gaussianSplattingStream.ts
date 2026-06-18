import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type IGaussianSplattingSplatRange } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { Vector3, Matrix } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import { Frustum } from "core/Maths/math.frustum";
import { Plane } from "core/Maths/math.plane";
import { Camera } from "core/Cameras/camera";
import { type Observer } from "core/Misc/observable";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { CreateLineSystem } from "core/Meshes/Builders/linesBuilder";
import { type LinesMesh } from "core/Meshes/linesMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { ParseSogMetaAsTextures, type SOGRootData } from "./sog";
import { GaussianSplattingWorkBuffer } from "./gaussianSplattingWorkBuffer";
import { GaussianSplattingDownloadManager } from "./gaussianSplattingDownloadManager";
import { GaussianSplattingResidencyController } from "./gaussianSplattingResidencyController";
import { type ISogTexturePack } from "./splatDefs";

/**
 * A single LOD variant of a tree node: a contiguous splat range inside one streamed SOG file.
 */
interface ISOGLODEntry {
    /** Index into {@link ISOGLODMetadata.filenames}. */
    file: number;
    /** First splat index inside that file. */
    offset: number;
    /** Number of splats. */
    count: number;
}

/**
 * A node of the PlayCanvas-style SOG LOD octree. Internal nodes have `children`; leaves have `lods`.
 */
interface ISOGLODNode {
    bound: { min: number[]; max: number[] };
    children?: ISOGLODNode[];
    lods?: { [level: string]: ISOGLODEntry };
    /** LOD level currently streamed/rendered for this node, or undefined until its base LOD is ready. */
    activeLod?: number;
    /** Distance-based ideal LOD level for this node, recomputed per frame. */
    optimalLod?: number;
    /** Available LOD levels for this leaf, sorted ascending (0 = finest). Set during the tree walk. */
    availableLevels?: number[];
    /** Coarsest available level (= max key), always streamed as the permanent base layer. */
    baseLod?: number;
    /** Final LOD level the node should stream/render (distance optimal, capped by maxDetailLod). */
    targetLevel?: number;
    /** Frames remaining before this node may switch LOD again (oscillation damping). */
    lodCooldown?: number;
    /** True when the node's bounding box currently intersects the camera frustum. Drives the LOD bias that
     * pushes off-screen nodes to the coarsest level (they stay rendered, not hidden). */
    inFrustum?: boolean;
    /** Cached local-space bounding info used for the per-node frustum test (created once per leaf). */
    cullBounds?: BoundingInfo;
    /** File index this node currently has an in-flight/queued decode request for (its not-yet-decoded target),
     * or undefined when the node's target is already decoded. Drives pending-download reference counting. */
    pendingFile?: number;
    /** File index this node's current {@link activeLod} renders from, or undefined before any LOD is active.
     * Drives the resident reference count that keeps a file in the work buffer. */
    activeFile?: number;
}

/**
 * Parsed contents of a PlayCanvas-style `lod-meta.json` file.
 */
export interface ISOGLODMetadata {
    /** Number of LOD levels (0 = highest detail). */
    lodLevels: number;
    /** SOG `meta.json` paths, relative to the metadata file, indexed by `ISOGLODEntry.file`. */
    filenames: string[];
    /** Optional always-on environment `.sog` bundle, relative to the metadata file. */
    environment?: string;
    /** Root of the LOD octree. */
    tree: ISOGLODNode;
}

/**
 * Selects which LOD value drives the {@link GaussianSplattingStream} debug wireframe colors.
 */
export type GaussianSplattingStreamDebugLodSource = "optimal" | "current";

/**
 * Options for {@link GaussianSplattingStream}.
 */
export interface IGaussianSplattingStreamOptions {
    /** URL of the fflate UMD module used to unzip `.sog` environment bundles. */
    deflateURL?: string;
    /** Pre-loaded fflate module. */
    fflate?: any;
    /** When true, renders a wireframe box per LOD node, colored by the node's LOD level. */
    debugDisplay?: boolean;
    /** Which LOD value drives the debug wireframe colors. Defaults to `"optimal"`. */
    debugLodSource?: GaussianSplattingStreamDebugLodSource;
    /** Distance (in local units) of the first LOD transition. PlayCanvas default `5`. */
    lodBaseDistance?: number;
    /** Geometric ratio between successive LOD transition distances. PlayCanvas default `3`. */
    lodMultiplier?: number;
    /** Distance multiplier applied to nodes behind the camera (`1` = no penalty). PlayCanvas default `1`. */
    lodBehindPenalty?: number;
    /** Lowest LOD index the optimal-LOD heuristic may select. Defaults to `0`. */
    lodRangeMin?: number;
    /** Highest LOD index the optimal-LOD heuristic may select. Defaults to `lodLevels - 1`. */
    lodRangeMax?: number;
    /** Maximum number of LOD source files to GPU-decode per frame (spreads work to avoid hitches). Defaults to `1`. */
    maxDecodesPerFrame?: number;
    /** Frames a node must wait after switching LOD before it may switch again (oscillation damping). Defaults to `10`. */
    lodCooldownFrames?: number;
    /** Minimum number of frames between LOD re-evaluations (throttles per-frame work during motion). Defaults to `4`. */
    lodUpdateInterval?: number;
    /** Minimum camera movement (world units) required to re-evaluate LODs. Defaults to `0.5`. */
    lodUpdateDistance?: number;
    /**
     * Finest (most detailed) LOD level any node is allowed to render. `0` allows full detail (level 0);
     * `1` caps detail at the next-coarser level, and so on. Higher values force a coarser maximum detail.
     */
    maxDetailLod?: number;
    /**
     * When true (default), LOD nodes outside the camera frustum are biased to their coarsest LOD rather than
     * rendered at full detail. They stay in the sort/render set so they appear instantly (at low detail) when
     * the camera turns toward them, then refine. Set to `false` to render every node at its distance LOD.
     */
    frustumCulling?: boolean;
    /** Maximum number of LOD file downloads allowed to run concurrently. PlayCanvas default `2`. */
    maxConcurrentDownloads?: number;
    /** Number of times a failed file download is retried before giving up. PlayCanvas default `2`. */
    maxDownloadRetries?: number;
    /**
     * GPU memory budget (in megabytes) for resident splats. When set (and smaller than the full dataset),
     * LOD files are streamed through a fixed-size work buffer and unreferenced files are evicted to stay
     * within budget, allowing datasets larger than a single full-dataset buffer. Converted to a splat count
     * at ~84 bytes/splat. Combined with {@link maxResidentSplats} by taking the smaller of the two.
     */
    memoryBudgetMb?: number;
    /**
     * Maximum number of splats kept resident in the work buffer. When set (and smaller than the full
     * dataset), enables eviction-based streaming (see {@link memoryBudgetMb}). Default unset = size the work
     * buffer for the whole dataset (no eviction).
     */
    maxResidentSplats?: number;
    /**
     * Frames an unreferenced (no longer rendered) LOD file stays resident before it is evicted, so a quick
     * return to it avoids a re-download. Only used when a budget enables eviction. PlayCanvas default `100`.
     */
    evictionCooldownFrames?: number;
}

// tan(22.5deg): reference half-FOV for a 45-degree vertical FOV, used for FOV compensation (matches PlayCanvas).
const RefTanHalfFov = Math.tan((22.5 * Math.PI) / 180);

// Sentinel "file" ids for the residency controller's pinned (never-evicted) allocations.
const PaddingFileId = -2;
const EnvironmentFileId = -1;
// Approximate bytes per resident splat used to convert a memory budget (MB) to a splat budget: the four
// work-buffer textures cost 16+16+16+4 = 52 bytes on the GPU, plus ~32 bytes of CPU position/sort data.
const BytesPerResidentSplat = 84;

// Scratch objects reused by the per-frame optimal-LOD evaluation (avoids per-call allocations).
const TmpInvWorld = new Matrix();
const TmpLocalCamera = new Vector3();
const TmpLocalForward = new Vector3();
const TmpWorldForward = new Vector3();
// Camera-local forward axis (+Z) used to derive the world-space view direction.
const LocalForwardAxis = new Vector3(0, 0, 1);

// The 12 edges of a box, as index pairs into its 8 corners. 12 edges x 2 endpoints = 24 vertices per box.
const BoxEdges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
];
// Vertices generated per leaf box (BoxEdges.length * 2).
const VerticesPerBox = BoxEdges.length * 2;

/**
 * Wireframe colors per LOD level (cycled by `node.activeLod`).
 */
const GsLodDebugColors = [
    new Color4(1.0, 0.2, 0.2, 1.0), // LOD 0 - red
    new Color4(1.0, 0.6, 0.1, 1.0), // LOD 1 - orange
    new Color4(1.0, 1.0, 0.2, 1.0), // LOD 2 - yellow
    new Color4(0.3, 1.0, 0.3, 1.0), // LOD 3 - green
    new Color4(0.2, 1.0, 1.0, 1.0), // LOD 4 - cyan
    new Color4(0.4, 0.5, 1.0, 1.0), // LOD 5 - blue
    new Color4(0.9, 0.4, 1.0, 1.0), // LOD 6 - magenta
    new Color4(1.0, 1.0, 1.0, 1.0), // LOD 7 - white
];

/**
 * Streams a PlayCanvas-style SOG LOD scene (`lod-meta.json`) into a single Gaussian Splatting mesh.
 *
 * Each selected SOG file (plus the environment) is loaded directly as GPU textures and decoded on the
 * GPU into one unified, PlayCanvas-style square work buffer (no CPU splat decode or `updateData`). Only
 * the splats of each node's currently-selected LOD are rendered/sorted via the mesh's interval filter.
 *
 * The coarsest (least-detail) LOD of every node is streamed first as a permanent base layer so the whole
 * scene is visible quickly with no holes. A distance-based "optimal" LOD is then computed per node (see
 * {@link evaluateOptimalLods}); finer LOD source files are streamed on demand and a node only switches to
 * a finer LOD once that file is decoded, so transitions never flash or leave gaps.
 *
 * @experimental
 */
export class GaussianSplattingStream extends GaussianSplattingMesh {
    private readonly _metadata: ISOGLODMetadata;
    private readonly _rootUrl: string;
    private readonly _streamOptions: IGaussianSplattingStreamOptions;

    // Flat list of leaf nodes that carry renderable LOD entries (used by the LOD heuristic and debug).
    private readonly _leafNodes: ISOGLODNode[] = [];

    // LOD heuristic parameters (PlayCanvas-aligned defaults).
    private _lodBaseDistance = 5;
    private _lodMultiplier = 3;
    private _lodBehindPenalty = 1;
    private _lodRangeMin = 0;
    private _lodRangeMax: number;
    private _maxDecodesPerFrame = 1;
    private _lodCooldownFrames = 10;
    // Minimum frames between LOD re-evaluations, and minimum camera movement (world units) to re-evaluate.
    private _lodUpdateInterval = 4;
    private _lodUpdateDistance = 0.5;
    private _maxDetailLod = 0;

    // Frustum LOD bias: when enabled, nodes outside the camera frustum are rendered at their coarsest LOD.
    private _frustumCulling = true;
    // Reused world-space frustum planes and view-projection scratch matrix (avoids per-frame allocation).
    private readonly _frustumPlanes: Plane[] = [
        new Plane(0, 0, 0, 0),
        new Plane(0, 0, 0, 0),
        new Plane(0, 0, 0, 0),
        new Plane(0, 0, 0, 0),
        new Plane(0, 0, 0, 0),
        new Plane(0, 0, 0, 0),
    ];
    private readonly _cullViewProj = new Matrix();

    // GPU work buffer holding all decoded splats; created once the total capacity is known.
    private _workBuffer: Nullable<GaussianSplattingWorkBuffer> = null;
    // True once GPU position readback has been validated against a CPU decode (see _probeReadbackAsync). While
    // false, positions are decoded on the CPU from the means images; once validated, every SOG image uses the
    // fast direct upload and positions are read back from the work buffer (non-blocking).
    private _useGpuPositionReadback = false;
    // Whether the engine reports GPU readback support (candidate to validate on the first decode).
    private _readbackCandidate = false;
    // Set once the one-time readback validation has run (success or failure).
    private _readbackProbed = false;

    // Residency controller: owns the work-buffer slot allocator, per-file blocks, and eviction cooldowns.
    private _residency: Nullable<GaussianSplattingResidencyController> = null;
    // Splat count of each source file (learned from its metadata before allocation).
    private readonly _fileCounts = new Map<number, number>();
    // Cached SOG metadata per file so on-demand decodes don't refetch the meta.json.
    private readonly _fileMeta = new Map<number, { sogData: SOGRootData; subRootUrl: string }>();
    // Files whose splats have been fully GPU-decoded into the work buffer (render-safe).
    private readonly _decodedFiles = new Set<number>();
    // Files whose decode is currently in flight (dedupes concurrent requests).
    private readonly _loadingFiles = new Set<number>();
    // FIFO of file ids waiting to be decoded (drained under a per-frame budget).
    private readonly _decodeQueue: number[] = [];
    // Per-file reference count: number of leaf nodes whose active LOD renders, or whose pending target points
    // at, each file. At zero, a decoded file is scheduled for eviction and a still-downloading file is cancelled.
    private readonly _fileRefs = new Map<number, number>();
    // Files whose in-flight decode was cancelled; checked at decode checkpoints to bail out cooperatively.
    private readonly _cancelledDecodes = new Set<number>();
    // Eviction streaming config: enabled only when a budget smaller than the full dataset is configured.
    private _evictionEnabled = false;
    private _residentBudget = 0;
    private _evictionCooldownFrames = 100;
    // Serializes the allocate -> decode -> readback critical section so a defrag relayout (which runs inside it)
    // never overlaps another file's decode writing the work buffer, which would corrupt the moved data.
    private _decodeGate: Promise<void> = Promise.resolve();
    // Reusable scratch for the (rare) defrag relayout, to avoid per-relayout allocations during streaming.
    private readonly _relayoutOldOffsets = new Map<number, number>();
    private _relayoutSrcIndex: Nullable<Float32Array> = null;

    // Throttles and retries the SOG file/image downloads (PlayCanvas-style download manager).
    private readonly _downloadManager: GaussianSplattingDownloadManager;

    // Global range covered by the environment file (always rendered), or null until it loads.
    private _environmentRange: Nullable<{ offset: number; count: number }> = null;
    // Unzipped environment bundle contents, retained between count-gathering and decode.
    private _environmentFiles: Nullable<Map<string, Uint8Array>> = null;

    // Per-frame LOD streaming loop; installed once the base layer is ready.
    private _lodObserver: Nullable<Observer<Scene>> = null;
    private _baseLayerReady = false;
    // Throttling state for the per-frame LOD loop.
    private _framesSinceLodUpdate = 0;
    private readonly _lastLodCamPos = new Vector3(Infinity, Infinity, Infinity);
    // Forces the next LOD update to run regardless of the throttle (e.g. after a budget change).
    private _forceLodUpdate = false;

    // Running local-space bounds of all decoded splat centers (for frustum culling / picking).
    private readonly _boundsMin = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    private readonly _boundsMax = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

    // Debug LOD-node wireframe display.
    private _debugDisplay = false;
    private _debugLodSource: GaussianSplattingStreamDebugLodSource = "optimal";
    private _debugMesh: Nullable<LinesMesh> = null;
    private _debugObserver: Nullable<Observer<Scene>> = null;
    // Per-vertex RGBA color buffer mirror, updated in place when LOD colors change (avoids mesh rebuild flicker).
    private _debugColorData: Nullable<Float32Array> = null;
    // Signature of the per-leaf displayed LOD levels, used to skip rebuilding unchanged debug geometry.
    private _debugSignature = 0;

    private _disposed = false;

    /**
     * Returns true when the parsed JSON looks like a PlayCanvas-style `lod-meta.json` payload.
     * @param data parsed JSON
     * @returns whether the data is SOG LOD metadata
     */
    public static IsLODMetadata(data: unknown): data is ISOGLODMetadata {
        if (typeof data !== "object" || data === null) {
            return false;
        }
        const meta = data as Partial<ISOGLODMetadata>;
        return typeof meta.lodLevels === "number" && Array.isArray(meta.filenames) && typeof meta.tree === "object" && meta.tree !== null;
    }

    /**
     * Creates a new SOG LOD streaming mesh and immediately starts streaming (non-blocking).
     * @param name mesh name
     * @param metadata parsed `lod-meta.json`
     * @param rootUrl base URL the metadata's relative paths resolve against
     * @param scene hosting scene
     * @param options streaming options
     */
    constructor(name: string, metadata: ISOGLODMetadata, rootUrl: string, scene: Scene, options: IGaussianSplattingStreamOptions = {}) {
        super(name, null, scene, false);
        this._metadata = metadata;
        this._rootUrl = rootUrl;
        this._streamOptions = options;

        // LOD heuristic parameters: take the provided values, otherwise keep the PlayCanvas-aligned defaults.
        const maxLod = Math.max(0, metadata.lodLevels - 1);
        this._lodRangeMax = maxLod;
        if (options.lodBaseDistance !== undefined) {
            this._lodBaseDistance = Math.max(0.1, options.lodBaseDistance);
        }
        if (options.lodMultiplier !== undefined) {
            this._lodMultiplier = Math.max(1.2, options.lodMultiplier);
        }
        if (options.lodBehindPenalty !== undefined) {
            this._lodBehindPenalty = Math.max(1, options.lodBehindPenalty);
        }
        if (options.lodRangeMin !== undefined) {
            this._lodRangeMin = Math.max(0, Math.min(options.lodRangeMin, maxLod));
        }
        if (options.lodRangeMax !== undefined) {
            this._lodRangeMax = Math.max(this._lodRangeMin, Math.min(options.lodRangeMax, maxLod));
        }
        if (options.maxDecodesPerFrame !== undefined) {
            this._maxDecodesPerFrame = Math.max(1, options.maxDecodesPerFrame);
        }
        if (options.lodCooldownFrames !== undefined) {
            this._lodCooldownFrames = Math.max(0, options.lodCooldownFrames);
        }
        if (options.lodUpdateInterval !== undefined) {
            this._lodUpdateInterval = Math.max(1, options.lodUpdateInterval);
        }
        if (options.lodUpdateDistance !== undefined) {
            this._lodUpdateDistance = Math.max(0, options.lodUpdateDistance);
        }
        if (options.maxDetailLod !== undefined) {
            this._maxDetailLod = Math.max(0, Math.floor(options.maxDetailLod));
        }
        if (options.frustumCulling !== undefined) {
            this._frustumCulling = options.frustumCulling;
        }
        if (options.debugLodSource) {
            this._debugLodSource = options.debugLodSource;
        }
        if (options.evictionCooldownFrames !== undefined) {
            this._evictionCooldownFrames = Math.max(0, Math.floor(options.evictionCooldownFrames));
        }
        // Resolve the resident-splat budget from the splat-count and/or memory-size options (smaller wins).
        let budget = 0;
        if (options.maxResidentSplats !== undefined && options.maxResidentSplats > 0) {
            budget = Math.floor(options.maxResidentSplats);
        }
        if (options.memoryBudgetMb !== undefined && options.memoryBudgetMb > 0) {
            const fromMB = Math.floor((options.memoryBudgetMb * 1024 * 1024) / BytesPerResidentSplat);
            budget = budget > 0 ? Math.min(budget, fromMB) : fromMB;
        }
        this._residentBudget = budget;

        this._downloadManager = new GaussianSplattingDownloadManager({
            maxConcurrent: options.maxConcurrentDownloads,
            maxRetries: options.maxDownloadRetries,
        });

        // PlayCanvas SOG data is authored with a flipped Y; match the standard SOG loader.
        this.scaling.y *= -1;
        // PlayCanvas SOG LOD scenes are authored Z-up; rotate into Babylon's Y-up convention.
        this.rotation.x = -Math.PI / 2;

        this._collectLodEntries(metadata.tree);

        if (options.debugDisplay) {
            this.debugDisplay = true;
        }

        // Kick off streaming without blocking the caller or the render loop.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
        this._streamAllAsync().catch((e) => {
            Logger.Error("GaussianSplattingStream: streaming failed: " + (e?.message ?? e));
        });
    }

    public override getClassName(): string {
        return "GaussianSplattingStream";
    }

    /**
     * Resolves once the scene is fully streamed and displayed for the current camera: a LOD re-evaluation has
     * run for the current point of view, every reachable LOD file has finished downloading and decoding (no
     * downloads, decodes, or queued work remain), and the depth sort for the resulting splats has been applied
     * and rendered. Intended for deterministic automated testing and screenshot/image comparison.
     *
     * Streaming and settling require rendered frames. If an external render loop is already running, this waits
     * on it passively; otherwise (e.g. when awaited inside an async `createScene` before the host starts its
     * render loop) it drives `scene.render()` itself until settled, so it never deadlocks.
     *
     * Note: the promise only resolves while the camera is still — if the camera keeps moving, the target LODs
     * (and the depth sort) keep changing and the stream never settles. Position the camera, then await this.
     * @param stableFrames number of consecutive settled frames to require before resolving (defaults to 3), so
     *   the final sorted frame is actually on screen
     * @returns a promise that resolves when loading and rendering are complete for the current view
     */
    public async whenSettledAsync(stableFrames = 3): Promise<void> {
        if (this._disposed) {
            return;
        }
        // Re-evaluate LODs immediately so the target levels reflect the current camera before we wait.
        this._forceLodUpdate = true;
        const required = Math.max(1, stableFrames);
        const scene = this._scene;
        let stable = 0;
        const isSettled = (): boolean => {
            if (this._isLoadingIdle() && this._isDepthSortSettled) {
                return ++stable >= required;
            }
            stable = 0;
            return false;
        };

        // An external render loop is already driving frames: observe it passively.
        if (scene.getEngine().activeRenderLoops.length > 0) {
            await new Promise<void>((resolve) => {
                let observer: Nullable<Observer<Scene>> = null;
                observer = scene.onAfterRenderObservable.add(() => {
                    if (this._disposed || isSettled()) {
                        if (observer) {
                            scene.onAfterRenderObservable.remove(observer);
                            observer = null;
                        }
                        resolve();
                    }
                });
            });
            return;
        }

        // No render loop yet (e.g. awaited inside createScene): drive rendering ourselves so the streaming
        // decodes and depth sort can progress, yielding between frames so async downloads/readbacks resolve.
        // Wrap each render in beginFrame/endFrame exactly like the engine's own render loop: on WebGPU,
        // endFrame submits the frame's command buffers and presents the swapchain, so a bare scene.render()
        // would leave the acquired swapchain texture to be destroyed at the frame boundary before its command
        // buffer is submitted ("destroyed texture used in a submit").
        const engine = scene.getEngine();
        const requestFrame = (globalThis as { requestAnimationFrame?: (cb: () => void) => void }).requestAnimationFrame;
        while (!this._disposed) {
            engine.beginFrame();
            scene.render();
            engine.endFrame();
            if (isSettled()) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => {
                if (typeof requestFrame === "function") {
                    requestFrame(() => resolve());
                } else {
                    setTimeout(resolve, 16);
                }
            });
        }
    }

    /**
     * Whether the base layer is ready and there is no streaming work in flight (nothing queued for decode, no
     * decode running, and no downloads pending).
     * @returns true when no loading work remains
     */
    private _isLoadingIdle(): boolean {
        return this._baseLayerReady && this._decodeQueue.length === 0 && this._loadingFiles.size === 0 && this._downloadManager.isIdle;
    }

    /**
     * Finest (most detailed) LOD level any node is allowed to render. `0` allows full detail (level 0);
     * `1` caps detail at the next-coarser level, and so on. Nodes already coarser than this cap (by
     * distance) are unaffected. Changes take effect in real time.
     */
    public get maxDetailLod(): number {
        return this._maxDetailLod;
    }

    public set maxDetailLod(value: number) {
        const level = Math.max(0, Math.floor(value));
        if (this._maxDetailLod === level) {
            return;
        }
        this._maxDetailLod = level;
        // Re-evaluate LODs on the next frame regardless of the movement throttle so the change is immediate.
        this._forceLodUpdate = true;
    }

    /**
     * Coarsest LOD level index in the scene (number of LOD levels minus one). Useful as the upper bound
     * for {@link maxDetailLod}.
     */
    public get maxLodLevel(): number {
        return Math.max(0, this._metadata.lodLevels - 1);
    }

    /**
     * When true (default), nodes whose bounding box is outside the camera frustum are biased to the coarsest
     * LOD instead of being hidden. They stay in the sort/render set (their off-screen splats are clipped), so
     * turning the camera toward them shows low detail immediately with no invisible frames, then refines.
     * Changes take effect in real time.
     */
    public get frustumCulling(): boolean {
        return this._frustumCulling;
    }

    public set frustumCulling(value: boolean) {
        if (this._frustumCulling === value) {
            return;
        }
        this._frustumCulling = value;
        // Re-evaluate LODs next frame so the off-screen bias is applied/removed immediately.
        this._forceLodUpdate = true;
    }

    /**
     * When true, renders a wireframe box per LOD node, colored by the LOD level selected by {@link debugLodSource}.
     */
    public get debugDisplay(): boolean {
        return this._debugDisplay;
    }

    public set debugDisplay(value: boolean) {
        if (this._debugDisplay === value) {
            return;
        }
        this._debugDisplay = value;
        if (value) {
            this._refreshDebugDisplay();
        } else {
            this._clearDebugDisplay();
        }
    }

    /**
     * Selects which LOD value drives the debug wireframe colors: the distance-based `"optimal"` LOD
     * (default, recomputed as the camera moves) or the `"current"` streamed/rendered LOD.
     */
    public get debugLodSource(): GaussianSplattingStreamDebugLodSource {
        return this._debugLodSource;
    }

    public set debugLodSource(value: GaussianSplattingStreamDebugLodSource) {
        if (this._debugLodSource === value) {
            return;
        }
        this._debugLodSource = value;
        if (this._debugDisplay) {
            this._refreshDebugDisplay();
        }
    }

    public override dispose(doNotRecurse?: boolean): void {
        this._disposed = true;
        if (this._lodObserver) {
            this._scene.onBeforeRenderObservable.remove(this._lodObserver);
            this._lodObserver = null;
        }
        this._clearDebugDisplay();
        this._downloadManager.dispose();
        this._residency?.dispose();
        this._residency = null;
        this._workBuffer?.dispose();
        this._workBuffer = null;
        super.dispose(doNotRecurse);
    }

    /**
     * Re-evaluates the optimal LOD for every node based on the camera position. The result is stored in
     * each node's `optimalLod`. Rendering is unaffected; this currently drives only diagnostics and the
     * debug wireframe display.
     * @param camera camera to evaluate against (defaults to the scene's active camera)
     */
    public evaluateOptimalLods(camera: Nullable<Camera> = this._scene.activeCamera): void {
        if (!camera || this._leafNodes.length === 0) {
            return;
        }

        const maxLod = Math.max(0, this._metadata.lodLevels - 1);
        const base = this._lodBaseDistance;
        const mult = this._lodMultiplier;
        const behindPenalty = this._lodBehindPenalty;
        const rangeMin = this._lodRangeMin;
        const rangeMax = this._lodRangeMax;

        // FOV compensation: use min(tanHalfV, tanHalfH) so transitions stay perceptually uniform (matches PlayCanvas).
        const aspect = this._scene.getEngine().getAspectRatio(camera) || 1;
        let tanHalfV = Math.tan(camera.fov * 0.5);
        if (camera.fovMode === Camera.FOVMODE_HORIZONTAL_FIXED) {
            tanHalfV /= aspect;
        }
        const tanHalfH = tanHalfV * aspect;
        const fovScale = Math.min(tanHalfV, tanHalfH) / RefTanHalfFov;

        // Transform the camera into the mesh's local space (where the node bounds live).
        this.computeWorldMatrix(false).invertToRef(TmpInvWorld);
        const localCamera = Vector3.TransformCoordinatesToRef(camera.globalPosition, TmpInvWorld, TmpLocalCamera);
        const px = localCamera.x;
        const py = localCamera.y;
        const pz = localCamera.z;

        let fwx = 0;
        let fwy = 0;
        let fwz = 0;
        if (behindPenalty > 1) {
            camera.getDirectionToRef(LocalForwardAxis, TmpWorldForward);
            const localForward = Vector3.TransformNormalToRef(TmpWorldForward, TmpInvWorld, TmpLocalForward);
            localForward.normalize();
            fwx = localForward.x;
            fwy = localForward.y;
            fwz = localForward.z;
        }

        for (const node of this._leafNodes) {
            const mn = node.bound.min;
            const mx = node.bound.max;

            // Distance from the camera to the closest point on this node's AABB (local space).
            const qx = px < mn[0] ? mn[0] : px > mx[0] ? mx[0] : px;
            const qy = py < mn[1] ? mn[1] : py > mx[1] ? mx[1] : py;
            const qz = pz < mn[2] ? mn[2] : pz > mx[2] ? mx[2] : pz;
            const dx = qx - px;
            const dy = qy - py;
            const dz = qz - pz;
            const actualDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            // Push nodes behind the camera toward coarser LODs when a penalty is configured.
            let penalizedDistance = actualDistance;
            if (behindPenalty > 1 && actualDistance > 0.01) {
                const dotOverDistance = (fwx * dx + fwy * dy + fwz * dz) / actualDistance;
                if (dotOverDistance < 0) {
                    penalizedDistance = actualDistance * (1 + -dotOverDistance * (behindPenalty - 1));
                }
            }

            // Geometric LOD bands: threshold[k] = base * mult^(k-1).
            const fovAdjustedDistance = penalizedDistance * fovScale;
            let optimalLod: number;
            if (maxLod === 0 || fovAdjustedDistance < base) {
                optimalLod = 0;
            } else {
                optimalLod = maxLod;
                while (optimalLod > 1 && fovAdjustedDistance < base * Math.pow(mult, optimalLod - 1)) {
                    optimalLod--;
                }
            }

            if (optimalLod < rangeMin) {
                optimalLod = rangeMin;
            } else if (optimalLod > rangeMax) {
                optimalLod = rangeMax;
            }

            // Frustum-based LOD bias: nodes outside the camera frustum are pushed to the coarsest allowed
            // level instead of being hidden. They stay in the render/sort set (their splats are off-screen
            // and clipped anyway), so when the camera turns to include them they are already present at low
            // detail with no invisible frames, then refine to the distance-optimal level.
            if (this._frustumCulling && node.inFrustum === false) {
                optimalLod = rangeMax;
            }

            node.optimalLod = optimalLod;
        }
    }

    /**
     * The LOD level used to color a node's debug box, per {@link debugLodSource}.
     * @param node leaf node
     * @returns the displayed LOD level
     */
    private _displayedLodLevel(node: ISOGLODNode): number {
        if (this._debugLodSource === "optimal") {
            return node.optimalLod ?? node.activeLod ?? 0;
        }
        return node.activeLod ?? 0;
    }

    /**
     * Rebuilds the debug wireframe (evaluating the optimal LOD first when needed) and wires up the per-frame
     * recolor observer. The observer runs for both LOD sources: "optimal" colors track the camera, and
     * "current" colors track LOD levels as they stream in/out.
     */
    private _refreshDebugDisplay(): void {
        if (this._debugLodSource === "optimal") {
            this.evaluateOptimalLods();
        }
        this._buildDebugMesh();

        const needsObserver = this._debugDisplay;
        if (needsObserver && !this._debugObserver) {
            this._debugObserver = this._scene.onBeforeRenderObservable.add(() => this._onDebugFrame());
        } else if (!needsObserver && this._debugObserver) {
            this._scene.onBeforeRenderObservable.remove(this._debugObserver);
            this._debugObserver = null;
        }
    }

    /**
     * Per-frame debug update: recolors the existing wireframe in place whenever the displayed LOD levels
     * change. For the "optimal" source the optimal LOD is recomputed first (it tracks the camera); for the
     * "current" source the levels are driven by the streaming loop, so no recomputation is needed here. The
     * geometry is never rebuilt, which avoids the dispose/recreate flicker while the camera moves.
     */
    private _onDebugFrame(): void {
        if (this._debugLodSource === "optimal") {
            this.evaluateOptimalLods();
        }
        if (this._computeDebugSignature() !== this._debugSignature) {
            this._updateDebugColors();
        }
    }

    /**
     * Builds the LOD-node wireframe boxes once (one box per leaf node), colored by the displayed LOD level.
     * The color vertex buffer is created updatable so subsequent recolors can happen in place.
     */
    private _buildDebugMesh(): void {
        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
        }
        this._debugColorData = null;

        const lines: Vector3[][] = [];
        const colors: Color4[][] = [];
        for (const node of this._leafNodes) {
            const color = GsLodDebugColors[this._displayedLodLevel(node) % GsLodDebugColors.length];
            const mn = node.bound.min;
            const mx = node.bound.max;
            const corners = [
                new Vector3(mn[0], mn[1], mn[2]),
                new Vector3(mx[0], mn[1], mn[2]),
                new Vector3(mx[0], mx[1], mn[2]),
                new Vector3(mn[0], mx[1], mn[2]),
                new Vector3(mn[0], mn[1], mx[2]),
                new Vector3(mx[0], mn[1], mx[2]),
                new Vector3(mx[0], mx[1], mx[2]),
                new Vector3(mn[0], mx[1], mx[2]),
            ];
            for (const edge of BoxEdges) {
                lines.push([corners[edge[0]], corners[edge[1]]]);
                colors.push([color, color]);
            }
        }

        this._debugSignature = this._computeDebugSignature();
        if (lines.length === 0) {
            return;
        }

        const mesh = CreateLineSystem(this.name + "_lodDebug", { lines, colors, updatable: true, useVertexAlpha: false }, this._scene);
        mesh.parent = this;
        mesh.isPickable = false;
        mesh.doNotSerialize = true;
        mesh.reservedDataStore = { hidden: true };
        this._debugMesh = mesh;
        this._debugColorData = new Float32Array(this._leafNodes.length * VerticesPerBox * 4);
    }

    /**
     * Recolors the existing wireframe in place from the current displayed LOD levels, without rebuilding geometry.
     */
    private _updateDebugColors(): void {
        if (!this._debugMesh || !this._debugColorData) {
            return;
        }
        const data = this._debugColorData;
        let offset = 0;
        for (const node of this._leafNodes) {
            const color = GsLodDebugColors[this._displayedLodLevel(node) % GsLodDebugColors.length];
            for (let v = 0; v < VerticesPerBox; v++) {
                data[offset++] = color.r;
                data[offset++] = color.g;
                data[offset++] = color.b;
                data[offset++] = color.a;
            }
        }
        this._debugMesh.updateVerticesData(VertexBuffer.ColorKind, data);
        this._debugSignature = this._computeDebugSignature();
    }

    /**
     * Computes a cheap 32-bit rolling hash of every leaf's displayed LOD level, used to detect when the
     * debug wireframe needs recoloring. Avoids per-frame string allocation in the render loop.
     * @returns a numeric signature of the current displayed LOD levels
     */
    private _computeDebugSignature(): number {
        let hash = 0;
        for (const node of this._leafNodes) {
            hash = (hash * 31 + this._displayedLodLevel(node)) | 0;
        }
        return hash;
    }

    /**
     * Disposes the LOD-node wireframe boxes and stops live debug updates.
     */
    private _clearDebugDisplay(): void {
        if (this._debugObserver) {
            this._scene.onBeforeRenderObservable.remove(this._debugObserver);
            this._debugObserver = null;
        }
        if (this._debugMesh) {
            this._debugMesh.dispose();
            this._debugMesh = null;
        }
        this._debugColorData = null;
        this._debugSignature = 0;
    }

    /**
     * Walks the LOD tree and records every leaf that carries renderable LOD entries, capturing the set of
     * available levels and the coarsest (base) level for each.
     * @param node current tree node
     */
    private _collectLodEntries(node: ISOGLODNode): void {
        if (node.children) {
            for (const child of node.children) {
                this._collectLodEntries(child);
            }
            return;
        }

        if (!node.lods) {
            return;
        }

        // Collect all levels that hold splats (PlayCanvas convention: level 0 is the finest, higher = coarser).
        const levels: number[] = [];
        for (const key of Object.keys(node.lods)) {
            const level = Number(key);
            const entry = node.lods[key];
            if (Number.isFinite(level) && entry && entry.count > 0) {
                levels.push(level);
            }
        }
        if (levels.length === 0) {
            return;
        }
        levels.sort((a, b) => a - b);

        node.availableLevels = levels;
        node.baseLod = levels[levels.length - 1];
        node.activeLod = undefined;
        node.lodCooldown = 0;
        node.inFrustum = true;
        // Local-space bounds for the per-node frustum test; the mesh world matrix is applied per evaluation.
        node.cullBounds = new BoundingInfo(Vector3.FromArray(node.bound.min), Vector3.FromArray(node.bound.max));
        this._leafNodes.push(node);
    }

    /**
     * Streams the scene: learns every source file's splat count, allocates one unified GPU work buffer
     * sized for all LOD files, decodes the environment and the coarsest LOD of every node as a permanent
     * base layer, then installs the per-frame loop that streams finer LODs on demand.
     */
    private async _streamAllAsync(): Promise<void> {
        // Phase 1: learn splat counts for the environment and every referenced LOD file (cheap meta only).
        const fileIds = this._collectAllFileIds();
        const envCount = await this._gatherCountsAsync(fileIds);
        if (this._disposed) {
            return;
        }

        // Phase 2: learn the full dataset size (padding + environment + every LOD file). The work buffer is
        // sized to this unless a smaller budget enables eviction-based streaming.
        // Index 0 is reserved as a never-decoded padding splat: the sort worker and index buffer pad unused
        // slots with index 0, and leaving that slot zeroed (center.w = 0 => zero covariance, alpha 0) makes
        // the padding invisible instead of ghosting a copy of the first real splat.
        let fullCapacity = 1;
        if (envCount > 0) {
            fullCapacity += envCount;
        }
        for (const fileId of fileIds) {
            const count = this._fileCounts.get(fileId);
            if (count !== undefined && count > 0) {
                fullCapacity += count;
            }
        }
        if (fullCapacity <= 1) {
            return;
        }

        // Eviction streams the dataset through a fixed budget; only enabled when that budget is below the full set.
        this._evictionEnabled = this._residentBudget > 0 && this._residentBudget < fullCapacity;
        const capacity = this._evictionEnabled ? Math.max(this._residentBudget, 1) : fullCapacity;

        this._residency = new GaussianSplattingResidencyController(capacity, this._evictionCooldownFrames, (file) => this._onFileEvicted(file));
        // Pin splat 0 as the invisible padding splat, then the environment (always rendered) — neither is evicted.
        this._residency.pin(PaddingFileId, 1);
        if (envCount > 0) {
            const envOffset = this._residency.pin(EnvironmentFileId, envCount);
            if (envOffset !== null) {
                this._environmentRange = { offset: envOffset, count: envCount };
            } else {
                Logger.Warn("GaussianSplattingStream: environment does not fit the memory budget; skipping it.");
                this._environmentFiles = null;
            }
        }

        this._workBuffer = new GaussianSplattingWorkBuffer(this._scene, capacity);
        // GPU readback is only enabled after it is validated against a CPU decode on the first file (see
        // _probeReadbackAsync); until then positions are decoded on the CPU so there is always a correct result.
        this._readbackCandidate = this._workBuffer.supportsAsyncCentersReadback;
        const splatPositions = new Float32Array(capacity * 4);
        const textures = this._workBuffer.textures;
        this._setExternalWorkBuffer(textures[0], textures[1], textures[2], textures[3], splatPositions, capacity);
        // Nothing is active until at least one resource has been decoded.
        this.setSplatIndexRanges([]);
        this.setEnabled(true);

        // Phase 3: decode the environment, then every node's coarsest LOD as the permanent base layer.
        if (this._environmentRange && this._environmentFiles) {
            await this._decodeEnvironmentAsync();
        }
        this._environmentFiles = null;

        const baseFiles = new Set<number>();
        for (const node of this._leafNodes) {
            const entry = node.lods![String(node.baseLod)];
            if (entry && this._fileCounts.has(entry.file)) {
                baseFiles.add(entry.file);
            }
        }
        for (const fileId of Array.from(baseFiles)) {
            if (this._disposed) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await this._decodeFileAsync(fileId);
        }

        if (this._disposed) {
            return;
        }
        // Phase 4: hand off to the per-frame LOD streaming loop.
        this._baseLayerReady = true;
        if (!this._lodObserver) {
            this._lodObserver = this._scene.onBeforeRenderObservable.add(() => this._onLodFrame());
        }
    }

    /**
     * Collects the unique set of source file indices referenced by any LOD of any leaf, sorted ascending.
     * @returns sorted unique file indices
     */
    private _collectAllFileIds(): number[] {
        const ids = new Set<number>();
        for (const node of this._leafNodes) {
            for (const level of node.availableLevels!) {
                const entry = node.lods![String(level)];
                if (entry) {
                    ids.add(entry.file);
                }
            }
        }
        return Array.from(ids).sort((a, b) => a - b);
    }

    /**
     * Fetches the environment bundle and every referenced file's metadata to learn splat counts, caching
     * each file's parsed metadata for the later on-demand decode. Metadata fetches run in parallel.
     * @param fileIds file indices to fetch metadata for
     * @returns the environment splat count (0 when there is no environment)
     */
    private async _gatherCountsAsync(fileIds: number[]): Promise<number> {
        let envCount = 0;
        if (this._metadata.environment) {
            try {
                const url = this._rootUrl + this._metadata.environment;
                const buffer = await this._downloadManager.loadFileAsync(url);
                const files = await this._unzipAsync(new Uint8Array(buffer));
                const metaBytes = files.get("meta.json");
                if (metaBytes) {
                    const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as SOGRootData;
                    envCount = GaussianSplattingStream._GetSplatCount(meta);
                    this._environmentFiles = files;
                }
            } catch (e: any) {
                // The environment is non-essential — keep streaming the LOD tree even if it fails.
                Logger.Warn("GaussianSplattingStream: failed to load environment: " + (e?.message ?? e));
            }
        }

        await Promise.all(
            fileIds.map(async (fileId) => {
                const relativePath = this._metadata.filenames[fileId];
                if (!relativePath) {
                    Logger.Warn(`GaussianSplattingStream: missing filename for file index ${fileId}.`);
                    return;
                }
                try {
                    const metaUrl = this._rootUrl + relativePath;
                    const subRootUrl = metaUrl.substring(0, metaUrl.lastIndexOf("/") + 1);
                    const metaBuffer = await this._downloadManager.loadFileAsync(metaUrl);
                    const sogData = JSON.parse(new TextDecoder().decode(new Uint8Array(metaBuffer))) as SOGRootData;
                    this._fileCounts.set(fileId, GaussianSplattingStream._GetSplatCount(sogData));
                    this._fileMeta.set(fileId, { sogData, subRootUrl });
                } catch (e: any) {
                    Logger.Warn(`GaussianSplattingStream: failed to load metadata for ${relativePath}: ${e?.message ?? e}`);
                }
            })
        );

        return envCount;
    }

    /**
     * Queues a file for on-demand decode if it isn't already decoded, in flight, or already queued.
     * @param fileId file index to decode
     */
    private _enqueueDecode(fileId: number): void {
        if (this._decodedFiles.has(fileId) || this._loadingFiles.has(fileId) || !this._fileMeta.has(fileId)) {
            return;
        }
        if (this._decodeQueue.indexOf(fileId) === -1) {
            this._decodeQueue.push(fileId);
        }
    }

    /**
     * Starts up to {@link _maxDecodesPerFrame} queued decodes for this frame. Decodes run asynchronously
     * and promote any waiting nodes once they complete.
     */
    private _pumpDecodeQueue(): void {
        let started = 0;
        while (this._decodeQueue.length > 0 && started < this._maxDecodesPerFrame) {
            const fileId = this._decodeQueue.shift()!;
            if (this._decodedFiles.has(fileId) || this._loadingFiles.has(fileId)) {
                continue;
            }
            started++;
            // eslint-disable-next-line github/no-then
            this._decodeFileAsync(fileId).catch((e) => {
                Logger.Warn("GaussianSplattingStream: decode failed: " + (e?.message ?? e));
            });
        }
    }

    /**
     * Writes a decoded splat range's positions into the shared buffer, expands the bounds, and incrementally
     * patches the sort worker.
     * @param positions stride-4 positions for the range
     * @param base first splat index of the range in the work buffer
     * @param count number of splats in the range
     */
    private _applyPositions(positions: Float32Array, base: number, count: number): void {
        this._splatPositions!.set(positions, base * 4);
        this._updateBounds(positions, count);
        // Incrementally patch only this range in the sort worker (avoids the full position-buffer re-copy).
        this._postWorkerPositionsRange(base, count);
    }

    /**
     * One-time validation of GPU position readback: reads a sample of the just-decoded range back from the work
     * buffer and compares it to the CPU-decoded positions. Enables {@link _useGpuPositionReadback} only on an
     * exact (within float tolerance) match, so an unsupported or incorrect readback (e.g. a backend without the
     * required texture usage, or an orientation mismatch) safely keeps the CPU decode path.
     * @param base first splat index of the validated range
     * @param count number of splats in the range
     * @param cpuPositions the CPU-decoded stride-4 positions for the range (ground truth)
     */
    private async _probeReadbackAsync(base: number, count: number, cpuPositions: Float32Array): Promise<void> {
        this._readbackProbed = true;
        if (!this._workBuffer) {
            return;
        }
        const sampleCount = Math.min(count, 1024);
        let ok = false;
        try {
            const gpu = await this._workBuffer.readCentersRangeAsync(base, sampleCount);
            if (this._disposed) {
                return;
            }
            if (gpu && gpu.length >= sampleCount * 4) {
                ok = true;
                for (let i = 0; i < sampleCount && ok; i++) {
                    for (let j = 0; j < 3; j++) {
                        const a = gpu[i * 4 + j];
                        const b = cpuPositions[i * 4 + j];
                        if (Math.abs(a - b) > 1e-2 * (1 + Math.abs(b))) {
                            ok = false;
                            break;
                        }
                    }
                }
            }
        } catch {
            ok = false;
        }
        this._useGpuPositionReadback = ok;
        Logger.Log(
            ok
                ? "GaussianSplattingStream: GPU position readback validated; streamed LOD positions are read back from the GPU."
                : "GaussianSplattingStream: GPU position readback unavailable; decoding LOD positions on the CPU."
        );
    }

    /**
     * Resolves the decoded positions for a splat range and applies them. Once GPU readback has been validated,
     * positions are read back from the work buffer (non-blocking) and `pack.positions` is empty; otherwise the
     * CPU-decoded `pack.positions` are used, and — on the first such decode — the GPU readback is validated
     * against them so subsequent decodes can use the fast path.
     * @param pack the parsed SOG pack (its `positions` is populated only on the CPU path)
     * @param base first splat index of the range in the work buffer
     * @param count number of splats in the range
     * @returns whether positions were applied
     */
    private async _applyDecodedPositionsAsync(pack: ISogTexturePack, base: number, count: number): Promise<boolean> {
        if (this._useGpuPositionReadback && this._workBuffer) {
            const positions = await this._workBuffer.readCentersRangeAsync(base, count);
            if (this._disposed) {
                return false;
            }
            if (positions && this._splatPositions) {
                this._applyPositions(positions, base, count);
                return true;
            }
            // Validated readback unexpectedly returned nothing; fall through to the (likely empty) CPU positions.
        }

        const cpu = pack.positions.length >= count * 4 ? (pack.positions.subarray(0, count * 4) as Float32Array) : null;
        if (!cpu || !this._splatPositions) {
            return false;
        }
        this._applyPositions(cpu, base, count);
        // First CPU decode while readback is a candidate: validate it so later decodes can use the fast path.
        if (!this._readbackProbed && this._readbackCandidate) {
            await this._probeReadbackAsync(base, count, cpu);
        }
        return true;
    }

    /**
     * Decodes the always-on environment bundle into its work-buffer block and activates its range.
     */
    private async _decodeEnvironmentAsync(): Promise<void> {
        if (!this._environmentRange || !this._environmentFiles || !this._workBuffer) {
            return;
        }
        const range = this._environmentRange;
        try {
            const parsed = await ParseSogMetaAsTextures(this._environmentFiles, "", this._scene, !this._useGpuPositionReadback, this._downloadManager);
            const pack = parsed.sogTextures;
            if (!pack) {
                return;
            }
            try {
                if (this._disposed || !this._workBuffer) {
                    return;
                }
                await this._workBuffer.decodeAsync(pack, range.offset);
                if (this._disposed) {
                    return;
                }
                await this._applyDecodedPositionsAsync(pack, range.offset, range.count);
                if (this._disposed) {
                    return;
                }
                this._refreshActiveRanges();
            } finally {
                // Always release the GPU source textures (the decode pass is the only consumer).
                GaussianSplattingStream._DisposePack(pack);
            }
        } catch (e: any) {
            Logger.Warn("GaussianSplattingStream: failed to decode environment: " + (e?.message ?? e));
        }
    }

    /**
     * Loads one LOD source file as GPU textures, decodes it into its fixed work-buffer block, records its
     * CPU centers for sorting, frees the source textures, then promotes any nodes that were waiting for it.
     * Concurrent or repeat requests for the same file are ignored. If the file is cancelled mid-flight
     * (because every node that wanted it retargeted), the decode bails cooperatively at the next checkpoint.
     * @param fileId file index to decode
     */
    private async _decodeFileAsync(fileId: number): Promise<void> {
        if (this._decodedFiles.has(fileId) || this._loadingFiles.has(fileId) || !this._residency) {
            return;
        }
        const meta = this._fileMeta.get(fileId);
        const count = this._fileCounts.get(fileId);
        if (!meta || count === undefined) {
            return;
        }
        this._loadingFiles.add(fileId);
        this._cancelledDecodes.delete(fileId);
        let allocated = false;
        try {
            const parsed = await ParseSogMetaAsTextures(meta.sogData, meta.subRootUrl, this._scene, !this._useGpuPositionReadback, this._downloadManager, fileId);
            const pack = parsed.sogTextures;
            if (!pack) {
                return;
            }
            // Serialize the allocate -> decode -> readback section: a relayout runs only inside it (see
            // _relayoutAndAllocateAsync), so it never moves a file whose decode has not finished writing.
            const release = await this._acquireDecodeGateAsync();
            try {
                if (this._disposed || !this._workBuffer || this._cancelledDecodes.has(fileId)) {
                    return;
                }
                let base = this._residency.allocate(fileId, count);
                if (base === null) {
                    // Defragment the work buffer to reclaim fragmented free space, then retry.
                    base = await this._relayoutAndAllocateAsync(fileId, count);
                }
                if (base === null) {
                    // No room even after evicting and compacting: refuse and keep nodes on their current LOD.
                    // A file cancelled mid-flight isn't a budget problem, so don't warn for it.
                    if (!this._cancelledDecodes.has(fileId)) {
                        Logger.Warn(`GaussianSplattingStream: resident memory budget full; skipping LOD file ${fileId}.`);
                    }
                    return;
                }
                allocated = true;
                if (this._disposed || !this._workBuffer || this._cancelledDecodes.has(fileId)) {
                    return;
                }
                await this._workBuffer.decodeAsync(pack, base);
                if (this._disposed || this._cancelledDecodes.has(fileId)) {
                    return;
                }
                await this._applyDecodedPositionsAsync(pack, base, count);
                if (this._disposed) {
                    return;
                }
                this._decodedFiles.add(fileId);
                // Promote any nodes that can now reach their desired LOD via this newly decoded file.
                if (this._applyDesiredLods()) {
                    this._refreshActiveRanges();
                }
            } finally {
                GaussianSplattingStream._DisposePack(pack);
                release();
            }
        } catch (e) {
            // A cancelled file rejects its downloads on purpose — swallow that; re-throw genuine failures.
            if (!this._cancelledDecodes.has(fileId)) {
                throw e;
            }
        } finally {
            // If a slot was allocated but the decode did not complete (cancelled/disposed), release it.
            if (allocated && !this._decodedFiles.has(fileId)) {
                this._residency.free(fileId);
            }
            this._loadingFiles.delete(fileId);
            this._cancelledDecodes.delete(fileId);
        }
    }

    /**
     * Acquires the decode gate (a simple async mutex). Resolves once any prior holder releases, returning a
     * release function the caller must invoke in a `finally`.
     * @returns the release function
     */
    private async _acquireDecodeGateAsync(): Promise<() => void> {
        const previous = this._decodeGate;
        let release!: () => void;
        this._decodeGate = new Promise<void>((resolve) => {
            release = resolve;
        });
        await previous;
        return release;
    }

    /**
     * Defragments the work buffer to make room for a file that did not fit, then allocates its slot. Runs the
     * compaction + GPU relayout atomically inside a single `onBeforeRender` so no inconsistent CPU/GPU layout
     * is ever rendered. Returns the new slot offset, or null if even compaction cannot free enough contiguous
     * space (the caller refuses the upgrade).
     * @param fileId file to allocate after compaction
     * @param count splats the file needs
     * @returns the allocated offset, or null
     */
    private async _relayoutAndAllocateAsync(fileId: number, count: number): Promise<Nullable<number>> {
        if (!this._residency || !this._workBuffer) {
            return null;
        }
        // Even a perfect compaction cannot help if the total free space is below what is needed.
        if (this._residency.freeSize < count) {
            return null;
        }
        return await new Promise<Nullable<number>>((resolve) => {
            const attempt = () => {
                // Bail out (no relayout) if the file was cancelled while we waited for the shader to be ready,
                // so rapidly-changing targets don't trigger an expensive compaction for a file no longer needed.
                if (this._disposed || !this._residency || !this._workBuffer || this._cancelledDecodes.has(fileId)) {
                    resolve(null);
                    return;
                }
                if (!this._workBuffer.isRelayoutReady()) {
                    this._scene.onBeforeRenderObservable.addOnce(attempt);
                    return;
                }
                this._performRelayout();
                resolve(this._residency.allocate(fileId, count));
            };
            this._scene.onBeforeRenderObservable.addOnce(attempt);
        });
    }

    /**
     * Compacts the resident set and relocates the corresponding GPU textures and CPU positions to the new
     * layout. Must run at a frame-safe point with the work buffer's relayout shader ready.
     */
    private _performRelayout(): void {
        if (!this._residency || !this._workBuffer || !this._splatPositions) {
            return;
        }
        const oldOffsets = this._relayoutOldOffsets;
        oldOffsets.clear();
        for (const block of this._residency.getResidentBlocks()) {
            oldOffsets.set(block.file, block.offset);
        }
        const moves = this._residency.compact();
        if (moves.length === 0) {
            return;
        }

        const capacity = this._residency.capacity;
        if (!this._relayoutSrcIndex || this._relayoutSrcIndex.length !== capacity) {
            this._relayoutSrcIndex = new Float32Array(capacity);
        }
        const srcIndexByDst = this._relayoutSrcIndex;
        srcIndexByDst.fill(-1);

        const resident = this._residency.getResidentBlocks();
        // Destination->source splat index map for the GPU relayout pass.
        for (const block of resident) {
            const oldOffset = oldOffsets.get(block.file)!;
            for (let k = 0; k < block.count; k++) {
                srcIndexByDst[block.offset + k] = oldOffset + k;
            }
        }
        // GPU: relocate the decoded textures in place (same texture instances).
        this._workBuffer.relayoutSync(srcIndexByDst);

        // CPU positions: compaction only ever moves a block to a lower offset, so copying in place in ascending
        // new-offset order is safe (a block's source is never overwritten by an earlier move). This avoids a
        // full capacity*4 scratch buffer.
        const positions = this._splatPositions;
        resident.sort((a, b) => a.offset - b.offset);
        for (const block of resident) {
            const oldOffset = oldOffsets.get(block.file)!;
            if (oldOffset !== block.offset) {
                positions.copyWithin(block.offset * 4, oldOffset * 4, (oldOffset + block.count) * 4);
            }
        }

        // Update the environment offset (it may have moved), re-post to the sort worker, and refresh ranges.
        if (this._environmentRange) {
            const envOffset = this._residency.offset(EnvironmentFileId);
            if (envOffset !== undefined) {
                this._environmentRange.offset = envOffset;
            }
        }
        this._notifyWorkerNewData();
        this._refreshActiveRanges();
    }

    /**
     * Drops a file evicted by the residency controller from the decoded set so it will be re-decoded on demand.
     * The file had no remaining references, so no node was rendering or downloading it.
     * @param fileId evicted file index
     */
    private _onFileEvicted(fileId: number): void {
        this._decodedFiles.delete(fileId);
    }

    /**
     * Snaps a desired LOD level to the nearest level the node provides, while never selecting a level finer
     * than {@link maxDetailLod} (i.e. with an index below the cap). Ties prefer the finer allowed level. If
     * the node has no level at or coarser than the cap, its coarsest available level is used.
     * @param node leaf node
     * @param desired desired LOD level
     * @returns the chosen available level
     */
    private _cappedLevelForNode(node: ISOGLODNode, desired: number): number {
        const levels = node.availableLevels!;
        const floor = this._maxDetailLod;
        let best = -1;
        let bestDiff = Number.POSITIVE_INFINITY;
        for (const level of levels) {
            if (level < floor) {
                continue;
            }
            const diff = Math.abs(level - desired);
            if (diff < bestDiff) {
                best = level;
                bestDiff = diff;
            }
        }
        // No level is coarse enough to satisfy the cap: fall back to the coarsest the node has.
        return best < 0 ? node.baseLod! : best;
    }

    /**
     * Computes each node's {@link ISOGLODNode.targetLevel}: the distance-based optimal level snapped to an
     * available level, capped so no node renders finer (more detailed) than {@link maxDetailLod}.
     */
    private _computeTargetLevels(): void {
        for (const node of this._leafNodes) {
            const desired = node.optimalLod ?? node.baseLod!;
            node.targetLevel = this._cappedLevelForNode(node, desired);
        }
    }

    /**
     * Applies each node's {@link ISOGLODNode.targetLevel}: switches a node to its target level when that
     * level's file is already decoded, otherwise records a pending download request for the file and leaves
     * the node on its current LOD (so nothing ever disappears). Nodes within their post-switch cooldown are
     * left untouched to damp oscillation (and keep their existing pending request).
     *
     * Each node tracks the single file it currently needs but lacks ({@link ISOGLODNode.pendingFile}). When a
     * node's target changes before that file finished downloading, the old file's reference is released; if no
     * other node still needs it, its queued/in-flight download is cancelled (see {@link _releaseFileRef}).
     * @returns true when at least one node changed LOD (callers should refresh the active ranges)
     */
    private _applyDesiredLods(): boolean {
        let dirty = false;
        for (const node of this._leafNodes) {
            // Nodes in cooldown keep their current LOD and their existing pending request untouched.
            if (node.lodCooldown && node.lodCooldown > 0) {
                continue;
            }
            const desired = node.targetLevel ?? node.baseLod!;
            let newPending: number | undefined;
            if (desired !== node.activeLod) {
                const entry = node.lods![String(desired)];
                if (entry) {
                    if (this._decodedFiles.has(entry.file)) {
                        this._switchActiveFile(node, entry.file);
                        node.activeLod = desired;
                        node.lodCooldown = this._lodCooldownFrames;
                        dirty = true;
                    } else {
                        newPending = entry.file;
                    }
                }
            }
            // Reconcile this node's pending-download reference against its (possibly changed) target.
            if (node.pendingFile !== newPending) {
                if (node.pendingFile !== undefined) {
                    this._releaseFileRef(node.pendingFile);
                }
                if (newPending !== undefined) {
                    this._acquirePendingFile(newPending);
                }
                node.pendingFile = newPending;
            }
        }
        return dirty;
    }

    /**
     * Moves a node's resident reference from its previous active file to the one it now renders, so the file
     * count that keeps a block in the work buffer stays accurate (and cancels any pending eviction of the new
     * file). The new file is already decoded.
     * @param node leaf node switching its rendered file
     * @param file the file the node now renders from
     */
    private _switchActiveFile(node: ISOGLODNode, file: number): void {
        if (node.activeFile === file) {
            return;
        }
        if (node.activeFile !== undefined) {
            this._releaseFileRef(node.activeFile);
        }
        this._acquireFileRef(file);
        node.activeFile = file;
    }

    /**
     * Adds a reference to a file (active render or pending download), cancelling any scheduled eviction.
     * @param fileId file index
     */
    private _acquireFileRef(fileId: number): void {
        const refs = (this._fileRefs.get(fileId) ?? 0) + 1;
        this._fileRefs.set(fileId, refs);
        if (refs === 1) {
            // Referenced again before its eviction cooldown elapsed: keep it resident.
            this._residency?.cancelEviction(fileId);
        }
    }

    /**
     * Records that a node needs a not-yet-decoded file, bumping its reference count and queueing the decode.
     * @param fileId file index the node now targets
     */
    private _acquirePendingFile(fileId: number): void {
        this._acquireFileRef(fileId);
        this._enqueueDecode(fileId);
    }

    /**
     * Releases a node's reference to a file. When the last reference is dropped: a decoded file is scheduled
     * for eviction (when streaming under a budget), and a still-downloading file has its queued decode dropped
     * and any in-flight download cancelled.
     * @param fileId file index the node no longer references
     */
    private _releaseFileRef(fileId: number): void {
        const refs = (this._fileRefs.get(fileId) ?? 0) - 1;
        if (refs > 0) {
            this._fileRefs.set(fileId, refs);
            return;
        }
        this._fileRefs.delete(fileId);
        if (this._decodedFiles.has(fileId)) {
            // No node renders it anymore: schedule eviction (only when streaming under a budget).
            if (this._evictionEnabled) {
                this._residency?.scheduleEviction(fileId);
            }
            return;
        }
        // Still downloading/queued: drop the queued decode and cancel any in-flight download.
        const queueIndex = this._decodeQueue.indexOf(fileId);
        if (queueIndex !== -1) {
            this._decodeQueue.splice(queueIndex, 1);
        }
        if (this._loadingFiles.has(fileId)) {
            // Flag the in-flight decode to bail at its next checkpoint and cancel its image downloads.
            this._cancelledDecodes.add(fileId);
            this._downloadManager.cancelGroup(fileId);
        }
    }

    /**
     * Per-frame LOD streaming loop. Ticks cooldowns and pumps the decode queue every frame, and runs the
     * cheap per-node frustum test every frame so the off-screen LOD bias tracks camera rotation. The LOD
     * re-evaluation is throttled to at most every {@link _lodUpdateInterval} frames once the camera has
     * translated far enough, but also runs immediately whenever a node enters/leaves the frustum (so its
     * detail upgrades/downgrades promptly) or a cap change forces it. Active ranges rebuild on any LOD change.
     */
    private _onLodFrame(): void {
        if (this._disposed || !this._baseLayerReady) {
            return;
        }
        for (const node of this._leafNodes) {
            if (node.lodCooldown && node.lodCooldown > 0) {
                node.lodCooldown--;
            }
        }
        // Tick eviction cooldowns: unreferenced files are freed once their cooldown elapses (budgeted streaming).
        if (this._evictionEnabled) {
            this._residency?.tick();
        }
        // In-flight/queued decodes still progress every frame.
        this._pumpDecodeQueue();

        // Per-node frustum test runs every frame (cheap) so the off-screen LOD bias tracks camera rotation,
        // not just the translation that gates the throttled LOD re-evaluation below.
        const frustumChanged = this._updateNodeFrustum();

        let runLodEval = this._forceLodUpdate || frustumChanged;
        if (!runLodEval && ++this._framesSinceLodUpdate >= this._lodUpdateInterval) {
            const camera = this._scene.activeCamera;
            const threshold = this._lodUpdateDistance;
            if (!camera || Vector3.DistanceSquared(camera.globalPosition, this._lastLodCamPos) >= threshold * threshold) {
                if (camera) {
                    this._lastLodCamPos.copyFrom(camera.globalPosition);
                }
                runLodEval = true;
            }
        }

        if (runLodEval) {
            this._forceLodUpdate = false;
            this._framesSinceLodUpdate = 0;
            this.evaluateOptimalLods(this._scene.activeCamera);
            this._computeTargetLevels();
            if (this._applyDesiredLods()) {
                this._refreshActiveRanges();
            }
        }
    }

    /**
     * Updates each leaf node's {@link ISOGLODNode.inFrustum} flag from a per-node frustum test against the
     * active camera. When {@link frustumCulling} is disabled (or there is no camera) every node is marked
     * in-frustum. Bounds are static (from the LOD tree), so flags are valid for all nodes regardless of
     * decode state. Returns true when any node's in-frustum state changed (so the LOD bias must be re-applied).
     * @returns whether any node's in-frustum state changed
     */
    private _updateNodeFrustum(): boolean {
        const camera = this._scene.activeCamera;
        let changed = false;

        if (!this._frustumCulling || !camera) {
            for (const node of this._leafNodes) {
                if (node.inFrustum === false) {
                    node.inFrustum = true;
                    changed = true;
                }
            }
            return changed;
        }

        // World-space frustum planes from the current view-projection, tested against each node's world AABB.
        // force=false uses the renderId/sync fast-path (still recomputes when the transform actually changed),
        // avoiding a full world-matrix recompute every frame for the per-node frustum test.
        const world = this.computeWorldMatrix(false);
        camera.getViewMatrix().multiplyToRef(camera.getProjectionMatrix(), this._cullViewProj);
        Frustum.GetPlanesToRef(this._cullViewProj, this._frustumPlanes);

        for (const node of this._leafNodes) {
            node.cullBounds!.update(world);
            const inFrustum = node.cullBounds!.isInFrustum(this._frustumPlanes);
            if (inFrustum !== node.inFrustum) {
                node.inFrustum = inFrustum;
                changed = true;
            }
        }
        return changed;
    }

    /**
     * Reads the splat count from SOG metadata.
     * @param data SOG metadata
     * @returns the splat count
     */
    private static _GetSplatCount(data: SOGRootData): number {
        return data.count ?? (Array.isArray(data.means.shape) ? data.means.shape[0] : 0);
    }

    /**
     * Disposes all GPU source textures of a SOG pack (they are only needed for the one decode pass).
     * @param pack the SOG texture pack
     */
    private static _DisposePack(pack: ISogTexturePack): void {
        pack.meansTextureL.dispose();
        pack.meansTextureU.dispose();
        pack.scalesTexture.dispose();
        pack.quatsTexture.dispose();
        pack.sh0Texture.dispose();
        pack.shCentroidsTexture?.dispose();
        pack.shLabelsTexture?.dispose();
        pack.codebookTexture?.dispose();
    }

    /**
     * Expands the running splat-center bounds with a newly decoded file's centers and updates the
     * mesh bounding info so the GS is correctly frustum-culled and pickable.
     * @param positions stride-4 splat centers for the new file
     * @param count number of splats
     */
    private _updateBounds(positions: Float32Array, count: number): void {
        const min = this._boundsMin;
        const max = this._boundsMax;
        for (let i = 0; i < count; i++) {
            const x = positions[i * 4 + 0];
            const y = positions[i * 4 + 1];
            const z = positions[i * 4 + 2];
            min.minimizeInPlaceFromFloats(x, y, z);
            max.maximizeInPlaceFromFloats(x, y, z);
        }
        this.setBoundingInfo(new BoundingInfo(min, max));
    }

    /**
     * Rebuilds the active interval set from the environment plus each node's currently-selected LOD entry,
     * coalesces adjacent ranges, and pushes the result to the sort worker.
     */
    private _refreshActiveRanges(): void {
        const ranges: IGaussianSplattingSplatRange[] = [];

        if (this._environmentRange) {
            ranges.push({ offset: this._environmentRange.offset, count: this._environmentRange.count });
        }

        for (const node of this._leafNodes) {
            if (node.activeLod === undefined) {
                continue;
            }
            const entry = node.lods![String(node.activeLod)];
            if (!entry) {
                continue;
            }
            const base = this._residency?.offset(entry.file);
            if (base === undefined) {
                continue;
            }
            ranges.push({ offset: base + entry.offset, count: entry.count });
        }

        this.setSplatIndexRanges(GaussianSplattingStream._CoalesceRanges(ranges));
    }

    /**
     * Sorts and merges adjacent/overlapping ranges to keep the interval list compact.
     * @param ranges raw ranges
     * @returns coalesced ranges
     */
    private static _CoalesceRanges(ranges: IGaussianSplattingSplatRange[]): IGaussianSplattingSplatRange[] {
        if (ranges.length <= 1) {
            return ranges;
        }
        const sorted = ranges.slice().sort((a, b) => a.offset - b.offset);
        const merged: IGaussianSplattingSplatRange[] = [{ offset: sorted[0].offset, count: sorted[0].count }];
        for (let i = 1; i < sorted.length; i++) {
            const last = merged[merged.length - 1];
            const range = sorted[i];
            const lastEnd = last.offset + last.count;
            if (range.offset <= lastEnd) {
                const end = Math.max(lastEnd, range.offset + range.count);
                last.count = end - last.offset;
            } else {
                merged.push({ offset: range.offset, count: range.count });
            }
        }
        return merged;
    }

    /**
     * Unzips a `.sog` bundle into a name -> bytes map, loading fflate on demand.
     * @param data zipped bytes
     * @returns map of entry name to bytes
     */
    private async _unzipAsync(data: Uint8Array): Promise<Map<string, Uint8Array>> {
        let fflateModule = this._streamOptions.fflate;
        if (!fflateModule) {
            if (typeof (window as any).fflate === "undefined") {
                await Tools.LoadScriptAsync(this._streamOptions.deflateURL ?? "https://unpkg.com/fflate/umd/index.js");
            }
            fflateModule = (window as any).fflate;
        }

        const unzipped = fflateModule.unzipSync(data) as Record<string, Uint8Array>;
        const files = new Map<string, Uint8Array>();
        for (const [name, content] of Object.entries(unzipped)) {
            files.set(name, content);
        }
        return files;
    }
}
