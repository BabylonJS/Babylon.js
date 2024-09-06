import type { IInternalTextureLoader } from "./internalTextureLoader";
import type { Nullable } from "../../../types";
import { Logger } from "core/Misc/logger";

const _registeredTextureLoaders = new Map<string, (mimeType?: string) => IInternalTextureLoader | Promise<IInternalTextureLoader>>();

/**
 * Registers a texture loader.
 * If a loader for the extension exists in the registry, it will be replaced.
 * @param extension The name of the loader extension.
 * @param loaderFactory The factory function that creates the loader extension.
 */
export function registerTextureLoader(extension: string, loaderFactory: (mimeType?: string) => IInternalTextureLoader | Promise<IInternalTextureLoader>): void {
    if (unregisterTextureLoader(extension)) {
        Logger.Warn(`Extension with the name '${name}' already exists`);
    }
    _registeredTextureLoaders.set(extension, loaderFactory);
}

/**
 * Unregisters a texture loader.
 * @param extension The name of the loader extension.
 * @returns A boolean indicating whether the extension has been unregistered
 */
export function unregisterTextureLoader(extension: string): boolean {
    return _registeredTextureLoaders.delete(extension);
}

/**
 * Function used to get the correct texture loader for a specific extension.
 * @param extension defines the file extension of the file being loaded
 * @param mimeType defines the optional mime type of the file being loaded
 * @returns the IInternalTextureLoader or null if it wasn't found
 */
export function _GetCompatibleTextureLoader(extension: string, mimeType?: string): Nullable<Promise<IInternalTextureLoader>> {
    if (mimeType === "image/ktx" || mimeType === "image/ktx2") {
        extension = ".ktx";
    }
    if (!_registeredTextureLoaders.has(extension)) {
        if (extension.endsWith(".dds")) {
            registerTextureLoader(".dds", () => import("./ddsTextureLoader").then((module) => new module._DDSTextureLoader()));
        }
        if (extension.endsWith(".basis")) {
            registerTextureLoader(".basis", () => import("./basisTextureLoader").then((module) => new module._BasisTextureLoader()));
        }
        if (extension.endsWith(".env")) {
            registerTextureLoader(".env", () => import("./envTextureLoader").then((module) => new module._ENVTextureLoader()));
        }
        if (extension.endsWith(".hdr")) {
            registerTextureLoader(".hdr", () => import("./hdrTextureLoader").then((module) => new module._HDRTextureLoader()));
        }
        // The ".ktx2" file extension is still up for debate: https://github.com/KhronosGroup/KTX-Specification/issues/18
        if (extension.endsWith(".ktx") || extension.endsWith(".ktx2")) {
            registerTextureLoader(".ktx", () => import("./ktxTextureLoader").then((module) => new module._KTXTextureLoader()));
            registerTextureLoader(".ktx2", () => import("./ktxTextureLoader").then((module) => new module._KTXTextureLoader()));
        }
        if (extension.endsWith(".tga")) {
            registerTextureLoader(".tga", () => import("./tgaTextureLoader").then((module) => new module._TGATextureLoader()));
        }
        if (extension.endsWith(".exr")) {
            registerTextureLoader(".exr", () => import("./exrTextureLoader").then((module) => new module._ExrTextureLoader()));
        }
    }
    const registered = _registeredTextureLoaders.get(extension);
    return registered ? Promise.resolve(registered(mimeType)) : null;
}
