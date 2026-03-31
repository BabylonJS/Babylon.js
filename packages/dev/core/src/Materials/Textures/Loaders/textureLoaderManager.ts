/* eslint-disable github/no-then */
import { type IInternalTextureLoader } from "./internalTextureLoader";
import { type Nullable } from "../../../types";
import { Logger } from "core/Misc/logger";

// Initialize the the default / well-known texture loaders.
const RegisteredTextureLoaders = new Map<string, (mimeType?: string) => IInternalTextureLoader | Promise<IInternalTextureLoader>>([
    /* eslint-disable @typescript-eslint/naming-convention */
    [".ies", async () => await import("./iesTextureLoader").then(({ _IESTextureLoader }) => new _IESTextureLoader())],
    [".dds", async () => await import("./ddsTextureLoader").then(({ _DDSTextureLoader }) => new _DDSTextureLoader())],
    [".basis", async () => await import("./basisTextureLoader").then(({ _BasisTextureLoader }) => new _BasisTextureLoader())],
    [".env", async () => await import("./envTextureLoader").then(({ _ENVTextureLoader }) => new _ENVTextureLoader())],
    [".hdr", async () => await import("./hdrTextureLoader").then(({ _HDRTextureLoader }) => new _HDRTextureLoader())],
    [".ktx", async () => await import("./ktxTextureLoader").then(({ _KTXTextureLoader }) => new _KTXTextureLoader())],
    [".ktx2", async () => await import("./ktxTextureLoader").then(({ _KTXTextureLoader }) => new _KTXTextureLoader())],
    [".tga", async () => await import("./tgaTextureLoader").then(({ _TGATextureLoader }) => new _TGATextureLoader())],
    [".exr", async () => await import("./exrTextureLoader").then(({ _ExrTextureLoader }) => new _ExrTextureLoader())],
    /* eslint-enable @typescript-eslint/naming-convention */
]);

export function GetRegisteredTextureLoaders(): readonly string[] {
    return Array.from(RegisteredTextureLoaders.keys());
}

/**
 * Registers a texture loader.
 * If a loader for the extension exists in the registry, it will be replaced.
 * @param extension The name of the loader extension.
 * @param loaderFactory The factory function that creates the loader extension.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function registerTextureLoader(extension: string, loaderFactory: (mimeType?: string) => IInternalTextureLoader | Promise<IInternalTextureLoader>): void {
    if (unregisterTextureLoader(extension)) {
        Logger.Warn(`Extension with the name '${extension}' already exists`);
    }
    RegisteredTextureLoaders.set(extension, loaderFactory);
}

/**
 * Unregisters a texture loader.
 * @param extension The name of the loader extension.
 * @returns A boolean indicating whether the extension has been unregistered
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function unregisterTextureLoader(extension: string): boolean {
    return RegisteredTextureLoaders.delete(extension);
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
    const registered = RegisteredTextureLoaders.get(extension);
    return registered ? Promise.resolve(registered(mimeType)) : null;
}
