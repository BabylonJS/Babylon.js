import { describe, expect, it, vi } from "vitest";
import { GPUMultiPickReadbackStrategy, GPUPicker, type IGPUMultiPickOptions } from "core/Collisions/gpuPicker";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { pickingPixelShader } from "core/Shaders/picking.fragment";
import { type Nullable } from "core/types";
import { NullEngine } from "core/Engines/nullEngine";
import { Engine } from "core/Engines/engine";
import { FreeCamera } from "core/Cameras/freeCamera";
import { Mesh } from "core/Meshes/mesh";
import { Scene } from "core/scene";
import { CreateMockWebGL2Canvas } from "../Engines/mockWebGL2Canvas";

type ClientRectSize = {
    width: number;
    height: number;
};

type GPUPickerInternals = {
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
    _getDepthPickingView: GPUPicker["_getDepthPickingView"];
    _getDepthPickingInfoFromBuffer: GPUPicker["_getDepthPickingInfoFromBuffer"];
    _getDepthPickingInfoAsync: GPUPicker["_getDepthPickingInfoAsync"];
    _getRenderInfo: () => { rttSizeW: number; rttSizeH: number; scaleX: number; scaleY: number };
    _prepareForPicking: (x: number, y: number, scaleX: number, scaleY: number) => { x: number; y: number };
    _readDepthTexturePixelsAsync: (x: number, y: number, w: number, h: number) => Promise<Nullable<ArrayBufferView>>;
    _shouldUseIndividualMultiPickReadback: (inBoundsPointCount: number, readArea: number, options?: IGPUMultiPickOptions) => boolean;
    _isPartProxyActiveForPicking: (proxy: { isEnabled: () => boolean; isPickable: boolean; isVisible: boolean }) => boolean;
};

const createPicker = (): GPUPickerInternals => {
    return new GPUPicker() as unknown as GPUPickerInternals;
};

describe("GPUPicker", () => {
    it.each(["single", "multi", "box"] as const)("allows retrying a %s pick after material readiness throws", async (mode) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const picker = new GPUPicker();
        try {
            picker.setPickingList([new Mesh("__root__", scene)]);
            const material = picker.defaultRenderMaterials.find((material) => material !== null)!;
            const error = new Error("Picking material readiness failed");
            const isReady = vi.spyOn(material, "isReady").mockImplementation(() => {
                throw error;
            });
            const renderPassId = engine.currentRenderPassId;
            const pick = () =>
                mode === "single"
                    ? picker.pickAsync(0, 0)
                    : mode === "multi"
                      ? picker.multiPickAsync([
                            { x: 0, y: 0 },
                            { x: 1, y: 1 },
                        ])
                      : picker.boxPickAsync(0, 0, 1, 1);

            await expect(pick()).rejects.toBe(error);
            expect(picker.pickingInProgress).toBe(false);
            expect(engine.currentRenderPassId).toBe(renderPassId);

            await expect(pick()).rejects.toBe(error);
            expect(isReady).toHaveBeenCalledTimes(2);
            expect(picker.pickingInProgress).toBe(false);
        } finally {
            picker.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("uses high precision integers for WebGL2 picking ID bit shifts", () => {
        expect(pickingPixelShader.shader).toContain("precision highp int;");
    });

    it("excludes disabled Gaussian splatting part proxies from picking", () => {
        const picker = createPicker();
        const proxy = { isEnabled: () => false, isPickable: true, isVisible: true };

        expect(picker._isPartProxyActiveForPicking(proxy)).toBe(false);
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

        await picker._getDepthPickingInfoAsync(10, 20, 100, 100, {
            view: Matrix.IdentityReadOnly,
            projection: Matrix.IdentityReadOnly,
            cameraPosition: Vector3.Zero(),
            viewport: { x: 0, y: 0, width: 100, height: 100 },
            halfZRange: true,
        });

        expect(picker._readDepthTexturePixelsAsync).toHaveBeenCalledWith(9, 19, 3, 3);
    });

    it.each([false, true])("reconstructs depth picking with the scene's range (half-range engine created first: %s)", async (halfRangeFirst) => {
        vi.stubGlobal("WebGL2RenderingContext", { SRGB: 0x8c40, SRGB8: 0x8c41, SRGB8_ALPHA8: 0x8c43 });
        const engines = [halfRangeFirst, !halfRangeFirst].map((useNDCHalfZRange) => {
            const { canvas } = CreateMockWebGL2Canvas(true);
            return new Engine(canvas, false, { useNDCHalfZRange });
        });

        try {
            for (const engine of engines) {
                const scene = new Scene(engine);
                const camera = new FreeCamera("camera", Vector3.Zero(), scene);
                scene.activeCamera = camera;
                camera.minZ = 1;
                camera.maxZ = 10;
                scene.updateTransformMatrix();

                const pickedZ = 1.25;
                const projection = scene.getProjectionMatrix();
                const ndcDepth = Vector3.TransformCoordinates(new Vector3(0, 0, pickedZ), projection).z;
                const depth = engine.isNDCHalfZRange ? ndcDepth : (ndcDepth + 1) * 0.5;
                const pixels = new Float32Array(3 * 3 * 4);
                for (let offset = 0; offset < pixels.length; offset += 4) {
                    pixels[offset] = depth;
                    pixels[offset + 3] = 1;
                }

                const picker = createPicker();
                picker._cachedScene = scene;
                picker._readDepthTexturePixelsAsync = vi.fn().mockResolvedValue(pixels);
                const depthView = picker._getDepthPickingView(3, 3);
                if (depthView === null) {
                    throw new Error("Expected a depth picking view for the active camera.");
                }
                const info = await picker._getDepthPickingInfoAsync(1, 1, 3, 3, depthView);
                expect(info?.pickedPoint?.z).toBeCloseTo(pickedZ);
                expect(info?.normal?.x).toBeCloseTo(0);
                expect(info?.normal?.y).toBeCloseTo(0);
                expect(info?.normal?.z).toBeCloseTo(-1);
            }
        } finally {
            for (const engine of engines) {
                engine.dispose();
            }
            vi.unstubAllGlobals();
        }
    });

    it("uses a camera-facing normal when depth neighbors cannot form a surface", () => {
        const picker = createPicker();
        picker._isDepthTexturePacked = false;

        const pixels = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0.5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        const info = picker._getDepthPickingInfoFromBuffer(pixels, 1, 1, 0, 0, 3, 3, 3, {
            view: Matrix.IdentityReadOnly,
            projection: Matrix.IdentityReadOnly,
            cameraPosition: new Vector3(0, 0, -1),
            viewport: { x: 0, y: 0, width: 3, height: 3 },
            halfZRange: false,
        });

        expect(info?.pickedPoint).toBeDefined();
        expect(info?.normal).toBeDefined();
        expect(info!.normal!.z).toBeLessThan(0);
    });

    it("reconstructs a normal from the closest valid depth-neighbor pair", () => {
        const picker = createPicker();
        picker._isDepthTexturePacked = false;

        const pixels = new Float32Array([0.45, 0, 0, 1, 0, 0, 0, 0, 0.55, 0, 0, 1, 0, 0, 0, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

        const info = picker._getDepthPickingInfoFromBuffer(pixels, 1, 1, 0, 0, 3, 3, 3, {
            view: Matrix.IdentityReadOnly,
            projection: Matrix.IdentityReadOnly,
            cameraPosition: new Vector3(0, 0, -1),
            viewport: { x: 0, y: 0, width: 3, height: 3 },
            halfZRange: false,
        });

        expect(info?.normal).toBeDefined();
        expect(Math.abs(info!.normal!.x) + Math.abs(info!.normal!.y)).toBeGreaterThan(0.001);
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
