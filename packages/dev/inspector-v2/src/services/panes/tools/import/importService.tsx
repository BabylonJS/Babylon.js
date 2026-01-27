import { GLTFLoaderOptionsServiceDefinition } from "./gltfLoaderOptionsService";
import { GLTFValidationServiceDefinition } from "./gltfValidationService";
import { GLTFAnimationImportServiceDefinition } from "./gltfAnimationImportService";

export default {
    serviceDefinitions: [GLTFAnimationImportServiceDefinition, GLTFLoaderOptionsServiceDefinition, GLTFValidationServiceDefinition],
} as const;
