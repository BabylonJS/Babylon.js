import type { IService, ServiceDefinition } from "../../../../modularity/serviceDefinition";
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
import { useCallback } from "react";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

const GLTFValidatorServiceIdentity = Symbol("GLTFValidatorService");

/**
 * glTF Validator service that validates glTFs loaded into the scene,
 * capturing the most recent validation results.
 *
 * Note: This service has no dependencies and will instantiate early in the service
 * initialization order, ensuring it captures validation results even from the initial
 * scene load (before the tools pane is opened).
 */
export interface IGLTFValidatorService extends IService<typeof GLTFValidatorServiceIdentity> {
    /**
     * The most recent validation results, if any.
     */
    validationResults: Nullable<IGLTFValidationResults>;
    /**
     * Observable event fired when new validation results are available.
     */
    onValidatedObservable: Observable<Nullable<IGLTFValidationResults>>;
}

export const GLTFValidatorServiceDefinition: ServiceDefinition<[IGLTFValidatorService], []> = {
    friendlyName: "glTF Validator",
    produces: [GLTFValidatorServiceIdentity],
    factory: () => {
        const onValidatedObservable = new Observable<Nullable<IGLTFValidationResults>>();
        let validationResults: Nullable<IGLTFValidationResults> = null;

        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Subscribe to loader's own validation event
                loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
                    validationResults = results;
                    onValidatedObservable.notifyObservers(results);
                });

                // Ensure validation is always enabled
                loader.validate = true;
            }
        });

        return {
            get validationResults() {
                return validationResults;
            },
            onValidatedObservable,
            dispose: () => {
                pluginObserver.remove();
                onValidatedObservable.clear();
            },
        };
    },
};

export const GLTFValidationResultsServiceDefinition: ServiceDefinition<[], [IGLTFValidatorService, IToolsService]> = {
    friendlyName: "glTF Validation Results",
    consumes: [GLTFValidatorServiceIdentity, ToolsServiceIdentity],
    factory: (gltfValidatorService, toolsService) => {
        const sectionRegistration = toolsService.addSectionContent({
            key: "GLTFValidation",
            section: "GLTF Validation",
            order: 60,
            component: () => {
                const validationState = useObservableState(
                    useCallback(() => gltfValidatorService.validationResults, []),
                    gltfValidatorService.onValidatedObservable
                );

                if (!validationState) {
                    return <MessageBar intent="info" title="" message="Reload the file to see validation results" />;
                }

                return <GLTFValidationTools validationResults={validationState} />;
            },
        });

        return {
            dispose: () => {
                sectionRegistration.dispose();
            },
        };
    },
};
