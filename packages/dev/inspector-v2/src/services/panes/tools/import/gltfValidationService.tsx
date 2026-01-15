import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import { Observable } from "core/Misc/observable";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import type { IGLTFValidationResults } from "babylonjs-gltf2interface";
import type { Nullable } from "core/types";
import { GLTFValidationTool } from "../../../../components/tools/import/gltfValidationTool";
import type { IToolsService } from "../../toolsService";
import { ToolsServiceIdentity } from "../../toolsService";
import { useObservableState } from "../../../../hooks/observableHooks";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

/**
 * The most recent validation results, if any.
 */
let ValidationResults: Nullable<IGLTFValidationResults> = null;

/**
 * Observable event fired when new validation results are available.
 */
let OnValidationResultsReadyObservable: Nullable<Observable<void>> = null;

// TODO: To capture validation results from glTFs loaded before the inspector is opened,
// something like this needs to be executed even earlier, e.g., in the sandbox initialization code itself.
function AttachGLTFValidatorObserver() {
    if (OnValidationResultsReadyObservable) {
        return; // Already attached
    }

    OnValidationResultsReadyObservable = new Observable<void>();

    SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
        if (plugin.name === "gltf") {
            const loader = plugin as GLTFFileLoader;
            loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
                ValidationResults = results;
                OnValidationResultsReadyObservable!.notifyObservers();
            });
            loader.validate = true;
        }
    });
}

/**
 * glTF Validator service that displays validation results
 * of the latest glTF loaded in the tools pane.
 */
export const GLTFValidationServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "glTF Validation",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        AttachGLTFValidatorObserver();

        const sectionRegistration = toolsService.addSectionContent({
            key: "GLTFValidation",
            section: "GLTF Validation",
            order: 60,
            component: () => {
                const validationState = useObservableState(() => ValidationResults, OnValidationResultsReadyObservable);

                if (!validationState) {
                    return <MessageBar intent="info" title="" message="Reload the file to see validation results" />;
                }

                return <GLTFValidationTool validationResults={validationState} />;
            },
        });

        return {
            dispose: () => sectionRegistration.dispose(),
        };
    },
};
