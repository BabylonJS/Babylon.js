/* eslint-disable @typescript-eslint/naming-convention */
import { type StandardRenderingPipelineParse } from "./standardRenderingPipeline.pure";

type StandardRenderingPipelineParseType = typeof StandardRenderingPipelineParse;

declare module "./standardRenderingPipeline.pure" {
    namespace StandardRenderingPipeline {
        export let Parse: StandardRenderingPipelineParseType;
    }
}
