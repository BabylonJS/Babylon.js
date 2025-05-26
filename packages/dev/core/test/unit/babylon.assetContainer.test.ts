import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { AssetContainer } from "core/assetContainer";
import { NullEngine } from "core/Engines/nullEngine";

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
});
