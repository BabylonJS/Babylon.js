import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { FlowGraphCoordinator } from "core/FlowGraph/flowGraphCoordinator";
import { Vector3 } from "core/Maths";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Logger } from "core/Misc";
import { ParseFlowGraphAsync } from "core/FlowGraph";
import { InteractivityGraphToFlowGraphParser } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityGraphParser";
import "loaders/glTF/2.0/glTFLoaderAnimation";
import "loaders/glTF/2.0/Extensions/KHR_animation_pointer.data";
import { _AddInteractivityObjectModel } from "loaders/glTF/2.0/Extensions/KHR_interactivity";
import { GetPathToObjectConverter } from "loaders/glTF/2.0/Extensions/objectModelMapping";
import { IKHRInteractivity_Declaration, IKHRInteractivity_Graph, IKHRInteractivity_Node, IKHRInteractivity_Type, IKHRInteractivity_Variable } from "babylonjs-gltf2interface";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { MorphTarget } from "core/Morph/morphTarget";
import { MorphTargetManager } from "core/Morph/morphTargetManager";

/**
 * These tests will check the connection between interactivity's object model and pointers to the flow graph.
 * It will check pointer get, pointer set, interpolation, and the JSON pointers specified in the interactivity specs.
 */

describe("glTF interactivity Object Model", () => {
    let engine: NullEngine;
    let scene: Scene;
    const log: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Log").mockImplementation(() => {});
    const errorLog: ReturnType<typeof vi.spyOn> = vi.spyOn(Logger, "Error").mockImplementation(() => {});
    let renderInterval: any;

    async function generateSimpleNodeGraph(
        mockGltf: any, //Partial<IGLTF>,
        declarations: IKHRInteractivity_Declaration[],
        nodes: IKHRInteractivity_Node[],
        types: IKHRInteractivity_Type[] = [],
        variables: IKHRInteractivity_Variable[] = []
    ) {
        const ig: IKHRInteractivity_Graph = {
            declarations: [...declarations, { op: "event/onStart" }],
            types,
            nodes: [
                ...nodes,
                {
                    declaration: declarations.length,
                    flows: {
                        out: {
                            node: 0, // first node provided should be the flow node tested
                            socket: "in",
                        },
                    },
                },
            ],
            variables,
        };

        const pathConverter = GetPathToObjectConverter(mockGltf);
        const i2fg = new InteractivityGraphToFlowGraphParser(ig, mockGltf);
        const json = i2fg.serializeToFlowGraph();
        const coordinator = new FlowGraphCoordinator({ scene });
        const graph = await ParseFlowGraphAsync(json, { coordinator, pathConverter });
        graph.getContext(0).enableLogging = true;
        graph.getContext(0).logger!.logToConsole = false;

        coordinator.start();

        return {
            graph,
            logger: graph.getContext(0).logger!,
        };
    }

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        new ArcRotateCamera("", Math.PI / 2, Math.PI / 2, 4, new Vector3(0, 0, 0));
        log.mockClear();
        errorLog.mockClear();
        _AddInteractivityObjectModel(scene);
        renderInterval = setInterval(() => scene?.render(), 16);
    });

    afterEach(() => {
        clearInterval(renderInterval);
        scene.dispose();
        engine.dispose();
    });

    // basic JSON Pointer tests
    it("should reject a relative JSON pointer even when a ref value could prefix it", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await expect(
            generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: {
                                node: 1,
                                socket: "value",
                            },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: ["translation"] },
                            type: { value: [0] },
                        },
                        values: {
                            nodeRef: {
                                value: ["/nodes/0/"],
                                type: 1,
                            },
                        },
                    },
                ],
                [{ signature: "float3" }, { signature: "ref" }]
            )
        ).rejects.toThrow();
    });

    it("should ignore anisotropy strength access when the Babylon material is unavailable", () => {
        const converter = GetPathToObjectConverter({
            materials: [
                {
                    extensions: {
                        KHR_materials_anisotropy: {},
                    },
                },
            ],
        } as any);
        const accessor = converter.convert("/materials/0/extensions/KHR_materials_anisotropy/anisotropyStrength");

        expect(accessor.info.get(accessor.object)).toBeUndefined();
        expect(() => accessor.info.set?.(0.5, accessor.object)).not.toThrow();
    });

    it("should find a node's translation", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: {
                            value: [0],
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should report node weights.length as invalid when the node has no mesh", async () => {
        const node = new TransformNode("node", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights.length"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report a node weight as invalid when the node has no mesh", async () => {
        const node = new TransformNode("node", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report a node weight as invalid when its mesh has no morph targets", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "isValid" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(false);
    });

    it("should report weights.length as valid and zero when a node's mesh has no morph targets", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 2, socket: "isValid" },
                    },
                    flows: {
                        out: { node: 1, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { node: 2, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights.length"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log.mock.calls.map((call) => call[0])).toEqual([true, 0]);
    });

    it("should read morph-target length, validity, and static weight values from a node mesh", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.1, scene));
        manager.addTarget(new MorphTarget("target1", 0.2, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        const getOutput = async (pointer: string, socket: "isValid" | "value"): Promise<any> => {
            log.mockClear();
            await generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: { node: 1, socket },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: [pointer] },
                            type: { value: [0] },
                        },
                    },
                ],
                [{ signature: "float" }]
            );
            return log.mock.calls[log.mock.calls.length - 1][0];
        };

        expect(await getOutput("/nodes/0/weights.length", "isValid")).toBe(true);
        expect(await getOutput("/nodes/0/weights.length", "value")).toBe(2);
        expect(await getOutput("/nodes/0/weights/0", "isValid")).toBe(true);
        expect(await getOutput("/nodes/0/weights/0", "value")).toBeCloseTo(0.1);
    });

    it("should read non-static morph weights from a descendant mesh", async () => {
        const node = new TransformNode("node", scene);
        const mesh = new Mesh("mesh", scene);
        mesh.parent = node;
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.5, scene));
        manager.addTarget(new MorphTarget("target1", 0.25, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: node }],
        };

        const getOutput = async (pointer: string, socket: "isValid" | "value"): Promise<any> => {
            log.mockClear();
            await generateSimpleNodeGraph(
                mockGltf,
                [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
                [
                    {
                        declaration: 1,
                        values: {
                            message: { node: 1, socket },
                        },
                    },
                    {
                        declaration: 0,
                        configuration: {
                            pointer: { value: [pointer] },
                            type: { value: [0] },
                        },
                    },
                ],
                [{ signature: "float" }]
            );
            return log.mock.calls[log.mock.calls.length - 1][0];
        };

        expect(await getOutput("/nodes/0/weights.length", "value")).toBe(2);
        expect(await getOutput("/nodes/0/weights/0", "isValid")).toBe(true);
        expect(await getOutput("/nodes/0/weights/0", "value")).toBe(0.5);
    });

    it("should expose a node-overridden morph weight", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.6, scene));
        manager.addTarget(new MorphTarget("target1", 0.2, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    weights: [0.6, 0.2],
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(0.6);
    });

    it("should set a morph weight and read it back", async () => {
        const mesh = new Mesh("mesh", scene);
        const manager = new MorphTargetManager(scene);
        manager.addTarget(new MorphTarget("target0", 0.1, scene));
        mesh.morphTargetManager = manager;
        const mockGltf: any = {
            nodes: [
                {
                    mesh: 0,
                    _babylonTransformNode: mesh,
                    _primitiveBabylonMeshes: [mesh],
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                    },
                    values: {
                        value: { type: 0, value: [0.9] },
                    },
                    flows: {
                        out: { node: 2, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/weights/0"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
            ],
            [{ signature: "float" }]
        );

        expect(log).toHaveBeenCalledWith(0.9);
        expect(manager.getTarget(0).influence).toBe(0.9);
    });

    // use variables to store the pointer
    it("should find a node's translation using a template variable", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/{nodeIdx}/translation"] },
                        type: { value: [1] },
                    },
                    values: {
                        nodeIdx: { value: [0], type: 0 },
                    },
                },
            ],
            [{ signature: "int" }, { signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(1, 2, 3));
    });

    it("should get the active camera's position", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/position"] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float3" }]
        );
        // the result comes from the definition in the beforeEach function - a: PI/2, b: PI/2, r: 4
        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        // round the result
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(0);
        expect(lastCallValue.z).toBeCloseTo(4);
    });

    // check activeCamera/rotation
    it("should get the active camera's rotation", async () => {
        await generateSimpleNodeGraph(
            {
                extensions: {
                    KHR_interactivity: {},
                },
            },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/extensions/KHR_interactivity/activeCamera/rotation"] },
                        type: { value: [1] },
                    },
                },
            ],
            [{ signature: "float4" }]
        );

        const lastCallValue = log.mock.calls[log.mock.calls.length - 1][0];
        // should be 0,1,0,0
        expect(lastCallValue.x).toBeCloseTo(0);
        expect(lastCallValue.y).toBeCloseTo(1);
        expect(lastCallValue.z).toBeCloseTo(0);
        expect(lastCallValue.w).toBeCloseTo(0);
    });

    // Helper: run a single pointer/get on a scalar (float) activeCamera pointer and return the logged value.
    async function getActiveCameraScalar(pointer: string): Promise<number> {
        log.mockClear();
        await generateSimpleNodeGraph(
            { extensions: { KHR_interactivity: {} } },
            [{ op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 1,
                    values: {
                        message: { node: 1, socket: "value" },
                    },
                },
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: [pointer] },
                        type: { value: [0] },
                    },
                },
            ],
            [{ signature: "float" }]
        );
        return log.mock.calls[log.mock.calls.length - 1][0] as number;
    }

    // check activeCamera perspective projection properties
    it("should get the active camera's perspective projection properties", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 0; // perspective (default for ArcRotateCamera)
        camera.fovMode = 0; // vertical fixed
        camera.fov = 0.75;
        camera.minZ = 0.5;
        camera.maxZ = 100;

        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/yfov")).toBeCloseTo(0.75);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/znear")).toBeCloseTo(0.5);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/zfar")).toBeCloseTo(100);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/aspectRatio")).toBeCloseTo(scene.getEngine().getAspectRatio(camera));
        // Orthographic pointers must be NaN for a perspective camera.
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/xmag")).toBeNaN();
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/ymag")).toBeNaN();
    });

    it("should report an infinite perspective far clipping plane as Infinity", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 0;
        camera.maxZ = 0; // Babylon uses maxZ === 0 to mean an infinite far plane
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/zfar")).toBe(Infinity);
    });

    // check activeCamera orthographic projection properties
    it("should get the active camera's orthographic projection properties", async () => {
        const camera = scene.activeCamera!;
        camera.mode = 1; // orthographic
        camera.orthoLeft = -3;
        camera.orthoRight = 3; // xmag = (3 - (-3)) / 2 = 3
        camera.orthoBottom = -2;
        camera.orthoTop = 2; // ymag = (2 - (-2)) / 2 = 2
        camera.minZ = 0.1;
        camera.maxZ = 50;

        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/xmag")).toBeCloseTo(3);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/ymag")).toBeCloseTo(2);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/znear")).toBeCloseTo(0.1);
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/orthographic/zfar")).toBeCloseTo(50);
        // Perspective pointers must be NaN for an orthographic camera.
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/yfov")).toBeNaN();
        expect(await getActiveCameraScalar("/extensions/KHR_interactivity/activeCamera/perspective/aspectRatio")).toBeNaN();
    });

    it("should set a pointer value and get it correctly", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/set" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                    },
                    flows: {
                        out: {
                            node: 2,
                            socket: "in",
                        },
                    },
                    values: {
                        value: { value: [2, 3, 4], type: 0 },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/scale"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 1,
                            socket: "value",
                        },
                    },
                },
            ],
            [{ signature: "float3" }]
        );

        expect(log).toHaveBeenCalledWith(new Vector3(2, 3, 4));
    });

    // simple pointer/interpolate
    it("should interpolate a pointer value", async () => {
        // the reason for cloning is that the same vector is being returned, meaning that the values will be the same at the end of the interpolation
        const calls: any[] = [];
        log.mockImplementation((val) => {
            calls.push(val.clone());
        });
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "pointer/get" }, { op: "flow/log", extension: "BABYLON" }, { op: "event/onTick" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: {
                            value: [2, 3, 4],
                            type: 0,
                        },
                        duration: {
                            value: [0.9],
                            type: 1,
                        },
                    },
                    flows: {
                        // on start - log
                        out: {
                            node: 1,
                            socket: "in",
                        },
                        // on done - log
                        done: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    declaration: 2,
                    values: {
                        message: {
                            node: 2,
                            socket: "value",
                        },
                    },
                },
                {
                    declaration: 1,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                },
                {
                    declaration: 3,
                    flows: {
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );

        // wait for 1 second + buffer
        await new Promise((resolve) => setTimeout(resolve, 1000 + 300));
        expect(calls[0]).toEqual(new Vector3(1, 2, 3));
        calls.forEach((call, idx) => {
            if (idx === 0) {
                return;
            }
            expect(call.x).toBeGreaterThanOrEqual(calls[idx - 1].x);
            expect(call.y).toBeGreaterThanOrEqual(calls[idx - 1].y);
            expect(call.z).toBeGreaterThanOrEqual(calls[idx - 1].z);
        });
        expect(calls.pop()).toEqual(new Vector3(2, 3, 4));

        log.mockImplementation(() => {});
    });

    it("should activate err for pointer/interpolate CSS control points outside the valid X range", async () => {
        const mesh = new Mesh("mesh", scene);
        const mockGltf: any = {
            nodes: [{ _babylonTransformNode: mesh }],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            [{ op: "pointer/interpolate" }, { op: "flow/log", extension: "BABYLON" }],
            [
                {
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { type: 0, value: [2, 3, 4] },
                        duration: { type: 2, value: [1] },
                        p1: { type: 1, value: [-0.01, 0] },
                        p2: { type: 1, value: [1, 1] },
                    },
                    flows: {
                        err: { node: 1, socket: "in" },
                        out: { node: 2, socket: "in" },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { type: 2, value: [1] },
                    },
                },
                {
                    declaration: 1,
                    values: {
                        message: { type: 2, value: [2] },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float2" }, { signature: "float" }]
        );

        expect(log.mock.calls.map((call) => call[0])).toEqual([1]);
    });

    // A concurrent invalid pointer/interpolate (bad duration) must not cancel a running interpolation on the same target.
    it("should not let an invalid pointer/interpolate cancel a running one", async () => {
        const mesh = new Mesh("mesh", scene);
        mesh.position.set(1, 2, 3);
        const mockGltf: any = {
            nodes: [
                {
                    _babylonTransformNode: mesh,
                },
            ],
        };

        await generateSimpleNodeGraph(
            mockGltf,
            // 0: valid interpolate, 1: invalid interpolate (same op/declaration), 2: unused
            [{ op: "pointer/interpolate" }],
            [
                {
                    // valid interpolation to (2,3,4) over ~0.9s
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { value: [2, 3, 4], type: 0 },
                        duration: { value: [0.9], type: 1 },
                    },
                    flows: {
                        // as soon as the valid interpolation starts, trigger the invalid one on the same target
                        out: {
                            node: 1,
                            socket: "in",
                        },
                    },
                },
                {
                    // invalid interpolation (negative duration) targeting the same node
                    declaration: 0,
                    configuration: {
                        pointer: { value: ["/nodes/0/translation"] },
                        type: { value: [0] },
                    },
                    values: {
                        value: { value: [9, 9, 9], type: 0 },
                        duration: { value: [-1], type: 1 },
                    },
                },
            ],
            [{ signature: "float3" }, { signature: "float" }]
        );

        // wait for the valid interpolation to complete
        await new Promise((resolve) => setTimeout(resolve, 1000 + 300));
        // the running interpolation must not have been cancelled by the invalid one
        expect(mesh.position.x).toBeCloseTo(2, 3);
        expect(mesh.position.y).toBeCloseTo(3, 3);
        expect(mesh.position.z).toBeCloseTo(4, 3);
    });
});
