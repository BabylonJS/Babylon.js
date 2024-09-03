/* eslint-disable @typescript-eslint/naming-convention */

import { GLTFLoaderExtensionRegistry } from "../glTFLoaderExtensionRegistry";

/**
 * Registers the built-in glTF 2.0 extension async factories, which dynamically imports and loads each glTF extension on demand (e.g. only when a glTF model uses the extension).
 */
export function registerBuiltInGLTFExtensions() {
    GLTFLoaderExtensionRegistry.Register("KHR_materials_pbrSpecularGlossiness", true, async (loader) => {
        const { KHR_materials_pbrSpecularGlossiness } = await import("./KHR_materials_pbrSpecularGlossiness");
        return new KHR_materials_pbrSpecularGlossiness(loader);
    });
}
