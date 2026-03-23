import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { AssetContainer } from "core/assetContainer";
import { NullEngine } from "core/Engines/nullEngine";
import { LoadAssetContainerFromSerializedScene } from "core/Loading/Plugins/babylonFileLoader";

/**
 * Describes the test suite.
 */
describe("Babylon AssetContainer", () => {
    console.log("Babylon AssetContainer Tests");
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
    });

    it("dispose", () => {
        // Arrange
        const assetCount = 4;
        const assetContainer = new AssetContainer(scene);
        for (let i = 0; i < assetCount; i++) {
            assetContainer.transformNodes.push(new TransformNode(`transformNode${i}`, scene));
            assetContainer.transformNodes[i]._parentContainer = assetContainer;
            assetContainer.meshes.push(new Mesh(`mesh${i}`, scene));
            assetContainer.meshes[i]._parentContainer = assetContainer;
            assetContainer.meshes[i].parent = assetContainer.transformNodes[i];
            assetContainer.materials.push(new PBRMaterial(`material${i}`, scene));
            assetContainer.materials[i]._parentContainer = assetContainer;
        }

        // Act
        assetContainer.dispose();

        // Assert
        expect(scene.transformNodes.length).toBe(0);
        expect(scene.meshes.length).toBe(0);
        expect(scene.materials.length).toBe(0);
    });

    it("LoadAssetContainerFromSerializedScene preserves parent-child and material linking", () => {
        // Minimal serialized .babylon scene: a mesh parented to a transform node, with a material
        const serializedScene = {
            meshes: [
                {
                    name: "childMesh",
                    id: "childMesh",
                    uniqueId: 1,
                    parentId: "parentNode",
                    materialId: "testMat",
                    type: 0,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scaling: [1, 1, 1],
                    isEnabled: true,
                    isVisible: true,
                    infiniteDistance: false,
                    pickable: true,
                    receiveShadows: false,
                    billboardMode: 0,
                    visibility: 1,
                    checkCollisions: false,
                    isBlocker: false,
                },
            ],
            transformNodes: [
                {
                    name: "parentNode",
                    id: "parentNode",
                    uniqueId: 2,
                    position: [0, 1, 0],
                    rotation: [0, 0, 0],
                    scaling: [1, 1, 1],
                },
            ],
            materials: [
                {
                    name: "testMat",
                    id: "testMat",
                    uniqueId: 3,
                    customType: "BABYLON.StandardMaterial",
                },
            ],
            lights: [],
            cameras: [],
        };

        const container = LoadAssetContainerFromSerializedScene(scene, serializedScene, "");

        expect(container.meshes.length).toBe(1);
        expect(container.transformNodes.length).toBe(1);
        expect(container.materials.length).toBe(1);

        const mesh = container.meshes[0];
        const parentNode = container.transformNodes[0];

        expect(mesh.parent).toBe(parentNode);
        expect(mesh.material).not.toBeNull();
        expect(mesh.material!.name).toBe("testMat");

        expect(scene.meshes.length).toBe(0);
        expect(scene.transformNodes.length).toBe(0);
    });

    it("LoadAssetContainerFromSerializedScene does not fire scene observables", () => {
        let meshObservableFired = false;
        let transformNodeObservableFired = false;
        scene.onNewMeshAddedObservable.add(() => {
            meshObservableFired = true;
        });
        scene.onNewTransformNodeAddedObservable.add(() => {
            transformNodeObservableFired = true;
        });

        const serializedScene = {
            meshes: [
                {
                    name: "testMesh",
                    id: "testMesh",
                    uniqueId: 1,
                    type: 0,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scaling: [1, 1, 1],
                    isEnabled: true,
                    isVisible: true,
                    infiniteDistance: false,
                    pickable: true,
                    receiveShadows: false,
                    billboardMode: 0,
                    visibility: 1,
                    checkCollisions: false,
                    isBlocker: false,
                },
            ],
            transformNodes: [
                {
                    name: "testNode",
                    id: "testNode",
                    uniqueId: 2,
                    position: [0, 0, 0],
                    rotation: [0, 0, 0],
                    scaling: [1, 1, 1],
                },
            ],
            materials: [],
            lights: [],
            cameras: [],
        };

        LoadAssetContainerFromSerializedScene(scene, serializedScene, "");

        expect(meshObservableFired).toBe(false);
        expect(transformNodeObservableFired).toBe(false);
    });
});
