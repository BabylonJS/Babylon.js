import { GLTFLoaderOptionsServiceDefinition } from "./gltfLoaderOptionsService";
import { GLTFValidationServiceDefinition } from "./gltfValidationService";
import { GLTFAnimationImportServiceDefinition } from "./gltfAnimationService";

export default {
    serviceDefinitions: [GLTFAnimationImportServiceDefinition, GLTFLoaderOptionsServiceDefinition, GLTFValidationServiceDefinition],
} as const;
