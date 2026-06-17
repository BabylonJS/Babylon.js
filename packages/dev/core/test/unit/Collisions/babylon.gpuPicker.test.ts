import { describe, expect, it, vi } from "vitest";
import { GPUMultiPickReadbackStrategy, GPUPicker, type IGPUMultiPickOptions } from "core/Collisions/gpuPicker";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { pickingPixelShader } from "core/Shaders/picking.fragment";
import { type Nullable } from "core/types";

type ClientRectSize = {
    width: number;
    height: number;
};

type GPUPickerInternals = GPUPicker & {
    _cachedScene: Nullable<{
        getEngine: () => {
            getRenderWidth: () => number;
            getRenderHeight: () => number;
            _hardwareScalingLevel: number;
            getInputElementClientRect: () => Nullable<ClientRectSize>;
        };
    }>;
    _isDepthTexturePacked: boolean;
    _useDepthPicking: boolean;
    _getDepthFromBuffer: (pixels: ArrayBufferView, x: number, y: number, width: number, height: number) => Nullable<number>;
    _getDepthPickingInfoFromBuffer: (
        pixels: ArrayBufferView,
        x: number,
        y: number,
        bufferLeft: number,
        bufferBottom: number,
        bufferWidth: number,
        bufferHeight: number,
        renderHeight: number,
        view: Matrix,
        projection: Matrix,
        cameraPosition: Vector3,
        viewport: { x: number; y: number; width: number; height: number }
    ) => Nullable<{ pickedPoint?: Vector3; normal?: Vector3 }>;
    _getDepthPickingInfoAsync: (
        x: number,
        y: number,
        renderWidth: number,
        renderHeight: number,
        view: Matrix,
        projection: Matrix,
        cameraPosition: Vector3,
        viewport: { x: number; y: number; width: number; height: number }
    ) => Promise<Nullable<{ pickedPoint?: Vector3; normal?: Vector3 }>>;
    _getRenderInfo: () => { rttSizeW: number; rttSizeH: number; scaleX: number; scaleY: number };
    _prepareForPicking: (x: number, y: number, scaleX: number, scaleY: number) => { x: number; y: number };
    _readDepthTexturePixelsAsync: (x: number, y: number, w: number, h: number) => Promise<Nullable<ArrayBufferView>>;
    _shouldUseIndividualMultiPickReadback: (inBoundsPointCount: number, readArea: number, options?: IGPUMultiPickOptions) => boolean;
};

const createPicker = (): GPUPickerInternals => {
    return new GPUPicker() as GPUPickerInternals;
};

describe("GPUPicker", () => {
    it("uses high precision integers for WebGL2 picking ID bit shifts", () => {
        expect(pickingPixelShader.shader).toContain("precision highp int;");
    });

    it("decodes float depth values from a depth read buffer", () => {
        const picker = createPicker();
        const pixels = new Float32Array([0.25, 0, 0, 1, 0.5, 0, 0, 1]);

        expect(picker._getDepthFromBuffer(pixels, 0, 0, 2, 1)).toBeCloseTo(0.25);
        expect(picker._getDepthFromBuffer(pixels, 1, 0, 2, 1)).toBeCloseTo(0.5);
    });

    it("decodes packed byte depth values from a depth read buffer", () => {
        const picker = createPicker();
        picker._isDepthTexturePacked = true;
        const pixels = new Uint8Array([1, 2, 3, 4]);

        expect(picker._getDepthFromBuffer(pixels, 0, 0, 1, 1)).toBeCloseTo(1 / (255 * 255 * 255 * 255) + 2 / (255 * 255 * 255) + 3 / (255 * 255) + 4 / 255);
    });

    it("rejects out-of-range and sentinel depth values", () => {
        const picker = createPicker();

        expect(picker._getDepthFromBuffer(new Float32Array([0, 0, 0, 1]), 0, 0, 1, 1)).toBeNull();
        expect(picker._getDepthFromBuffer(new Float32Array([1, 0, 0, 1]), 0, 0, 1, 1)).toBeNull();
        expect(picker._getDepthFromBuffer(new Float32Array([0.5, 0, 0, 1]), 1, 0, 1, 1)).toBeNull();
    });

    it("reads WebGPU depth neighbors from the same center pixel with radius one", async () => {
        const picker = createPicker();
        picker._cachedScene = {
            getEngine: () => ({
                isWebGPU: true,
            }),
        } as any;
        picker._readDepthTexturePixelsAsync = vi.fn().mockResolvedValue(null);

        await picker._getDepthPickingInfoAsync(10, 20, 100, 100, Matrix.IdentityReadOnly, Matrix.IdentityReadOnly, Vector3.Zero(), {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        });

        expect(picker._readDepthTexturePixelsAsync).toHaveBeenCalledWith(9, 19, 3, 3);
    });

    it("uses a camera-facing normal when depth neighbors cannot form a surface", () => {
        const picker = createPicker();
        picker._isDepthTexturePacked = false;

        const pixels = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        const info = picker._getDepthPickingInfoFromBuffer(pixels, 1, 1, 0, 0, 3, 3, 3, Matrix.IdentityReadOnly, Matrix.IdentityReadOnly, new Vector3(0, 0, -1), {
            x: 0,
            y: 0,
            width: 3,
            height: 3,
        });

        expect(info?.pickedPoint).toBeDefined();
        expect(info?.normal).toBeDefined();
        expect(info!.normal!.z).toBeLessThan(0);
    });

    it("selects the multi-pick readback strategy from explicit options", () => {
        const picker = createPicker();

        expect(picker._shouldUseIndividualMultiPickReadback(10, 1000, { readbackStrategy: GPUMultiPickReadbackStrategy.Rectangle })).toBe(false);
        expect(picker._shouldUseIndividualMultiPickReadback(10, 1, { readbackStrategy: GPUMultiPickReadbackStrategy.Individual })).toBe(true);
        expect(picker._shouldUseIndividualMultiPickReadback(0, 1000, { readbackStrategy: GPUMultiPickReadbackStrategy.Individual })).toBe(false);
    });

    it("selects individual multi-pick readback only for sparse automatic picks", () => {
        const picker = createPicker();

        expect(picker._shouldUseIndividualMultiPickReadback(2, 100)).toBe(true);
        expect(picker._shouldUseIndividualMultiPickReadback(33, 10000)).toBe(false);
        expect(picker._shouldUseIndividualMultiPickReadback(2, 30)).toBe(false);
        expect(picker._shouldUseIndividualMultiPickReadback(4, 50, { maxIndividualReadbackCount: 3 })).toBe(false);
        expect(picker._shouldUseIndividualMultiPickReadback(4, 50, { individualReadbackAreaRatio: 2 })).toBe(true);
    });

    it("accounts for depth-neighbor pixels when selecting automatic individual readback", () => {
        const picker = createPicker();
        picker._useDepthPicking = true;

        expect(picker._shouldUseIndividualMultiPickReadback(2, 100)).toBe(false);
        expect(picker._shouldUseIndividualMultiPickReadback(2, 400)).toBe(true);
    });

    it("uses input element client rect scaling for picking coordinates", () => {
        const picker = createPicker();
        picker._cachedScene = {
            getEngine: () => ({
                getRenderWidth: () => 200,
                getRenderHeight: () => 100,
                _hardwareScalingLevel: 0.5,
                getInputElementClientRect: () => ({ width: 100, height: 25 }),
            }),
        };

        const renderInfo = picker._getRenderInfo();

        expect(renderInfo.scaleX).toBe(2);
        expect(renderInfo.scaleY).toBe(4);
        expect(picker._prepareForPicking(10.2, 10.2, renderInfo.scaleX, renderInfo.scaleY)).toEqual({ x: 20, y: 40 });
    });

    it("falls back to hardware scaling when input element client rect is unavailable", () => {
        const picker = createPicker();
        picker._cachedScene = {
            getEngine: () => ({
                getRenderWidth: () => 200,
                getRenderHeight: () => 100,
                _hardwareScalingLevel: 0.5,
                getInputElementClientRect: () => {
                    throw new Error("DOM side effect unavailable");
                },
            }),
        };

        expect(picker._getRenderInfo()).toEqual({ rttSizeW: 200, rttSizeH: 100, scaleX: 2, scaleY: 2 });
    });
});
