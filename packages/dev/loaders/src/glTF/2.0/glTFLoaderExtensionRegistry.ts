import type { GLTFLoader } from "./glTFLoader";
import type { IGLTFLoaderExtension } from "./glTFLoaderExtension";

import { Logger } from "core/Misc/logger";

interface IRegisteredExtension {
    isGLTFExtension: boolean;
    factory: ExtensionFactory;
}

export type ExtensionFactory = (loader: GLTFLoader) => IGLTFLoaderExtension | Promise<IGLTFLoaderExtension>;

const _glTFRegisteredExtensions = new Map<string, IRegisteredExtension>();

/**
 * All currently registered glTF 2.0 loader extensions.
 */
export const glTFRegisteredExtensions: ReadonlyMap<string, Readonly<IRegisteredExtension>> = _glTFRegisteredExtensions;

/**
 * Registers a loader extension.
 * @param name The name of the loader extension.
 * @param isGLTFExtension If the loader extension is a glTF extension, then it will only be used for glTF files that use the corresponding glTF extension. Otherwise, it will be used for all loaded glTF files.
 * @param factory The factory function that creates the loader extension.
 */
export function registerGLTFExtension(name: string, isGLTFExtension: boolean, factory: ExtensionFactory): void {
    if (unregisterGLTFExtension(name)) {
        Logger.Warn(`Extension with the name '${name}' already exists`);
    }

    _glTFRegisteredExtensions.set(name, {
        isGLTFExtension,
        factory,
    });
}

/**
 * Unregisters a loader extension.
 * @param name The name of the loader extension.
 * @returns A boolean indicating whether the extension has been unregistered
 */
export function unregisterGLTFExtension(name: string): boolean {
    return _glTFRegisteredExtensions.delete(name);
}
