/* eslint-disable @typescript-eslint/naming-convention */
import { type FresnelParametersParse } from "./fresnelParameters.pure";

type FresnelParametersParseType = typeof FresnelParametersParse;

declare module "./fresnelParameters.pure" {
    namespace FresnelParameters {
        export let Parse: FresnelParametersParseType;
    }
}
