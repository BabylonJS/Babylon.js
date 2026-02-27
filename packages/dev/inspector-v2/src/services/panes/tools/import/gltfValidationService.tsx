import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import { GLTFValidationTool } from "../../../../components/tools/import/gltfValidationTool";
import type { IToolsService } from "../../toolsService";
import { ToolsServiceIdentity } from "../../toolsService";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { GLTFValidation } from "loaders/glTF/glTFValidation";
import { useProperty } from "../../../../hooks/compoundPropertyHooks";

export const GLTFValidationServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "GLTF Validation",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;
                loader.validate = true;
            }
        });

        const sectionRegistration = toolsService.addSectionContent({
            key: "GLTFValidation",
            section: "GLTF Validation",
            order: 60,
            component: () => {
                const validationState = useProperty(GLTFValidation, "_LastResults");

                if (!validationState) {
                    return <MessageBar intent="info" message="Reload the file to see validation results" />;
                }

                return <GLTFValidationTool validationResults={validationState} />;
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
                pluginObserver.remove();
            },
        };
    },
};
