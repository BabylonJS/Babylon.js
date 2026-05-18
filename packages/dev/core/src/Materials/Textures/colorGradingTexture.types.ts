/* eslint-disable @typescript-eslint/naming-convention */
import { type ColorGradingTextureParse } from "./colorGradingTexture.pure";

type ColorGradingTextureParseType = typeof ColorGradingTextureParse;

declare module "./colorGradingTexture.pure" {
    namespace ColorGradingTexture {
        export let Parse: ColorGradingTextureParseType;
    }
}
