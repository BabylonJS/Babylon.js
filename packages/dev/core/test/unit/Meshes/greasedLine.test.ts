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

            // Create the first line with materialType SIMPLE (2)
            const line1 = CreateGreasedLine("line1", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);

            // The shared EmptyColorsTexture should exist after creation
            expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();

            // Dispose the line and its material
            line1.dispose(false, true);

            // The shared EmptyColorsTexture's internal texture should NOT have been disposed.
            // Before the fix, _colorsTexture.dispose() was called on the shared texture,
            // which set its _texture to null, making it a zombie texture.
            const sharedTex = GreasedLineMaterialDefaults.EmptyColorsTexture!;
            expect(sharedTex.getInternalTexture()).toBeTruthy();

            // Create a second line - this should work correctly
            const line2 = CreateGreasedLine("line2", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            expect(line2).toBeTruthy();
            expect(line2.material).toBeTruthy();

            // The material's colors texture should have a valid internal texture
            const simpleMat = line2.material as GreasedLineSimpleMaterial;
            expect(simpleMat.colorsTexture).toBeTruthy();
            expect(simpleMat.colorsTexture!.getInternalTexture()).toBeTruthy();

            // Clean up
            line2.dispose(false, true);
        });

        it("should allow creating multiple SIMPLE lines after dispose cycles with valid textures", () => {
            const points = [-1, 0, 0, 1, 0, 0];

            for (let i = 0; i < 3; i++) {
                const line = CreateGreasedLine(`line${i}`, { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
                expect(line).toBeTruthy();
                expect(line.material).toBeTruthy();
                line.dispose(false, true);

                // Shared texture should remain valid after each dispose
                expect(GreasedLineMaterialDefaults.EmptyColorsTexture).toBeTruthy();
                expect(GreasedLineMaterialDefaults.EmptyColorsTexture!.getInternalTexture()).toBeTruthy();
            }

            // Final line should still work with a valid texture
            const finalLine = CreateGreasedLine("finalLine", { points }, { materialType: GreasedLineMeshMaterialType.MATERIAL_TYPE_SIMPLE }, scene);
            expect(finalLine).toBeTruthy();
            expect(finalLine.material).toBeTruthy();
            const simpleMat = finalLine.material as GreasedLineSimpleMaterial;
            expect(simpleMat.colorsTexture).toBeTruthy();
            expect(simpleMat.colorsTexture!.getInternalTexture()).toBeTruthy();
            finalLine.dispose(false, true);
        });
    });
});
