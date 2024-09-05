// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions, ISceneLoaderPluginMetadata } from "core/index";

export const GLTFMagicBase64Encoded = "Z2xURg"; // "glTF" base64 encoded (without the quotes!)

export const GLTFFileLoaderMetadata = {
    name: "gltf",

    extensions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".gltf": { isBinary: false },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".glb": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions,

    canDirectLoad(data: string): boolean {
        return (
            (data.indexOf("asset") !== -1 && data.indexOf("version") !== -1) ||
            data.startsWith("data:base64," + GLTFMagicBase64Encoded) || // this is technically incorrect, but will continue to support for backcompat.
            data.startsWith("data:;base64," + GLTFMagicBase64Encoded) ||
            data.startsWith("data:application/octet-stream;base64," + GLTFMagicBase64Encoded) ||
            data.startsWith("data:model/gltf-binary;base64," + GLTFMagicBase64Encoded)
        );
    },
} as const satisfies ISceneLoaderPluginMetadata;
