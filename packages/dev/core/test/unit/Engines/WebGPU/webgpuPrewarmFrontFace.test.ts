import { afterEach, describe, expect, it, vi } from "vitest";
import { WebGPUEngine } from "core/Engines/webgpuEngine.pure";
import { WebGPUCacheRenderPipelineTree } from "core/Engines/WebGPU/webgpuCacheRenderPipelineTree";
import { WebGPUMaterialContext } from "core/Engines/WebGPU/webgpuMaterialContext";
import { type WebGPUPipelineContext } from "core/Engines/WebGPU/webgpuPipelineContext";
import { Constants } from "core/Engines/constants";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { Material } from "core/Materials/material";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MultiMaterial } from "core/Materials/multiMaterial";
import { SubMesh } from "core/Meshes/subMesh";
import "core/Meshes/instancedMesh";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { AlphaState } from "core/States/alphaCullingState";
import { DepthCullingState } from "core/States/depthCullingState";
import { type VertexBuffer } from "core/Buffers/buffer";
import { type Effect } from "core/Materials/effect";
import { type Mesh } from "core/Meshes/mesh";

const effect = {
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
            textureNames: [],
        },
        bindGroupLayouts: {},
        uniformBuffer: null,
    } as unknown as WebGPUPipelineContext,
} as unknown as Effect;

let nullEngine: NullEngine;
let scene: Scene;

afterEach(() => {
    scene?.dispose();
    nullEngine?.dispose();
});

// A sphere with a standard material, in a scene of a null engine
function createMesh(useRightHandedSystem = false): Mesh {
    nullEngine = new NullEngine();
    scene = new Scene(nullEngine);
    scene.useRightHandedSystem = useRightHandedSystem;
    const mesh = CreateSphere("sphere", { segments: 4 }, scene);
    mesh.material = new StandardMaterial("material", scene);
    return mesh;
}

// A WebGPU engine with a real pipeline cache on a device that records which pipelines it creates, and the real prewarm, state and draw paths.
// A draw applies the engine's tracked depth and culling states to the cache, as applyStates does.
function createEngine(mesh: Mesh) {
    const device = {
        limits: { maxVertexBufferArrayStride: 2048, maxVertexAttributes: 16 },
        createRenderPipeline: vi.fn((descriptor: GPURenderPipelineDescriptor) => ({ descriptor })),
        createRenderPipelineAsync: vi.fn(async (descriptor: GPURenderPipelineDescriptor) => ({ descriptor })),
        createPipelineLayout: vi.fn(() => ({})),
        createBindGroupLayout: vi.fn(() => ({})),
    };
    const emptyVertexBuffer = { getSize: () => 1, getIsInstanced: () => false, type: Constants.FLOAT, effectiveByteStride: 12, effectiveByteOffset: 0, hashCode: 0 };
    WebGPUCacheRenderPipelineTree.ResetCache();
    const cache = new WebGPUCacheRenderPipelineTree(device as unknown as GPUDevice, emptyVertexBuffer as unknown as VertexBuffer);
    const depthCullingState = new DepthCullingState();
    depthCullingState.depthFunc = Constants.LEQUAL;
    const renderPass = { setPipeline: vi.fn(), setIndexBuffer: vi.fn(), setVertexBuffer: vi.fn(), setBindGroup: vi.fn(), drawIndexed: vi.fn() };

    const engine = Object.create(WebGPUEngine.prototype) as WebGPUEngine;
    Object.assign(engine, {
        _device: device,
        _caps: { textureFloatLinearFiltering: true },
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
        _currentVertexBuffers: mesh.geometry!.getVertexBuffers(),
        _currentIndexBuffer: mesh.geometry!.getIndexBuffer(),
        _currentOverrideVertexBuffers: null,
        _compatibilityMode: true,
        _renderPassCommandRecorderProvider: null,
        _renderPassCommandBatching: null,
        _snapshotRendering: { record: false, play: false },
        _getCurrentRenderPass: () => renderPass,
        _bundleList: {},
        applyStates: () => {
            const state = depthCullingState;
            cache.setDepthCullingState(
                state.cull ?? false,
                state.frontFace ?? 2,
                state.cullFace ?? 1,
                state.zOffset,
                state.zOffsetUnits,
                state.depthTest ?? true,
                state.depthMask ?? true,
                state.depthFunc
            );
        },
        bindUniformBufferBase: vi.fn(),
        _applyRenderPassChanges: vi.fn(),
        _currentEffect: effect,
        _currentMaterialContext: new WebGPUMaterialContext(),
        _currentDrawContext: { setVertexPulling: vi.fn(), indirectDrawBuffer: null, _enableIndirectDrawInCompatMode: false },
        _counters: { numBundleCreationNonCompatMode: 0, numBundleReuseNonCompatMode: 0 },
        _reportDrawCall: vi.fn(),
    });

    // a draw of the mesh: the material it draws with sets the states as Material._preBind does, with the front faces reversed or not
    const draw = (reverseSide: boolean, material: Material = mesh.material!) => {
        engine.setState(material.backFaceCulling, 0, false, reverseSide, material.cullBackFaces);
        engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 3);
    };

    return { engine, device, draw };
}

describe("WebGPUEngine.createRenderPipelineAsync front face", () => {
    it("prewarms the front face of a mesh with the default orientation, drawn counter clockwise", async () => {
        const mesh = createMesh();
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(false);

        expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh whose world matrix mirrors, drawn clockwise, before the world matrix is computed", async () => {
        const mesh = createMesh();
        mesh.scaling.x = -1;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh in a right handed scene, drawn clockwise", async () => {
        const mesh = createMesh(true);
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a material with a side orientation of its own", async () => {
        const mesh = createMesh();
        mesh.material!.sideOrientation = Material.ClockWiseSideOrientation;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a material that doesn't cull, whose first draw doesn't reverse it in a right handed scene", async () => {
        const mesh = createMesh(true);
        mesh.material!.backFaceCulling = false;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, cullEnabled: false }));
        draw(false);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh drawn in a render target, which is drawn Y-flipped", async () => {
        const mesh = createMesh();
        const { engine, device, draw } = createEngine(mesh);
        Object.assign(engine, { _currentRenderTarget: { samples: 1, _disableEngineYFlip: false } });

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(false);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh without material, drawn with the scene's default one (clockwise in a right handed scene)", async () => {
        const mesh = createMesh(true);
        mesh.material = null;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true, scene.defaultMaterial);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of the sub-material of the sub mesh drawn with the effect", async () => {
        const mesh = createMesh();
        const counterClockWise = new StandardMaterial("counterClockWise", scene);
        const clockWise = new StandardMaterial("clockWise", scene);
        clockWise.sideOrientation = Material.ClockWiseSideOrientation;
        const multiMaterial = new MultiMaterial("multi", scene);
        multiMaterial.subMaterials.push(counterClockWise, clockWise);
        mesh.material = multiMaterial;
        // a second sub mesh, drawn with the second sub-material and with the effect, created for it once its material is resolved (the
        // first resolution of a multi-material's sub-material resets the draw cache of the sub mesh)
        const second = new SubMesh(1, 0, mesh.getTotalVertices(), 0, mesh.getTotalIndices(), mesh);
        second.getMaterial();
        second.setEffect(effect);
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true, clockWise);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
        // the effect here has no engine to dispose it on when the scene is
        second.setEffect(null);
    });

    it("prewarms the front face of the material a render pass draws the mesh with", async () => {
        const mesh = createMesh();
        const passMaterial = new StandardMaterial("pass", scene);
        passMaterial.sideOrientation = Material.ClockWiseSideOrientation;
        mesh.setMaterialForRenderPass(nullEngine.currentRenderPassId, passMaterial);
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw(true, passMaterial);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of an instance from its source mesh and its own world matrix, also when it mirrors and is drawn on its own", async () => {
        // in a right handed scene the source is drawn clockwise, and so is an instance that does not mirror
        const source = createMesh(true);
        const instance = source.createInstance("instance");
        const { engine, device, draw } = createEngine(source);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh: instance }));
        draw(true);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();

        // a mirrored instance is drawn on its own, with its world matrix: counter clockwise
        const mirrored = source.createInstance("mirrored");
        mirrored.scaling.x = -1;
        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh: mirrored }));
        draw(false);

        expect(device.createRenderPipelineAsync.mock.calls[1][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("uses the front face it is given", async () => {
        const mesh = createMesh();
        const { engine, device } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, frontFace: 2 }));

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
    });
});
