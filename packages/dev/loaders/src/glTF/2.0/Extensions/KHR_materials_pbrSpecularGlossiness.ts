import { GLTFLoaderExtensionRegistry } from "../glTFLoaderExtensionRegistry";
import { KHR_materials_pbrSpecularGlossiness } from "./KHR_materials_pbrSpecularGlossiness.extension";
export * from "./KHR_materials_pbrSpecularGlossiness.extension";

GLTFLoaderExtensionRegistry.Register("KHR_materials_pbrSpecularGlossiness", true, (loader) => new KHR_materials_pbrSpecularGlossiness(loader));
