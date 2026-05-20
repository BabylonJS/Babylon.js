import { type Nullable } from "core/types";
import { type ShaderMaterial } from "core/Materials/shaderMaterial";
declare module "../scene.pure" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /** @internal */
        _meshUVSpaceRendererShader: Nullable<ShaderMaterial>;
        /** @internal */
        _meshUVSpaceRendererMaskShader: Nullable<ShaderMaterial>;
    }
}
