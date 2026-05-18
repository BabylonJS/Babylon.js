/* eslint-disable @typescript-eslint/naming-convention */
import { type TAARenderingPipelineParse } from "./taaRenderingPipeline.pure";

type TAARenderingPipelineParseType = typeof TAARenderingPipelineParse;

declare module "./taaRenderingPipeline.pure" {
    namespace TAARenderingPipeline {
        export let Parse: TAARenderingPipelineParseType;
    }
}
