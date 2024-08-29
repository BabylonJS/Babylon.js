// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions } from "core/index";

/**
 * @internal
 */
export abstract class SPLATFileLoaderMetadata {
    /**
     * @internal
     */
    public static readonly Name = "splat";

    /**
     * @internal
     */
    public static readonly Extensions = Object.freeze({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".splat": Object.freeze({ isBinary: true }),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".ply": Object.freeze({ isBinary: true }),
    }) satisfies ISceneLoaderPluginExtensions;
}
