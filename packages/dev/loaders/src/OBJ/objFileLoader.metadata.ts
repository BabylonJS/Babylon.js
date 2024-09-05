// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginMetadata } from "core/index";

export const OBJFileLoaderMetadata = {
    name: "obj",
    extensions: ".obj",
} as const satisfies ISceneLoaderPluginMetadata;
