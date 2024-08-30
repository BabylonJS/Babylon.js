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
    public static readonly Extensions = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ".stl": { isBinary: true },
    } as const satisfies ISceneLoaderPluginExtensions;
}
