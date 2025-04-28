// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginMetadata } from "core/index";

export const BVHFileLoaderMetadata = {
    name: "bvh",
    extensions: ".bvh",
} as const satisfies ISceneLoaderPluginMetadata;
