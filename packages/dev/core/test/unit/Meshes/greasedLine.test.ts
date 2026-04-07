import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { CreateGreasedLine } from "core/Meshes";
import { GreasedLineMeshMaterialType } from "core/Materials/GreasedLine/greasedLineMaterialInterfaces";
import { GreasedLineMaterialDefaults } from "core/Materials/GreasedLine/greasedLineMaterialDefaults";
import type { GreasedLineSimpleMaterial } from "core/Materials/GreasedLine/greasedLineSimpleMaterial";

describe("GreasedLine", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        // Reset shared state
        GreasedLineMaterialDefaults.EmptyColorsTexture = null;
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("dispose and recreate with MATERIAL_TYPE_SIMPLE", () => {
        it("should not dispose the shared EmptyColorsTexture when a simple material is disposed", () => {
            const points = [-1, 0, 0, 1, 0, 0];

            const line1 = CreateGreasedLine("line1", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();

            line1.dispose(false, true);

            // The shared texture must survive individual material dispose
            const sharedTex = GreasedLineMaterialDefaults.EmptyColorsTexture!;
            expect(sharedTex.getInternalTexture()).toBeTruthy();

            // A second line should work correctly
            const line2 = CreateGreasedLine("line2", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            const simpleMat = line2.material as GreasedLineSimpleMaterial;
            expect(simpleMat.colorsTexture).toBeTruthy();
            expect(simpleMat.colorsTexture!.getInternalTexture()).toBeTruthy();

            line2.dispose(false, true);
        });

        it("should allow creating multiple SIMPLE lines after dispose cycles with valid textures", () => {
            const points = [-1, 0, 0, 1, 0, 0];

            for (let i = 0; i < 3; i++) {
                const line = CreateGreasedLine(`line${i}`, { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
                expect(line).toBeTruthy();
                expect(line.material).toBeTruthy();
                line.dispose(false, true);

                expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();
                expect(GreasedLineMaterialDefaults.EmptyColorsTexture!.getInternalTexture()).toBeTruthy();
            }

            const finalLine = CreateGreasedLine("finalLine", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            const simpleMat = finalLine.material as GreasedLineSimpleMaterial;
            expect(simpleMat.colorsTexture).toBeTruthy();
            expect(simpleMat.colorsTexture!.getInternalTexture()).toBeTruthy();
            finalLine.dispose(false, true);
        });

        it("should clear the shared EmptyColorsTexture when the scene is disposed and recreate it for a new scene", () => {
            const points = [-1, 0, 0, 1, 0, 0];

            const line1 = CreateGreasedLine("line1", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();
            line1.dispose(false, true);

            // Dispose the scene — the shared texture's onDisposeObservable should null the static
            scene.dispose();
            expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeNull();

            // Create a new scene and a new line — should get a fresh shared texture
            scene = new Scene(engine);
            const line2 = CreateGreasedLine("line2", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();
            const simpleMat = line2.material as GreasedLineSimpleMaterial;
            expect(simpleMat.colorsTexture).toBeTruthy();
            expect(simpleMat.colorsTexture!.getInternalTexture()).toBeTruthy();

            line2.dispose(false, true);
        });
    });
});
