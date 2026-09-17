import { ThinWebGPUEngine } from "core/Engines/thinWebGPUEngine";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { Constants } from "core/Engines/constants";
import { WebGPUBundleList } from "core/Engines/WebGPU/webgpuBundleList";
import { RegisterEnginesWebGPUExtensionsEngineQuery } from "core/Engines/WebGPU/Extensions/engine.query.pure";
import { type WebGPUBufferManager } from "core/Engines/WebGPU/webgpuBufferManager";
import { WebGPUOcclusionQuery } from "core/Engines/WebGPU/webgpuOcclusionQuery";
import { WebGPURenderTargetWrapper } from "core/Engines/WebGPU/webgpuRenderTargetWrapper";
import { type WebGPUHardwareTexture } from "core/Engines/WebGPU/webgpuHardwareTexture";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { describe, expect, it, vi } from "vitest";

type RenderPassDescriptor = Parameters<GPUCommandEncoder["beginRenderPass"]>[0];
type TextureViewDescriptor = Exclude<Parameters<GPUTexture["createView"]>[0], undefined>;
type RenderPassColorAttachment = Exclude<RenderPassDescriptor["colorAttachments"][number], null>;

interface WebGPUEngineRenderPassInternals {
    compatibilityMode: boolean;
    _currentRenderTarget: WebGPURenderTargetWrapper | null;
    _currentRenderPass: GPURenderPassEncoder | null;
    _mainRenderPassWrapper: {
        renderPassDescriptor: {
            occlusionQuerySet?: GPUQuerySet;
        };
    };
    _rttRenderPassWrapper: {
        renderPassDescriptor: RenderPassDescriptor | null;
        colorAttachmentViewDescriptor: TextureViewDescriptor | null;
        colorAttachmentDepthSlice: number | undefined;
        depthAttachmentViewDescriptor: TextureViewDescriptor | null;
        colorAttachmentGPUTextures: (WebGPUHardwareTexture | null)[];
        depthTextureFormat: WebGPUHardwareTexture["format"] | undefined;
    };
    _occlusionQuery: ThinWebGPUEngine["_occlusionQuery"];
    _occlusionQueryActive: boolean;
    _bundleList: WebGPUBundleList;
    _snapshotRendering: {
        handleRenderPassRestart(): void;
    };
    _cacheTextureViews: {
        getView(texture: GPUTexture, descriptor: TextureViewDescriptor): GPUTextureView;
    };
    _renderEncoder: {
        beginRenderPass(descriptor: RenderPassDescriptor): GPURenderPassEncoder;
    };
    _timestampQuery: {
        enable: boolean;
        startPass(descriptor: RenderPassDescriptor, index: number): void;
    };
    _timestampIndex: number;
    _internalFrameCounter: number;
    _frameId: number;
    useReverseDepthBuffer: boolean;
    _stencilStateComposer: {
        enabled: boolean;
    };
    _endCurrentRenderPass(): number;
    _startMainRenderPass(setClearStates: boolean): void;
    _startRenderTargetRenderPass(renderTargetWrapper: WebGPURenderTargetWrapper, setClearStates: boolean, clearColor: null, clearDepth: boolean, clearStencil: boolean): void;
    _debugPushAfterStartOfEncoder(): void;
    _resetRenderPassStates(): void;
    _getCurrentRenderPass(): GPURenderPassEncoder;
    beginOcclusionQuery(algorithmType: number, query: number): boolean;
    endOcclusionQuery(): ThinWebGPUEngine;
}

describe("WebGPU engine queries", () => {
    it("creates a compatibility-mode render pass before beginning an occlusion query", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const renderPass = {
            beginOcclusionQuery: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._getCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = renderPass;
            return renderPass;
        });
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(() => engine._currentRenderPass === renderPass),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 3)).toBe(true);
        expect(engine._getCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._occlusionQuery.canBeginQuery).toHaveBeenCalledExactlyOnceWith(3);
        expect(renderPass.beginOcclusionQuery).toHaveBeenCalledExactlyOnceWith(3);
    });

    it("returns false without recording a compatibility-mode query when it cannot begin", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        const renderPass = {
            beginOcclusionQuery: vi.fn(),
            endOcclusionQuery: vi.fn(),
        } as unknown as GPURenderPassEncoder;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._getCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = renderPass;
            return renderPass;
        });
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(() => false),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 7)).toBe(false);
        expect(engine._getCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._occlusionQuery.canBeginQuery).toHaveBeenCalledExactlyOnceWith(7);
        expect(renderPass.beginOcclusionQuery).not.toHaveBeenCalled();

        engine.endOcclusionQuery();
        expect(renderPass.endOcclusionQuery).not.toHaveBeenCalled();
    });

    it("returns false when a compatibility-mode engine cannot provide a render pass", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(ThinWebGPUEngine.prototype) as ThinWebGPUEngine;
        engine.compatibilityMode = true;
        engine._currentRenderPass = null;
        engine._occlusionQuery = {
            canBeginQuery: vi.fn(),
        } as unknown as ThinWebGPUEngine["_occlusionQuery"];

        expect(engine.beginOcclusionQuery(0, 9)).toBe(false);
        expect(engine._occlusionQuery.canBeginQuery).not.toHaveBeenCalled();
    });

    it("restarts an existing pass when it does not contain the current occlusion query set", () => {
        const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngineRenderPassInternals;
        const oldRenderPass = {} as GPURenderPassEncoder;
        const newRenderPass = {} as GPURenderPassEncoder;
        const querySet = {} as GPUQuerySet;
        const renderPassDescriptor: { occlusionQuerySet?: GPUQuerySet } = {};
        Object.defineProperty(engine, "compatibilityMode", { value: true });
        engine._currentRenderTarget = null;
        engine._currentRenderPass = oldRenderPass;
        engine._mainRenderPassWrapper = { renderPassDescriptor };
        engine._occlusionQuery = {
            hasQueries: true,
            querySet,
        } as ThinWebGPUEngine["_occlusionQuery"];
        engine._snapshotRendering = { handleRenderPassRestart: vi.fn() };
        engine._endCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = null;
            return 2;
        });
        engine._startMainRenderPass = vi.fn(() => {
            renderPassDescriptor.occlusionQuerySet = querySet;
            engine._currentRenderPass = newRenderPass;
        });

        expect(engine._getCurrentRenderPass()).toBe(newRenderPass);
        expect(engine._snapshotRendering.handleRenderPassRestart).toHaveBeenCalledOnce();
        expect(engine._endCurrentRenderPass).toHaveBeenCalledOnce();
        expect(engine._startMainRenderPass).toHaveBeenCalledExactlyOnceWith(false);
    });

    it("keeps an active compatibility query on its pass when the real allocator grows", () => {
        vi.useFakeTimers();
        try {
            RegisterEnginesWebGPUExtensionsEngineQuery();

            const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngineRenderPassInternals;
            const oldRenderPass = {
                beginOcclusionQuery: vi.fn(),
                endOcclusionQuery: vi.fn(),
            } as unknown as GPURenderPassEncoder;
            const newRenderPass = {} as GPURenderPassEncoder;
            const querySets: GPUQuerySet[] = [];
            const device = {
                createQuerySet: vi.fn(() => {
                    const querySet = { destroy: vi.fn() } as unknown as GPUQuerySet;
                    querySets.push(querySet);
                    return querySet;
                }),
            } as unknown as GPUDevice;
            const bufferManager = {
                createRawBuffer: vi.fn(() => ({}) as GPUBuffer),
                releaseBuffer: vi.fn(),
            } as unknown as WebGPUBufferManager;

            Object.defineProperty(engine, "compatibilityMode", { value: true });
            engine._currentRenderTarget = null;
            engine._currentRenderPass = oldRenderPass;
            engine._occlusionQueryActive = false;
            engine._occlusionQuery = new WebGPUOcclusionQuery(engine as unknown as WebGPUEngine, device, bufferManager, 1, 1);
            engine._frameId = 1;
            engine._mainRenderPassWrapper = {
                renderPassDescriptor: { occlusionQuerySet: engine._occlusionQuery.querySet },
            };
            engine._snapshotRendering = { handleRenderPassRestart: vi.fn() };
            engine._endCurrentRenderPass = vi.fn(() => {
                engine._currentRenderPass = null;
                return 2;
            });
            engine._startMainRenderPass = vi.fn(() => {
                engine._mainRenderPassWrapper.renderPassDescriptor.occlusionQuerySet = engine._occlusionQuery.querySet;
                engine._currentRenderPass = newRenderPass;
            });

            const query = engine._occlusionQuery.createQuery();
            expect(engine.beginOcclusionQuery(0, query)).toBe(true);
            expect(engine._occlusionQueryActive).toBe(true);

            engine._occlusionQuery.createQuery();
            expect(engine._occlusionQuery.querySet).toBe(querySets[1]);
            expect(engine._getCurrentRenderPass()).toBe(oldRenderPass);
            expect(engine._endCurrentRenderPass).not.toHaveBeenCalled();

            engine.endOcclusionQuery();
            expect(oldRenderPass.endOcclusionQuery).toHaveBeenCalledOnce();
            expect(engine._occlusionQueryActive).toBe(false);

            expect(engine._getCurrentRenderPass()).toBe(newRenderPass);
            expect(engine._endCurrentRenderPass).toHaveBeenCalledOnce();
            expect(engine._startMainRenderPass).toHaveBeenCalledExactlyOnceWith(false);
        } finally {
            vi.runAllTimers();
            vi.useRealTimers();
        }
    });

    it("keeps a bundled occlusion query within one render pass outside compatibility mode", () => {
        RegisterEnginesWebGPUExtensionsEngineQuery();

        const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngineRenderPassInternals;
        const calls: string[] = [];
        const renderPass = {
            beginOcclusionQuery: vi.fn(() => calls.push("begin")),
            endOcclusionQuery: vi.fn(() => calls.push("end")),
        } as unknown as GPURenderPassEncoder;
        const querySet = {} as GPUQuerySet;
        Object.defineProperty(engine, "compatibilityMode", { value: false });
        engine._currentRenderTarget = null;
        engine._currentRenderPass = renderPass;
        engine._mainRenderPassWrapper = { renderPassDescriptor: {} };
        engine._occlusionQuery = {
            hasQueries: true,
            querySet,
        } as ThinWebGPUEngine["_occlusionQuery"];
        engine._bundleList = new WebGPUBundleList({} as GPUDevice);
        engine._endCurrentRenderPass = vi.fn();
        engine._startMainRenderPass = vi.fn();

        expect(engine.beginOcclusionQuery(0, 11)).toBe(true);
        expect(engine._getCurrentRenderPass()).toBe(renderPass);
        engine.endOcclusionQuery();
        engine._bundleList.run(renderPass);

        expect(engine._endCurrentRenderPass).not.toHaveBeenCalled();
        expect(engine._startMainRenderPass).not.toHaveBeenCalled();
        expect(renderPass.beginOcclusionQuery).toHaveBeenCalledExactlyOnceWith(11);
        expect(renderPass.endOcclusionQuery).toHaveBeenCalledOnce();
        expect(calls).toEqual(["begin", "end"]);
    });

    it("preserves the selected 3D render target slice when restarting a compatibility pass", () => {
        const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngineRenderPassInternals;
        const colorTexture = {} as GPUTexture;
        const colorView = {} as GPUTextureView;
        const renderPasses: RenderPassDescriptor[] = [];
        const querySet = {} as GPUQuerySet;
        const hardwareTexture = {
            underlyingResource: colorTexture,
            format: "rgba8unorm",
        } as WebGPUHardwareTexture;
        const internalTexture = {
            _hardwareTexture: hardwareTexture,
            format: Constants.TEXTUREFORMAT_RGBA,
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            is3D: true,
        } as InternalTexture;
        engine._timestampQuery = { enable: false, startPass: vi.fn() };
        const renderTarget = new WebGPURenderTargetWrapper(false, false, { width: 16, height: 16, depth: 8 }, engine as unknown as ThinWebGPUEngine, "3D target");
        renderTarget.setTexture(internalTexture, 0, false);

        Object.defineProperty(engine, "compatibilityMode", { value: true });
        engine._currentRenderTarget = renderTarget;
        engine._currentRenderPass = null;
        engine._rttRenderPassWrapper = {
            renderPassDescriptor: null,
            colorAttachmentViewDescriptor: {
                format: "rgba8unorm",
                dimension: "3d",
                baseArrayLayer: 0,
                baseMipLevel: 0,
                mipLevelCount: 1,
                arrayLayerCount: 1,
            },
            colorAttachmentDepthSlice: 5,
            depthAttachmentViewDescriptor: null,
            colorAttachmentGPUTextures: [hardwareTexture],
            depthTextureFormat: undefined,
        };
        engine._occlusionQuery = {
            hasQueries: false,
            querySet,
        } as ThinWebGPUEngine["_occlusionQuery"];
        engine._occlusionQueryActive = false;
        engine._snapshotRendering = { handleRenderPassRestart: vi.fn() };
        engine._cacheTextureViews = {
            getView: vi.fn((_texture, descriptor) => {
                expect(descriptor.baseArrayLayer).toBe(0);
                return colorView;
            }),
        };
        engine._renderEncoder = {
            beginRenderPass: vi.fn((descriptor) => {
                renderPasses.push(descriptor);
                return {} as GPURenderPassEncoder;
            }),
        };
        engine._timestampIndex = 0;
        engine._internalFrameCounter = 0;
        engine._frameId = 1;
        Object.defineProperty(engine, "useReverseDepthBuffer", { value: false });
        engine._stencilStateComposer = { enabled: true };
        engine._endCurrentRenderPass = vi.fn(() => {
            engine._currentRenderPass = null;
            return 1;
        });
        engine._debugPushAfterStartOfEncoder = vi.fn();
        engine._resetRenderPassStates = vi.fn();

        engine._startRenderTargetRenderPass(renderTarget, false, null, false, false);
        engine._occlusionQuery = {
            hasQueries: true,
            querySet,
        } as ThinWebGPUEngine["_occlusionQuery"];
        const restartedPass = engine._getCurrentRenderPass();

        expect(restartedPass).toBe(engine._currentRenderPass);
        expect(renderPasses).toHaveLength(2);
        const restartedColorAttachment = renderPasses[1].colorAttachments[0] as RenderPassColorAttachment;
        expect(restartedColorAttachment.view).toBe(colorView);
        expect(restartedColorAttachment.depthSlice).toBe(5);
        expect(restartedColorAttachment.loadOp).toBe("load");
        expect(renderPasses[1].occlusionQuerySet).toBe(querySet);
    });
});
