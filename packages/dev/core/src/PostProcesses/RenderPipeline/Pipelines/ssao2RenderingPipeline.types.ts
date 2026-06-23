/* eslint-disable @typescript-eslint/naming-convention */
import { type SSAO2RenderingPipelineParse } from "./ssao2RenderingPipeline.pure";

type SSAO2RenderingPipelineParseType = typeof SSAO2RenderingPipelineParse;

declare module "./ssao2RenderingPipeline.pure" {
    namespace SSAO2RenderingPipeline {
        export let Parse: SSAO2RenderingPipelineParseType;
    }
}
