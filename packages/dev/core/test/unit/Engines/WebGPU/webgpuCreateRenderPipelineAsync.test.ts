import { describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUCacheRenderPipelineTree } from "core/Engines/WebGPU/webgpuCacheRenderPipelineTree";
import { WebGPUMaterialContext } from "core/Engines/WebGPU/webgpuMaterialContext";
import { type WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import { Constants } from "core/Engines/constants";
import { AlphaState } from "core/States/alphaCullingState";
import { DepthCullingState } from "core/States/depthCullingState";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type Effect } from "core/Materials/effect";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type AbstractMesh } from "core/Meshes/abstractMesh";

const colorTexture = { uniqueId: 1, format: Constants.TEXTUREFORMAT_RGBA, type: Constants.TEXTURETYPE_UNSIGNED_BYTE } as InternalTexture;
const depthTexture = { uniqueId: 2, format: Constants.TEXTUREFORMAT_DEPTH32_FLOAT, type: Constants.TEXTURETYPE_UNSIGNED_BYTE } as InternalTexture;
const floatTexture = { uniqueId: 3, format: Constants.TEXTUREFORMAT_RGBA, type: Constants.TEXTURETYPE_FLOAT } as InternalTexture;

function createEffect(textureNames: string[]): Effect {
    return {
        uniqueId: 1,
        getEngine: () => ({}),
        _pipelineContext: {
            stages: {
                vertexStage: { module: {}, entryPoint: "main" },
                fragmentStage: { module: {}, entryPoint: "main" },
            },
            shaderProcessingContext: {
                attributeNamesFromEffect: [],
                attributeLocationsFromEffect: [],
                bindGroupLayoutEntries: [],
                bindGroupEntries: [],
                bindGroupLayoutEntryInfo: [],
                textureNames,
            },
            bindGroupLayouts: {},
            uniformBuffer: null,
        } as unknown as WebGPUPipelineContext,
    } as unknown as Effect;
}

// An engine with a real pipeline cache on a device that records which pipelines it creates, and the real prewarm and draw paths.
// Its tracked states are the ones a prewarm uses by default (an opaque mesh), so that a draw looks up the pipeline a prewarm created.
function createEngine(textureFloatLinearFiltering: boolean) {
    const device = {
        limits: { maxVertexBufferArrayStride: 2048, maxVertexAttributes: 16 },
        createRenderPipeline: vi.fn(() => ({})),
        createRenderPipelineAsync: vi.fn(async () => ({})),
        createPipelineLayout: vi.fn(() => ({})),
        createBindGroupLayout: vi.fn(() => ({})),
    };
    const emptyVertexBuffer = { getSize: () => 1, getIsInstanced: () => false, type: Constants.FLOAT, effectiveByteStride: 12, effectiveByteOffset: 0, hashCode: 0 };
    WebGPUCacheRenderPipelineTree.ResetCache();
    const cache = new WebGPUCacheRenderPipelineTree(device as unknown as GPUDevice, emptyVertexBuffer as unknown as VertexBuffer);
    const indexBuffer = { underlyingResource: {}, is32Bits: true };
    const renderPass = { setPipeline: vi.fn(), setIndexBuffer: vi.fn(), setVertexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn() };
    const depthCullingState = new DepthCullingState();
    depthCullingState.depthFunc = Constants.LEQUAL;

    const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngine;
    Object.assign(engine, {
        _device: device,
        _caps: { textureFloatLinearFiltering },
        _cacheRenderPipeline: cache,
        _cacheBindGroups: { getBindGroups: () => [] },
        _colorFormat: "bgra8unorm",
        _depthTextureFormat: "depth24plus-stencil8",
        _mainPassSampleCount: 1,
        _currentRenderTarget: null,
        _alphaState: new AlphaState(false),
        _alphaMode: [Constants.ALPHA_DISABLE],
        _depthCullingState: depthCullingState,
        _stencilStateComposer: { enabled: false },
        _colorWrite: true,
        _currentVertexBuffers: {},
        _currentIndexBuffer: indexBuffer,
        _currentOverrideVertexBuffers: null,
        _compatibilityMode: true,
        _renderPassCommandRecorderProvider: null,
        _renderPassCommandBatching: null,
        _snapshotRendering: { record: false, play: false },
        _getCurrentRenderPass: () => renderPass,
        _bundleList: {},
        applyStates: vi.fn(),
        bindUniformBufferBase: vi.fn(),
        _applyRenderPassChanges: vi.fn(),
        _currentDrawContext: { setVertexPulling: vi.fn(), indirectDrawBuffer: null, _enableIndirectDrawInCompatMode: false },
        _counters: { numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 },
        _reportDrawCall: vi.fn(),
    });
    engine.setState(true);

    const mesh = { geometry: { getVertexBuffers: () => ({}), getIndexBuffer: () => indexBuffer } } as unknown as AbstractMesh;

    // draws with an effect and the textures a material binds, by name
    const draw = (effect: Effect, textures: { [name: string]: InternalTexture }) => {
        const materialContext = new WebGPUMaterialContext();
        for (const name in textures) {
            materialContext.setTexture(name, textures[name]);
        }
        Object.assign(engine, { _currentEffect: effect, _currentMaterialContext: materialContext });
        engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 3);
    };

    return { engine, device, mesh, draw };
}

describe("WebGPUEngine.createRenderPipelineAsync", () => {
    it("prewarms the pipeline of the draws that bind a depth texture, like the shadow map of a light with percentage closer filtering", async () => {
        const { engine, device, mesh, draw } = createEngine(true);
        const effect = createEffect(["albedoSampler", "shadowTexture0"]);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, textures: { shadowTexture0: depthTexture } }));
        draw(effect, { albedoSampler: colorTexture, shadowTexture0: depthTexture });

        expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it.each([false, true])("prewarms the pipeline of the draws that bind a float texture, with linear filtering of float textures %s", async (textureFloatLinearFiltering) => {
        const { engine, device, mesh, draw } = createEngine(textureFloatLinearFiltering);
        const effect = createEffect(["albedoSampler", "dataSampler"]);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, textures: { dataSampler: floatTexture } }));
        draw(effect, { albedoSampler: colorTexture, dataSampler: floatTexture });

        expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the pipeline of the draws that bind neither when no texture is given", async () => {
        const { engine, device, mesh, draw } = createEngine(false);
        const effect = createEffect(["albedoSampler", "shadowTexture0"]);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(effect, { albedoSampler: colorTexture });

        expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });
});
