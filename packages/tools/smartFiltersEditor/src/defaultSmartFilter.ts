import { ConnectionPointType, InputBlock, SmartFilter } from "@babylonjs/smart-filters";
import { PixelateBlock } from "@babylonjs/smart-filters-blocks";

/**
 * Creates a new instance of the default Smart Filter for the Smart Filter Editor
 * @returns The default Smart Filter
 */
export function createDefaultSmartFilter(): SmartFilter {
    const smartFilter = new SmartFilter("Default");

    const pixelateBlock = new PixelateBlock(smartFilter, "Pixelate");

    const textureInputBlock = new InputBlock(smartFilter, "Texture", ConnectionPointType.Texture, null);
    textureInputBlock.editorData = {
        url: "/assets/logo.png",
        urlTypeHint: "image",
        flipY: true,
        anisotropicFilteringLevel: null,
        forcedExtension: null,
    };

    const intensityInputBlock = new InputBlock(smartFilter, "Intensity", ConnectionPointType.Float, 0.5);
    intensityInputBlock.editorData = {
        animationType: null,
        valueDeltaPerMs: null,
        min: 0.0,
        max: 1.0,
    };

    textureInputBlock.output.connectTo(pixelateBlock.input);
    intensityInputBlock.output.connectTo(pixelateBlock.intensity);
    pixelateBlock.output.connectTo(smartFilter.output);

    return smartFilter;
}
