import type { IInternalTextureLoader } from "./internalTextureLoader";
import type { Nullable } from "../../../types";

export const OverrideTextureLoader: {
    /**
     * Function used to get the correct texture loader for a specific extension.
     * This function will be executed before the default loader. If it returns null, the default loader will be used.
     * @param extension defines the file extension of the file being loaded
     */
    getTextureLoader: Nullable<(extension: string, mimeType?: string) => Nullable<Promise<IInternalTextureLoader>>>;
} = {
    getTextureLoader: null,
};

/**
 * Function used to get the correct texture loader for a specific extension.
 * @param extension defines the file extension of the file being loaded
 * @param mimeType defines the optional mime type of the file being loaded
 * @returns the IInternalTextureLoader or null if it wasn't found
 */
export function _GetCompatibleTextureLoader(extension: string, mimeType?: string): Nullable<Promise<IInternalTextureLoader>> {
    if (OverrideTextureLoader.getTextureLoader) {
        const loader = OverrideTextureLoader.getTextureLoader(extension, mimeType);
        if (loader) {
            return loader;
        }
    }

    if (extension.endsWith(".dds")) {
        return import("./ddsTextureLoader").then((module) => new module._DDSTextureLoader());
    }
    if (extension.endsWith(".basis")) {
        return import("./basisTextureLoader").then((module) => new module._BasisTextureLoader());
    }
    if (extension.endsWith(".env")) {
        return import("./envTextureLoader").then((module) => new module._ENVTextureLoader());
    }
    if (extension.endsWith(".hdr")) {
        return import("./hdrTextureLoader").then((module) => new module._HDRTextureLoader());
    }
    // The ".ktx2" file extension is still up for debate: https://github.com/KhronosGroup/KTX-Specification/issues/18
    if (extension.endsWith(".ktx") || extension.endsWith(".ktx2") || mimeType === "image/ktx" || mimeType === "image/ktx2") {
        return import("./ktxTextureLoader").then((module) => new module._KTXTextureLoader());
    }
    if (extension.endsWith(".tga")) {
        return import("./tgaTextureLoader").then((module) => new module._TGATextureLoader());
    }
    if (extension.endsWith(".exr")) {
        return import("./exrTextureLoader").then((module) => new module._ExrTextureLoader());
    }

    return null;
}
