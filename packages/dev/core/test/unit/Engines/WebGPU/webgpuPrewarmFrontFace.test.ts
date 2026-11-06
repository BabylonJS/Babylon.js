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
        enableEffect: vi.fn(),
    });

    // a draw of a sub mesh through the code Mesh.render runs for it: the material SubMesh.getMaterial gives it, the effective mesh
    // SubMesh.render gives it (an instance that acts as a regular mesh draws with its own world matrix, the others with their source's),
    // and the side orientation _getDrawSideOrientation gives Material._preBind, which sets the states on this engine (setState); then the
    // draw looks its pipeline up. The world matrix is computed as the frame computes it
    const draw = (subMesh: SubMesh = mesh.subMeshes[0]) => {
        const material = subMesh.getMaterial()!;
        const renderingMesh = subMesh.getRenderingMesh();
        const effectiveMesh = subMesh.getReplacementMesh() ?? renderingMesh;
        effectiveMesh.computeWorldMatrix(true);
        const getEngine = vi.spyOn(material.getScene(), "getEngine").mockReturnValue(engine);
        try {
            material._preBind(undefined, renderingMesh._getDrawSideOrientation(material, effectiveMesh));
        } finally {
            getEngine.mockRestore();
        }
        engine.drawElementsType(Constants.MATERIAL_TriangleFillMode, 0, 3);
    };

    return { engine, device, draw };
}

describe("WebGPUEngine.createRenderPipelineAsync front face", () => {
    it("prewarms the front face of a mesh with the default orientation, drawn counter clockwise", async () => {
        const mesh = createMesh();
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

        expect(device.createRenderPipelineAsync).toHaveBeenCalledTimes(1);
        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh whose world matrix mirrors, drawn clockwise, before the world matrix is computed", async () => {
        const mesh = createMesh();
        mesh.scaling.x = -1;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh in a right handed scene, drawn clockwise", async () => {
        const mesh = createMesh(true);
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a material with a side orientation of its own", async () => {
        const mesh = createMesh();
        mesh.material!.sideOrientation = Material.ClockWiseSideOrientation;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a material that doesn't cull, whose first draw doesn't reverse it in a right handed scene", async () => {
        const mesh = createMesh(true);
        mesh.material!.backFaceCulling = false;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, cullEnabled: false }));
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh drawn in a render target, which is drawn Y-flipped", async () => {
        const mesh = createMesh();
        const { engine, device, draw } = createEngine(mesh);
        Object.assign(engine, { _currentRenderTarget: { samples: 1, _disableEngineYFlip: false } });

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of a mesh without material, drawn with the scene's default one (clockwise in a right handed scene)", async () => {
        const mesh = createMesh(true);
        mesh.material = null;
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh }));
        draw();

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
        draw(second);

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
        draw();

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of an instance from its source mesh and its own world matrix: a mirrored instance of a left handed source is drawn clockwise, on its own", async () => {
        const source = createMesh();
        const instance = source.createInstance("instance");
        const mirrored = source.createInstance("mirrored");
        mirrored.scaling.x = -1;
        const { engine, device, draw } = createEngine(source);
        // as the frame activates them: an instance whose determinant's sign differs from its source's acts as a regular mesh, drawn on
        // its own; the others are drawn in their source's draw
        source.computeWorldMatrix(true);
        for (const each of [instance, mirrored]) {
            each.computeWorldMatrix(true);
            each._currentLOD = source;
            each._activate(scene.getRenderId(), false);
        }

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh: instance }));
        draw(instance.subMeshes[0]);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("ccw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh: mirrored }));
        draw(mirrored.subMeshes[0]);

        expect(device.createRenderPipelineAsync.mock.calls[1][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("prewarms the front face of the sub mesh it is given, among sub meshes drawn with the same effect", async () => {
        const mesh = createMesh();
        const counterClockWise = new StandardMaterial("counterClockWise", scene);
        const clockWise = new StandardMaterial("clockWise", scene);
        clockWise.sideOrientation = Material.ClockWiseSideOrientation;
        const multiMaterial = new MultiMaterial("multi", scene);
        multiMaterial.subMaterials.push(counterClockWise, clockWise);
        mesh.material = multiMaterial;
        const second = new SubMesh(1, 0, mesh.getTotalVertices(), 0, mesh.getTotalIndices(), mesh);
        // both sub meshes drawn with the effect, created for each once its material is resolved
        for (const subMesh of mesh.subMeshes) {
            subMesh.getMaterial();
            subMesh.setEffect(effect);
        }
        const { engine, device, draw } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, subMesh: second }));
        draw(second);

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
        expect(device.createRenderPipeline).not.toHaveBeenCalled();
        // the effect here has no engine to dispose it on when the scene is
        for (const subMesh of mesh.subMeshes) {
            subMesh.setEffect(null);
        }
    });

    it("uses the front face it is given", async () => {
        const mesh = createMesh();
        const { engine, device } = createEngine(mesh);

        await Promise.all(engine.createRenderPipelineAsync({ effect, mesh, frontFace: 2 }));

        expect(device.createRenderPipelineAsync.mock.calls[0][0].primitive!.frontFace).toBe("cw");
    });
});
