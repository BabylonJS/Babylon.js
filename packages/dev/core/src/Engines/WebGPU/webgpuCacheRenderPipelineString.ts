import type { Nullable } from "../../types";
import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";

/**
 * Class not used, WebGPUCacheRenderPipelineTree is faster
 * @internal
 */
export class WebGPUCacheRenderPipelineString extends WebGPUCacheRenderPipeline {
    private static _Cache: { [hash: string]: GPURenderPipeline } = {};

    protected _getRenderPipeline(param: { token: any; pipeline: Nullable<GPURenderPipeline> }): void {
        const hash = this._states.join();
        param.token = hash;
        param.pipeline = WebGPUCacheRenderPipelineString._Cache[hash];
    }

    protected _setRenderPipeline(param: { token: any; pipeline: Nullable<GPURenderPipeline> }): void {
        WebGPUCacheRenderPipelineString._Cache[param.token] = param.pipeline!;
    }
}
