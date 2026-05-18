/* eslint-disable @typescript-eslint/naming-convention */
import { type SSRRenderingPipelineParse } from "./ssrRenderingPipeline.pure";

type SSRRenderingPipelineParseType = typeof SSRRenderingPipelineParse;

declare module "./ssrRenderingPipeline.pure" {
    namespace SSRRenderingPipeline {
        export let Parse: SSRRenderingPipelineParseType;
    }
}
