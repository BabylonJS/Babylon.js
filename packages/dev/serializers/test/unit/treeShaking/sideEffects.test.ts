import { describe, expect, it } from "vitest";

import { GLTFExporter } from "serializers/glTF/2.0/glTFExporter";

/**
 * Reads the private registry of exporter extension names. The serializers
 * package does not expose a public getter, so the test inspects the internal
 * list directly to assert registration side effects.
 * @returns The list of currently registered exporter extension names.
 */
function getRegisteredExtensionNames(): string[] {
    return (GLTFExporter as unknown as { _ExtensionNames: string[] })._ExtensionNames;
}

/**
 * Tree-shaking guard for the serializers package.
 *
 * Validates the two halves of the side-effect split introduced by the
 * pure-architecture migration:
 *  - Back-compat: importing the side-effect wrapper still auto-registers the
 *    glTF exporter extension (legacy full-package side-effect import).
 *  - Purity: importing the `.pure` implementation performs no registration, so
 *    unused extensions can be tree-shaken; the registration only happens when
 *    the explicit `Register*` opt-in is called.
 */
describe("serializers tree-shaking side effects", () => {
    it("does not register the extension when importing the pure module (opt-in only)", async () => {
        expect(getRegisteredExtensionNames()).not.toContain("EXT_lights_area");

        const pure = await import("serializers/glTF/2.0/Extensions/EXT_lights_area.pure");
        expect(getRegisteredExtensionNames()).not.toContain("EXT_lights_area");

        pure.RegisterEXT_lights_area();
        expect(getRegisteredExtensionNames()).toContain("EXT_lights_area");
    });

    it("auto-registers the extension when importing the side-effect wrapper (back-compat)", async () => {
        expect(getRegisteredExtensionNames()).not.toContain("KHR_lights_punctual");

        await import("serializers/glTF/2.0/Extensions/KHR_lights_punctual");
        expect(getRegisteredExtensionNames()).toContain("KHR_lights_punctual");
    });
});
