import { GLTFLoaderOptionsServiceDefinition } from "./gltfLoaderOptionsService";
import { GLTFValidationResultsServiceDefinition } from "./gltfValidatorService";
import { GLTFAnimationImportServiceDefinition } from "./gltfAnimationService";

export default {
    serviceDefinitions: [GLTFAnimationImportServiceDefinition, GLTFLoaderOptionsServiceDefinition, GLTFValidationResultsServiceDefinition],
} as const;
