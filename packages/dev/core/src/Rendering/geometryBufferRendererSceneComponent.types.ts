import { type Nullable } from "../types";
import { type GeometryBufferRenderer, type IGeometryBufferTextureTypeAndFormat } from "./geometryBufferRenderer";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal (Backing field) */
        _geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Gets or Sets the current geometry buffer associated to the scene.
         */
        geometryBufferRenderer: Nullable<GeometryBufferRenderer>;

        /**
         * Enables a GeometryBufferRender and associates it with the scene
         * @param ratioOrDimensions defines the scaling ratio to apply to the renderer (1 by default which means same resolution). You can also directly pass a width and height for the generated textures
         * @param depthFormat Format of the depth texture (default: Constants.TEXTUREFORMAT_DEPTH16)
         * @param textureTypesAndFormats The types, formats and optional sampling modes of textures to create as render targets.
         * If not provided, all textures will be RGBA and float or half float, depending on the engine capabilities.
         * @returns the GeometryBufferRenderer
         */
        enableGeometryBufferRenderer(
            ratioOrDimensions?: number | { width: number; height: number },
            depthFormat?: number,
            textureTypesAndFormats?: { [key: number]: IGeometryBufferTextureTypeAndFormat }
        ): Nullable<GeometryBufferRenderer>;

        /**
         * Disables the GeometryBufferRender associated with the scene
         */
        disableGeometryBufferRenderer(): void;
    }
}
