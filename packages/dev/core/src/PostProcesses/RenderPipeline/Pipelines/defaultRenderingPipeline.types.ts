/* eslint-disable @typescript-eslint/naming-convention */
import { type DefaultRenderingPipelineParse } from "./defaultRenderingPipeline.pure";

type DefaultRenderingPipelineParseType = typeof DefaultRenderingPipelineParse;

declare module "./defaultRenderingPipeline.pure" {
    namespace DefaultRenderingPipeline {
        export let Parse: DefaultRenderingPipelineParseType;
    }
}
