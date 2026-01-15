import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "core/Loading/sceneLoader";
import type { GLTFFileLoader } from "loaders/glTF/glTFFileLoader";
import type { IGLTFValidationResults } from "babylonjs-gltf2interface";
import type { Nullable } from "core/types";
import { GLTFValidationTools } from "../../../../components/tools/import/gltfValidator";
import type { IToolsService } from "../../toolsService";
import { ToolsServiceIdentity } from "../../toolsService";
import { useObservableState } from "../../../../hooks/observableHooks";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

/**
 * NOTE: We keep this state separate from the service because
 * 1. When the inspector is hidden, the service is destroyed
 * 1. Validation results
 * => we lose validation results when the inspector is closed, even if the scene remains the same
 * This is especially a problem in the sandbox, where when a new model is dropped in, the inspector is hidden then reopened
 *  *after* we already started loading the model, so we lose the validation results entirely.
 *
 * With this approach, the state is kept alive as long as the inspector app is open, even if the service is destroyed.
 * This doesn't solve the issue of not grabbing the validation results on the first load when the inspector is initially opened,
 * but at least subsequent loads will have the results.
 *
 * NOTE: Yes, this means that, once this file is dynamically imported, this state/memory is never cleaned up.
 * I hope that's acceptable, considering this is a debug tool anyway.
 */

/**
 * The most recent validation results, if any.
 */
let ValidationResults: Nullable<IGLTFValidationResults> = null;

/**
 * Observable event fired when new validation results are available.
 */
const OnValidationResultsReadyObservable = new Observable<void>();

let PluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>> = null;
/**
 * This exists mostly for the sandbox, where the first load of a glTF happens before the inspector/tools pane is opened,
 * and thus before the GLTFValidatorService is instantiated.
 * Thus, we need to attach to the SceneLoader plugin activation event as early as possible
 * so that, by the time the inspector IS opened, we have already captured validation results from the initial load.
 */
export function AttachGLTFValidator() {
    if (PluginActivatedObserver) {
        return; // Already attached
    }

    PluginActivatedObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
        if (plugin.name === "gltf") {
            const loader = plugin as GLTFFileLoader;

            // Subscribe to loader's own validation event
            loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
                ValidationResults = results;
                OnValidationResultsReadyObservable.notifyObservers();
            });

            // Ensure validation is always enabled
            loader.validate = true;
        }
    });
}

/**
 * glTF Validator service that validates the latest glTF loaded into the scene
 * and displays the results in the tools pane.
 */
export const GLTFValidationResultsServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "glTF Validation Results",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        // Setup validation observer (if not already done by user manually)
        AttachGLTFValidator();

        const sectionRegistration = toolsService.addSectionContent({
            key: "GLTFValidation",
            section: "GLTF Validation",
            order: 60,
            component: () => {
                const validationState = useObservableState(() => ValidationResults, OnValidationResultsReadyObservable);

                if (!validationState) {
                    return <MessageBar intent="info" title="" message="Reload the file to see validation results" />;
                }

                return <GLTFValidationTools validationResults={validationState} />;
            },
        });

        return {
            dispose: () => sectionRegistration.dispose(),
        };
    },
};
