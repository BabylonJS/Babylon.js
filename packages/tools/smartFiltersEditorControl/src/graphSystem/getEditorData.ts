import { type ConnectionPointType, type InputBlock, type InputBlockEditorData } from "smart-filters";
import { type Nullable } from "core/types.js";

type InternalTextureEditorMetadata = {
    url?: Nullable<string>;
    anisotropicFilteringLevel?: number;
    invertY?: boolean;
    _extension?: Nullable<string>;
};

type TextureWithInternalTexture = {
    getInternalTexture: () => Nullable<InternalTextureEditorMetadata>;
};

function GetInternalTextureEditorMetadata(texture: unknown): Nullable<InternalTextureEditorMetadata> {
    if (!texture || typeof (texture as Partial<TextureWithInternalTexture>).getInternalTexture !== "function") {
        return null;
    }

    return (texture as TextureWithInternalTexture).getInternalTexture();
}

/**
 * Gets the metadata the editor can use for a texture input.
 * @param inputBlock - The input block to get the editor data for
 * @returns The editor data for the input block
 */
export function GetTextureInputBlockEditorData(inputBlock: InputBlock<ConnectionPointType.Texture>): InputBlockEditorData<ConnectionPointType.Texture> {
    if (inputBlock.editorData === null || inputBlock.editorData === undefined) {
        const internalTexture = GetInternalTextureEditorMetadata(inputBlock.runtimeValue.value);
        inputBlock.editorData = {
            url: internalTexture?.url ?? null,
            urlTypeHint: null,
            anisotropicFilteringLevel: internalTexture?.anisotropicFilteringLevel ?? null,
            flipY: internalTexture?.invertY ?? true,
            forcedExtension: internalTexture?._extension ?? null,
        };
    }

    // Apply defaults
    inputBlock.editorData.flipY = inputBlock.editorData.flipY ?? true;

    return inputBlock.editorData;
}

/**
 * Gets the source URL available to the editor for a texture input.
 * @param inputBlock - The texture input block
 * @returns The source URL, if one is available
 */
export function GetTextureInputBlockUrl(inputBlock: InputBlock<ConnectionPointType.Texture>): Nullable<string> {
    return inputBlock.editorData?.url || GetInternalTextureEditorMetadata(inputBlock.runtimeValue.value)?.url || null;
}

/**
 * Gets the InputBlockEditorData for a Float InputBlock, and if it's missing
 * anything, falls back to defaults.
 * @param inputBlock - The input block to get the editor data for
 * @returns The editor data for the input block
 */
export function GetFloatInputBlockEditorData(inputBlock: InputBlock<ConnectionPointType.Float>): InputBlockEditorData<ConnectionPointType.Float> {
    if (inputBlock.editorData === null) {
        inputBlock.editorData = {
            animationType: null,
            valueDeltaPerMs: null,
            min: null,
            max: null,
        };
    }

    return inputBlock.editorData;
}
