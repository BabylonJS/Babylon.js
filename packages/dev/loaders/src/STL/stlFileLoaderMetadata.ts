// eslint-disable-next-line import/no-internal-modules
import type { ISceneLoaderPluginExtensions } from "core/index";

/**
 * @internal
 */
export abstract class STLFileLoaderMetadata {
    /**
     * @internal
     */
    public static readonly Name = "stl";

    /**
     * @internal
     */
    public static readonly Extensions = Object.freeze({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".stl": Object.freeze({ isBinary: true }),
    }) satisfies ISceneLoaderPluginExtensions;
}
