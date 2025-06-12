import type { ConnectionPointType, InputBlock, InputBlockEditorData } from "@babylonjs/smart-filters";

/**
 * Gets the InputBlockEditorData for a Texture InputBlock, and if it's missing,
 * reads the values from the actual texture, and falls back to defaults if necessary.
 * It sets the editor data on the input block for future use.
 * @param inputBlock - The input block to get the editor data for
 * @returns The editor data for the input block
 */
export function getTextureInputBlockEditorData(
    inputBlock: InputBlock<ConnectionPointType.Texture>
): InputBlockEditorData<ConnectionPointType.Texture> {
    if (inputBlock.editorData === null) {
        const internalTexture = inputBlock.runtimeValue.value?.getInternalTexture();
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
 * Gets the InputBlockEditorData for a Float InputBlock, and if it's missing
 * anything, falls back to defaults.
 * @param inputBlock - The input block to get the editor data for
 * @returns The editor data for the input block
 */
export function getFloatInputBlockEditorData(
    inputBlock: InputBlock<ConnectionPointType.Float>
): InputBlockEditorData<ConnectionPointType.Float> {
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
