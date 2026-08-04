import { type ImageSource } from "../../types";
import { type InternalTexture } from "../../Materials/Textures/internalTexture";

declare module "../abstractEngine.pure" {
    /**
     * Engine methods that upload decoded image sources into 2D array texture layers.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Uploads an image source (ImageBitmap, canvas, video, image element...) into a single layer of a 2D array texture.
         * Unlike updateRawTexture2DArray, which uploads raw bytes, this uploads a decoded image source directly.
         * This is a side-effect engine extension: import "core/Engines/Extensions/engine.texture2DArrayImageSource"
         * (or the WebGPU counterpart) to make it available on the tree-shakeable engine path.
         * @param texture defines the 2D array texture to update
         * @param source defines the image source to upload
         * @param layer defines the array layer (z index) to upload into
         * @param invertY defines if the source must be stored with the Y axis inverted (false by default)
         * @param premultiplyAlpha defines if the source alpha must be premultiplied (false by default)
         */
        updateTextureArrayLayerFromImageSource(texture: InternalTexture, source: ImageSource, layer: number, invertY?: boolean, premultiplyAlpha?: boolean): void;
    }
}
