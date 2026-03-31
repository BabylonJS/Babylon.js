import { type ISceneLoaderPlugin, type ISceneLoaderPluginAsync, SceneLoader } from "core/Loading/sceneLoader";
import { type GLTFFileLoader, type IGLTFLoaderExtension } from "loaders/glTF/glTFFileLoader";
import { type ServiceDefinition } from "../../../../modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../../toolsService";

import { registeredGLTFExtensions } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { GLTFExtensionOptionsTool, GLTFLoaderOptionsTool } from "../../../../components/tools/import/gltfLoaderOptionsTool";
import { ExtensionOptionDefaults, LoaderOptionDefaults, type GLTFExtensionOptionsType, type GLTFLoaderOptionsType } from "./gltfLoaderOptionsDefaults";

export const GLTFLoaderServiceIdentity = Symbol("GLTFLoaderService");

export const GLTFLoaderOptionsServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "GLTF Loader Options",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        // Current loader options with nullable properties (null means "don't override the options coming in with load calls")
        const currentLoaderOptions: GLTFLoaderOptionsType = Object.fromEntries(Object.keys(LoaderOptionDefaults).map((key) => [key, null])) as GLTFLoaderOptionsType;

        // Build extension options dynamically from the registered extensions.
        // Every extension gets an 'enabled' toggle; extensions in ExtensionOptionDefaults also get their extra properties.
        const currentExtensionOptions: GLTFExtensionOptionsType = {};
        for (const extName of registeredGLTFExtensions.keys()) {
            const defaults = (ExtensionOptionDefaults as Record<string, Record<string, unknown>>)[extName];
            const extraNulls = defaults ? Object.fromEntries(Object.keys(defaults).map((key) => [key, null])) : {};
            currentExtensionOptions[extName] = { enabled: null, ...extraNulls };
        }

        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Apply loader settings (filter out null values to not override options coming in with load calls)
                const nonNullLoaderOptions = Object.fromEntries(Object.entries(currentLoaderOptions).filter(([_, v]) => v !== null));
                Object.assign(loader, nonNullLoaderOptions);

                // Subscribe to extension loading
                loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
                    const extensionOptions = currentExtensionOptions[extension.name];
                    if (extensionOptions) {
                        // Apply extension settings (filter out null values to not override options coming in with load calls)
                        const nonNullExtOptions = Object.fromEntries(Object.entries(extensionOptions).filter(([_, v]) => v !== null));
                        Object.assign(extension, nonNullExtOptions);
                    }
                });
            }
        });

        const loaderToolsRegistration = toolsService.addSectionContent({
            key: "GLTFLoaderOptions",
            section: "GLTF Loader",
            order: 50,
            component: () => {
                return (
                    <>
                        <MessageBar intent="info" message="Reload the file for changes to take effect" />
                        <GLTFLoaderOptionsTool loaderOptions={currentLoaderOptions} />
                        <GLTFExtensionOptionsTool extensionOptions={currentExtensionOptions} />
                    </>
                );
            },
        });

        return {
            dispose: () => {
                pluginObserver.remove();
                loaderToolsRegistration.dispose();
            },
        };
    },
};
