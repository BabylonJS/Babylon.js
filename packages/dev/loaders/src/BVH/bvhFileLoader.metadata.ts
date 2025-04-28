// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/index";

export const BVHFileLoaderMetadata = {
    name: "bvh",
    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".bvh": { isBinary: false },
    } as const satisfies ISceneLoaderPluginExtensions,
} as const satisfies ISceneLoaderPluginMetadata;
