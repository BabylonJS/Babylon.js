import type { ISceneLoaderPlugin, ISceneLoaderPluginAsync, SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import type { GLTFFileLoader, IGLTFLoaderExtension } from "loaders/glTF/glTFFileLoader";
import type { ServiceDefinition } from "../../../../modularity/serviceDefinition";
import type { IToolsService } from "../../toolsService";

import { SceneLoader } from "core/Loading/sceneLoader";
import { GLTFLoaderDefaultOptions } from "loaders/glTF/glTFFileLoader";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { GLTFExtensionOptionsTool, GLTFLoaderOptionsTool } from "../../../../components/tools/import/gltfLoaderOptionsTool";
import { ToolsServiceIdentity } from "../../toolsService";

export const GLTFLoaderServiceIdentity = Symbol("GLTFLoaderService");

// Options exposed in Inspector includes all the properties from the default loader options (GLTFLoaderDefaultOptions)
// plus some options that only exist directly on the GLTFFileLoader class itself.
const CurrentLoaderOptions = Object.assign(
    {
        capturePerformanceCounters: false,
        loggingEnabled: false,
    } satisfies Pick<GLTFFileLoader, "capturePerformanceCounters" | "loggingEnabled">,
    GLTFLoaderDefaultOptions
);

export type GLTFLoaderOptionsType = typeof CurrentLoaderOptions;

const CurrentExtensionOptions = {
    /* eslint-disable @typescript-eslint/naming-convention */
    EXT_lights_image_based: { enabled: true },
    EXT_mesh_gpu_instancing: { enabled: true },
    EXT_texture_webp: { enabled: true },
    EXT_texture_avif: { enabled: true },
    KHR_draco_mesh_compression: { enabled: true },
    KHR_materials_pbrSpecularGlossiness: { enabled: true },
    KHR_materials_clearcoat: { enabled: true },
    KHR_materials_iridescence: { enabled: true },
    KHR_materials_anisotropy: { enabled: true },
    KHR_materials_emissive_strength: { enabled: true },
    KHR_materials_ior: { enabled: true },
    KHR_materials_sheen: { enabled: true },
    KHR_materials_specular: { enabled: true },
    KHR_materials_unlit: { enabled: true },
    KHR_materials_variants: { enabled: true },
    KHR_materials_transmission: { enabled: true },
    KHR_materials_diffuse_transmission: { enabled: true },
    KHR_materials_volume: { enabled: true },
    KHR_materials_dispersion: { enabled: true },
    KHR_materials_diffuse_roughness: { enabled: true },
    KHR_mesh_quantization: { enabled: true },
    KHR_lights_punctual: { enabled: true },
    EXT_lights_area: { enabled: true },
    KHR_texture_basisu: { enabled: true },
    KHR_texture_transform: { enabled: true },
    KHR_xmp_json_ld: { enabled: true },
    MSFT_lod: { enabled: true, maxLODsToLoad: 10 },
    MSFT_minecraftMesh: { enabled: true },
    MSFT_sRGBFactors: { enabled: true },
    MSFT_audio_emitter: { enabled: true },
} satisfies SceneLoaderPluginOptions["gltf"]["extensionOptions"];

export type GLTFExtensionOptionsType = typeof CurrentExtensionOptions;

export const GLTFLoaderOptionsServiceDefinition: ServiceDefinition<[], [IToolsService]> = {
    friendlyName: "GLTF Loader Options",
    consumes: [ToolsServiceIdentity],
    factory: (toolsService) => {
        // Subscribe to plugin activation
        const pluginObserver = SceneLoader.OnPluginActivatedObservable.add((plugin: ISceneLoaderPlugin | ISceneLoaderPluginAsync) => {
            if (plugin.name === "gltf") {
                const loader = plugin as GLTFFileLoader;

                // Apply loader settings
                Object.assign(loader, CurrentLoaderOptions);

                // Subscribe to extension loading
                loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
                    const extensionOptions = CurrentExtensionOptions[extension.name as keyof GLTFExtensionOptionsType];
                    if (extensionOptions) {
                        // Apply extension settings
                        Object.assign(extension, extensionOptions);
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
