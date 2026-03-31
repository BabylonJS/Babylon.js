import { type SceneLoaderPluginOptions } from "core/Loading/sceneLoader";
import { type GLTFFileLoader, GLTFLoaderDefaultOptions } from "loaders/glTF/glTFFileLoader";

/**
 * Helper type to make all properties of T nullable.
 */
export type NullableProperties<T> = { [K in keyof T]: T[K] | null };

// Options exposed in Inspector includes all the properties from the default loader options (GLTFLoaderDefaultOptions)
// plus some options that only exist directly on the GLTFFileLoader class itself.
// These are the non-null defaults, used as defaultValue for the nullable property lines.
export const LoaderOptionDefaults = Object.assign(
    {
        capturePerformanceCounters: false,
        loggingEnabled: false,
    } satisfies Pick<GLTFFileLoader, "capturePerformanceCounters" | "loggingEnabled">,
    { ...GLTFLoaderDefaultOptions }
);

export type GLTFLoaderOptionsType = NullableProperties<typeof LoaderOptionDefaults>;

// Non-null defaults for extension options that have properties beyond just 'enabled'.
export const ExtensionOptionDefaults = {
    /* eslint-disable @typescript-eslint/naming-convention */
    MSFT_lod: { maxLODsToLoad: 10 },
} satisfies Partial<SceneLoaderPluginOptions["gltf"]["extensionOptions"]>;

export type GLTFExtensionOptionsType = Record<
    string,
    {
        /**
         *
         */
        enabled: boolean | null;
        [key: string]: unknown;
    }
>;
