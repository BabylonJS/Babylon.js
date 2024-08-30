import { GLTFLoaderExtensionRegistry } from "../glTFLoaderExtensionRegistry";

// eslint-disable-next-line @typescript-eslint/naming-convention
export function registerKHR_materials_pbrSpecularGlossiness() {
    GLTFLoaderExtensionRegistry.Register("KHR_materials_pbrSpecularGlossiness", true, async (loader) => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { KHR_materials_pbrSpecularGlossiness } = await import("./KHR_materials_pbrSpecularGlossiness.extension");
        return new KHR_materials_pbrSpecularGlossiness(loader);
    });
}
