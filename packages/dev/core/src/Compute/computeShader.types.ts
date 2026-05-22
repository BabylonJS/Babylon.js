/* eslint-disable @typescript-eslint/naming-convention */
import { type ComputeShaderParse } from "./computeShader.pure";

type ComputeShaderParseType = typeof ComputeShaderParse;

declare module "./computeShader.pure" {
    namespace ComputeShader {
        export let Parse: ComputeShaderParseType;
    }
}
