/* eslint-disable @typescript-eslint/naming-convention */
import { type CubeTextureCreateFromImages, type CubeTextureCreateFromPrefilteredData, type CubeTextureParse } from "./cubeTexture.pure";

type CubeTextureCreateFromImagesType = typeof CubeTextureCreateFromImages;
type CubeTextureCreateFromPrefilteredDataType = typeof CubeTextureCreateFromPrefilteredData;
type CubeTextureParseType = typeof CubeTextureParse;

declare module "./cubeTexture.pure" {
    namespace CubeTexture {
        export let CreateFromImages: CubeTextureCreateFromImagesType;
        export let CreateFromPrefilteredData: CubeTextureCreateFromPrefilteredDataType;
        export let Parse: CubeTextureParseType;
    }
}
