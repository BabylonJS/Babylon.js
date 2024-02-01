import { ActionManager, IncrementValueAction } from "core/Actions";
import { VertexBuffer } from "core/Buffers";
import { FreeCamera } from "core/Cameras";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { HemisphericLight } from "core/Lights";
import { SceneLoader } from "core/Loading";
import { Vector2, Vector3 } from "core/Maths";
import { Mesh, TransformNode } from "core/Meshes";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { SceneSerializer } from "core/Misc/sceneSerializer";
import { ParticleHelper } from "core/Particles";
import { BlurPostProcess } from "core/PostProcesses";
import { Scene } from "core/scene";

describe("Babylon scene serializer", () => {
    let subject: Engine;
    let scene: Scene;

    beforeEach(function () {
        subject = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(subject);
    });

    describe("#sceneSerialize", () => {
        it("should serialize an empty scene", () => {
            const result = SceneSerializer.Serialize(scene);

            // Scene is not empty, it has at least some properties such as clearColor
            expect(result).not.toEqual({});
        });

        it("should serialize a scene with different elements", () => {
            /**
             * Meshes
             */
            const mesh1 = MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);
            const mesh2 = MeshBuilder.CreateBox("box1", { size: 2 }, scene);
            mesh2.parent = mesh1;

            /**
             * Transform nodes
             */
            const transformNode1 = new TransformNode("transformNode1", scene);
            transformNode1.parent = mesh1;

            /**
             * Cameras
             */
            const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
            camera.parent = mesh1;

            /**
             * Lights
             */
            const light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
            light.parent = mesh1;

            /**
             * Particles
             */
            ParticleHelper.CreateDefault(mesh1, 100, scene, false);

            /**
             * Post processes
             */
            new BlurPostProcess("Horizontal blur", new Vector2(1, 0), 2, 1.0, camera, 1);

            /**
             * Actions
             */
            scene.metadata = { counter: 0 };
            scene.actionManager = new ActionManager(scene);
            scene.actionManager.registerAction(new IncrementValueAction(ActionManager.OnEveryFrameTrigger, scene.metadata, "counter", 1));
            const result = SceneSerializer.Serialize(scene);

            expect(result).not.toEqual({});

            expect(result.geometries.vertexData.length).toBe(2);

            expect(result.meshes.length).toBe(2);
            expect(result.meshes[0].name).toBe("ground1");
            expect(result.meshes[0].geometryId).toBe(result.geometries.vertexData[0].id);

            expect(result.meshes[1].name).toBe("box1");
            expect(result.meshes[1].parentId).toBe(result.meshes[0].uniqueId);
            expect(result.meshes[1].geometryId).toBe(result.geometries.vertexData[1].id);

            expect(result.transformNodes.length).toBe(1);
            expect(result.transformNodes[0].name).toBe("transformNode1");
            expect(result.transformNodes[0].parentId).toBe(result.meshes[0].uniqueId);

            expect(result.cameras.length).toBe(1);
            expect(result.cameras[0].name).toBe("camera1");
            expect(result.cameras[0].parentId).toBe(result.meshes[0].uniqueId);

            expect(result.lights.length).toBe(1);
            expect(result.lights[0].name).toBe("light1");
            expect(result.lights[0].parentId).toBe(result.meshes[0].uniqueId);

            expect(result.particleSystems.length).toBe(1);
            expect(result.particleSystems[0].emitterId).toBe(result.meshes[0].id);

            expect(result.postProcesses.length).toBe(1);
            expect(result.postProcesses[0].name).toBe("Horizontal blur");
            expect(result.postProcesses[0].cameraId).toBe(result.cameras[0].id);

            expect(result.actions.children.length).toBe(1);
        });

        it("should serialize shared buffers only once", async () => {
            const mesh1 = new Mesh("mesh1", scene);
            mesh1.setVerticesData(VertexBuffer.PositionKind, new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2]), false, 3);
            mesh1.setVerticesData(VertexBuffer.NormalKind, new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2]), false, 3);
            mesh1.setIndices([0, 1, 2]);
            mesh1.setVerticesData(VertexBuffer.UVKind, new Float32Array([0, 0, 1, 1, 2, 2]), false, 2);

            const positionVertexBuffer = mesh1.getVertexBuffer(VertexBuffer.PositionKind);
            const normalBuffer = mesh1.getVertexBuffer(VertexBuffer.NormalKind)?.getWrapperBuffer();
            const normalVertexBuffer = normalBuffer?.createVertexBuffer(VertexBuffer.NormalKind, 0, 3);
            const indices = mesh1.getIndices();

            // Mesh1 and Mesh2 share the same position vertex buffer
            // They have different normal vertex buffers, but both use the same underlying Buffer
            // And the uvs are completely distinct
            const mesh2 = new Mesh("mesh2", scene);
            mesh2.setVerticesBuffer(positionVertexBuffer!);
            mesh2.setVerticesBuffer(normalVertexBuffer!);
            mesh2.setIndices(indices!);
            mesh2.setVerticesData(VertexBuffer.UVKind, new Float32Array([5, 5, 6, 6, 7, 7]), false, 2);

            const serialized = SceneSerializer.Serialize(scene);

            // serialize 2 common position and normals and 2 unique uvs
            expect(Object.keys(serialized.buffers).length).toBe(4);
            // 1 common position, 2 unique normals and 2 unique uvs vertex buffers
            expect(Object.keys(serialized.vertexBuffers).length).toBe(5);

            // dispose mesh1 and mesh2
            mesh1.dispose();
            mesh2.dispose();

            const result = await SceneLoader.AppendAsync("", "data:" + JSON.stringify(serialized), scene);
            expect(result.meshes.length).toBe(2);
            const importedMesh1 = result.meshes[0] as Mesh;
            const importedMesh2 = result.meshes[1] as Mesh;

            // positions have same vertex and underlying buffer
            expect(importedMesh1.getVertexBuffer(VertexBuffer.PositionKind)).toBe(importedMesh2.getVertexBuffer(VertexBuffer.PositionKind));
            expect(importedMesh1.getVertexBuffer(VertexBuffer.PositionKind)?.getWrapperBuffer()).toBe(importedMesh2.getVertexBuffer(VertexBuffer.PositionKind)?.getWrapperBuffer());
            // normals have different vertex buffers but same underlying buffer
            expect(importedMesh1.getVertexBuffer(VertexBuffer.NormalKind)).not.toBe(importedMesh2.getVertexBuffer(VertexBuffer.NormalKind));
            expect(importedMesh1.getVertexBuffer(VertexBuffer.NormalKind)?.getWrapperBuffer()).toBe(importedMesh2.getVertexBuffer(VertexBuffer.NormalKind)?.getWrapperBuffer());
            // uvs have different vertex and underlying buffers
            expect(importedMesh1.getVertexBuffer(VertexBuffer.UVKind)).not.toBe(importedMesh2.getVertexBuffer(VertexBuffer.UVKind));
            expect(importedMesh1.getVertexBuffer(VertexBuffer.UVKind)?.getWrapperBuffer()).not.toBe(importedMesh2.getVertexBuffer(VertexBuffer.UVKind)?.getWrapperBuffer());
        });
    });

    describe("#meshSerialize", () => {
        it("should serialize a single mesh", () => {
            const mesh = MeshBuilder.CreateGround("ground1", {}, scene);

            const result = SceneSerializer.SerializeMesh(mesh);
            expect(result).not.toEqual({});
            expect(result.meshes.length).toBe(1);
            expect(result.meshes[0].name).toBe("ground1");
            expect(result.geometries.vertexData.length).toBe(1);
            expect(result.meshes[0].geometryId).toBe(result.geometries.vertexData[0].id);
        });

        it("should serialize a mesh with parents and children", () => {
            const grandparent = new TransformNode("grandparent", scene);
            const parent = MeshBuilder.CreateBox("parent", { size: 2 }, scene);
            const child = MeshBuilder.CreateGround("child", { width: 1, height: 1 }, scene);

            parent.parent = grandparent;
            child.parent = parent;

            const resultWithParentAndChild = SceneSerializer.SerializeMesh(parent, true, true);
            expect(resultWithParentAndChild).not.toEqual({});
            expect(resultWithParentAndChild.meshes.length).toBe(2);
            expect(resultWithParentAndChild.transformNodes.length).toBe(1);
            expect(resultWithParentAndChild.meshes[0].name).toBe("parent");
            expect(resultWithParentAndChild.meshes[1].name).toBe("child");
            expect(resultWithParentAndChild.meshes[1].parentId).toBe(resultWithParentAndChild.meshes[0].uniqueId);
            expect(resultWithParentAndChild.transformNodes[0].name).toBe("grandparent");
            expect(resultWithParentAndChild.meshes[0].parentId).toBe(resultWithParentAndChild.transformNodes[0].uniqueId);

            const resultWithoutParent = SceneSerializer.SerializeMesh(parent, false, true);
            expect(resultWithoutParent).not.toEqual({});
            expect(resultWithoutParent.meshes.length).toBe(2);
            expect(resultWithoutParent.transformNodes.length).toBe(0);
            expect(resultWithoutParent.meshes[1].parentId).toBe(resultWithoutParent.meshes[0].uniqueId);

            const resultWithoutChild = SceneSerializer.SerializeMesh(parent, true, false);
            expect(resultWithoutChild).not.toEqual({});
            expect(resultWithoutChild.meshes.length).toBe(1);
            expect(resultWithoutChild.transformNodes.length).toBe(1);
            expect(resultWithoutChild.meshes[0].name).toBe("parent");
            expect(resultWithoutChild.transformNodes[0].name).toBe("grandparent");
            expect(resultWithoutChild.meshes[0].parentId).toBe(resultWithoutChild.transformNodes[0].uniqueId);

            const resultWithoutParentAndChild = SceneSerializer.SerializeMesh(parent, false, false);
            expect(resultWithoutParentAndChild).not.toEqual({});
            expect(resultWithoutParentAndChild.meshes.length).toBe(1);
            expect(resultWithoutParentAndChild.transformNodes.length).toBe(0);
        });

        it("should serialize a mesh with custom vertex buffers", async () => {
            const mesh = MeshBuilder.CreateGround("ground", { subdivisions: 0 });

            const nVerts = 4;
            const customVertexData = new Float32Array(nVerts * 3);
            for (let i = 0; i < nVerts; i++) {
                customVertexData[i * 3] = i;
                customVertexData[i * 3 + 1] = i;
                customVertexData[i * 3 + 2] = i;
            }
            mesh.setVerticesData("custom", customVertexData, false, 3);

            const serialized = SceneSerializer.SerializeMesh(mesh);

            expect(serialized).not.toEqual({});
            expect(serialized.geometries.vertexData.length).toBe(1);
            const vertexData = serialized.geometries.vertexData[0];
            expect(vertexData.customData).toBeDefined();
            expect(Object.keys(vertexData.customData).length).toBe(1);

            const result = await SceneLoader.ImportMeshAsync("", "data:" + JSON.stringify(serialized), "", scene);
            expect(result.meshes.length).toBe(1);
            const importedMesh = result.meshes[0];
            expect(importedMesh.getVerticesData("custom")).toEqual([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
        });
    });
});
