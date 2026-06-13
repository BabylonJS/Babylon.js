import { describe, expect, it } from "vitest";
import { GPUMultiPickReadbackStrategy, GPUPicker, type IGPUMultiPickOptions } from "core/Collisions/gpuPicker";
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
    _getRenderInfo: () => { rttSizeW: number; rttSizeH: number; scaleX: number; scaleY: number };
    _prepareForPicking: (x: number, y: number, scaleX: number, scaleY: number) => { x: number; y: number };
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
