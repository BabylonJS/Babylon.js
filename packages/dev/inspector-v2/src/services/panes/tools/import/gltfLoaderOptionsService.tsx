import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import type { GLTFFileLoader, IGLTFLoaderExtension } from "loaders/glTF/glTFFileLoader";
import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IToolsService } from "../../toolsService";

import { SceneLoader } from "core/Loading/sceneLoader";
import { GLTFLoaderDefaultOptions } from "loaders/glTF/glTFFileLoader";
import { registeredGLTFExtensions } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { GLTFExtensionOptionsTool, GLTFLoaderOptionsTool } from "../../../../components/tools/import/gltfLoaderOptionsTool";
import { ToolsServiceIdentity } from "../../toolsService";

export const GLTFLoaderServiceIdentity = Symbol("GLTFLoaderService");

/**
 * Helper type to make all properties of T nullable.
 */
type NullableProperties<T> = { [K in keyof T]: T[K] | null };

// Options exposed in Inspector includes all the properties from the default loader options (GLTFLoaderDefaultOptions)
// plus some options that only exist directly on the GLTFFileLoader class itself.
// These are the non-null defaults, used as defaultValue for the nullable property lines.
export const LoaderOptionDefaults = Object.assign(
    {
        capturePerformanceCounters: false,
        loggingEnabled: false,
    } satisfies Pick<GLTFFileLoader, "capturePerformanceCounters" | "loggingEnabled">,
    GLTFLoaderDefaultOptions
);

// Current loader options with nullable properties (null means "don't override the options coming in with load calls")
const CurrentLoaderOptions: NullableProperties<typeof LoaderOptionDefaults> = Object.fromEntries(Object.keys(LoaderOptionDefaults).map((key) => [key, null])) as NullableProperties<
    typeof LoaderOptionDefaults
>;

export type GLTFLoaderOptionsType = typeof CurrentLoaderOptions;

// Non-null defaults for extension options that have properties beyond just 'enabled'.
export const ExtensionOptionDefaults = {
    /* eslint-disable @typescript-eslint/naming-convention */
    MSFT_lod: { maxLODsToLoad: 10 },
} satisfies Partial<SceneLoaderPluginOptions["gltf"]["extensionOptions"]>;

export type GLTFExtensionOptionsType = Record<string, { enabled: boolean | null; [key: string]: unknown }>;

export const GLTFLoaderOptionsServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "GLTF Loader Options",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        // Build extension options dynamically from the registered extensions.
        // Every extension gets an 'enabled' toggle; extensions in ExtensionOptionDefaults also get their extra properties.
        const CurrentExtensionOptions: GLTFExtensionOptionsType = {};
        for (const extName of registeredGLTFExtensions.keys()) {
            const defaults = (ExtensionOptionDefaults as Record<string, Record<string, unknown>>)[extName];
            const extraNulls = defaults ? Object.fromEntries(Object.keys(defaults).map((key) => [key, null])) : {};
            CurrentExtensionOptions[extName] = { enabled: null, ...extraNulls };
        }

        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Apply loader settings (filter out null values to not override options coming in with load calls)
                const nonNullLoaderOptions = Object.fromEntries(Object.entries(CurrentLoaderOptions).filter(([_, v]) => v !== null));
                Object.assign(loader, nonNullLoaderOptions);

                // Subscribe to extension loading
                loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
                    const extensionOptions = CurrentExtensionOptions[extension.name];
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
                        <GLTFLoaderOptionsTool loaderOptions={CurrentLoaderOptions} />
                        <GLTFExtensionOptionsTool extensionOptions={CurrentExtensionOptions} />
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
