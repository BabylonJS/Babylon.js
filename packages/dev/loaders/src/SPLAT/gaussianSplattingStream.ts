import { GaussianSplattingMesh, type IGaussianSplattingStreamingPart, type IGaussianSplattingLodBudgetParticipant } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type GaussianSplattingPartProxyMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingPartProxyMesh";
import { type IGaussianSplattingSplatRange } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { Vector3, Matrix, Quaternion } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import { Frustum } from "core/Maths/math.frustum";
import { Plane } from "core/Maths/math.plane";
import { Camera } from "core/Cameras/camera";
import { type Observer } from "core/Misc/observable";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { CreateLineSystem } from "core/Meshes/Builders/linesBuilder";
import { type LinesMesh } from "core/Meshes/linesMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { ParseSogMetaAsTextures, type SOGRootData } from "./sog.pure";
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
    /** Projected screen size (pixels) of the node's AABB — the max across active cameras. Larger nodes keep finer
     * detail under the splat budget. Only computed while the budget is enabled. */
    pixelSize?: number;
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
     * using the per-splat cost (core data plus any baked SH and rotation/scale textures). Combined with
     * {@link maxResidentSplats} by taking the smaller of the two.
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
    /**
     * Enables budget-driven LOD: caps the total rendered splats by converging a screen-space (size + distance)
     * pixel-size threshold to the budget. Selection is view-direction-independent, so it is consistent across any
     * number of active cameras (each node takes the finest level and largest projected size any camera demands).
     * A number is an explicit splat cap; `"auto"` picks a device-tiered default (desktop 2.5M / iOS 1.5M /
     * other mobile 1M; XR shares the mobile tier). **Undefined (default) disables the cap** — LOD is pure
     * distance, identical to prior behavior. Runtime-mutable via the {@link splatBudget} accessor. When this stream
     * is hosted in a compound, the compound's {@link GaussianSplattingMesh.splatBudget} (if set) overrides this and
     * apportions a shared budget across all its streams.
     */
    splatBudget?: number | "auto";
    /**
     * When set, the stream does not render itself; instead it reserves a region of this compound mesh and
     * decodes/sorts into it, so its splats are depth-sorted and drawn in ONE pass together with the compound's
     * other (static) parts. Used by {@link AddGaussianSplattingStreamPart}. The stream mesh becomes a hidden
     * controller; the SOG up-axis orientation is applied to the reserved part's proxy transform.
     * @internal
     */
    hostCompound?: GaussianSplattingMesh;
    /**
     * When true, higher-order spherical-harmonics carried by the SOG files (`shN`) are GPU-decoded into baked
     * packed-u32 SH textures so the streamed splats render with view-dependent lighting (matching the non-stream
     * `.spz`/`.sog` path) instead of flat DC-only color. The SH degree is the max `shN.bands` across the streamed
     * files (lower-band files neutral-fill). No effect when the files carry no `shN`. Defaults to `true`, matching
     * the non-stream path's always-decode-if-present behavior; set to `false` to force flat DC-only color even
     * when the data carries `shN` (e.g. to save the decode cost/texture memory).
     */
    decodeSh?: boolean;
    /**
     * When true, each splat's rotation matrix + scale are GPU-decoded into half-float rotation/scale textures so the
     * streamed splats participate in voxel-based IBL shadowing (matching the non-stream path). Standalone: the work
     * buffer owns the rotation textures. Hosted: the compound's rotation textures become a shared render-target atlas
     * the stream decodes into. Defaults to `false`.
     */
    needsRotationScale?: boolean;
}

// tan(22.5deg): reference half-FOV for a 45-degree vertical FOV, used for FOV compensation (matches PlayCanvas).
const RefTanHalfFov = Math.tan((22.5 * Math.PI) / 180);

// Sentinel "file" ids for the residency controller's pinned (never-evicted) allocations.
const PaddingFileId = -2;
const EnvironmentFileId = -1;
// Core bytes per resident splat: the four work-buffer textures cost 16+16+16+4 = 52 bytes on the GPU, plus ~32
// bytes of CPU position/sort data. `_resolveResidentBudget` adds the SH and rotation/scale texture cost on top.
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
export class GaussianSplattingStream extends GaussianSplattingMesh implements IGaussianSplattingLodBudgetParticipant {
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

    // Budget-driven LOD. The stream's own resolved cap lives in the inherited protected `_splatBudget`
    // (0 = disabled; the option's "auto" is resolved to a device-tiered default in the constructor). `_lodPixelThreshold`
    // is the converged pixel-size threshold that selects each node's level. `_hostBudgetAllocation` is
    // the compound's apportioned slice when this stream is a coordinated budget participant (null = not coordinated,
    // so the stream uses its own `_splatBudget`).
    private _lodPixelThreshold = 1;
    private _hostBudgetAllocation: Nullable<number> = null;

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
    // Reused per-leaf "inside any active camera's frustum" accumulator for the union frustum test (avoids per-frame allocation).
    private readonly _frustumScratch: boolean[] = [];

    // GPU work buffer holding all decoded splats; created once the total capacity is known.
    private _workBuffer: Nullable<GaussianSplattingWorkBuffer> = null;
    // Higher-order SH. Set from options.decodeSh in the constructor; the degree/texture-count are the MAX across the
    // streamed files (learned in the meta pre-pass). 0 degree = no SH baking (files carry no shN or option is off).
    private _decodeSh!: boolean;
    private _streamShDegree = 0;
    private _shTextureCount = 0;
    // Rotation/scale for voxel-IBL shadows. Enabled via options.needsRotationScale.
    private _needsRotationScale = false;
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
    // Raw budget options; the final `_residentBudget` is resolved from these once the SH/rotation byte cost is known
    // (after the metadata pre-pass), so the memory budget accounts for the extra baked SH and rotation textures.
    private _maxResidentSplats = 0;
    private _memoryBudgetMb = 0;
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
    // Throttling state for the per-frame LOD loop: each active camera's world position at the last LOD evaluation, so
    // a re-eval is gated on the camera set changing or any camera translating past `_lodUpdateDistance`.
    private _framesSinceLodUpdate = 0;
    private readonly _lastLodCamPositions: Vector3[] = [];
    // Signature of the discrete projected-size inputs (per-camera identity/FOV/FOV-mode/viewport + render size) at the
    // last LOD evaluation. Camera translation is tracked separately (above); this catches the rest — a colocated
    // camera swap, a viewport resize, or an FOV change — which would otherwise leave the budget LODs stale.
    private _lastLodSignature = "";
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

    // Hosted mode: when set, the stream decodes/sorts into a reserved region of a compound mesh instead of
    // rendering itself. `_host` is the reserved-part handle (resolved once the total capacity is known),
    // `_positionBase` is the region's first splat index in the compound's shared position buffer.
    private readonly _hostCompound: Nullable<GaussianSplattingMesh> = null;
    private _host: Nullable<IGaussianSplattingStreamingPart> = null;
    private _positionBase = 0;
    // Unsubscribe functions for the host's atlas-rebuild hooks (backup/restore the region across a grow).
    private _unsubBeforeRebuild: Nullable<() => void> = null;
    private _unsubAfterRebuild: Nullable<() => void> = null;
    // Unsubscribe functions binding this controller's lifetime to its host compound: removing the part or disposing
    // the compound disposes this stream, even mid-load. Registered at reservation so the window is never open.
    private _hostUnsubRemove: Nullable<() => void> = null;
    private _hostUnsubDispose: Nullable<() => void> = null;
    // True once the host has released this stream's part (removePart, or the compound is being disposed), so dispose()
    // must NOT call back into the compound to remove the part again.
    private _partReleasedByHost = false;
    // CPU snapshot of this region's shared `_splatPositions` taken before an atlas grow and restored after it —
    // the grow rebuilds `_splatPositions` from CPU part sources, and a streamed region has none, so without this
    // its sort-worker positions would be zeroed (the streamed splats would collapse to the origin).
    private _positionSnapshot: Nullable<Float32Array> = null;
    // Hosted mode: resolves once the reserved part exists AND its base layer has decoded (proxy bounds are
    // real); rejects if streaming fails/disposes before that. Lets AddGaussianSplattingStreamPartAsync hand
    // back a ready part proxy, replacing the standalone waitForEnabled/waitForStreamedBounds handshake.
    private _partReadyPromise: Nullable<Promise<void>> = null;
    private _partReadyResolve: Nullable<() => void> = null;
    private _partReadyReject: Nullable<(reason: Error) => void> = null;
    private _partReadySettled = false;

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
        this._hostCompound = options.hostCompound ?? null;
        this._decodeSh = options.decodeSh ?? true;
        this._needsRotationScale = options.needsRotationScale ?? false;

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
        this._splatBudget = this._resolveSplatBudget(options.splatBudget);
        if (options.frustumCulling !== undefined) {
            this._frustumCulling = options.frustumCulling;
        }
        if (options.debugLodSource) {
            this._debugLodSource = options.debugLodSource;
        }
        if (options.evictionCooldownFrames !== undefined) {
            this._evictionCooldownFrames = Math.max(0, Math.floor(options.evictionCooldownFrames));
        }
        // Capture the raw budget options; `_residentBudget` is resolved in _streamAllAsync once the SH/rotation
        // per-splat cost is known (a memory budget must count the extra baked SH and rotation textures, not just core).
        if (options.maxResidentSplats !== undefined && options.maxResidentSplats > 0) {
            this._maxResidentSplats = Math.floor(options.maxResidentSplats);
        }
        if (options.memoryBudgetMb !== undefined && options.memoryBudgetMb > 0) {
            this._memoryBudgetMb = options.memoryBudgetMb;
        }

        this._downloadManager = new GaussianSplattingDownloadManager({
            maxConcurrent: options.maxConcurrentDownloads,
            maxRetries: options.maxDownloadRetries,
        });

        // PlayCanvas SOG data is authored with a flipped Y and Z-up. Standalone: bake the orientation into this
        // mesh's transform. Hosted: this mesh does not render — the orientation is applied to the reserved part's
        // proxy transform instead (see _streamAllAsync), so it composes with the compound's per-part world matrix.
        if (!this._hostCompound) {
            this.scaling.y *= -1;
            this.rotation.x = -Math.PI / 2;
        } else {
            // Hidden controller: never rendered/picked/serialized; the compound renders the streamed splats.
            this.setEnabled(false);
            this.isPickable = false;
            this.doNotSerialize = true;
            // Created before _streamAllAsync is kicked off (below) so there is no resolve-before-await race.
            this._partReadyPromise = new Promise<void>((resolve, reject) => {
                this._partReadyResolve = resolve;
                this._partReadyReject = reject;
            });
            // Attach a no-op rejection handler so a caller that never awaits whenPartReadyAsync() (e.g. the synchronous
            // AddGaussianSplattingStreamPart) does not produce an unhandled promise rejection on failure; real
            // consumers still observe the rejection through their own await.
            // eslint-disable-next-line github/no-then
            this._partReadyPromise.catch(() => {});
            // Bind to the host's disposal FROM CONSTRUCTION (not just from reservation): the metadata pre-pass in
            // _streamAllAsync runs before the region is reserved, so a compound disposed during that download would
            // otherwise be missed and the controller would reserve into a disposed host. dispose() -> _disposed, so
            // _streamAllAsync's post-download check bails before reserving.
            const disposeObserver = this._hostCompound.onDisposeObservable.add(() => {
                if (!this._disposed) {
                    this._partReleasedByHost = true;
                    this.dispose();
                }
            });
            this._hostUnsubDispose = () => this._hostCompound!.onDisposeObservable.remove(disposeObserver);
        }

        this._collectLodEntries(metadata.tree);

        if (options.debugDisplay) {
            this.debugDisplay = true;
        }

        // Kick off streaming without blocking the caller or the render loop. In hosted mode settle the part-ready
        // deferred: _streamAllAsync resolves it once the base layer has decoded. If it finishes WITHOUT the part ever
        // becoming ready (empty stream) or throws, dispose the controller so a hosted stream doesn't leave its work
        // buffer and reserved region allocated — the synchronous AddGaussianSplattingStreamPart never awaits, so it
        // can't clean up itself. `_partReadySettled` distinguishes a genuine success (leave it running) from a
        // finished-but-never-ready result (dispose).
        // eslint-disable-next-line github/no-then
        void this._streamAllAsync().then(
            () => {
                const becameReady = this._partReadySettled;
                this._rejectPartReady("GaussianSplattingStream: stream produced no splats.");
                if (!becameReady && this._hostCompound && !this._disposed) {
                    this._disposeAndReclaim();
                }
            },
            (e) => {
                Logger.Error("GaussianSplattingStream: streaming failed: " + (e?.message ?? e));
                this._rejectPartReady("GaussianSplattingStream: streaming failed: " + (e?.message ?? e));
                if (this._hostCompound && !this._disposed) {
                    this._disposeAndReclaim();
                }
            }
        );
    }

    public override getClassName(): string {
        return "GaussianSplattingStream";
    }

    /**
     * When `_hostCompound` is set (i.e. this stream was created via {@link AddGaussianSplattingStreamPart}
     * to drive a reserved region of another compound mesh, rather than rendering itself), this instance is
     * disabled and never drawn — so it never runs its own depth-sort worker and the base class's readiness
     * check (which waits for one) would never pass. Report ready unconditionally in that case; the host
     * compound is the one actually rendering, and its own `isReady()` already covers real sort completion.
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns true when ready
     */
    public override isReady(completeCheck = false): boolean {
        if (this._hostCompound) {
            return true;
        }
        return super.isReady(completeCheck);
    }

    /**
     * Hosted mode only: the compound part proxy this stream drives (world transform + visibility of the
     * reserved region), or null before the part has been reserved (or when running standalone).
     */
    public get streamingPartProxy(): Nullable<GaussianSplattingPartProxyMesh> {
        return this._host?.proxy ?? null;
    }

    /**
     * Hosted mode only: resolves once the reserved part exists and its base layer has decoded (so the proxy's
     * bounds are real and the part is ready to be placed/framed), or rejects if streaming fails/disposes first.
     * Resolves immediately for a standalone stream. Used by {@link AddGaussianSplattingStreamPartAsync}.
     * @returns a promise that settles when the hosted part is ready to use
     */
    public async whenPartReadyAsync(): Promise<void> {
        await (this._partReadyPromise ?? Promise.resolve());
    }

    /** Resolves the part-ready deferred (hosted mode); no-op if already settled or standalone. */
    private _resolvePartReady(): void {
        if (this._partReadySettled) {
            return;
        }
        this._partReadySettled = true;
        this._partReadyResolve?.();
    }

    /**
     * Rejects the part-ready deferred (hosted mode); no-op if already settled or standalone.
     * @param message failure reason surfaced to the awaiter
     */
    private _rejectPartReady(message: string): void {
        if (this._partReadySettled) {
            return;
        }
        this._partReadySettled = true;
        this._partReadyReject?.(new Error(message));
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
            if (this._isLoadingIdle() && this._sinkIsDepthSortSettled) {
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
     * This stream's own budget-driven LOD cap in splats (see {@link IGaussianSplattingStreamOptions.splatBudget}).
     * `0` disables the budget (pure distance LOD). Setting it caps the rendered splat count, taking effect on the
     * next frame. When this stream is hosted in a compound whose own budget is set, that shared budget overrides
     * this value — read the actual runtime cap from {@link effectiveSplatBudget}, not this getter (which always
     * reports the configured own cap).
     * @experimental
     */
    public override get splatBudget(): number {
        return this._splatBudget;
    }

    public override set splatBudget(value: number) {
        const budget = value > 0 ? Math.floor(value) : 0;
        if (budget === this._splatBudget) {
            return;
        }
        this._splatBudget = budget;
        // Re-evaluate LODs on the next frame regardless of the movement throttle so the change is immediate.
        this._forceLodUpdate = true;
    }

    /**
     * The splat cap actually in force this frame: a hosting compound's apportioned allocation when this stream is
     * coordinated, otherwise this stream's own {@link splatBudget}, clamped to what can be kept resident. `0` means
     * no cap (pure distance LOD). Unlike {@link splatBudget}, this reflects the compound override, so it is the value
     * to display or reason about at runtime.
     * @experimental
     */
    public get effectiveSplatBudget(): number {
        return this._effectiveSplatBudget();
    }

    /**
     * Resolves the raw {@link splatBudget} option to a concrete cap: `undefined` ⇒ 0 (disabled), `"auto"` ⇒ a
     * device-tiered default, a positive number ⇒ itself (floored).
     * @param option the raw option value
     * @returns the resolved splat cap (0 = disabled)
     */
    private _resolveSplatBudget(option: number | "auto" | undefined): number {
        if (option === undefined) {
            return 0;
        }
        if (option === "auto") {
            return this._computeDefaultSplatBudget();
        }
        return option > 0 ? Math.floor(option) : 0;
    }

    /**
     * Device-tiered default splat budget for {@link splatBudget} `"auto"`: desktop 2.5M, iOS 1.5M, other mobile
     * (incl. Android/XR) 1M. XR is folded into the mobile tier (no reliable at-construction detection).
     * @returns the default splat cap for this device
     */
    private _computeDefaultSplatBudget(): number {
        const isMobile = !!this._scene.getEngine().hostInformation?.isMobile;
        if (!isMobile) {
            return 2_500_000;
        }
        if (typeof navigator !== "undefined" && navigator.userAgent && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
            return 1_500_000;
        }
        return 1_000_000;
    }

    /**
     * The splat budget this stream converges against this frame: the compound's apportioned allocation when hosted
     * and coordinated, else this stream's own resolved budget. Clamped to the resident budget so the stream never
     * targets more splats than can be kept resident. `0` means the budget is disabled.
     * @returns the effective splat cap (0 = disabled)
     */
    private _effectiveSplatBudget(): number {
        if (this._hostBudgetAllocation !== null) {
            // Coordinated by the host: even a 0 allocation (static parts consumed the whole budget) keeps the budget
            // path active so the stream converges to its coarsest level — it must never revert to unbounded LOD, or
            // the compound total could exceed the cap.
            const alloc = Math.max(1, this._hostBudgetAllocation);
            return this._residentBudget > 0 ? Math.min(alloc, this._residentBudget) : alloc;
        }
        if (this._splatBudget <= 0) {
            return 0;
        }
        return this._residentBudget > 0 ? Math.min(this._splatBudget, this._residentBudget) : this._splatBudget;
    }

    /**
     * Whether budget-driven LOD is active this frame.
     * @returns true when a positive effective budget is in force
     */
    private _splatBudgetEnabled(): boolean {
        return this._effectiveSplatBudget() > 0;
    }

    /**
     * {@link IGaussianSplattingLodBudgetParticipant}: the splats this stream would render at full (distance-optimal)
     * detail — its demand on a host compound's shared budget. Computed from the current per-node distance-optimal
     * levels (no pixel threshold), so it does not depend on the allocation it is helping to compute.
     * @returns the full-detail rendered splat count (0 before the base layer is ready)
     */
    public getBudgetDemand(): number {
        if (!this._baseLayerReady) {
            return 0;
        }
        // Include the always-rendered environment as a fixed cost so the host allocates enough for it; the leaf
        // convergence reserves the same amount (see _computeTargetLevels).
        let sum = this._environmentSplatCount();
        for (const node of this._leafNodes) {
            const desired = node.optimalLod ?? node.baseLod!;
            sum += this._countAtLevel(node, this._cappedLevelForNode(node, desired));
        }
        return sum;
    }

    /**
     * {@link IGaussianSplattingLodBudgetParticipant}: sets the compound's apportioned share of the shared budget.
     * `null` releases coordination (revert to this stream's own {@link splatBudget}); a number (incl. 0, meaning
     * "coordinated at the coarsest level") drives the pixel-threshold convergence. Any change to the (already integer)
     * allocation forces a next-frame re-eval: a decrease may put the current selection over the new cap, and even a
     * small increase can unlock a finer level that a stationary camera would otherwise never re-evaluate to. The
     * apportioned demand is allocation-independent, so this settles in one step and does not churn frame to frame.
     * @param splats the apportioned allocation, or null to release coordination
     */
    public setBudgetAllocation(splats: Nullable<number>): void {
        if (splats === null) {
            if (this._hostBudgetAllocation !== null) {
                this._hostBudgetAllocation = null;
                this._forceLodUpdate = true;
            }
            return;
        }
        const prev = this._hostBudgetAllocation;
        this._hostBudgetAllocation = splats;
        if (prev === null || splats !== prev) {
            this._forceLodUpdate = true;
        }
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
        if (this._disposed) {
            // Idempotent: a failed load disposes from its own _streamAllAsync handler, and the awaiter's catch may
            // dispose again — don't re-fire cleanup/observables (and super.dispose) a second time.
            return;
        }
        this._disposed = true;
        this._rejectPartReady("GaussianSplattingStream: disposed before the part was ready.");
        this._unsubBeforeRebuild?.();
        this._unsubAfterRebuild?.();
        this._unsubBeforeRebuild = null;
        this._unsubAfterRebuild = null;
        this._hostUnsubRemove?.();
        this._hostUnsubDispose?.();
        this._hostUnsubRemove = null;
        this._hostUnsubDispose = null;
        // If this stream disposes on its own rather than because the host removed its part, release the reserved
        // region (tombstone). Reclaiming the rows is a separate compaction — cheap disposal here so tearing down N
        // parts doesn't trigger N atlas rebuilds; the caller/host reclaims when appropriate (a failed load compacts
        // once, see the _streamAllAsync handler). Skipped when the host removed the part (it owns that policy).
        if (this._hostCompound && !this._hostCompound.isDisposed()) {
            this._hostCompound.unregisterLodBudgetParticipant(this);
        }
        if (this._host && this._hostCompound && !this._partReleasedByHost && !this._hostCompound.isDisposed()) {
            this._hostCompound.removePart(this._host.partIndex);
        }
        this._host = null;
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
     * Disposes this stream (which tombstones its region) and then compacts the host once to actually reclaim the
     * reserved rows. Used on a definitive load failure / empty result — a discrete, one-off reclaim, versus a bare
     * {@link dispose} that only tombstones so tearing down several parts doesn't rebuild the atlas repeatedly.
     */
    private _disposeAndReclaim(): void {
        const compound = this._hostCompound;
        const hadPart = !!this._host && !this._partReleasedByHost;
        this.dispose();
        if (hadPart && compound && !compound.isDisposed()) {
            compound.compactAtlas();
        }
    }

    /**
     * The world matrix that actually places this stream's splats, used to map the camera into the space the
     * node bounds live in (for LOD distance) and to build per-node world AABBs (for frustum culling). Standalone:
     * this controller mesh carries the transform. Hosted: this controller is a hidden, unplaced node — the splats
     * are placed by the reserved part's proxy (SOG up-axis basis composed with the host's placement), so LOD and
     * culling MUST use the proxy's world matrix or they compute distances/frustum tests in the wrong space
     * (producing wrong per-chunk LODs, i.e. holes, whenever the host applies a non-identity transform).
     * @param force when true, forces a full world-matrix recompute (else uses the renderId/sync fast-path)
     * @returns the effective world matrix for LOD/culling
     */
    private _getEffectiveWorldMatrix(force: boolean): Matrix {
        if (this._host) {
            return this._host.proxy.computeWorldMatrix(force);
        }
        return this.computeWorldMatrix(force);
    }

    /**
     * The cameras the LOD should serve: `scene.activeCameras` when set (split-view / multi-view), else the single
     * `scene.activeCamera`. Mirrors the sort path's multi-camera handling.
     * @returns the non-null active cameras (may be empty)
     */
    private _getActiveLodCameras(): Camera[] {
        const cameras = this._scene.activeCameras?.length ? this._scene.activeCameras : this._scene.activeCamera ? [this._scene.activeCamera] : [];
        return cameras.filter((camera): camera is Camera => !!camera);
    }

    /**
     * Re-evaluates the optimal LOD for every node from the active cameras. Each node takes the finest level and the
     * largest projected pixel size any active camera demands (so every pane of a split view is served), and the
     * frustum bias uses the union of the frusta. Selection is view-direction-independent, so single- and multi-camera
     * rendering are consistent. The results are stored in each node's `optimalLod` / `pixelSize`.
     * @param camera when provided, evaluate against just this camera; otherwise use the active-camera set
     */
    public evaluateOptimalLods(camera: Nullable<Camera> = null): void {
        const cameras = camera ? [camera] : this._getActiveLodCameras();
        if (cameras.length === 0 || this._leafNodes.length === 0) {
            return;
        }

        const maxLod = Math.max(0, this._metadata.lodLevels - 1);
        const base = this._lodBaseDistance;
        const mult = this._lodMultiplier;
        const behindPenalty = this._lodBehindPenalty;
        const rangeMin = this._lodRangeMin;
        const rangeMax = this._lodRangeMax;
        const budgetEnabled = this._splatBudgetEnabled();
        const renderHeight = this._scene.getEngine().getRenderHeight() || 1;

        // Precompute each camera in the mesh's local space (where the node bounds live). The local forward is only
        // needed for the behind-camera penalty. FOV compensation uses min(tanHalfV, tanHalfH) (matches PlayCanvas).
        const engine = this._scene.getEngine();
        this._getEffectiveWorldMatrix(false).invertToRef(TmpInvWorld);
        const camInfos = cameras.map((cam) => {
            const aspect = engine.getAspectRatio(cam) || 1;
            let tanHalfV = Math.tan(cam.fov * 0.5);
            if (cam.fovMode === Camera.FOVMODE_HORIZONTAL_FIXED) {
                tanHalfV /= aspect;
            }
            const tanHalfH = tanHalfV * aspect;
            const fovScale = Math.min(tanHalfV, tanHalfH) / RefTanHalfFov;
            // Vertical pixel extent of THIS camera's viewport (split-view panes render to a fraction of the canvas),
            // so a node's projected size is measured against the pixels the camera actually draws into.
            const pixelHeight = renderHeight * (cam.viewport ? cam.viewport.height : 1);
            const localCamera = Vector3.TransformCoordinatesToRef(cam.globalPosition, TmpInvWorld, TmpLocalCamera);
            const info = { px: localCamera.x, py: localCamera.y, pz: localCamera.z, fwx: 0, fwy: 0, fwz: 0, fovScale, tanHalfV, pixelHeight };
            if (behindPenalty > 1) {
                cam.getDirectionToRef(LocalForwardAxis, TmpWorldForward);
                const localForward = Vector3.TransformNormalToRef(TmpWorldForward, TmpInvWorld, TmpLocalForward);
                localForward.normalize();
                info.fwx = localForward.x;
                info.fwy = localForward.y;
                info.fwz = localForward.z;
            }
            return info;
        });

        for (const node of this._leafNodes) {
            const mn = node.bound.min;
            const mx = node.bound.max;
            const cx = (mn[0] + mx[0]) * 0.5;
            const cy = (mn[1] + mx[1]) * 0.5;
            const cz = (mn[2] + mx[2]) * 0.5;
            const hx = mx[0] - mn[0];
            const hy = mx[1] - mn[1];
            const hz = mx[2] - mn[2];
            const radius = 0.5 * Math.sqrt(hx * hx + hy * hy + hz * hz);

            // Aggregate across cameras: the finest level and the largest projected size any active camera demands.
            let optimalLod = Number.POSITIVE_INFINITY;
            let pixelSize = 0;
            for (const cam of camInfos) {
                // Distance from the camera to the closest point on this node's AABB (local space).
                const qx = cam.px < mn[0] ? mn[0] : cam.px > mx[0] ? mx[0] : cam.px;
                const qy = cam.py < mn[1] ? mn[1] : cam.py > mx[1] ? mx[1] : cam.py;
                const qz = cam.pz < mn[2] ? mn[2] : cam.pz > mx[2] ? mx[2] : cam.pz;
                const dx = qx - cam.px;
                const dy = qy - cam.py;
                const dz = qz - cam.pz;
                const actualDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                // Push nodes behind the camera toward coarser LODs when a penalty is configured.
                let penalizedDistance = actualDistance;
                if (behindPenalty > 1 && actualDistance > 0.01) {
                    const dotOverDistance = (cam.fwx * dx + cam.fwy * dy + cam.fwz * dz) / actualDistance;
                    if (dotOverDistance < 0) {
                        penalizedDistance = actualDistance * (1 + -dotOverDistance * (behindPenalty - 1));
                    }
                }

                // Geometric LOD bands: threshold[k] = base * mult^(k-1). Keep the finest (min) any camera wants.
                const fovAdjustedDistance = penalizedDistance * cam.fovScale;
                let lod: number;
                if (maxLod === 0 || fovAdjustedDistance < base) {
                    lod = 0;
                } else {
                    lod = maxLod;
                    while (lod > 1 && fovAdjustedDistance < base * Math.pow(mult, lod - 1)) {
                        lod--;
                    }
                }
                if (lod < optimalLod) {
                    optimalLod = lod;
                }

                // Budget-driven LOD: raw projected pixel size (node diameter in pixels), largest across cameras.
                // Uses local radius/distance (invariant under uniform world scale); every camera weighs the same and
                // view direction is ignored, so single- and multi-camera rendering stay consistent.
                if (budgetEnabled) {
                    const rdx = cx - cam.px;
                    const rdy = cy - cam.py;
                    const rdz = cz - cam.pz;
                    const centerDist = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
                    const pixels = (radius * cam.pixelHeight) / (Math.max(centerDist, 1e-4) * cam.tanHalfV);
                    if (pixels > pixelSize) {
                        pixelSize = pixels;
                    }
                }
            }

            if (optimalLod < rangeMin) {
                optimalLod = rangeMin;
            } else if (optimalLod > rangeMax) {
                optimalLod = rangeMax;
            }

            // Frustum-based LOD bias: nodes outside EVERY active camera's frustum (see _updateNodeFrustum) are pushed
            // to the coarsest allowed level instead of being hidden. They stay in the render/sort set (off-screen and
            // clipped anyway), so turning a camera toward them shows low detail immediately, then refines.
            if (this._frustumCulling && node.inFrustum === false) {
                optimalLod = rangeMax;
            }

            node.optimalLod = optimalLod;
            if (budgetEnabled) {
                node.pixelSize = pixelSize;
            }
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

        // Malformed bounds break distance, projected-size, and frustum math. Check the coordinates are present and
        // finite, then the DERIVED diagonal is finite and positive: finite-but-huge coordinates (e.g. ±1e308) yield an
        // infinite span/radius/pixel-size and thus an infinite budget threshold that defeats the cap, while a zero
        // (degenerate) span projects to zero pixels and never coarsens. Either way, skip such a node entirely.
        const bmin = node.bound?.min;
        const bmax = node.bound?.max;
        if (!bmin || !bmax || bmin.length < 3 || bmax.length < 3 || !bmin.every((v) => Number.isFinite(v)) || !bmax.every((v) => Number.isFinite(v))) {
            return;
        }
        const spanX = bmax[0] - bmin[0];
        const spanY = bmax[1] - bmin[1];
        const spanZ = bmax[2] - bmin[2];
        const diagonal = Math.sqrt(spanX * spanX + spanY * spanY + spanZ * spanZ);
        if (!Number.isFinite(diagonal) || diagonal <= 0) {
            return;
        }

        // Declared LOD range: keys must resolve to a canonical, in-range, integer level so later `node.lods[String(level)]`
        // lookups always hit and an out-of-range fine level can't slip past the convergence (which only coarsens within
        // the declared level count) and defeat the cap.
        const declaredLevels = Math.floor(Number(this._metadata.lodLevels));
        const maxLevel = Number.isFinite(declaredLevels) && declaredLevels > 0 ? declaredLevels - 1 : 0;

        // Collect all levels that hold splats (PlayCanvas convention: level 0 is the finest, higher = coarser).
        // Normalize each entry's count to a finite positive integer HERE (metadata is untrusted and only shallowly
        // validated, so `count` may be a string): all downstream arithmetic — budget demand/convergence — then adds
        // numbers instead of concatenating strings. Require `String(level) === key` so a non-canonical key like "01"
        // (which `Number` maps to 1, but `String(1)` can't retrieve) is rejected rather than crashing a later lookup.
        const levels: number[] = [];
        for (const key of Object.keys(node.lods)) {
            const level = Number(key);
            const entry = node.lods[key];
            const count = entry ? Math.floor(Number(entry.count)) : NaN;
            if (Number.isInteger(level) && String(level) === key && level >= 0 && level <= maxLevel && entry && Number.isFinite(count) && count > 0) {
                entry.count = count;
                levels.push(level);
            }
        }
        if (levels.length === 0) {
            return;
        }
        levels.sort((a, b) => a - b);

        // Enforce non-increasing count as the level index increases (a coarser level must not cost MORE than a finer
        // one). Keep every level whose count is at or below the running minimum: equal-count adjacent levels are valid
        // (same splat count, different geometry) and preserved, while a malformed "coarser but larger" level is dropped
        // so the budget can never pick more splats than a cheaper available level and the coarsest kept level (the base)
        // is the true minimum — which the convergence relies on for its guaranteed cap.
        const usable: number[] = [];
        let minCount = Infinity;
        for (const level of levels) {
            const count = node.lods[String(level)].count;
            if (count <= minCount) {
                usable.push(level);
                minCount = count;
            }
        }

        node.availableLevels = usable;
        node.baseLod = usable[usable.length - 1];
        node.activeLod = undefined;
        node.lodCooldown = 0;
        node.inFrustum = true;
        // Local-space bounds for the per-node frustum test; the mesh world matrix is applied per evaluation.
        node.cullBounds = new BoundingInfo(Vector3.FromArray(bmin), Vector3.FromArray(bmax));
        this._leafNodes.push(node);
    }

    /**
     * Streams the scene: learns every source file's splat count, allocates one unified GPU work buffer
     * sized for all LOD files, decodes the environment and the coarsest LOD of every node as a permanent
     * base layer, then installs the per-frame loop that streams finer LODs on demand.
     */
    private async _streamAllAsync(): Promise<void> {
        // Step 1: learn splat counts for the environment and every referenced LOD file (cheap meta only). This also
        // resolves the max SH degree, so the resident-splat budget can now be sized with the SH/rotation byte cost.
        const fileIds = this._collectAllFileIds();
        const envCount = await this._gatherCountsAsync(fileIds);
        if (this._disposed) {
            return;
        }
        this._resolveResidentBudget();

        // Step 2: learn the full dataset size (padding + environment + every LOD file). The work buffer is
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

        if (this._hostCompound) {
            // Hosted: reserve a region of the compound sized to the work buffer, orient the part's proxy for the
            // SOG up-axis, and decode straight into the compound's shared atlas so the streamed splats sort/draw
            // in one pass with the compound's other parts. The compound owns the worker/render; this mesh stays
            // a hidden controller.
            const sogWorld = Matrix.Compose(new Vector3(1, -1, 1), Quaternion.RotationYawPitchRoll(0, -Math.PI / 2, 0), Vector3.ZeroReadOnly);
            // Reserve with SH so the compound converts its SH textures to shared render-targetable integer MRTs and
            // sets its SH degree; the hosted work buffer bakes into those shared targets at the region base offset.
            const host = this._hostCompound.reserveStreamingPart(capacity, sogWorld, this.name + "_part", this._shTextureCount, this._streamShDegree, this._needsRotationScale);
            this._host = host;
            this._positionBase = host.base;
            // Join the compound's shared splat budget (if any): the compound apportions its cap across all hosted
            // streams. Harmless when the compound has no budget set (registration just tracks the participant).
            this._hostCompound.registerLodBudgetParticipant(this);
            // Bind this controller's lifetime to its part FROM RESERVATION (not after readiness): removing the part or
            // disposing the compound — even while still downloading/decoding — disposes this stream so it stops writing
            // into the compound's borrowed textures. `_partReleasedByHost` stops dispose() from removing the part again.
            const compound = this._hostCompound;
            // The remove observer needs the assigned part index, so it is registered here (at reservation); the
            // compound-disposal observer was already registered at construction (see the ctor) to cover the pre-pass.
            const removeObserver = compound.onPartRemovedObservable.add((removedIndex) => {
                if (!this._disposed && this._host && removedIndex === this._host.partIndex) {
                    this._partReleasedByHost = true;
                    this.dispose();
                }
            });
            this._hostUnsubRemove = () => compound.onPartRemovedObservable.remove(removeObserver);
            const shExternal = this._shTextureCount > 0 && host.shMrtAtlas ? { textureCount: this._shTextureCount, externalMrts: host.shMrtAtlas } : undefined;
            const rotExternal = this._needsRotationScale && host.rotMrtAtlas ? { externalMrt: host.rotMrtAtlas } : undefined;
            // Use the region's ROW-ALIGNED capacity (host.capacity), not the raw stream capacity: backup/restore/
            // relayout scope to whole atlas rows, so an unaligned capacity would drop the region's partial final row.
            this._workBuffer = new GaussianSplattingWorkBuffer(
                this._scene,
                host.capacity,
                {
                    mrt: host.mrtAtlas!,
                    width: host.atlasWidth,
                    baseOffset: host.base,
                },
                shExternal,
                rotExternal
            );
            this._readbackCandidate = this._workBuffer.supportsAsyncCentersReadback;
            // Write decoded centers directly into the compound's shared position buffer (offset by the region base).
            this._splatPositions = host.splatPositions;
            this._vertexCount = capacity;
            // Preserve this region's GPU-only data when the compound grows its atlas (adding a part / another
            // stream): back it up before the old atlas is disposed, then rebind + restore into the new atlas.
            const wb = this._workBuffer;
            this._unsubBeforeRebuild = host.onBeforeAtlasRebuild(() => {
                // Back up the region's atlas texels, and snapshot its CPU positions: the grow reallocates the shared
                // `_splatPositions` and rebuilds it from CPU part sources, but this region has none, so its positions
                // would be lost. `this._splatPositions` is still the pre-grow array and holds the real positions.
                wb.backupRegion();
                this._positionSnapshot = this._splatPositions ? this._splatPositions.slice(this._positionBase * 4, (this._positionBase + this._vertexCount) * 4) : null;
            });
            this._unsubAfterRebuild = host.onAfterAtlasRebuild(() => {
                if (host.mrtAtlas) {
                    wb.rebindAtlas(host.mrtAtlas);
                }
                // Rebind to the recreated shared SH and rotation atlases; restoreRegion() writes the backups into them.
                wb.rebindShAtlas(host.shMrtAtlas);
                wb.rebindRotAtlas(host.rotMrtAtlas);
                // A plain grow keeps `host.base`; a compaction relocates the region to a new base. Update the base
                // before restoring so the region's texels and positions land there.
                this._positionBase = host.base;
                wb.setBaseOffset(host.base);
                wb.restoreRegion();
                // Re-cache the reallocated shared array and restore the region's CPU positions at the (new) base.
                this._splatPositions = host.splatPositions;
                if (this._positionSnapshot && this._splatPositions) {
                    this._splatPositions.set(this._positionSnapshot, this._positionBase * 4);
                    this._positionSnapshot = null;
                }
            });
            // Nothing active until a resource is decoded (as a range on the reserved part).
            host.setActiveRanges([]);
        } else {
            // Bake higher-order SH when requested and present: the work buffer owns `_shTextureCount` integer SH
            // targets and the draw path lights the decoded splats with them (SH degree = max across files).
            const sh = this._shTextureCount > 0 ? { textureCount: this._shTextureCount } : undefined;
            // Decode rotation/scale into an owned 3-attachment half-float target when voxel-IBL shadows are requested.
            const rot = this._needsRotationScale ? {} : undefined;
            this._workBuffer = new GaussianSplattingWorkBuffer(this._scene, capacity, undefined, sh, rot);
            // GPU readback is only enabled after it is validated against a CPU decode on the first file (see
            // _probeReadbackAsync); until then positions are decoded on the CPU so there is always a correct result.
            this._readbackCandidate = this._workBuffer.supportsAsyncCentersReadback;
            const splatPositions = new Float32Array(capacity * 4);
            const textures = this._workBuffer.textures;
            const shTextures = sh ? this._workBuffer.shTextures : undefined;
            const rotTextures = rot ? this._workBuffer.rotationTextures : undefined;
            this._setExternalWorkBuffer(textures[0], textures[1], textures[2], textures[3], splatPositions, capacity, shTextures, this._streamShDegree, rotTextures);
            // Nothing is active until at least one resource has been decoded.
            this.setSplatIndexRanges([]);
            this.setEnabled(true);
        }

        // Hosted only: compile the region's backup/restore copy shaders BEFORE decoding any data, so a later
        // grow/compaction (which synchronously backs this region up) can never race shader compilation and lose it.
        if (this._host && this._workBuffer) {
            await this._waitForCanBackupAsync(this._workBuffer);
            if (this._disposed) {
                return;
            }
        }

        // Step 3: decode the environment, then every node's coarsest LOD as the permanent base layer.
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
        // Step 4: hand off to the per-frame LOD streaming loop.
        this._baseLayerReady = true;
        if (!this._lodObserver) {
            this._lodObserver = this._scene.onBeforeRenderObservable.add(() => this._onLodFrame());
        }
        // Hosted: the reserved part now exists with a decoded base layer and real bounds — release awaiters.
        this._resolvePartReady();
    }

    /**
     * Waits (up to a frame cap) until the work buffer's backup/restore copy shaders are compiled, so a later
     * grow/compaction can preserve this hosted region (see {@link GaussianSplattingWorkBuffer.backupRegion}).
     * Polls per rendered frame: shader readiness here depends on the render loop (and the shared atlas can be
     * rebuilt concurrently), so this stays synchronized with the render-driven decode and always makes progress.
     * On timeout it proceeds best-effort — a subsequent grow/compaction then warns rather than blocking decode.
     * @param wb the hosted work buffer to wait on
     */
    private async _waitForCanBackupAsync(wb: GaussianSplattingWorkBuffer): Promise<void> {
        for (let frame = 0; frame < 600 && !this._disposed; frame++) {
            if (wb.canBackup) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => this._scene.onBeforeRenderObservable.addOnce(() => resolve()));
        }
        if (!this._disposed && !wb.canBackup) {
            Logger.Warn("GaussianSplattingStream: backup/restore copy shaders did not compile in time; a grow/compaction before they are ready may drop streamed data.");
        }
    }

    /**
     * Resolves the resident-splat budget from the raw options, sizing a memory (MB) budget with the actual per-splat
     * GPU+CPU cost — core data plus the baked SH textures and rotation/scale textures when enabled — so SH/rotation
     * assets don't silently consume up to double the configured budget. Requires the SH degree (from the metadata
     * pre-pass) to be known. The smaller of the splat-count and memory budgets wins.
     */
    private _resolveResidentBudget(): void {
        let budget = this._maxResidentSplats;
        if (this._memoryBudgetMb > 0) {
            // Per resident splat: core 84 B, + 16 B per packed-u32 SH texture, + the 3 RGBA rotation textures. The
            // work buffer uses half-float rotation textures (8 B each = 24 B) when the engine can render to them,
            // else full float (16 B each = 48 B) — match that so fallback devices aren't under-budgeted.
            const rotBytes = this._scene.getEngine().getCaps().textureHalfFloatRender ? 24 : 48;
            const bytesPerSplat = BytesPerResidentSplat + this._shTextureCount * 16 + (this._needsRotationScale ? rotBytes : 0);
            const fromMB = Math.floor((this._memoryBudgetMb * 1024 * 1024) / bytesPerSplat);
            budget = budget > 0 ? Math.min(budget, fromMB) : fromMB;
        }
        this._residentBudget = budget;
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
        // Track the max SH degree/coeffs across every streamed file (+ environment): the baked SH atlas is sized
        // for the max once, up front, so no mid-stream resize — lower-degree files neutral-fill their higher bands.
        let maxShDegree = 0;
        let maxCoeffs = 0;
        const foldSh = (data: SOGRootData) => {
            const info = GaussianSplattingStream._GetShInfo(data);
            if (info.degree > maxShDegree) {
                maxShDegree = info.degree;
            }
            if (info.coeffs > maxCoeffs) {
                maxCoeffs = info.coeffs;
            }
        };
        if (this._metadata.environment) {
            try {
                const url = this._rootUrl + this._metadata.environment;
                const buffer = await this._downloadManager.loadFileAsync(url);
                const files = await this._unzipAsync(new Uint8Array(buffer));
                const metaBytes = files.get("meta.json");
                if (metaBytes) {
                    const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as SOGRootData;
                    envCount = GaussianSplattingStream._GetSplatCount(meta);
                    foldSh(meta);
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

        // Fold in every file's SH (done after the parallel fetch so _fileMeta is fully populated).
        for (const { sogData } of this._fileMeta.values()) {
            foldSh(sogData);
        }

        // Resolve the stream's baked-SH configuration: enabled only when requested AND the data carries shN.
        if (this._decodeSh && maxShDegree > 0 && maxCoeffs > 0) {
            this._streamShDegree = maxShDegree;
            // Packed-u32 SH textures: 16 SH scalar-bytes per texel, 3 channels per coefficient (matches ParseSogDatas).
            this._shTextureCount = Math.ceil((maxCoeffs * 3) / 16);
        }

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
        // In hosted mode _splatPositions is the compound's shared buffer; the region starts at _positionBase.
        this._splatPositions!.set(positions, (this._positionBase + base) * 4);
        this._updateBounds(positions, count);
        // Incrementally patch only this range in the sort worker (avoids the full position-buffer re-copy).
        this._sinkPostPositionsRange(base, count);
    }

    // ---- Sink routing: standalone drives this mesh; hosted drives the compound's reserved-part handle. ----

    /**
     * Sets the active source ranges (local to the stream's buffer) on the render sink.
     * @param localRanges active ranges in the stream's local index space
     */
    private _sinkSetActiveRanges(localRanges: readonly IGaussianSplattingSplatRange[]): void {
        if (this._host) {
            this._host.setActiveRanges(localRanges);
        } else {
            this.setSplatIndexRanges(localRanges);
        }
    }

    /**
     * Patches a decoded position range (local offset) into the render sink's sort worker.
     * @param base first splat index of the range, local to the stream's buffer
     * @param count number of splats in the range
     */
    private _sinkPostPositionsRange(base: number, count: number): void {
        if (this._host) {
            this._host.postPositionsRange(base, count);
        } else {
            this._postWorkerPositionsRange(base, count);
        }
    }

    /** Re-posts the full position/part set to the render sink's worker (after a relayout moved the region). */
    private _sinkNotifyDataChanged(): void {
        if (this._host) {
            this._host.notifyDataChanged();
        } else {
            this._notifyWorkerNewData();
        }
    }

    /** Whether the render sink's depth sort is settled. */
    private get _sinkIsDepthSortSettled(): boolean {
        return this._host ? this._host.isDepthSortSettled : this._isDepthSortSettled;
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
        // full capacity*4 scratch buffer. Block offsets are region-local; in hosted mode `_splatPositions` is the
        // compound-wide buffer, so shift both source and destination by the region base (`_positionBase`, 0 standalone).
        const positions = this._splatPositions;
        const base = this._positionBase;
        resident.sort((a, b) => a.offset - b.offset);
        for (const block of resident) {
            const oldOffset = oldOffsets.get(block.file)!;
            if (oldOffset !== block.offset) {
                positions.copyWithin((base + block.offset) * 4, (base + oldOffset) * 4, (base + oldOffset + block.count) * 4);
            }
        }

        // Update the environment offset (it may have moved), re-post to the sort worker, and refresh ranges.
        if (this._environmentRange) {
            const envOffset = this._residency.offset(EnvironmentFileId);
            if (envOffset !== undefined) {
                this._environmentRange.offset = envOffset;
            }
        }
        this._sinkNotifyDataChanged();
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
     * Computes each node's {@link ISOGLODNode.targetLevel}. With the splat budget disabled this is the
     * distance-optimal level snapped to an available level (capped by {@link maxDetailLod}) — unchanged prior
     * behavior. With the budget enabled it converges a global pixel-size threshold to the budget and coarsens each
     * node from its distance-optimal ceiling by how far its projected size falls below that threshold.
     */
    private _computeTargetLevels(): void {
        const budget = this._effectiveSplatBudget();
        if (budget <= 0) {
            for (const node of this._leafNodes) {
                const desired = node.optimalLod ?? node.baseLod!;
                node.targetLevel = this._cappedLevelForNode(node, desired);
            }
            return;
        }
        // The environment is always rendered on top of the leaves, so reserve it as a fixed cost: the leaves
        // converge against the remainder, keeping the stream's total (env + leaves) within the budget.
        const leafBudget = Math.max(0, budget - this._environmentSplatCount());
        this._convergePixelThreshold(leafBudget);
        const t = this._lodPixelThreshold;
        for (const node of this._leafNodes) {
            node.targetLevel = this._budgetedLevel(node, t);
        }
    }

    /**
     * Splat count of the always-rendered environment layer (0 when none), coerced to a finite non-negative integer.
     * Counted as a fixed cost in both the budget demand and the leaf convergence so it is never over-drawn.
     * @returns the environment's rendered splat count
     */
    private _environmentSplatCount(): number {
        const count = this._environmentRange ? Math.floor(Number(this._environmentRange.count)) : 0;
        return Number.isFinite(count) && count > 0 ? count : 0;
    }

    /**
     * The level a node renders at for a given pixel-size threshold `t`: its distance-optimal ceiling, coarsened by
     * `round(log_mult(t / pixelSize))` geometric steps when its projected size is below `t`. Snapped to
     * an available level honoring {@link maxDetailLod}.
     * @param node leaf node
     * @param t pixel-size threshold (pixels)
     * @returns the chosen available LOD level
     */
    private _budgetedLevel(node: ISOGLODNode, t: number): number {
        const ceiling = node.optimalLod ?? node.baseLod!;
        const ps = node.pixelSize ?? 0;
        let steps = 0;
        if (ps > 0 && t > ps) {
            steps = Math.max(0, Math.round(Math.log(t / ps) / Math.log(this._lodMultiplier)));
        }
        return this._cappedLevelForNode(node, ceiling + steps);
    }

    /**
     * Splat count of a node's file at a given (already snapped) available level.
     * @param node leaf node
     * @param level available LOD level
     * @returns the level's splat count (0 if absent)
     */
    private _countAtLevel(node: ISOGLODNode, level: number): number {
        const entry = node.lods![String(level)];
        return entry ? entry.count : 0;
    }

    /**
     * Sum of every leaf's rendered splat count at pixel-size threshold `t`.
     * @param t pixel-size threshold (pixels)
     * @returns total rendered splats
     */
    private _totalSplatsAtThreshold(t: number): number {
        let sum = 0;
        for (const node of this._leafNodes) {
            sum += this._countAtLevel(node, this._budgetedLevel(node, t));
        }
        return sum;
    }

    /**
     * Converges the global pixel-size threshold {@link _lodPixelThreshold} to the largest detail whose total rendered
     * splats is still within `budget` (the pixel-scale cut, floored at the true sub-pixel limit of 1 px). The
     * total is monotonically non-increasing in the threshold, so a bisection on `[floorT, ceilT]` — where `ceilT`
     * coarsens every node to its coarsest available level — gives a GUARANTEED result at or under the cap. When even
     * that coarsest state exceeds the budget (the budget is below the pinned minimum detail), the threshold is set to
     * `ceilT` so every node renders at minimum detail — the best achievable; the cap is then unavoidable. O(leaves)
     * per iteration; no decode.
     * @param budget target maximum rendered splat count
     */
    private _convergePixelThreshold(budget: number): void {
        const floorT = 1; // sub-pixel limit, in pixels
        // At the finest allowed (threshold floor) we are already within budget: no coarsening needed.
        if (this._totalSplatsAtThreshold(floorT) <= budget) {
            this._lodPixelThreshold = floorT;
            return;
        }
        // A threshold large enough to coarsen every node to its coarsest available level: a node coarsens by
        // round(log_mult(t / pixelSize)) steps, so t >= maxPixelSize · mult^(lodLevels + 1) saturates them all.
        let maxPixelSize = floorT;
        for (const node of this._leafNodes) {
            if (node.pixelSize && node.pixelSize > maxPixelSize) {
                maxPixelSize = node.pixelSize;
            }
        }
        // Cap the exponent (real LOD trees are shallow) so untrusted metadata can't push ceilT to Infinity, which
        // would skip the bisection below and force every node to minimum detail.
        const lodLevels = Math.min(32, Math.max(1, this._metadata.lodLevels));
        const ceilT = maxPixelSize * Math.pow(this._lodMultiplier, lodLevels + 1);
        if (this._totalSplatsAtThreshold(ceilT) > budget) {
            // Even the coarsest level exceeds the budget (pinned base layers alone are over): render minimum detail.
            this._lodPixelThreshold = ceilT;
            return;
        }
        // Bisection: `hi` always satisfies the cap (starts at ceilT), `lo` never does, so the result is guaranteed
        // within budget while keeping the finest detail the budget allows. Deterministic => temporally stable.
        let lo = floorT;
        let hi = ceilT;
        for (let i = 0; i < 40 && hi - lo > 1e-3 * hi; i++) {
            const mid = 0.5 * (lo + hi);
            if (this._totalSplatsAtThreshold(mid) <= budget) {
                hi = mid;
            } else {
                lo = mid;
            }
        }
        this._lodPixelThreshold = hi;
    }

    /**
     * The finest already-decoded level of a node that is at least as coarse as `level` (index >= level). Used to
     * enforce the budget cap immediately without waiting for a download. Returns `null` when no such level is resident
     * — including when eviction has freed the base layer — so the caller keeps the currently-visible (resident) file
     * rather than switching to a non-resident one, which would render a hole.
     * @param node leaf node
     * @param level the minimum coarseness (level index) required
     * @returns a resident level index >= level, or null when none is resident
     */
    private _residentLevelAtLeast(node: ISOGLODNode, level: number): Nullable<number> {
        for (const lvl of node.availableLevels!) {
            if (lvl >= level && this._decodedFiles.has(node.lods![String(lvl)].file)) {
                return lvl;
            }
        }
        return null;
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
            const desired = node.targetLevel ?? node.baseLod!;

            // Budget cap enforcement (only when a budget is in force — otherwise ordinary distance/frustum coarsening
            // must keep going through the cooldown path below, unchanged from pre-budget behavior). If the node renders
            // FINER than its target (activeLod index < target) it exceeds the cap, so coarsen immediately — bypassing
            // the oscillation cooldown and any not-yet-downloaded finer target — to the finest already-resident level at
            // least as coarse as the target. When nothing coarser is resident (e.g. eviction freed the base layer) keep
            // the current visible file and let the normal path below queue the coarse download, so nothing disappears.
            if (this._splatBudgetEnabled() && node.activeLod !== undefined && node.activeLod < desired) {
                const coarse = this._residentLevelAtLeast(node, desired);
                if (coarse !== null && coarse !== node.activeLod) {
                    this._switchActiveFile(node, node.lods![String(coarse)].file);
                    node.activeLod = coarse;
                    node.lodCooldown = this._lodCooldownFrames;
                    dirty = true;
                }
            }

            // Nodes in cooldown keep their current LOD and their existing pending request untouched (the cap
            // coarsening above already ran, so this only gates refinement toward the target).
            if (node.lodCooldown && node.lodCooldown > 0) {
                continue;
            }
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
     * detail upgrades/downgrades promptly), a node whose cooldown just expired still needs to switch LOD,
     * or a cap change forces it. Active ranges rebuild on any LOD change.
     *
     * The cooldown-expiry trigger lets a node reach its already-computed target level as soon as its
     * cooldown clears, rather than waiting for the camera to move. This matters right from load: a
     * node's base-layer decode is itself applied as a switch (from no active level to the base one), so
     * it starts the same cooldown a later switch would — this trigger is what lets the node progress past
     * that base level promptly once it expires, even at a fixed camera pose.
     */
    private _onLodFrame(): void {
        if (this._disposed || !this._baseLayerReady) {
            return;
        }
        let cooldownExpiredWithPendingSwitch = false;
        for (const node of this._leafNodes) {
            if (node.lodCooldown && node.lodCooldown > 0) {
                node.lodCooldown--;
                if (node.lodCooldown === 0 && node.targetLevel !== undefined && node.targetLevel !== node.activeLod) {
                    cooldownExpiredWithPendingSwitch = true;
                }
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

        let runLodEval = this._forceLodUpdate || frustumChanged || cooldownExpiredWithPendingSwitch;
        if (!runLodEval && ++this._framesSinceLodUpdate >= this._lodUpdateInterval) {
            const cameras = this._getActiveLodCameras();
            const threshold = this._lodUpdateDistance;
            // Re-evaluate when the active-camera set changes, when ANY active camera translated past the threshold, or
            // when a discrete projected-size input changed (identity / FOV / viewport / render size). LOD selection is
            // view-direction-independent, so rotation alone doesn't need a re-eval (the frustum test above tracks it).
            if (cameras.length !== this._lastLodCamPositions.length || this._computeLodSignature(cameras) !== this._lastLodSignature) {
                runLodEval = true;
            } else {
                for (let i = 0; i < cameras.length; i++) {
                    if (Vector3.DistanceSquared(cameras[i].globalPosition, this._lastLodCamPositions[i]) >= threshold * threshold) {
                        runLodEval = true;
                        break;
                    }
                }
            }
        }

        if (runLodEval) {
            this._forceLodUpdate = false;
            this._framesSinceLodUpdate = 0;
            // Snapshot each active camera's position and the projected-size signature so the next throttled check
            // measures movement/input changes against them.
            const cameras = this._getActiveLodCameras();
            this._lastLodCamPositions.length = 0;
            for (const cam of cameras) {
                this._lastLodCamPositions.push(cam.globalPosition.clone());
            }
            this._lastLodSignature = this._computeLodSignature(cameras);
            this.evaluateOptimalLods();
            this._computeTargetLevels();
            if (this._applyDesiredLods()) {
                this._refreshActiveRanges();
            }
        }
    }

    /**
     * A cheap signature of the discrete inputs (besides camera translation, tracked separately) that affect projected
     * pixel size: each camera's identity, FOV, FOV mode and viewport, plus the engine render size and the effective
     * world matrix revision. A change invalidates the throttled budget LOD so a colocated camera swap / viewport
     * resize / FOV change — or the stream (or its hosted proxy) being moved or scaled while still in frustum, which
     * shifts every node's distance and projected size — can't leave it stale.
     * @param cameras the active cameras
     * @returns the signature string
     */
    private _computeLodSignature(cameras: Camera[]): string {
        const engine = this._scene.getEngine();
        let sig = `${engine.getRenderWidth()}x${engine.getRenderHeight()}#${this._getEffectiveWorldMatrix(false).updateFlag}`;
        for (const cam of cameras) {
            const vp = cam.viewport;
            sig += `|${cam.uniqueId}:${cam.fov}:${cam.fovMode}:${vp.x},${vp.y},${vp.width},${vp.height}`;
        }
        return sig;
    }

    /**
     * Updates each leaf node's {@link ISOGLODNode.inFrustum} flag: a node is in-frustum if it is inside ANY
     * active camera's frustum (the union). When {@link frustumCulling} is disabled (or there are no cameras)
     * every node is marked in-frustum. Bounds are static (from the LOD tree), so flags are valid for all nodes
     * regardless of decode state. Returns true when any node's in-frustum state changed (so the LOD bias must be re-applied).
     * @returns whether any node's in-frustum state changed
     */
    private _updateNodeFrustum(): boolean {
        const cameras = this._getActiveLodCameras();
        let changed = false;

        if (!this._frustumCulling || cameras.length === 0) {
            for (const node of this._leafNodes) {
                if (node.inFrustum === false) {
                    node.inFrustum = true;
                    changed = true;
                }
            }
            return changed;
        }

        const nodes = this._leafNodes;
        const inAny = this._frustumScratch;
        // Update each node's world AABB once (force=false uses the renderId/sync fast-path, avoiding a full
        // world-matrix recompute), then seed the union accumulator to false.
        const world = this._getEffectiveWorldMatrix(false);
        for (let i = 0; i < nodes.length; i++) {
            nodes[i].cullBounds!.update(world);
            inAny[i] = false;
        }
        // A node is in-frustum if inside ANY active camera's frustum: OR each camera's test into the accumulator.
        for (const cam of cameras) {
            cam.getViewMatrix().multiplyToRef(cam.getProjectionMatrix(), this._cullViewProj);
            Frustum.GetPlanesToRef(this._cullViewProj, this._frustumPlanes);
            for (let i = 0; i < nodes.length; i++) {
                if (!inAny[i] && nodes[i].cullBounds!.isInFrustum(this._frustumPlanes)) {
                    inAny[i] = true;
                }
            }
        }
        for (let i = 0; i < nodes.length; i++) {
            if (inAny[i] !== nodes[i].inFrustum) {
                nodes[i].inFrustum = inAny[i];
                changed = true;
            }
        }
        return changed;
    }

    /**
     * Reads the splat count from SOG metadata, coerced to a finite non-negative integer (metadata is untrusted, so
     * `count` / `shape[0]` may be a string or malformed — a non-numeric value must not leak into count arithmetic).
     * @param data SOG metadata
     * @returns the splat count (0 when absent/invalid)
     */
    private static _GetSplatCount(data: SOGRootData): number {
        const raw = data.count ?? (Array.isArray(data.means.shape) ? data.means.shape[0] : 0);
        const count = Math.floor(Number(raw));
        return Number.isFinite(count) && count > 0 ? count : 0;
    }

    /**
     * Reads a SOG file's higher-order SH degree and coefficient count from its metadata, mirroring
     * {@link ParseSogDatas}'s `coeffs`/`shDegree` derivation. Returns zeros when the file carries no `shN`.
     * @param data parsed SOG root metadata
     * @returns the SH degree and higher-order coefficient count (excludes the DC/SH0 term)
     */
    private static _GetShInfo(data: SOGRootData): { degree: number; coeffs: number } {
        if (!data.shN) {
            return { degree: 0, coeffs: 0 };
        }
        // Derive the SH degree from remote (untrusted) metadata, then validate/clamp it: the degree drives the SH
        // render-target count and decode-pass count, so a bogus (huge / non-finite / negative) `bands` or `shape`
        // must not be able to demand unbounded allocation. The draw path supports shTexture0..4, i.e. degree <= 4.
        const maxDegree = 4;
        let degree = 0;
        const bands = data.shN.bands;
        if (typeof bands === "number" && Number.isFinite(bands) && bands > 0) {
            degree = Math.floor(bands);
        } else if (Array.isArray(data.shN.shape) && Number.isFinite(data.shN.shape[1]) && data.shN.shape[1] > 0) {
            const shapeCoeffs = Math.floor(data.shN.shape[1] / 3);
            degree = shapeCoeffs > 0 ? Math.round(Math.sqrt(shapeCoeffs + 1) - 1) : 0;
        }
        if (!(degree > 0)) {
            return { degree: 0, coeffs: 0 };
        }
        if (degree > maxDegree) {
            Logger.Warn(`GaussianSplattingStream: SH degree ${degree} exceeds the maximum supported (${maxDegree}); clamping.`);
            degree = maxDegree;
        }
        return { degree, coeffs: (degree + 1) ** 2 - 1 };
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
        // Hosted: grow the reserved part's (and compound's) bounds. Standalone: set this mesh's bounds.
        if (this._host) {
            this._host.expandBounds(min, max);
        } else {
            this.setBoundingInfo(new BoundingInfo(min, max));
        }
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

        // Ranges are local to the stream's buffer; the sink (compound handle) offsets them by the region base.
        this._sinkSetActiveRanges(GaussianSplattingStream._CoalesceRanges(ranges));
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

/**
 * Adds a PlayCanvas-style SOG LOD stream as a part of a compound Gaussian Splatting mesh, so the streamed
 * splats are depth-sorted and rendered in ONE pass together with the compound's other (static) parts.
 *
 * The returned mesh is a hidden controller: it streams SOG LOD files, GPU-decodes them into a reserved region
 * of the compound's shared atlas, and drives which of its splats are active (LOD) — the compound owns the sort
 * and the single instanced draw. The SOG up-axis orientation is applied to the reserved part's proxy transform;
 * move/hide the part via the proxy (`streamController` exposes it once streaming has started).
 * @param compound the compound mesh to add the streamed part to
 * @param name name for the streaming controller / part
 * @param metadata parsed `lod-meta.json`
 * @param rootUrl base URL the metadata's relative paths resolve against
 * @param options streaming options
 * @returns the streaming controller mesh (hidden; drives the reserved compound part)
 * @experimental
 */
export function AddGaussianSplattingStreamPart(
    compound: GaussianSplattingMesh,
    name: string,
    metadata: ISOGLODMetadata,
    rootUrl: string,
    options: IGaussianSplattingStreamOptions = {}
): GaussianSplattingStream {
    return new GaussianSplattingStream(name, metadata, rootUrl, compound.getScene(), { ...options, hostCompound: compound });
}

/**
 * Adds a PlayCanvas-style SOG LOD stream as a part of a compound Gaussian Splatting mesh and resolves once the
 * part is ready to use, returning its {@link GaussianSplattingPartProxyMesh} — the same handle
 * `GaussianSplattingCompoundMesh.addPart` returns for a static part. This lets a host application treat a
 * streamed splat exactly like any other compound part (place/frame/gizmo via the proxy, remove via
 * `compound.removePart(proxy.partIndex)`); the streaming controller lives behind the proxy and is disposed
 * automatically when the part is removed.
 *
 * Resolves after the reserved region exists and its base layer has decoded (so the proxy's bounds are real),
 * and rejects if streaming fails before that (the partially-constructed stream is disposed on rejection).
 *
 * NOTE: the base-layer decode runs on the GPU inside the scene's render loop, so this promise only resolves once
 * the scene is rendering. Do not `await` it before the render loop has started (it would never resolve) — start
 * rendering (e.g. `engine.runRenderLoop`) first, or `await` it concurrently with the first frames.
 * @param compound the compound mesh to add the streamed part to
 * @param name name for the streaming controller / part
 * @param metadata parsed `lod-meta.json`
 * @param rootUrl base URL the metadata's relative paths resolve against
 * @param options streaming options
 * @returns the part proxy driving the streamed region, ready to place/frame
 * @experimental
 */
export async function AddGaussianSplattingStreamPartAsync(
    compound: GaussianSplattingMesh,
    name: string,
    metadata: ISOGLODMetadata,
    rootUrl: string,
    options: IGaussianSplattingStreamOptions = {}
): Promise<GaussianSplattingPartProxyMesh> {
    const stream = new GaussianSplattingStream(name, metadata, rootUrl, compound.getScene(), { ...options, hostCompound: compound });
    try {
        await stream.whenPartReadyAsync();
    } catch (e) {
        stream.dispose();
        throw e;
    }
    const proxy = stream.streamingPartProxy;
    if (!proxy) {
        stream.dispose();
        throw new Error("GaussianSplattingStream: streaming part was not reserved.");
    }
    // The controller already binds its own lifetime to the part (removePart / compound disposal dispose the stream,
    // and stream disposal releases the reserved part) — wired at reservation inside the stream, so it also covers the
    // download/decode window before this promise resolves. Nothing to register here.
    return proxy;
}
