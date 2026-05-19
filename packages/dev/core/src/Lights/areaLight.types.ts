import { type ILTCTextures } from "core/Lights/LTC/ltcTextureTool";
declare module "../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         */
        _ltcTextures?: ILTCTextures;
    }
}
