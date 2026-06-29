import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for the tree-shaken build issue where
 * `SerializationHelper._ImageProcessingConfigurationParser` stayed unregistered,
 * causing `clone()`/`Parse()` to throw for any material that serializes an
 * image processing configuration.
 *
 * Each material that mixes in image processing must register the parser from its
 * own `Register*()` function so that importing only that material (without the
 * `imageProcessingConfiguration` side-effect wrapper) still produces a working
 * `clone()`.
 */
describe("Image processing serialization side effect", () => {
    // Reset the module registry before each case so every material is validated
    // against a freshly imported, unregistered SerializationHelper.
    beforeEach(() => {
        vi.resetModules();
    });

    it.each([
        ["StandardMaterial", "core/Materials/standardMaterial.pure", "RegisterStandardMaterial"],
        ["BackgroundMaterial", "core/Materials/Background/backgroundMaterial.pure", "RegisterBackgroundMaterial"],
        ["NodeMaterial", "core/Materials/Node/nodeMaterial.pure", "RegisterNodeMaterial"],
        ["OpenPBRMaterial", "core/Materials/PBR/openpbrMaterial.pure", "RegisterOpenpbrMaterial"],
        ["PBRMaterial", "core/Materials/PBR/pbrMaterial.pure", "RegisterPbrMaterial"],
        ["PBRMetallicRoughnessMaterial", "core/Materials/PBR/pbrMetallicRoughnessMaterial.pure", "RegisterPbrMetallicRoughnessMaterial"],
        ["PBRSpecularGlossinessMaterial", "core/Materials/PBR/pbrSpecularGlossinessMaterial.pure", "RegisterPbrSpecularGlossinessMaterial"],
    ])(
        "registers the image processing parser when %s is registered",
        async (_materialName, pureModulePath, registerName) => {
            const { SerializationHelper } = await import("core/Misc/decorators.serialization");
            const unregisteredParser = SerializationHelper._ImageProcessingConfigurationParser;

            // The unregistered parser is a throwing stub.
            expect(() => unregisteredParser({})).toThrow();

            // Importing the pure module must not have any side effects.
            const materialModule = (await import(/* @vite-ignore */ pureModulePath)) as Record<string, () => void>;
            expect(SerializationHelper._ImageProcessingConfigurationParser).toBe(unregisteredParser);

            // Running the material's registration must wire up the parser.
            materialModule[registerName]();
            expect(SerializationHelper._ImageProcessingConfigurationParser).not.toBe(unregisteredParser);
            expect(() => SerializationHelper._ImageProcessingConfigurationParser({})).not.toThrow();
        },
        30000
    );
});
