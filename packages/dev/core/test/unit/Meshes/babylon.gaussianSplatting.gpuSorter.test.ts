import { afterEach, describe, expect, it, vi } from "vitest";
import { Logger } from "core/Misc/logger";
import {
    GaussianSplattingGpuSorter,
    GetGaussianSplattingGpuSorterMaxSplatCount,
    _ClampGpuSortKeyBits,
    _ComputeGpuSortDepthCoefficients,
    _ComputeGpuSortDepthRange,
    _ComputeGpuSortKeyScale,
    _DecodeGpuSortSogMean,
    _GetGpuSortPaddedCount,
    _GetGpuSortPassCount,
    _PackGpuSortIntervals,
} from "core/Meshes/GaussianSplatting/gaussianSplattingGpuSorter";

const Identity = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

describe("GaussianSplattingGpuSorter shader readiness", () => {
    it("caches readiness and invalidates the fast path when shared or output bindings change", () => {
        const shader = () => ({
            isReady: vi.fn(() => true),
            setStorageBuffer: vi.fn(),
            setTexture: vi.fn(),
            fastMode: false,
            triggerContextRebuild: false,
        });
        const keys = shader();
        const outputCs = shader();
        const count = shader();
        const scatter = shader();
        const scanLocal = shader();
        const scanSums = shader();
        const shaders = [keys, outputCs, count, scatter, scanLocal, scanSums];
        const sorter = Object.create(GaussianSplattingGpuSorter.prototype) as any;
        Object.assign(sorter, {
            _bindingsVersion: 1,
            _sortShadersBoundVersion: -1,
            _passCount: 1,
            _passParams: [{}],
            _countCs: [count],
            _scatterCs: [scatter],
            _scanLocalCs: scanLocal,
            _scanSumsCs: scanSums,
        });
        const output = { buffersVersion: 1, _coefsBuffer: {}, _outputCs: outputCs };
        sorter._bindResources(output, keys, false, false);
        expect(sorter._isReady(keys, output)).toBe(true);
        for (const cs of shaders) {
            expect(cs.fastMode).toBe(true);
            // The first dispatch still checks/clears the compute context before taking the fast path.
            expect(cs.triggerContextRebuild).toBe(true);
            cs.isReady.mockClear();
        }
        sorter._bindResources(output, keys, false, false);
        expect(sorter._isReady(keys, output)).toBe(true);
        for (const cs of shaders) {
            expect(cs.isReady).not.toHaveBeenCalled();
        }

        sorter._bindingsVersion++;
        sorter._bindResources(output, keys, false, false);
        for (const cs of shaders) {
            expect(cs.fastMode).toBe(false);
        }
        expect(sorter._isReady(keys, output)).toBe(true);
        for (const cs of shaders) {
            expect(cs.isReady).toHaveBeenCalledOnce();
            cs.isReady.mockClear();
        }

        output.buffersVersion++;
        output._coefsBuffer = {};
        const newKeys = shader();
        sorter._bindResources(output, newKeys, false, false);
        expect(outputCs.fastMode).toBe(false);
        expect(sorter._isReady(newKeys, output)).toBe(true);
        expect(newKeys.isReady).toHaveBeenCalledOnce();
        expect(outputCs.isReady).toHaveBeenCalledOnce();
        for (const cs of [count, scatter, scanLocal, scanSums]) {
            expect(cs.isReady).not.toHaveBeenCalled();
        }
    });
});

describe("GaussianSplattingGpuSorter helpers", () => {
    it("pads the count to a multiple of 16, at least 16", () => {
        expect(_GetGpuSortPaddedCount(0)).toBe(16);
        expect(_GetGpuSortPaddedCount(1)).toBe(16);
        expect(_GetGpuSortPaddedCount(16)).toBe(16);
        expect(_GetGpuSortPaddedCount(17)).toBe(32);
    });

    it("clamps key bits and computes the pass count", () => {
        expect(_ClampGpuSortKeyBits(2)).toBe(8);
        expect(_ClampGpuSortKeyBits(40)).toBe(24);
        expect(_ClampGpuSortKeyBits(15.6)).toBe(16);
        expect(_GetGpuSortPassCount(16)).toBe(4);
        expect(_GetGpuSortPassCount(18)).toBe(5);
        expect(_GetGpuSortPassCount(24)).toBe(6);
    });

    it("packs intervals as (exclusive prefix, start), dropping empty and clamping", () => {
        const packed = _PackGpuSortIntervals([10, 5, 20, 0, 90, 100, 200, 4], 100);
        expect(packed.count).toBe(2);
        expect(packed.total).toBe(15);
        expect(Array.from(packed.data.subarray(0, 4))).toEqual([0, 10, 5, 90]);
    });

    it("packs an empty interval list", () => {
        const packed = _PackGpuSortIntervals([], 100);
        expect(packed.count).toBe(0);
        expect(packed.total).toBe(0);
        expect(packed.data.length).toBeGreaterThanOrEqual(2);
    });

    it("computes depth coefficients like the CPU worker", () => {
        const view = Identity.slice();
        view[14] = 5;
        const world = Identity.slice();
        world[12] = 1;
        world[13] = 2;
        world[14] = 3;
        const out = new Float32Array(4);
        _ComputeGpuSortDepthCoefficients(world, view, 1, null, out, 0);
        expect(Array.from(out)).toEqual([0, 0, 1, 8]);

        // equivalent camera position: view translation z = -dot(forward, camPos)
        _ComputeGpuSortDepthCoefficients(world, view, 1, [0, 0, -5], out, 0);
        expect(Array.from(out)).toEqual([0, 0, 1, 8]);

        _ComputeGpuSortDepthCoefficients(world, view, -1, null, out, 0);
        expect(Array.from(out)).toEqual([-0, -0, -1, -8]);
    });

    it("reads the world matrix at an offset of a flat array", () => {
        const view = Identity.slice();
        const flat = [...Identity, ...Identity];
        flat[16 + 12] = 1;
        flat[16 + 13] = 2;
        flat[16 + 14] = 3;
        const out = new Float32Array(8);
        _ComputeGpuSortDepthCoefficients(flat, view, 1, null, out, 4, 16);
        expect(Array.from(out.subarray(4))).toEqual([0, 0, 1, 3]);
    });

    it("computes the depth range of a box over several coefficient sets", () => {
        const coefs = [0, 0, 1, 0, 0, 0, -1, 10];
        const range = _ComputeGpuSortDepthRange(coefs, 2, [-1, -1, -2], [1, 1, 3]);
        expect(range.min).toBe(-2);
        expect(range.max).toBe(12);

        const result = { min: 0, max: 0 };
        expect(_ComputeGpuSortDepthRange(coefs, 2, [-1, -1, -2], [1, 1, 3], result)).toBe(result);
        expect(result).toEqual({ min: -2, max: 12 });
    });

    it("computes the key scale", () => {
        expect(_ComputeGpuSortKeyScale(0, 255, 8)).toBe(1);
        expect(_ComputeGpuSortKeyScale(1, 1, 16)).toBe(0);
        expect(_ComputeGpuSortKeyScale(0, 65535, 16)).toBe(1);
    });

    it("decodes SOG means range bounds", () => {
        expect(_DecodeGpuSortSogMean(0)).toBe(0);
        expect(_DecodeGpuSortSogMean(Math.log(3))).toBeCloseTo(2);
        expect(_DecodeGpuSortSogMean(-Math.log(3))).toBeCloseTo(-2);
    });
});

describe("GaussianSplattingGpuSorter support", () => {
    afterEach(() => vi.restoreAllMocks());

    const createValidationSorter = (maxSplatCount: number, vertexCount: number) => {
        // Exercise interval validation without allocating storage for millions of keys.
        const sorter = Object.create(GaussianSplattingGpuSorter.prototype) as GaussianSplattingGpuSorter;
        Object.assign(sorter, { _name: "validation", _maxSplatCount: maxSplatCount, _vertexCount: vertexCount });
        return sorter;
    };

    it("rejects overlapping intervals exceeding the scan chunk capacity before allocating or dispatching", () => {
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
        const sorter = createValidationSorter(1 << 24, 8388609);
        const ensureCapacity = vi.spyOn(sorter as any, "_ensureCapacity");

        expect(sorter.setIntervals([0, 8388609, 0, 8388609])).toBe(false);
        expect(sorter.sort({} as any, { m: Identity }, { m: Identity })).toBe(false);
        expect(ensureCapacity).not.toHaveBeenCalled();
        expect(sorter.setIntervals([0, 8388608, 0, 8388608])).toBe(true);
        expect(sorter.activeCount).toBe(1 << 24);
    });

    it("validates the packed padded count against either storage buffer limit", () => {
        vi.spyOn(Logger, "Error").mockImplementation(() => {});
        for (const limits of [
            { maxStorageBufferBindingSize: 1000, maxBufferSize: 1 << 20 },
            { maxStorageBufferBindingSize: 1 << 20, maxBufferSize: 1000 },
        ]) {
            const maxCount = GetGaussianSplattingGpuSorterMaxSplatCount({ currentLimits: limits } as any);
            const sorter = createValidationSorter(maxCount, 121);
            expect(sorter.setIntervals([0, 121, 0, 120])).toBe(false);
            expect(sorter.setIntervals([0, 120, 0, 120])).toBe(true);
            expect(sorter.paddedCount).toBe(240);
        }
    });

    it("is only supported on WebGPU engines with compute shaders", () => {
        const webgpu = { isWebGPU: true, getCaps: () => ({ supportComputeShaders: true }) };
        const noCompute = { isWebGPU: true, getCaps: () => ({ supportComputeShaders: false }) };
        const webgl = { isWebGPU: false, getCaps: () => ({ supportComputeShaders: false }) };
        expect(GaussianSplattingGpuSorter.IsSupported(webgpu as any)).toBe(true);
        expect(GaussianSplattingGpuSorter.IsSupported(noCompute as any)).toBe(false);
        expect(GaussianSplattingGpuSorter.IsSupported(webgl as any)).toBe(false);
    });

    it("throws when created on an unsupported engine", () => {
        expect(() => new GaussianSplattingGpuSorter({ isWebGPU: false, getCaps: () => ({ supportComputeShaders: false }) } as any)).toThrow();
    });

    it("limits the splat count by the device limits and float exactness", () => {
        const limits = (maxStorageBufferBindingSize: number, maxBufferSize: number) => ({ currentLimits: { maxStorageBufferBindingSize, maxBufferSize } }) as any;
        expect(GetGaussianSplattingGpuSorterMaxSplatCount(limits(134217728, 268435456))).toBe(1 << 24);
        expect(GetGaussianSplattingGpuSorterMaxSplatCount(limits(1 << 20, 1 << 30))).toBe(1 << 18);
        expect(GetGaussianSplattingGpuSorterMaxSplatCount(limits(1 << 30, 1 << 20))).toBe(1 << 18);
        expect(GetGaussianSplattingGpuSorterMaxSplatCount({} as any)).toBe(1 << 24);
        expect(GetGaussianSplattingGpuSorterMaxSplatCount(limits(1000, 1 << 20)) % 16).toBe(0);
    });
});
