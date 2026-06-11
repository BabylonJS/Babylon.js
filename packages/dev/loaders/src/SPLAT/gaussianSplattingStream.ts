import { GaussianSplattingMesh } from "core/Meshes/GaussianSplatting/gaussianSplattingMesh";
import { type IGaussianSplattingSplatRange } from "core/Meshes/GaussianSplatting/gaussianSplattingMeshBase";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { Vector3, Matrix } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import { Camera } from "core/Cameras/camera";
import { type Observer } from "core/Misc/observable";
import { BoundingInfo } from "core/Culling/boundingInfo";
import { CreateLineSystem } from "core/Meshes/Builders/linesBuilder";
import { type LinesMesh } from "core/Meshes/linesMesh";
import { VertexBuffer } from "core/Buffers/buffer";
import { ParseSogMetaAsTextures, type SOGRootData } from "./sog";
import { GaussianSplattingWorkBuffer } from "./gaussianSplattingWorkBuffer";
import { type ISogTexturePack } from "./splatDefs";

/**
 * Internal descriptor for one resource to stream (environment bundle or a LOD source file).
 */
interface ILoadDescriptor {
    kind: "env" | "file";
    /** Number of splats in this resource. */
    count: number;
    /** First splat index (pixel offset) assigned in the work buffer. */
    offset: number;
    /** Index into `filenames` (kind "file"). */
    fileId: number;
    /** Parsed SOG metadata (kind "file"). */
    sogData?: SOGRootData;
    /** Base URL for the file's webp images (kind "file"). */
    subRootUrl?: string;
    /** Unzipped bundle contents (kind "env"). */
    files?: Map<string, Uint8Array>;
}

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
    /** LOD level currently streamed/rendered for this node (set during the tree walk). */
    activeLod?: number;
    /** Distance-based ideal LOD level for this node, recomputed per frame (diagnostics only). */
    optimalLod?: number;
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
}

// tan(22.5deg): reference half-FOV for a 45-degree vertical FOV, used for FOV compensation (matches PlayCanvas).
const RefTanHalfFov = Math.tan((22.5 * Math.PI) / 180);

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
 * the selected-LOD splats are rendered/sorted via the mesh's interval filter.
 *
 * A distance-based "optimal" LOD is computed per node (see {@link evaluateOptimalLods}) for diagnostics
 * and the debug wireframe display; rendering itself still streams and shows the least-detail LOD.
 *
 * @experimental
 */
export class GaussianSplattingStream extends GaussianSplattingMesh {
    private readonly _metadata: ISOGLODMetadata;
    private readonly _rootUrl: string;
    private readonly _streamOptions: IGaussianSplattingStreamOptions;

    // Selected-LOD entries grouped by source file index.
    private readonly _entriesByFile = new Map<number, ISOGLODEntry[]>();

    // Flat list of leaf nodes that carry a renderable LOD entry (used by the optimal-LOD heuristic and debug).
    private readonly _leafNodes: ISOGLODNode[] = [];

    // LOD heuristic parameters (PlayCanvas-aligned defaults).
    private _lodBaseDistance = 5;
    private _lodMultiplier = 3;
    private _lodBehindPenalty = 1;
    private _lodRangeMin = 0;
    private _lodRangeMax: number;

    // GPU work buffer holding all decoded splats; created once the total capacity is known.
    private _workBuffer: Nullable<GaussianSplattingWorkBuffer> = null;

    // Global splat offset where each loaded source file begins in the work buffer.
    private readonly _fileBaseSplat = new Map<number, number>();
    // Global range covered by the environment file (always rendered), or null until it loads.
    private _environmentRange: Nullable<{ offset: number; count: number }> = null;

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
    private _debugSignature = "";

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
        if (options.debugLodSource) {
            this._debugLodSource = options.debugLodSource;
        }

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
        this._clearDebugDisplay();
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
        this.computeWorldMatrix(true).invertToRef(TmpInvWorld);
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
     * Rebuilds the debug wireframe (evaluating the optimal LOD first) and wires up live updates when the
     * "optimal" source is selected, since those colors track the camera.
     */
    private _refreshDebugDisplay(): void {
        if (this._debugLodSource === "optimal") {
            this.evaluateOptimalLods();
        }
        this._buildDebugMesh();

        const needsObserver = this._debugDisplay && this._debugLodSource === "optimal";
        if (needsObserver && !this._debugObserver) {
            this._debugObserver = this._scene.onBeforeRenderObservable.add(() => this._onDebugFrame());
        } else if (!needsObserver && this._debugObserver) {
            this._scene.onBeforeRenderObservable.remove(this._debugObserver);
            this._debugObserver = null;
        }
    }

    /**
     * Per-frame debug update: recomputes the optimal LOD and, only when the set of displayed LOD levels
     * actually changes (e.g. the camera crosses a LOD boundary), recolors the existing wireframe in place.
     * The geometry is never rebuilt here, which avoids the dispose/recreate flicker while the camera moves.
     */
    private _onDebugFrame(): void {
        this.evaluateOptimalLods();
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
     * Concatenates the displayed LOD level of every leaf into a compact signature used for change detection.
     * @returns a signature string for the current displayed LOD levels
     */
    private _computeDebugSignature(): string {
        let signature = "";
        for (const node of this._leafNodes) {
            signature += this._displayedLodLevel(node) + ",";
        }
        return signature;
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
        this._debugSignature = "";
    }

    /**
     * Walks the LOD tree and records each leaf's least-detail (highest-numbered) LOD entry,
     * grouped by the source file it lives in.
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

        // Least detail == highest LOD key (PlayCanvas convention: level 0 is the finest).
        let bestLevel = Number.NEGATIVE_INFINITY;
        for (const key of Object.keys(node.lods)) {
            const level = Number(key);
            if (level > bestLevel) {
                bestLevel = level;
            }
        }
        if (!Number.isFinite(bestLevel)) {
            return;
        }

        const entry = node.lods[String(bestLevel)];
        if (!entry || entry.count <= 0) {
            return;
        }

        node.activeLod = bestLevel;
        this._leafNodes.push(node);

        let entries = this._entriesByFile.get(entry.file);
        if (!entries) {
            entries = [];
            this._entriesByFile.set(entry.file, entries);
        }
        entries.push(entry);
    }

    /**
     * Streams the environment (if any) and every selected-LOD source file: first learns each splat
     * count, allocates the unified GPU work buffer, then GPU-decodes each resource into its block.
     */
    private async _streamAllAsync(): Promise<void> {
        // Phase 1: fetch metadata to learn splat counts (cheap; no webp decode yet).
        const descriptors = await this._gatherLoadDescriptorsAsync();
        if (this._disposed || descriptors.length === 0) {
            return;
        }

        // Allocate the unified work buffer sized to the total splat count (PlayCanvas-style square).
        let capacity = 0;
        for (const descriptor of descriptors) {
            descriptor.offset = capacity;
            if (descriptor.kind === "env") {
                this._environmentRange = { offset: capacity, count: descriptor.count };
            } else {
                this._fileBaseSplat.set(descriptor.fileId, capacity);
            }
            capacity += descriptor.count;
        }

        this._workBuffer = new GaussianSplattingWorkBuffer(this._scene, capacity);
        const splatPositions = new Float32Array(capacity * 4);
        const textures = this._workBuffer.textures;
        this._setExternalWorkBuffer(textures[0], textures[1], textures[2], textures[3], splatPositions, capacity);
        // Nothing is active until at least one resource has been decoded.
        this.setSplatIndexRanges([]);
        this.setEnabled(true);

        // Phase 2: GPU-decode each resource into its block, activating its splats as it arrives.
        for (const descriptor of descriptors) {
            if (this._disposed) {
                return;
            }
            // eslint-disable-next-line no-await-in-loop
            await this._decodeDescriptorAsync(descriptor);
        }
    }

    /**
     * Fetches the environment bundle and each selected file's metadata to determine splat counts.
     * @returns descriptors for every resource to decode
     */
    private async _gatherLoadDescriptorsAsync(): Promise<ILoadDescriptor[]> {
        const descriptors: ILoadDescriptor[] = [];

        if (this._metadata.environment) {
            try {
                const url = this._rootUrl + this._metadata.environment;
                const buffer = (await Tools.LoadFileAsync(url, true)) as ArrayBuffer;
                const files = await this._unzipAsync(new Uint8Array(buffer));
                const metaBytes = files.get("meta.json");
                if (metaBytes) {
                    const meta = JSON.parse(new TextDecoder().decode(metaBytes)) as SOGRootData;
                    descriptors.push({ kind: "env", count: GaussianSplattingStream._GetSplatCount(meta), offset: 0, fileId: -1, files });
                }
            } catch (e: any) {
                // The environment is non-essential — keep streaming the LOD tree even if it fails.
                Logger.Warn("GaussianSplattingStream: failed to load environment: " + (e?.message ?? e));
            }
        }

        for (const fileId of Array.from(this._entriesByFile.keys())) {
            const relativePath = this._metadata.filenames[fileId];
            if (!relativePath) {
                Logger.Warn(`GaussianSplattingStream: missing filename for file index ${fileId}.`);
                continue;
            }
            try {
                const metaUrl = this._rootUrl + relativePath;
                const subRootUrl = metaUrl.substring(0, metaUrl.lastIndexOf("/") + 1);
                // eslint-disable-next-line no-await-in-loop
                const metaText = (await Tools.LoadFileAsync(metaUrl, false)) as string;
                const sogData = JSON.parse(metaText) as SOGRootData;
                descriptors.push({ kind: "file", count: GaussianSplattingStream._GetSplatCount(sogData), offset: 0, fileId, sogData, subRootUrl });
            } catch (e: any) {
                Logger.Warn(`GaussianSplattingStream: failed to load metadata for ${relativePath}: ${e?.message ?? e}`);
            }
        }

        return descriptors;
    }

    /**
     * Loads one resource as GPU textures, decodes it into the work buffer, records its CPU centers for
     * sorting, frees the source textures, and activates its splat ranges.
     * @param descriptor the resource to decode
     */
    private async _decodeDescriptorAsync(descriptor: ILoadDescriptor): Promise<void> {
        try {
            const parsed =
                descriptor.kind === "env"
                    ? await ParseSogMetaAsTextures(descriptor.files!, "", this._scene)
                    : await ParseSogMetaAsTextures(descriptor.sogData!, descriptor.subRootUrl!, this._scene);
            if (this._disposed || !this._workBuffer) {
                return;
            }
            const pack = parsed.sogTextures;
            if (!pack) {
                return;
            }

            await this._workBuffer.decodeAsync(pack, descriptor.offset);
            if (this._disposed) {
                GaussianSplattingStream._DisposePack(pack);
                return;
            }
            // Copy CPU centers for the depth-sort worker, then free the GPU source textures.
            this._splatPositions!.set(pack.positions.subarray(0, descriptor.count * 4), descriptor.offset * 4);
            GaussianSplattingStream._DisposePack(pack);

            this._updateBounds(pack.positions, descriptor.count);
            this._notifyWorkerNewData();
            this._refreshActiveRanges();
        } catch (e: any) {
            Logger.Warn("GaussianSplattingStream: failed to decode SOG resource: " + (e?.message ?? e));
        }
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
     * Rebuilds the active (selected-LOD) interval set from every loaded file plus the environment,
     * coalesces adjacent ranges, and pushes it to the sort worker.
     */
    private _refreshActiveRanges(): void {
        const ranges: IGaussianSplattingSplatRange[] = [];

        if (this._environmentRange) {
            ranges.push({ offset: this._environmentRange.offset, count: this._environmentRange.count });
        }

        for (const [fileId, entries] of Array.from(this._entriesByFile)) {
            const base = this._fileBaseSplat.get(fileId);
            if (base === undefined) {
                continue; // file not streamed yet
            }
            for (const entry of entries) {
                ranges.push({ offset: base + entry.offset, count: entry.count });
            }
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
