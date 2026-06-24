import { describe, expect, it } from "vitest";

import { registeredGLTFExtensions } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";

/**
 * Tree-shaking guard for the loaders package.
 *
 * Validates the two halves of the side-effect split introduced by the
 * pure-architecture migration:
 *  - Back-compat: importing the side-effect wrapper still auto-registers the
 *    glTF extension (legacy full-package side-effect import).
 *  - Purity: importing the `.pure` implementation performs no registration, so
 *    unused extensions can be tree-shaken; the registration only happens when
 *    the explicit `Register*` opt-in is called.
 */
describe("loaders tree-shaking side effects", () => {
    it("does not register the extension when importing the pure module (opt-in only)", async () => {
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(false);

        const pure = await import("loaders/glTF/2.0/Extensions/KHR_materials_unlit.pure");
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(false);

        pure.RegisterKHR_materials_unlit();
        expect(registeredGLTFExtensions.has("KHR_materials_unlit")).toBe(true);
    });

    it("auto-registers the extension when importing the side-effect wrapper (back-compat)", async () => {
        expect(registeredGLTFExtensions.has("KHR_draco_mesh_compression")).toBe(false);

        await import("loaders/glTF/2.0/Extensions/KHR_draco_mesh_compression");
        expect(registeredGLTFExtensions.has("KHR_draco_mesh_compression")).toBe(true);
    });
});
