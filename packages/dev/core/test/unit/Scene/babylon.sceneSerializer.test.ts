import { ActionManager, IncrementValueAction } from "core/Actions";
import { FreeCamera } from "core/Cameras";
import type { Engine } from "core/Engines";
import { NullEngine } from "core/Engines";
import { HemisphericLight } from "core/Lights";
import { Vector2, Vector3 } from "core/Maths";
import { TransformNode } from "core/Meshes";
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

            expect(result).toBeTruthy();
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

            expect(result).toBeTruthy();

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
    });

    describe("#meshSerialize", () => {
        it("should serialize a single mesh", () => {
            const mesh = MeshBuilder.CreateGround("ground1", { width: 6, height: 6, subdivisions: 2 }, scene);

            const result = SceneSerializer.SerializeMesh(mesh);
            expect(result).toBeTruthy();
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
            expect(resultWithParentAndChild).toBeTruthy();
            expect(resultWithParentAndChild.meshes.length).toBe(2);
            expect(resultWithParentAndChild.transformNodes.length).toBe(1);
            expect(resultWithParentAndChild.meshes[0].name).toBe("parent");
            expect(resultWithParentAndChild.meshes[1].name).toBe("child");
            expect(resultWithParentAndChild.meshes[1].parentId).toBe(resultWithParentAndChild.meshes[0].uniqueId);
            expect(resultWithParentAndChild.transformNodes[0].name).toBe("grandparent");
            expect(resultWithParentAndChild.meshes[0].parentId).toBe(resultWithParentAndChild.transformNodes[0].uniqueId);

            const resultWithoutParent = SceneSerializer.SerializeMesh(parent, false, true);
            console.log(resultWithoutParent);
            expect(resultWithoutParent).toBeTruthy();
            expect(resultWithoutParent.meshes.length).toBe(2);
            expect(resultWithoutParent.transformNodes.length).toBe(0);
            expect(resultWithoutParent.meshes[1].parentId).toBe(resultWithoutParent.meshes[0].uniqueId);

            const resultWithoutChild = SceneSerializer.SerializeMesh(parent, true, false);
            expect(resultWithoutChild).toBeTruthy();
            expect(resultWithoutChild.meshes.length).toBe(1);
            expect(resultWithoutChild.transformNodes.length).toBe(1);
            expect(resultWithoutChild.meshes[0].name).toBe("parent");
            expect(resultWithoutChild.transformNodes[0].name).toBe("grandparent");
            expect(resultWithoutChild.meshes[0].parentId).toBe(resultWithoutChild.transformNodes[0].uniqueId);

            const resultWithoutParentAndChild = SceneSerializer.SerializeMesh(parent, false, false);
            expect(resultWithoutParentAndChild).toBeTruthy();
            expect(resultWithoutParentAndChild.meshes.length).toBe(1);
            expect(resultWithoutParentAndChild.transformNodes.length).toBe(0);
        });
    });
});
