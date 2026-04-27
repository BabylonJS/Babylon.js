import { type FunctionComponent } from "react";

import { type ISceneLoaderPlugin, type ISceneLoaderPluginAsync, SceneLoader } from "core/Loading/sceneLoader";
import { registeredGLTFExtensions } from "loaders/glTF/2.0/glTFLoaderExtensionRegistry";
import { type GLTFFileLoader, type IGLTFLoaderExtension } from "loaders/glTF/glTFFileLoader";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";
import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type ISettingsStore, type SettingDescriptor, SettingsStoreIdentity } from "shared-ui-components/modularTool/services/settingsStore";
import { type IToastService, ToastServiceIdentity } from "shared-ui-components/modularTool/services/toastService";
import { GLTFExtensionOptionsTool, GLTFLoaderOptionsTool } from "../../../../components/tools/import/gltfLoaderOptionsTool";
import { type IToolsService, ToolsServiceIdentity } from "../../toolsService";
import { ExtensionOptionDefaults, type GLTFExtensionOptionsType, type GLTFLoaderOptionsType, LoaderOptionDefaults } from "./gltfLoaderOptionsDefaults";

export const GLTFLoaderServiceIdentity = Symbol("GLTFLoaderService");

const LoaderOptionsSetting: SettingDescriptor<Partial<GLTFLoaderOptionsType>> = {
    key: "glTFLoaderOptions",
    defaultValue: {},
};

const ExtensionOptionsSetting: SettingDescriptor<Partial<GLTFExtensionOptionsType>> = {
    key: "glTFExtensionOptions",
    defaultValue: {},
};

function CreatePersistingProxy<T extends object>(target: T, settingsStore: ISettingsStore, descriptor: SettingDescriptor<Partial<T>>): T {
    return new Proxy(target, {
        set(obj, prop, value) {
            const result = Reflect.set(obj, prop, value);
            settingsStore.writeSetting(descriptor, { ...obj });
            return result;
        },
    });
}

function HasNonNullValues(obj: object): boolean {
    return Object.values(obj).some((v) => v !== null);
}

const OverridesWarning: FunctionComponent<{ loaderOptions: GLTFLoaderOptionsType; extensionOptions: GLTFExtensionOptionsType }> = (props) => {
    const { loaderOptions, extensionOptions } = props;
    const [persistedLoaderOptions] = useSetting(LoaderOptionsSetting);
    const [persistedExtensionOptions] = useSetting(ExtensionOptionsSetting);

    // Check the live options objects, but depend on the persisted settings to trigger re-renders
    void persistedLoaderOptions;
    void persistedExtensionOptions;

    const hasLoaderOverrides = HasNonNullValues(loaderOptions);
    const hasExtensionOverrides = Object.values(extensionOptions).some((opts) => HasNonNullValues(opts));

    return (
        <Collapse visible={hasLoaderOverrides || hasExtensionOverrides}>
            <MessageBar intent="warning" message="Loader option overrides are enabled and will persist across refreshes until disabled or reset." />
        </Collapse>
    );
};

export const GLTFLoaderOptionsServiceDefinition: ServiceDefinition<[], [IToolsService, ISettingsStore, IToastService]> = {
    friendlyName: "GLTF Loader Options",
    consumes: [ToolsServiceIdentity, SettingsStoreIdentity, ToastServiceIdentity],
    factory: (toolsService, settingsStore, toastService) => {
        // Current loader options with nullable properties (null means "don't override the options coming in with load calls")
        let currentLoaderOptions: GLTFLoaderOptionsType = Object.fromEntries(Object.keys(LoaderOptionDefaults).map((key) => [key, null])) as GLTFLoaderOptionsType;

        // Hydrate loader options from persisted settings
        const persistedLoaderOptions = settingsStore.readSetting(LoaderOptionsSetting);
        Object.assign(currentLoaderOptions, persistedLoaderOptions);

        // Wrap in a proxy so property writes from the UI are automatically persisted
        currentLoaderOptions = CreatePersistingProxy(currentLoaderOptions, settingsStore, LoaderOptionsSetting);

        // Build extension options dynamically from the registered extensions.
        // Every extension gets an 'enabled' toggle; extensions in ExtensionOptionDefaults also get their extra properties.
        const currentExtensionOptions: GLTFExtensionOptionsType = {};
        for (const extName of registeredGLTFExtensions.keys()) {
            const defaults = (ExtensionOptionDefaults as Record<string, Record<string, unknown>>)[extName];
            const extraNulls = defaults ? Object.fromEntries(Object.keys(defaults).map((key) => [key, null])) : {};
            currentExtensionOptions[extName] = { enabled: null, ...extraNulls };
        }

        // Hydrate extension options from persisted settings, only for extensions that are still registered
        const persistedExtensionOptions = settingsStore.readSetting(ExtensionOptionsSetting);
        for (const [extName, persistedOptions] of Object.entries(persistedExtensionOptions)) {
            if (currentExtensionOptions[extName] && persistedOptions) {
                Object.assign(currentExtensionOptions[extName], persistedOptions);
            }
        }

        // Wrap each extension's options object in a proxy that persists the full extension options map on write
        for (const extName of Object.keys(currentExtensionOptions)) {
            currentExtensionOptions[extName] = new Proxy(currentExtensionOptions[extName], {
                set(obj, prop, value) {
                    const result = Reflect.set(obj, prop, value);
                    settingsStore.writeSetting(ExtensionOptionsSetting, { ...currentExtensionOptions });
                    return result;
                },
            });
        }

        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Apply loader settings (filter out null values to not override options coming in with load calls)
                const nonNullLoaderOptions = Object.fromEntries(Object.entries(currentLoaderOptions).filter(([_, v]) => v !== null));
                const hasLoaderOverrides = Object.keys(nonNullLoaderOptions).length > 0;
                Object.assign(loader, nonNullLoaderOptions);

                let hasExtensionOverrides = false;

                // Subscribe to extension loading
                loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
                    const extensionOptions = currentExtensionOptions[extension.name];
                    if (extensionOptions) {
                        // Apply extension settings (filter out null values to not override options coming in with load calls)
                        const nonNullExtOptions = Object.fromEntries(Object.entries(extensionOptions).filter(([_, v]) => v !== null));
                        if (Object.keys(nonNullExtOptions).length > 0) {
                            hasExtensionOverrides = true;
                        }
                        Object.assign(extension, nonNullExtOptions);
                    }
                });

                // Show a toast after all extensions have loaded if any overrides were applied
                loader.onCompleteObservable.addOnce(() => {
                    if (hasLoaderOverrides || hasExtensionOverrides) {
                        toastService.showToast("Applied glTF loader option overrides");
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
                        <OverridesWarning loaderOptions={currentLoaderOptions} extensionOptions={currentExtensionOptions} />
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
