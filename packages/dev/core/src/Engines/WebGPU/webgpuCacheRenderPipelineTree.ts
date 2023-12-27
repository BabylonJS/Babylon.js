/* eslint-disable babylonjs/available */
import type { Nullable } from "../../types";
import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";

/** @internal */
class NodeState {
    public values: { [id: number]: NodeState };
    public pipeline: GPURenderPipeline;

    constructor() {
        this.values = {};
    }

    public count(): [number, number] {
        let countNode = 0,
            countPipeline = this.pipeline ? 1 : 0;
        for (const value in this.values) {
            const node = this.values[value];
            const [childCountNodes, childCoundPipeline] = node!.count();
            countNode += childCountNodes;
            countPipeline += childCoundPipeline;
            countNode++;
        }
        return [countNode, countPipeline];
    }
}

/** @internal */
export class WebGPUCacheRenderPipelineTree extends WebGPUCacheRenderPipeline {
    private static _Cache: NodeState = new NodeState();

    private _nodeStack: NodeState[];

    public static GetNodeCounts(): { nodeCount: number; pipelineCount: number } {
        const counts = WebGPUCacheRenderPipelineTree._Cache.count();

        return { nodeCount: counts[0], pipelineCount: counts[1] };
    }

    public static _GetPipelines(node: NodeState, pipelines: Array<Array<number>>, curPath: Array<number>, curPathLen: number): void {
        if (node.pipeline) {
            const path = curPath.slice();
            path.length = curPathLen;
            pipelines.push(path);
        }
        for (const value in node.values) {
            const nnode = node.values[value];
            curPath[curPathLen] = parseInt(value);
            WebGPUCacheRenderPipelineTree._GetPipelines(nnode, pipelines, curPath, curPathLen + 1);
        }
    }

    public static GetPipelines(): Array<Array<number>> {
        const pipelines: Array<Array<number>> = [];
        WebGPUCacheRenderPipelineTree._GetPipelines(WebGPUCacheRenderPipelineTree._Cache, pipelines, [], 0);
        return pipelines;
    }

    public static ResetCache() {
        WebGPUCacheRenderPipelineTree._Cache = new NodeState();
    }

    public reset(): void {
        this._nodeStack = [];
        this._nodeStack[0] = WebGPUCacheRenderPipelineTree._Cache;
        super.reset();
    }

    protected _getRenderPipeline(param: { token: any; pipeline: Nullable<GPURenderPipeline> }): void {
        let node = this._nodeStack[this._stateDirtyLowestIndex];
        for (let i = this._stateDirtyLowestIndex; i < this._statesLength; ++i) {
            let nn: NodeState | undefined = node!.values[this._states[i]];
            if (!nn) {
                nn = new NodeState();
                node!.values[this._states[i]] = nn;
            }
            node = nn;
            this._nodeStack[i + 1] = node;
        }

        param.token = node;
        param.pipeline = node.pipeline;
    }

    protected _setRenderPipeline(param: { token: NodeState; pipeline: Nullable<GPURenderPipeline> }): void {
        param.token.pipeline = param.pipeline!;
    }
}
