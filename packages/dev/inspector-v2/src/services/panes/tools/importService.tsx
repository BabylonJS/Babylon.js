import type { ServiceDefinition } from "../../../modularity/serviceDefinition";
import { ToolsServiceIdentity } from "../toolsService";
import type { IToolsService } from "../toolsService";
import { GLTFAnimationImport } from "../../../components/tools/import/gltfAnimationImport";
import { GLTFLoaderOptions } from "../../../components/tools/import/gltfLoaderOptions";
import { GLTFLoaderServiceIdentity } from "./gltfLoaderService";
import type { IGLTFLoaderService } from "./gltfLoaderService";
import { GLTFValidationTools } from "../../../components/tools/import/gltfValidator";

export const GLTFAnimationImportServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "Animation Import Tool",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const contentRegistration = toolsService.addSectionContent({
            key: "AnimationImport",
            section: "Animation Import",
            component: ({ context }) => <GLTFAnimationImport scene={context} />,
        });

        return {
            dispose: () => {
                contentRegistration.dispose();
            },
        };
    },
};

export const GLTFToolsServiceDefinition: ServiceDefinition<[], [IToolsService, IGLTFLoaderService]> = {
    friendlyName: "GLTF Tools",
    consumes: [ToolsServiceIdentity, GLTFLoaderServiceIdentity],
    factory: (toolsService, gltfLoaderService) => {
        const loaderToolsRegistration = toolsService.addSectionContent({
            key: "GLTFLoader",
            section: "GLTF Loader",
            component: () => <GLTFLoaderOptions gltfLoaderService={gltfLoaderService} />,
        });

        const validationToolsRegistration = toolsService.addSectionContent({
            key: "GLTFValidation",
            section: "GLTF Validation",
            component: () => <GLTFValidationTools gltfLoaderService={gltfLoaderService} />,
        });

        return {
            dispose: () => {
                loaderToolsRegistration.dispose();
                validationToolsRegistration.dispose();
            },
        };
    },
};

export default {
    serviceDefinitions: [GLTFAnimationImportServiceDefinition, GLTFToolsServiceDefinition],
} as const;
