import { type Nullable } from "core/types";
import { type AbstractEngine } from "core/Engines/abstractEngine.pure";
import { type WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { type Matrix } from "core/Maths/math.vector.pure";
import { type BaseTexture } from "core/Materials/Textures/baseTexture.pure";
import { Constants } from "core/Engines/constants";
import { ComputeShader } from "core/Compute/computeShader.pure";
import { StorageBuffer } from "core/Buffers/storageBuffer";
import { Buffer, type VertexBuffer } from "core/Buffers/buffer.pure";
import { type ComputeBindingMapping } from "core/Engines/Extensions/engine.computeShader.pure";
import { RegisterEnginesWebGPUExtensionsEngineComputeShader } from "core/Engines/WebGPU/Extensions/engine.computeShader.pure";
import { Logger } from "core/Misc/logger";

const WorkgroupSize = 256;
// One workgroup sorts a block of WorkgroupSize threads x 4 contiguous keys. Must match the gsSort*.compute.fx shaders.
const SortBlockSize = 1024;
const RadixBits = 4;
const RadixBins = 16;
// One scan chunk covers 1024 histogram entries (16 bins x 64 blocks). The top-level scan handles at most 256 chunks.
const BlocksPerScanChunk = 64;
const MaxScanChunks = 256;
const MaxSortKeyCount = SortBlockSize * BlocksPerScanChunk * MaxScanChunks;
const MaxDispatchGroupsPerDimension = 65535;
// Source indices travel as float32 in the vertex buffer, so they must stay exactly representable.
const MaxFloatExactSplatCount = 1 << 24;
const DefaultMaxStorageBufferSize = 134217728;
const MinKeyBits = 8;
const MaxKeyBits = 24;
const DefaultKeyBits = 16;
const ParamsByteSize = 80;
const PassParamsByteSize = 16;
const MinCapacity = 16;
const MinDepthRange = 1e-12;

/**
 * Anything exposing a Babylon.js column-major 4x4 matrix array (a Matrix, for instance).
 */
export type GaussianSplattingGpuSortMatrix = Pick<Matrix, "m">;

/**
 * Inputs describing the splat data the GPU sorter reads. The sorter only reads textures: it never owns them.
 */
export interface IGaussianSplattingGpuSortSource {
    /**
     * Number of splats in the mesh (the value used as the "empty splat" index padding the sorted output).
     */
    vertexCount: number;
    /**
     * Width in texels of the data textures (splat index i lives at texel (i % width, floor(i / width))).
     */
    textureWidth: number;
    /**
     * RGBA32F texture whose xyz hold the splat centers. For SOG data, the RGBA8 "means low" texture.
     */
    centersTexture: BaseTexture;
    /**
     * SOG (quantized means) inputs. When set, centers are decoded like the Gaussian Splatting vertex shader does.
     */
    sog?: {
        /**
         * RGBA8 "means high" texture.
         */
        meansHighTexture: BaseTexture;
        /**
         * Quantization range minimum (xyz) of the log-encoded means.
         */
        meansMin: ArrayLike<number>;
        /**
         * Quantization range maximum (xyz) of the log-encoded means.
         */
        meansMax: ArrayLike<number>;
    };
    /**
     * Compound meshes: R8 texture (same layout as the centers) holding each splat's part index. Used together with {@link GaussianSplattingGpuSorter.setPartMatrices}.
     */
    partIndicesTexture?: BaseTexture;
    /**
     * Optional local-space bounding box minimum of the splat centers, used to derive the depth range when none is given to {@link GaussianSplattingGpuSorter.sort}.
     * Not needed for SOG data (derived from the means range).
     */
    boundsMin?: ArrayLike<number>;
    /**
     * Optional local-space bounding box maximum of the splat centers.
     */
    boundsMax?: ArrayLike<number>;
}

/**
 * Options of {@link GaussianSplattingGpuSorter.sort}.
 */
export interface IGaussianSplattingGpuSortOptions {
    /**
     * Whether the scene is right-handed. Matches the CPU sort worker: the depth is negated so larger always means farther.
     */
    rightHanded?: boolean;
    /**
     * World position of the camera. When omitted, the translation of the view matrix is used, which is equivalent.
     */
    cameraPosition?: ArrayLike<number>;
    /**
     * Depth interval covering every active splat, in the sign-adjusted depth space (larger = farther). The 2^keyBits sort keys span this interval,
     * so a tight interval improves the precision. When omitted, it is derived from the source bounds.
     */
    depthRange?: { min: number; max: number };
}

/**
 * Number of keys bits clamped to the supported range.
 * @param keyBits requested number of sort key bits
 * @returns the clamped, integral number of key bits
 * @internal
 */
export function _ClampGpuSortKeyBits(keyBits: number): number {
    return Math.min(MaxKeyBits, Math.max(MinKeyBits, Math.round(keyBits)));
}

/**
 * Number of radix passes needed to sort keys of a given size.
 * @param keyBits number of bits of the sort keys
 * @returns the number of 4-bit radix passes
 * @internal
 */
export function _GetGpuSortPassCount(keyBits: number): number {
    return Math.ceil(_ClampGpuSortKeyBits(keyBits) / RadixBits);
}

/**
 * Count of output slots: the active count rounded up to a multiple of 16 (16 splats per instance), at least 16.
 * @param activeCount number of splats to render
 * @returns the padded count
 * @internal
 */
export function _GetGpuSortPaddedCount(activeCount: number): number {
    return Math.max((activeCount + 15) & ~15, 16);
}

/**
 * Packs flat `[start0, count0, start1, count1, ...]` splat intervals for the key shader. Each GPU entry is `(exclusive prefix of the counts, start)`.
 * Empty intervals are dropped and intervals are clamped to `[0, vertexCount)`.
 * @param intervals flat source-splat intervals (start, count pairs)
 * @param vertexCount number of splats in the mesh
 * @returns the packed entries, the number of entries and the total number of active splats
 * @internal
 */
export function _PackGpuSortIntervals(intervals: ArrayLike<number>, vertexCount: number): { data: Uint32Array; count: number; total: number } {
    const data = new Uint32Array(Math.max(intervals.length & ~1, 2));
    let count = 0;
    let total = 0;
    for (let i = 0; i + 1 < intervals.length; i += 2) {
        const start = Math.min(Math.max(intervals[i], 0), vertexCount);
        const length = Math.min(Math.max(intervals[i + 1], 0), vertexCount - start);
        if (length > 0) {
            data[count * 2] = total;
            data[count * 2 + 1] = start;
            count++;
            total += length;
        }
    }
    return { data, count, total };
}

/**
 * Computes the coefficients of the depth of a splat center: `depth = dot(coef.xyz, center) + coef.w`, in the same space and sign convention as the CPU sort worker
 * (the signed distance along the camera forward axis, negated in right-handed scenes, so a larger value is farther).
 * @param world world matrix (array of 16 numbers) transforming the splat center
 * @param view view matrix (array of 16 numbers)
 * @param depthSign 1 for left-handed scenes, -1 for right-handed scenes
 * @param cameraPosition world camera position, or null to use the view matrix translation
 * @param out receives the 4 coefficients
 * @param offset index of the first coefficient in out
 * @param worldOffset index of the first element of the world matrix in world (defaults to 0), so a matrix can be read from a flat array without creating a view
 * @internal
 */
export function _ComputeGpuSortDepthCoefficients(
    world: ArrayLike<number>,
    view: ArrayLike<number>,
    depthSign: number,
    cameraPosition: Nullable<ArrayLike<number>>,
    out: Float32Array,
    offset: number,
    worldOffset = 0
): void {
    const fx = view[2];
    const fy = view[6];
    const fz = view[10];
    const w = worldOffset;
    out[offset] = (fx * world[w] + fy * world[w + 1] + fz * world[w + 2]) * depthSign;
    out[offset + 1] = (fx * world[w + 4] + fy * world[w + 5] + fz * world[w + 6]) * depthSign;
    out[offset + 2] = (fx * world[w + 8] + fy * world[w + 9] + fz * world[w + 10]) * depthSign;
    const translation = fx * world[w + 12] + fy * world[w + 13] + fz * world[w + 14];
    const d = cameraPosition ? translation - (fx * cameraPosition[0] + fy * cameraPosition[1] + fz * cameraPosition[2]) : translation + view[14];
    out[offset + 3] = d * depthSign;
}

/**
 * Computes the interval of depths reached by the points of a box, for one or several sets of depth coefficients.
 * @param coefficients depth coefficients (4 per set)
 * @param setCount number of coefficient sets
 * @param boundsMin box minimum (xyz)
 * @param boundsMax box maximum (xyz)
 * @param result optional object receiving the interval, to avoid an allocation when called every frame
 * @returns the min and max depths (the result object when provided)
 * @internal
 */
export function _ComputeGpuSortDepthRange(
    coefficients: ArrayLike<number>,
    setCount: number,
    boundsMin: ArrayLike<number>,
    boundsMax: ArrayLike<number>,
    result: { min: number; max: number } = { min: 0, max: 0 }
): { min: number; max: number } {
    let min = Infinity;
    let max = -Infinity;
    for (let set = 0; set < setCount; set++) {
        let setMin = coefficients[set * 4 + 3];
        let setMax = setMin;
        for (let axis = 0; axis < 3; axis++) {
            const a = coefficients[set * 4 + axis] * boundsMin[axis];
            const b = coefficients[set * 4 + axis] * boundsMax[axis];
            setMin += Math.min(a, b);
            setMax += Math.max(a, b);
        }
        min = Math.min(min, setMin);
        max = Math.max(max, setMax);
    }
    result.min = min;
    result.max = max;
    return result;
}

/**
 * Scale converting a depth distance to a sort key: `key = (depthMax - depth) * scale`, so the farthest splat gets key 0 (sorted first).
 * @param depthMin smallest depth
 * @param depthMax largest depth
 * @param keyBits number of bits of the sort keys
 * @returns the scale, 0 when the depth range is degenerate (all keys are 0, like the CPU worker)
 * @internal
 */
export function _ComputeGpuSortKeyScale(depthMin: number, depthMax: number, keyBits: number): number {
    const range = depthMax - depthMin;
    return range > MinDepthRange ? (Math.pow(2, _ClampGpuSortKeyBits(keyBits)) - 1) / range : 0;
}

/**
 * Inverse of the SOG means log-transform, applied to a quantization range bound.
 * @param value log-encoded value
 * @returns the decoded value
 * @internal
 */
export function _DecodeGpuSortSogMean(value: number): number {
    return Math.sign(value) * (Math.exp(Math.abs(value)) - 1);
}

/**
 * Gets the number of splats a GPU sorter can handle on an engine: limited by the maximum storage buffer binding size (4 bytes per splat),
 * and by 2^24 so that source indices are exactly representable as float32 in the instanced vertex buffer.
 * @param engine the engine
 * @returns the maximum number of splats (a multiple of 16)
 */
export function GetGaussianSplattingGpuSorterMaxSplatCount(engine: AbstractEngine): number {
    const limits = (engine as WebGPUEngine).currentLimits;
    const maxBytes = limits
        ? Math.min(limits.maxStorageBufferBindingSize ?? DefaultMaxStorageBufferSize, limits.maxBufferSize ?? DefaultMaxStorageBufferSize)
        : DefaultMaxStorageBufferSize;
    return Math.min(MaxFloatExactSplatCount, MaxSortKeyCount, Math.floor(maxBytes / Float32Array.BYTES_PER_ELEMENT) & ~15);
}

function _RoundUp16(value: number): number {
    return (Math.ceil(value) + 15) & ~15;
}

/**
 * Per-view GPU buffer receiving a sorted splat index list. It can be bound as the four instanced `splatIndex0` ... `splatIndex3` vertex attributes
 * of the Gaussian Splatting vertex shader (16 splats per instance), in place of the CPU-uploaded index buffer.
 *
 * Create it with {@link GaussianSplattingGpuSorter.createOutput}. After each successful sort, if {@link buffersVersion} changed,
 * the vertex buffers were recreated (the output grew) and must be bound again.
 */
export class GaussianSplattingGpuSortOutput {
    private _engine: WebGPUEngine;
    private _label: string;
    private _storageBuffer: Nullable<StorageBuffer> = null;
    private _vertexBuffers: VertexBuffer[] = [];
    private _wrapper: Nullable<Buffer> = null;
    private _capacity = 0;
    private _buffersVersion = 0;
    /** @internal */
    public _sortedPaddedCount = 0;
    /** @internal */
    public _paramsBuffer: StorageBuffer;
    /** @internal */
    public _coefsBuffer: Nullable<StorageBuffer> = null;
    /** @internal */
    public _coefsCapacity = 0;
    /** @internal */
    public _keysCs: Nullable<ComputeShader> = null;
    /** @internal */
    public _keysCsSog = false;
    /** @internal */
    public _keysCsCompound = false;
    /** @internal */
    public _outputCs: ComputeShader;
    /** @internal Sorter binding version the compute shaders of this output were last bound with. */
    public _boundSorterVersion = -1;
    /** @internal Buffers version of the output storage buffer the output shader was last bound with. */
    public _boundBuffersVersion = -1;
    /** @internal */
    public _boundCoefsBuffer: Nullable<StorageBuffer> = null;
    /** @internal */
    public _boundKeysCs: Nullable<ComputeShader> = null;
    /** @internal */
    public _lastSortError = false;
    /** @internal */
    public _onDisposed: Nullable<() => void> = null;
    private _disposed = false;

    /**
     * @param engine the WebGPU engine
     * @param label debug label
     * @internal
     */
    constructor(engine: WebGPUEngine, label: string) {
        this._engine = engine;
        this._label = label;
        this._paramsBuffer = new StorageBuffer(engine, ParamsByteSize, Constants.BUFFER_CREATIONFLAG_READWRITE, label + "_params");
        this._outputCs = new ComputeShader(label + "_output", engine, "gsSortOutput", {
            bindingsMapping: { params: { group: 0, binding: 0 }, vals: { group: 0, binding: 1 }, indexOut: { group: 0, binding: 2 } },
        });
    }

    /**
     * The buffer holding the sorted splat indices as float32 (back-to-front), padded to a multiple of 16 with the empty splat index.
     */
    public get buffer(): Nullable<StorageBuffer> {
        return this._storageBuffer;
    }

    /**
     * The 4 instanced vertex buffers `splatIndex0` ... `splatIndex3` (vec4 each, stride 16 floats) viewing {@link buffer}.
     */
    public get vertexBuffers(): readonly VertexBuffer[] {
        return this._vertexBuffers;
    }

    /**
     * Number of output slots written by the last successful sort: a multiple of 16 (0 before the first successful sort).
     */
    public get paddedCount(): number {
        return this._sortedPaddedCount;
    }

    /**
     * Number of instances to draw (16 splats per instance) after the last successful sort.
     */
    public get instanceCount(): number {
        return this._sortedPaddedCount >> 4;
    }

    /**
     * Incremented each time the underlying buffer and vertex buffers are recreated.
     */
    public get buffersVersion(): number {
        return this._buffersVersion;
    }

    /**
     * Creates (or grows) the GPU buffer so it can hold the given number of slots.
     * @param paddedCount number of slots
     * @param maxCapacity maximum capacity allowed by the device limits
     * @internal
     */
    public _ensureCapacity(paddedCount: number, maxCapacity: number): void {
        if (this._storageBuffer && this._capacity >= paddedCount) {
            return;
        }

        const capacity = Math.max(paddedCount, Math.min(_RoundUp16(this._capacity * 1.5), maxCapacity));
        this._releaseBuffers();
        this._capacity = capacity;
        this._storageBuffer = new StorageBuffer(
            this._engine,
            capacity * Float32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_VERTEX | Constants.BUFFER_CREATIONFLAG_READWRITE,
            this._label + "_indices"
        );
        // The wrapper does not own the GPU buffer: it is released through the StorageBuffer only.
        this._wrapper = new Buffer(this._engine, this._storageBuffer.getBuffer(), false, 16, true, true);
        for (let i = 0; i < 4; i++) {
            this._vertexBuffers.push(this._wrapper.createVertexBuffer("splatIndex" + i, i * 4, 4));
        }
        this._buffersVersion++;
    }

    /**
     * Releases the GPU resources.
     */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._onDisposed?.();
        this._onDisposed = null;
        this._releaseBuffers();
        this._paramsBuffer.dispose();
        this._coefsBuffer?.dispose();
        this._coefsBuffer = null;
        this._keysCs = null;
    }

    private _releaseBuffers(): void {
        for (const vertexBuffer of this._vertexBuffers) {
            vertexBuffer.dispose();
        }
        this._vertexBuffers = [];
        // A device restoration rebuilds the wrapper with its own buffer, which is no longer the storage buffer and must be released.
        if (this._wrapper && this._wrapper.getBuffer() !== this._storageBuffer?.getBuffer()) {
            this._wrapper.dispose();
        }
        this._wrapper = null;
        this._storageBuffer?.dispose();
        this._storageBuffer = null;
    }
}

function _Dispatch(cs: ComputeShader, groups: number): boolean {
    const dispatched =
        groups <= MaxDispatchGroupsPerDimension
            ? cs.dispatch(Math.max(groups, 1), 1, 1)
            : cs.dispatch(MaxDispatchGroupsPerDimension, Math.ceil(groups / MaxDispatchGroupsPerDimension), 1);
    if (dispatched) {
        // The context check leaves this set when rebinding reuses the same resources.
        cs.triggerContextRebuild = false;
    }
    return dispatched;
}

function _IsShaderReady(cs: ComputeShader): boolean {
    if (cs.fastMode) {
        return true;
    }
    if (!cs.isReady()) {
        return false;
    }
    cs.fastMode = true;
    // Binding setters mark the context dirty, but fastMode skips that check. Rebuild it on the first dispatch after each rebind.
    cs.triggerContextRebuild = true;
    return true;
}

/**
 * WebGPU compute depth sorter for Gaussian Splatting. It reproduces the ordering of the CPU sort worker (back-to-front counting sort) entirely on the GPU,
 * and writes the sorted splat indices in a vertex buffer ready to be used as the instanced `splatIndex` attributes ({@link GaussianSplattingGpuSortOutput}).
 *
 * Pipeline of a sort (all dispatches are enqueued on the engine's command encoder, without any CPU readback):
 *   1. keys: for each active splat, compute the view depth and quantize it to a `keyBits`-bit key (farthest = smallest). Supports splat intervals,
 *      compound parts (per-part matrices) and SOG decoded means.
 *   2. a stable LSD radix sort with 4-bit digits, `ceil(keyBits / 4)` passes of count, scan (2 levels) and scatter. No subgroup operation is required.
 *   3. output: writes the sorted indices as float32, padding to a multiple of 16 with `vertexCount`.
 *
 * Usage constraints:
 * - {@link sort} ends the current render pass: call it outside of any render pass (e.g. in `onBeforeRenderObservable` / `onBeforeCameraRenderObservable`).
 * - Uniform-like data is written with queue writes, which take effect before the whole frame's commands. So call {@link sort} at most once per output and per frame, and do not
 *   change the source, the intervals or the part matrices between two sorts of the same frame.
 * - If the textures given to {@link setSource} are recreated, call {@link setSource} again.
 * - The compute shaders and the WebGPU compute engine extension are loaded by {@link GaussianSplattingGpuSorter.LoadDependenciesAsync}: await it before the first {@link sort}.
 * Until it has completed, {@link sort} returns false without enqueuing anything.
 * @experimental
 */
export class GaussianSplattingGpuSorter {
    private static _DependenciesReady = false;
    private static _DependenciesPromise: Nullable<Promise<void>> = null;

    private readonly _engine: WebGPUEngine;
    private readonly _name: string;
    private readonly _keyBits: number;
    private readonly _passCount: number;
    private readonly _maxSplatCount: number;

    private _vertexCount = 0;
    private _textureWidth = 0;
    private _centersTexture: Nullable<BaseTexture> = null;
    private _meansHighTexture: Nullable<BaseTexture> = null;
    private _partIndicesTexture: Nullable<BaseTexture> = null;
    private readonly _meansMin = new Float32Array(4);
    private readonly _meansMax = new Float32Array(4);
    private _boundsMin: Nullable<Float32Array> = null;
    private _boundsMax: Nullable<Float32Array> = null;

    private _partMatrices: Nullable<Float32Array> = null;
    private _partCount = 0;

    private _rawIntervals: Nullable<Uint32Array> = null;
    private _packedIntervals: Nullable<Uint32Array> = null;
    private _intervalCount = 0;
    private _intervalsDirty = true;
    private _intervalsValid = true;
    private _activeCount = 0;

    // Incremented whenever a buffer or texture bound to the compute shaders is created, replaced or released, so the shaders are only rebound when needed.
    private _bindingsVersion = 0;
    private _sortShadersBoundVersion = -1;
    private _capacity = 0;
    private _keysA: Nullable<StorageBuffer> = null;
    private _keysB: Nullable<StorageBuffer> = null;
    private _valsA: Nullable<StorageBuffer> = null;
    private _valsB: Nullable<StorageBuffer> = null;
    private _sumTable: Nullable<StorageBuffer> = null;
    private _intervalsBuffer: Nullable<StorageBuffer> = null;
    private _intervalsCapacity = 0;
    private readonly _chunkSums: StorageBuffer;
    private readonly _passParams: StorageBuffer[] = [];
    private _passParamsActiveCount = -1;
    private readonly _passData = new Uint32Array(4);

    private readonly _countCs: ComputeShader[] = [];
    private readonly _scatterCs: ComputeShader[] = [];
    private readonly _scanLocalCs: ComputeShader;
    private readonly _scanSumsCs: ComputeShader;

    private readonly _paramsData = new ArrayBuffer(ParamsByteSize);
    private readonly _paramsU32 = new Uint32Array(this._paramsData);
    private readonly _paramsF32 = new Float32Array(this._paramsData);
    private _coefs = new Float32Array(4);
    private readonly _depthRange = { min: 0, max: 0 };

    private readonly _outputs: GaussianSplattingGpuSortOutput[] = [];
    private _disposed = false;

    /**
     * Whether GPU sorting is available on an engine: a WebGPU engine with compute shader support.
     * @param engine the engine
     * @returns true if a {@link GaussianSplattingGpuSorter} can be created
     */
    public static IsSupported(engine: AbstractEngine): boolean {
        return !!engine && engine.isWebGPU && !!engine.getCaps().supportComputeShaders;
    }

    /**
     * Gets the maximum number of splats the sorter can sort on an engine.
     * @param engine the engine
     * @returns the maximum splat count
     */
    public static GetMaxSupportedSplatCount(engine: AbstractEngine): number {
        return GetGaussianSplattingGpuSorterMaxSplatCount(engine);
    }

    /**
     * Registers the WebGPU compute engine extension and loads the compute shaders of the sorter. The result is cached: calling it again returns the same promise.
     * It must have completed before the first {@link sort} (which returns false until then). If loading fails, the promise rejects and the next call retries.
     * @returns a promise resolved when the dependencies are ready
     */
    public static async LoadDependenciesAsync(): Promise<void> {
        if (GaussianSplattingGpuSorter._DependenciesReady) {
            return;
        }
        GaussianSplattingGpuSorter._DependenciesPromise ??= (async () => {
            try {
                RegisterEnginesWebGPUExtensionsEngineComputeShader();
                await Promise.all([
                    import("../../ShadersWGSL/gsSortKeys.compute"),
                    import("../../ShadersWGSL/gsSortCount.compute"),
                    import("../../ShadersWGSL/gsSortScanLocal.compute"),
                    import("../../ShadersWGSL/gsSortScanSums.compute"),
                    import("../../ShadersWGSL/gsSortScatter.compute"),
                    import("../../ShadersWGSL/gsSortOutput.compute"),
                ]);
                GaussianSplattingGpuSorter._DependenciesReady = true;
            } catch (e) {
                GaussianSplattingGpuSorter._DependenciesPromise = null;
                throw e;
            }
        })();
        await GaussianSplattingGpuSorter._DependenciesPromise;
    }

    /**
     * Creates a GPU sorter. Shaders are compiled asynchronously: {@link sort} returns false until they are ready.
     * Await {@link GaussianSplattingGpuSorter.LoadDependenciesAsync} before the first {@link sort}.
     * @param engine the WebGPU engine
     * @param name debug name
     * @param keyBits number of bits of the depth sort keys (8 to 24, default 16). Each 4 bits cost one radix pass; 16 bits is enough for most scenes.
     */
    constructor(engine: AbstractEngine, name = "GaussianSplattingGpuSorter", keyBits = DefaultKeyBits) {
        if (!GaussianSplattingGpuSorter.IsSupported(engine)) {
            throw new Error("GaussianSplattingGpuSorter requires a WebGPU engine with compute shader support.");
        }
        // ComputeShader creates its compute context on construction, so the engine extension must be registered first.
        RegisterEnginesWebGPUExtensionsEngineComputeShader();
        this._engine = engine as WebGPUEngine;
        this._name = name;
        this._keyBits = _ClampGpuSortKeyBits(keyBits);
        this._passCount = _GetGpuSortPassCount(this._keyBits);
        this._maxSplatCount = GetGaussianSplattingGpuSorterMaxSplatCount(engine);

        const passBindings: ComputeBindingMapping = { params: { group: 0, binding: 0 } };
        this._chunkSums = new StorageBuffer(this._engine, MaxScanChunks * Uint32Array.BYTES_PER_ELEMENT, Constants.BUFFER_CREATIONFLAG_READWRITE, name + "_chunkSums");
        for (let pass = 0; pass < this._passCount; pass++) {
            this._passParams.push(new StorageBuffer(this._engine, PassParamsByteSize, Constants.BUFFER_CREATIONFLAG_READWRITE, name + "_passParams" + pass));
            this._countCs.push(
                new ComputeShader(name + "_count" + pass, engine, "gsSortCount", {
                    bindingsMapping: { ...passBindings, keysIn: { group: 0, binding: 1 }, sumTable: { group: 0, binding: 2 } },
                })
            );
            this._scatterCs.push(
                new ComputeShader(name + "_scatter" + pass, engine, "gsSortScatter", {
                    bindingsMapping: {
                        ...passBindings,
                        keysIn: { group: 0, binding: 1 },
                        valsIn: { group: 0, binding: 2 },
                        keysOut: { group: 0, binding: 3 },
                        valsOut: { group: 0, binding: 4 },
                        sumTable: { group: 0, binding: 5 },
                        chunkSums: { group: 0, binding: 6 },
                    },
                })
            );
        }
        this._scanLocalCs = new ComputeShader(name + "_scanLocal", engine, "gsSortScanLocal", {
            bindingsMapping: { ...passBindings, sumTable: { group: 0, binding: 1 }, chunkSums: { group: 0, binding: 2 } },
        });
        this._scanSumsCs = new ComputeShader(name + "_scanSums", engine, "gsSortScanSums", { bindingsMapping: { ...passBindings, chunkSums: { group: 0, binding: 1 } } });
    }

    /**
     * Number of splats rendered after applying the intervals (the number of keys sorted).
     */
    public get activeCount(): number {
        return this._activeCount;
    }

    /**
     * Number of output slots (activeCount rounded up to a multiple of 16).
     */
    public get paddedCount(): number {
        return _GetGpuSortPaddedCount(this._activeCount);
    }

    /**
     * Number of bits of the depth sort keys.
     */
    public get keyBits(): number {
        return this._keyBits;
    }

    /**
     * Sets the splat data to sort.
     * @param source the source textures and layout
     * @returns false (and logs an error) if the source or active interval count exceeds {@link GaussianSplattingGpuSorter.GetMaxSupportedSplatCount}
     */
    public setSource(source: IGaussianSplattingGpuSortSource): boolean {
        if (source.vertexCount > this._maxSplatCount) {
            Logger.Error(`${this._name}: ${source.vertexCount} splats exceeds the GPU sorter limit of ${this._maxSplatCount}.`);
            return false;
        }
        this._vertexCount = source.vertexCount;
        this._textureWidth = source.textureWidth;
        this._bindingsVersion++;
        this._centersTexture = source.centersTexture;
        this._partIndicesTexture = source.partIndicesTexture ?? null;
        this._meansHighTexture = source.sog?.meansHighTexture ?? null;
        this._boundsMin = null;
        this._boundsMax = null;
        if (source.sog) {
            this._meansMin.fill(0);
            this._meansMax.fill(0);
            this._boundsMin = new Float32Array(3);
            this._boundsMax = new Float32Array(3);
            for (let i = 0; i < 3; i++) {
                this._meansMin[i] = source.sog.meansMin[i];
                this._meansMax[i] = source.sog.meansMax[i];
                this._boundsMin[i] = _DecodeGpuSortSogMean(source.sog.meansMin[i]);
                this._boundsMax[i] = _DecodeGpuSortSogMean(source.sog.meansMax[i]);
            }
        } else if (source.boundsMin && source.boundsMax) {
            this._boundsMin = Float32Array.from(source.boundsMin);
            this._boundsMax = Float32Array.from(source.boundsMax);
        }
        return this._refreshIntervals();
    }

    /**
     * Sets the transform of each part of a compound mesh. Used instead of the world matrix given to {@link sort} when a part indices texture was set in {@link setSource}.
     * The matrices are copied: call this again when they change.
     * @param matrices one matrix per part, or a flat array of 16 floats per part, or null for a non-compound mesh
     */
    public setPartMatrices(matrices: Nullable<ReadonlyArray<GaussianSplattingGpuSortMatrix> | ArrayLike<number>>): void {
        if (!matrices || matrices.length === 0) {
            this._partCount = 0;
            return;
        }
        const isFlat = typeof matrices[0] === "number";
        const count = isFlat ? Math.floor(matrices.length / 16) : matrices.length;
        if (!this._partMatrices || this._partMatrices.length < count * 16) {
            this._partMatrices = new Float32Array(count * 16);
        }
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < 16; j++) {
                this._partMatrices[i * 16 + j] = isFlat ? (matrices as ArrayLike<number>)[i * 16 + j] : (matrices as ReadonlyArray<GaussianSplattingGpuSortMatrix>)[i].m[j];
            }
        }
        this._partCount = count;
    }

    /**
     * Restricts the sort to ranges of source splats, like the CPU worker's `intervals` message.
     * @param intervals flat `[start0, count0, start1, count1, ...]` (start, COUNT pairs), or null to sort every splat
     * @returns false (and logs an error) if the packed, padded active count exceeds the scan or device storage-buffer limits.
     * Overlapping intervals count each occurrence. Sorting is disabled until valid intervals or a valid source are set.
     */
    public setIntervals(intervals: Nullable<ArrayLike<number>>): boolean {
        this._rawIntervals = intervals ? Uint32Array.from(intervals) : null;
        return this._refreshIntervals();
    }

    /**
     * Creates an output receiving the sorted indices of one view. Use one output per camera that is sorted independently.
     * @returns the new output
     */
    public createOutput(): GaussianSplattingGpuSortOutput {
        if (!this._intervalsValid) {
            throw new Error(`${this._name}: cannot create an output for unsupported active intervals.`);
        }
        const output = new GaussianSplattingGpuSortOutput(this._engine, this._name + "_out" + this._outputs.length);
        output._ensureCapacity(this.paddedCount, this._maxSplatCount);
        this._outputs.push(output);
        output._onDisposed = () => {
            const index = this._outputs.indexOf(output);
            if (index >= 0) {
                this._outputs.splice(index, 1);
            }
        };
        return output;
    }

    /**
     * Enqueues the sort of the active splats for a view. Call it outside of any render pass, once per output and per frame.
     * @param output the output receiving the sorted indices
     * @param worldMatrix world matrix of the mesh (ignored for compound meshes, which use the part matrices)
     * @param viewMatrix view matrix of the camera
     * @param options handedness, camera position and depth range
     * @returns false if nothing was enqueued (unsupported active intervals, shaders still compiling, no source, or no depth range), true otherwise
     */
    public sort(
        output: GaussianSplattingGpuSortOutput,
        worldMatrix: GaussianSplattingGpuSortMatrix,
        viewMatrix: GaussianSplattingGpuSortMatrix,
        options?: IGaussianSplattingGpuSortOptions
    ): boolean {
        if (this._disposed || !this._intervalsValid || !this._centersTexture || !GaussianSplattingGpuSorter._DependenciesReady) {
            return false;
        }
        const sog = !!this._meansHighTexture;
        const compound = !!this._partIndicesTexture && this._partCount > 0 && !!this._partMatrices;
        const coefCount = compound ? this._partCount : 1;
        const activeCount = this._activeCount;
        const paddedCount = this.paddedCount;

        this._ensureCapacity(Math.max(activeCount, MinCapacity));
        output._ensureCapacity(paddedCount, this._maxSplatCount);
        this._ensureIntervalsBuffer();
        this._ensureCoefsBuffer(output, coefCount);
        const keysCs = this._getKeysComputeShader(output, sog, compound);
        this._bindResources(output, keysCs, sog, compound);

        if (!this._isReady(keysCs, output)) {
            return false;
        }

        const depthSign = options?.rightHanded ? -1 : 1;
        const cameraPosition = options?.cameraPosition ?? null;
        if (this._coefs.length < coefCount * 4) {
            this._coefs = new Float32Array(coefCount * 4);
        }
        if (compound) {
            const partMatrices = this._partMatrices!;
            for (let i = 0; i < coefCount; i++) {
                _ComputeGpuSortDepthCoefficients(partMatrices, viewMatrix.m, depthSign, cameraPosition, this._coefs, i * 4, i * 16);
            }
        } else {
            _ComputeGpuSortDepthCoefficients(worldMatrix.m, viewMatrix.m, depthSign, cameraPosition, this._coefs, 0);
        }

        let range = options?.depthRange;
        if (!range && this._boundsMin && this._boundsMax) {
            range = _ComputeGpuSortDepthRange(this._coefs, coefCount, this._boundsMin, this._boundsMax, this._depthRange);
        }
        if (!range) {
            if (!output._lastSortError) {
                Logger.Error(`${this._name}: no depth range available. Provide options.depthRange or source bounds.`);
                output._lastSortError = true;
            }
            return false;
        }
        output._lastSortError = false;

        this._writeParams(output, coefCount, range.min, range.max);
        output._coefsBuffer!.update(this._coefs, 0, coefCount * 4 * Float32Array.BYTES_PER_ELEMENT);
        this._writeIntervals();
        this._writePassParams(activeCount);

        if (activeCount > 0 && !this._dispatchSort(keysCs, activeCount)) {
            return false;
        }
        if (!_Dispatch(output._outputCs, Math.ceil(paddedCount / WorkgroupSize))) {
            return false;
        }
        output._sortedPaddedCount = paddedCount;
        return true;
    }

    /**
     * Releases all the GPU resources, including the outputs created by {@link createOutput}.
     */
    public dispose(): void {
        this._disposed = true;
        const outputs = this._outputs.slice();
        for (const output of outputs) {
            output.dispose();
        }
        this._outputs.length = 0;
        this._releaseSortBuffers();
        this._intervalsBuffer?.dispose();
        this._intervalsBuffer = null;
        this._chunkSums.dispose();
        for (const buffer of this._passParams) {
            buffer.dispose();
        }
        this._passParams.length = 0;
        this._centersTexture = null;
        this._meansHighTexture = null;
        this._partIndicesTexture = null;
    }

    private _refreshIntervals(): boolean {
        if (this._rawIntervals) {
            const packed = _PackGpuSortIntervals(this._rawIntervals, this._vertexCount);
            this._packedIntervals = packed.data;
            this._intervalCount = packed.count;
            this._activeCount = packed.total;
        } else {
            this._packedIntervals = null;
            this._intervalCount = 0;
            this._activeCount = this._vertexCount;
        }
        this._intervalsDirty = true;
        this._intervalsValid = this._activeCount <= this._maxSplatCount && this.paddedCount <= this._maxSplatCount;
        if (!this._intervalsValid) {
            Logger.Error(`${this._name}: ${this._activeCount} active splats exceeds the GPU sorter limit of ${this._maxSplatCount}.`);
        }
        return this._intervalsValid;
    }

    private _releaseSortBuffers(): void {
        this._keysA?.dispose();
        this._keysB?.dispose();
        this._valsA?.dispose();
        this._valsB?.dispose();
        this._sumTable?.dispose();
        this._keysA = this._keysB = this._valsA = this._valsB = this._sumTable = null;
        this._capacity = 0;
        this._passParamsActiveCount = -1;
        this._bindingsVersion++;
    }

    private _ensureCapacity(needed: number): void {
        if (this._keysA && this._capacity >= needed) {
            return;
        }
        const capacity = Math.max(needed, Math.min(Math.ceil(this._capacity * 1.5), this._maxSplatCount));
        this._releaseSortBuffers();
        this._capacity = capacity;
        // Rounded to 4 elements: the scatter pass reads the keys and values as vec4u
        const bytes = _RoundUp16(capacity) * Uint32Array.BYTES_PER_ELEMENT;
        const create = (label: string, size: number) => new StorageBuffer(this._engine, size, Constants.BUFFER_CREATIONFLAG_READWRITE, this._name + label);
        this._keysA = create("_keysA", bytes);
        this._keysB = create("_keysB", bytes);
        this._valsA = create("_valsA", bytes);
        this._valsB = create("_valsB", bytes);
        this._sumTable = create("_sumTable", RadixBins * Math.ceil(capacity / SortBlockSize) * Uint32Array.BYTES_PER_ELEMENT);
    }

    private _ensureIntervalsBuffer(): void {
        const entries = Math.max(this._intervalCount, 2);
        if (this._intervalsBuffer && this._intervalsCapacity >= entries) {
            return;
        }
        this._intervalsBuffer?.dispose();
        this._intervalsCapacity = Math.max(entries, Math.ceil(this._intervalsCapacity * 1.5));
        this._intervalsBuffer = new StorageBuffer(
            this._engine,
            this._intervalsCapacity * 2 * Uint32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_READWRITE,
            this._name + "_intervals"
        );
        this._intervalsDirty = true;
        this._bindingsVersion++;
    }

    private _ensureCoefsBuffer(output: GaussianSplattingGpuSortOutput, coefCount: number): void {
        if (output._coefsBuffer && output._coefsCapacity >= coefCount) {
            return;
        }
        output._coefsBuffer?.dispose();
        output._coefsCapacity = Math.max(coefCount, 1);
        output._coefsBuffer = new StorageBuffer(
            this._engine,
            output._coefsCapacity * 4 * Float32Array.BYTES_PER_ELEMENT,
            Constants.BUFFER_CREATIONFLAG_READWRITE,
            this._name + "_coefs"
        );
    }

    private _getKeysComputeShader(output: GaussianSplattingGpuSortOutput, sog: boolean, compound: boolean): ComputeShader {
        if (!output._keysCs || output._keysCsSog !== sog || output._keysCsCompound !== compound) {
            const bindingsMapping: ComputeBindingMapping = {
                params: { group: 0, binding: 0 },
                intervals: { group: 0, binding: 1 },
                coefs: { group: 0, binding: 2 },
                keys: { group: 0, binding: 3 },
                vals: { group: 0, binding: 4 },
                centersTexture: { group: 0, binding: 5 },
            };
            const defines: string[] = [];
            if (sog) {
                bindingsMapping.meansUTexture = { group: 0, binding: 6 };
                defines.push("#define USE_SOG");
            }
            if (compound) {
                bindingsMapping.partIndicesTexture = { group: 0, binding: 7 };
                defines.push("#define COMPOUND");
            }
            const key = `${sog ? "S" : ""}${compound ? "C" : ""}`;
            output._keysCs = new ComputeShader(this._name + "_keys" + key, this._engine, "gsSortKeys", { bindingsMapping, defines, useExplicitComputePipelineLayout: true });
            output._keysCsSog = sog;
            output._keysCsCompound = compound;
        }
        return output._keysCs;
    }

    // Binds the resources of the shaders. The setters allocate a binding each call, so a shader is only bound again when one of its resources changed.
    private _bindResources(output: GaussianSplattingGpuSortOutput, keysCs: ComputeShader, sog: boolean, compound: boolean): void {
        if (this._sortShadersBoundVersion !== this._bindingsVersion) {
            this._sortShadersBoundVersion = this._bindingsVersion;
            this._bindSortShaders();
        }

        if (
            output._boundSorterVersion === this._bindingsVersion &&
            output._boundBuffersVersion === output.buffersVersion &&
            output._boundCoefsBuffer === output._coefsBuffer &&
            output._boundKeysCs === keysCs
        ) {
            return;
        }
        output._boundSorterVersion = this._bindingsVersion;
        output._boundBuffersVersion = output.buffersVersion;
        output._boundCoefsBuffer = output._coefsBuffer;
        output._boundKeysCs = keysCs;

        keysCs.fastMode = false;
        output._outputCs.fastMode = false;
        keysCs.setStorageBuffer("params", output._paramsBuffer);
        keysCs.setStorageBuffer("intervals", this._intervalsBuffer!);
        keysCs.setStorageBuffer("coefs", output._coefsBuffer!);
        keysCs.setStorageBuffer("keys", this._keysA!);
        keysCs.setStorageBuffer("vals", this._valsA!);
        keysCs.setTexture("centersTexture", this._centersTexture!, false);
        if (sog) {
            keysCs.setTexture("meansUTexture", this._meansHighTexture!, false);
        }
        if (compound) {
            keysCs.setTexture("partIndicesTexture", this._partIndicesTexture!, false);
        }

        // After the radix passes, the sorted values are in valsA for an even number of passes (the passes ping-pong between A and B), valsB otherwise.
        output._outputCs.setStorageBuffer("params", output._paramsBuffer);
        output._outputCs.setStorageBuffer("vals", (this._passCount & 1) === 0 ? this._valsA! : this._valsB!);
        output._outputCs.setStorageBuffer("indexOut", output.buffer!);
    }

    // The ping-pong buffers of each radix pass are the same for every view: pass 0 reads A and writes B, pass 1 reads B and writes A, and so on.
    private _bindSortShaders(): void {
        let keysIn = this._keysA!;
        let valsIn = this._valsA!;
        let keysOut = this._keysB!;
        let valsOut = this._valsB!;
        for (let pass = 0; pass < this._passCount; pass++) {
            const params = this._passParams[pass];
            const count = this._countCs[pass];
            count.fastMode = false;
            count.setStorageBuffer("params", params);
            count.setStorageBuffer("keysIn", keysIn);
            count.setStorageBuffer("sumTable", this._sumTable!);
            const scatter = this._scatterCs[pass];
            scatter.fastMode = false;
            scatter.setStorageBuffer("params", params);
            scatter.setStorageBuffer("keysIn", keysIn);
            scatter.setStorageBuffer("valsIn", valsIn);
            scatter.setStorageBuffer("keysOut", keysOut);
            scatter.setStorageBuffer("valsOut", valsOut);
            scatter.setStorageBuffer("sumTable", this._sumTable!);
            scatter.setStorageBuffer("chunkSums", this._chunkSums);
            const keysTemp = keysIn;
            keysIn = keysOut;
            keysOut = keysTemp;
            const valsTemp = valsIn;
            valsIn = valsOut;
            valsOut = valsTemp;
        }

        this._scanLocalCs.fastMode = false;
        this._scanSumsCs.fastMode = false;
        this._scanLocalCs.setStorageBuffer("params", this._passParams[0]);
        this._scanLocalCs.setStorageBuffer("sumTable", this._sumTable!);
        this._scanLocalCs.setStorageBuffer("chunkSums", this._chunkSums);
        this._scanSumsCs.setStorageBuffer("params", this._passParams[0]);
        this._scanSumsCs.setStorageBuffer("chunkSums", this._chunkSums);
    }

    private _isReady(keysCs: ComputeShader, output: GaussianSplattingGpuSortOutput): boolean {
        let ready = _IsShaderReady(keysCs) && _IsShaderReady(output._outputCs) && _IsShaderReady(this._scanLocalCs) && _IsShaderReady(this._scanSumsCs);
        for (let pass = 0; pass < this._passCount && ready; pass++) {
            ready = _IsShaderReady(this._countCs[pass]) && _IsShaderReady(this._scatterCs[pass]);
        }
        return ready;
    }

    private _writeParams(output: GaussianSplattingGpuSortOutput, coefCount: number, depthMin: number, depthMax: number): void {
        const u32 = this._paramsU32;
        const f32 = this._paramsF32;
        u32[0] = this._activeCount;
        u32[1] = this._vertexCount;
        u32[2] = this.paddedCount;
        u32[3] = this._textureWidth;
        u32[4] = coefCount;
        u32[5] = this._intervalCount;
        f32[6] = depthMax;
        f32[7] = _ComputeGpuSortKeyScale(depthMin, depthMax, this._keyBits);
        f32[8] = Math.pow(2, this._keyBits) - 1;
        f32[9] = f32[10] = f32[11] = 0;
        f32.set(this._meansMin, 12);
        f32.set(this._meansMax, 16);
        output._paramsBuffer.update(this._paramsData);
    }

    private _writeIntervals(): void {
        if (!this._intervalsDirty) {
            return;
        }
        this._intervalsDirty = false;
        if (this._packedIntervals && this._intervalCount > 0) {
            this._intervalsBuffer!.update(this._packedIntervals, 0, this._intervalCount * 2 * Uint32Array.BYTES_PER_ELEMENT);
        }
    }

    private _writePassParams(activeCount: number): void {
        if (this._passParamsActiveCount === activeCount) {
            return;
        }
        this._passParamsActiveCount = activeCount;
        const numBlocks = Math.ceil(activeCount / SortBlockSize);
        const chunkCount = Math.ceil(numBlocks / BlocksPerScanChunk);
        for (let pass = 0; pass < this._passCount; pass++) {
            this._passData[0] = activeCount;
            this._passData[1] = numBlocks;
            this._passData[2] = pass * RadixBits;
            this._passData[3] = chunkCount;
            this._passParams[pass].update(this._passData);
        }
    }

    private _dispatchSort(keysCs: ComputeShader, activeCount: number): boolean {
        const numBlocks = Math.ceil(activeCount / SortBlockSize);
        const chunkCount = Math.ceil(numBlocks / BlocksPerScanChunk);
        if (!_Dispatch(keysCs, Math.ceil(activeCount / WorkgroupSize))) {
            return false;
        }
        for (let pass = 0; pass < this._passCount; pass++) {
            _Dispatch(this._countCs[pass], numBlocks);
            _Dispatch(this._scanLocalCs, chunkCount);
            _Dispatch(this._scanSumsCs, 1);
            _Dispatch(this._scatterCs[pass], numBlocks);
        }
        return true;
    }
}
