import type { GLTFLoader } from "./glTFLoader";
import type { IGLTFLoaderExtension } from "./glTFLoaderExtension";

import { Logger } from "core/Misc/logger";

interface IRegisteredExtension {
    isGLTFExtension: boolean;
    factory: ExtensionFactory;
}

export type ExtensionFactory = (loader: GLTFLoader) => IGLTFLoaderExtension | Promise<IGLTFLoaderExtension>;

/**
 * Contains all registered glTF 2.0 loader extensions.
 */
export class GLTFLoaderExtensionRegistry {
    private constructor() {}

    private static readonly _RegisteredExtensions = new Map<string, IRegisteredExtension>();

    /**
     * Gets all currently registered glTF 2.0 loader extensions.
     */
    public static get RegisteredExtensions(): ReadonlyMap<string, Readonly<IRegisteredExtension>> {
        return GLTFLoaderExtensionRegistry._RegisteredExtensions;
    }

    /**
     * Registers a loader extension.
     * @param name The name of the loader extension.
     * @param isGLTFExtension If the loader extension is a glTF extension, then it will only be used for glTF files that use the corresponding glTF extension. Otherwise, it will be used for all loaded glTF files.
     * @param factory The factory function that creates the loader extension.
     */
    public static Register(name: string, isGLTFExtension: boolean, factory: ExtensionFactory): void {
        if (GLTFLoaderExtensionRegistry.Unregister(name)) {
            Logger.Warn(`Extension with the name '${name}' already exists`);
        }

        GLTFLoaderExtensionRegistry._RegisteredExtensions.set(name, {
            isGLTFExtension,
            factory,
        });
    }

    /**
     * Unregisters a loader extension.
     * @param name The name of the loader extension.
     * @returns A boolean indicating whether the extension has been unregistered
     */
    public static Unregister(name: string): boolean {
        return GLTFLoaderExtensionRegistry._RegisteredExtensions.delete(name);
    }
}
