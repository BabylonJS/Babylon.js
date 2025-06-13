import type { TexturePreset } from "@babylonjs/smart-filters-editor-control";

/**
 * Texture presets are used to provide a list of assets that can be used
 * easily in the editor.
 *
 * You can either a base64 encoded image or a URL to an image.
 *
 * For a URL to an image, you can add the assets to packages/demo/www/assets then add them to this list.
 *
 */
export const texturePresets: TexturePreset[] = [
    {
        name: "Babylon.js Logo",
        url: "/assets/logo.png",
    },
    {
        name: "Kittens",
        url: "/assets/kittens.jpg",
    },
];
